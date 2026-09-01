import archetypesData from '../data/archetypes.json'
import type { AddonDef, Archetype, ModifierDef, PriceConfigResult, PriceCurvePoint } from '../types'

interface ArchetypeCatalog {
  modifierLibrary: Record<string, ModifierDef>
  addons: Record<string, AddonDef>
  archetypes: Archetype[]
}

const catalog = archetypesData as unknown as ArchetypeCatalog

export const modifierLibrary = catalog.modifierLibrary
export const addonLibrary = catalog.addons
export const archetypeCatalog = catalog.archetypes

export function getArchetype(id: string): Archetype | undefined {
  return archetypeCatalog.find((a) => a.id === id)
}

export const CLEARANCE_MM = 15

export function pickSizeCode(archetype: Archetype, productMm?: [number, number, number]): { code: string; fits: boolean } {
  if (!productMm) return { code: archetype.sizes[0].code, fits: true }
  const sortedProduct = [...productMm].sort((a, b) => b - a).map((v) => v + CLEARANCE_MM)
  for (const size of archetype.sizes) {
    const sortedSize = [...size.mm].sort((a, b) => b - a)
    if (sortedSize.every((v, i) => v >= sortedProduct[i])) {
      return { code: size.code, fits: true }
    }
  }
  const last = archetype.sizes[archetype.sizes.length - 1]
  return { code: last.code, fits: false }
}

function interpolateCurve(points: PriceCurvePoint[], qty: number): number | null {
  const sorted = [...points].sort((a, b) => a.qty - b.qty)
  const lo = sorted[0]
  const hi = sorted[sorted.length - 1]
  if (qty < lo.qty || qty > hi.qty) return null

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i]
    const b = sorted[i + 1]
    if (qty < a.qty || qty > b.qty) continue
    if (qty === a.qty) return a.unit
    if (qty === b.qty) return b.unit
    const t = (Math.log(qty) - Math.log(a.qty)) / (Math.log(b.qty) - Math.log(a.qty))
    return Math.exp(Math.log(a.unit) + t * (Math.log(b.unit) - Math.log(a.unit)))
  }
  return null
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function unitForQuantity(archetype: Archetype, sizeCode: string, quantity: number, modifiers: string[]): number | null {
  const sizeMult = archetype.sizeMultiplier[sizeCode]
  if (sizeMult === undefined) return null

  const baseUnit = interpolateCurve(archetype.priceCurve.points, quantity)
  if (baseUnit === null) return null

  let unit = baseUnit * sizeMult
  for (const key of modifiers) {
    const mod = modifierLibrary[key]
    if (mod?.unitMultiplier) unit *= mod.unitMultiplier
  }
  for (const key of modifiers) {
    const mod = modifierLibrary[key]
    if (mod?.unitDelta) unit += mod.unitDelta
  }
  return unit
}

export interface PriceConfigInput {
  archetypeId: string
  sizeCode: string
  quantity: number
  modifiers: string[]
  budgetTotal?: number
}

/** The only source of prices in the app — mirrors the price_configuration tool contract. */
export function priceConfiguration(input: PriceConfigInput): PriceConfigResult {
  const archetype = getArchetype(input.archetypeId)
  if (!archetype) return { valid: false, reason: 'Nieznany archetyp.' }

  if (archetype.sizeMultiplier[input.sizeCode] === undefined) {
    return { valid: false, reason: 'Nieznany rozmiar dla tego archetypu.' }
  }

  if (input.quantity < archetype.moq) {
    return { valid: false, reason: `Minimalny nakład dla tego formatu to ${archetype.moq} szt.` }
  }

  for (const key of input.modifiers) {
    const mod = modifierLibrary[key]
    if (mod?.minQty && input.quantity < mod.minQty) {
      return { valid: false, reason: `${mod.label} wymaga nakładu min. ${mod.minQty} szt.` }
    }
  }

  const unit = unitForQuantity(archetype, input.sizeCode, input.quantity, input.modifiers)
  if (unit === null) {
    return { valid: false, reason: 'Nakład poza zakresem cennika — poproś o indywidualną wycenę.' }
  }

  const total = unit * input.quantity
  const result: PriceConfigResult = {
    valid: true,
    unit: round2(unit),
    total: round2(total),
    currency: 'GBP',
    priceSource: archetype.priceCurve.source,
  }

  if (input.budgetTotal !== undefined) {
    result.budgetDelta = round2(input.budgetTotal - total)
    result.overBudgetPct = total > input.budgetTotal ? round2(((total - input.budgetTotal) / input.budgetTotal) * 100) : null

    result.upsellAvailable = false
    const candidateQtys = archetype.priceCurve.points.map((p) => p.qty).filter((q) => q > input.quantity)
    for (const q of candidateQtys) {
      const uu = unitForQuantity(archetype, input.sizeCode, q, input.modifiers)
      if (uu === null) continue
      const tt = uu * q
      if (tt <= input.budgetTotal) {
        result.upsellAvailable = true
        result.upsellQuantity = q
        result.upsellUnit = round2(uu)
        result.upsellTotal = round2(tt)
        break
      }
    }
  }

  return result
}
