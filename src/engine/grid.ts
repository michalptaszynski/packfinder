import directionsData from '../data/directions.json'
import { archetypeCatalog, getArchetype, modifierLibrary, pickSizeCode, priceConfiguration } from './pricing'
import type { CoverageChoice, Direction, DirectionBadge, DirectionCard, Fragility, GridFilter, MaterialChoice, Protection, Slots, StripChoice } from '../types'

export const directionsCatalog = directionsData as Direction[]

const PROTECTION_RANK: Record<Protection, number> = { low: 0, medium: 1, high: 2 }

function fragilityToProtection(fragility?: Fragility): Protection {
  if (fragility === 'high') return 'high'
  if (fragility === 'medium') return 'medium'
  return 'low'
}

function formatPct(pct: number): string {
  return `+${Math.round(pct)}%`
}

/**
 * Refinement answers translated onto the modifier ids a direction carries.
 * 'any' — and an unanswered question — matches everything, so the grid only
 * ever narrows on a choice the user actually made.
 */
function matchesMaterial(modifiers: string[], choice?: MaterialChoice): boolean {
  if (!choice || choice === 'any') return true
  if (choice === 'white') return modifiers.includes('material.white') || modifiers.includes('material.white_both')
  return modifiers.includes(`material.${choice}`)
}

function matchesCoverage(modifiers: string[], choice?: CoverageChoice): boolean {
  if (!choice || choice === 'any') return true
  return modifiers.includes(`coverage.${choice}`)
}

function hasStrip(modifiers: string[]): boolean {
  return modifiers.some((m) => m.startsWith('closure.') && m !== 'closure.none')
}

function matchesStrip(modifiers: string[], choice?: StripChoice): boolean {
  if (!choice || choice === 'any') return true
  return choice === 'with' ? hasStrip(modifiers) : !hasStrip(modifiers)
}

/**
 * Mirrors the build_grid tool contract. Directions with a hard mismatch
 * (food contact, insufficient protection class, eco required but the
 * modifiers break it) are dropped from the grid entirely — never shown
 * with a warning badge, per section 6/10 of the brief. Everything else
 * always stays visible; only badges and sort order change.
 */
export function buildGrid(slots: Slots, filter: GridFilter = 'all'): DirectionCard[] {
  const quantity = slots.quantity?.value ?? 120
  const budgetTotal = slots.budgetTotal?.value
  const productMm = slots.dimensions?.value
    ? ([slots.dimensions.value.w, slots.dimensions.value.h, slots.dimensions.value.d] as [number, number, number])
    : undefined
  const neededProtection = fragilityToProtection(slots.fragility?.value)
  const ecoRequired = slots.ecoRequirement?.value === 'required'
  const foodContactRequired = Boolean(slots.foodContact?.value)

  const cards: DirectionCard[] = []

  for (const direction of directionsCatalog) {
    const archetype = getArchetype(direction.archetype)
    if (!archetype) continue

    if (foodContactRequired && !archetype.foodSafe) continue
    if (PROTECTION_RANK[archetype.protection] < PROTECTION_RANK[neededProtection]) continue
    if (ecoRequired && direction.modifiers.some((m) => modifierLibrary[m]?.breaksEco)) continue
    if (!matchesMaterial(direction.modifiers, slots.materialColour?.value)) continue
    if (!matchesCoverage(direction.modifiers, slots.printCoverage?.value)) continue
    if (!matchesStrip(direction.modifiers, slots.adhesiveStrip?.value)) continue

    const { code: sizeCode } = pickSizeCode(archetype, productMm)
    const price = priceConfiguration({
      archetypeId: archetype.id,
      sizeCode,
      quantity,
      modifiers: direction.modifiers,
      budgetTotal,
    })

    const badges: DirectionBadge[] = []
    let sortRank: number
    let selectable: boolean

    if (!price.valid) {
      const modifierMoqs = direction.modifiers.map((m) => modifierLibrary[m]?.minQty ?? 0)
      const minQty = Math.max(archetype.moq, ...modifierMoqs)
      badges.push({ kind: 'moq_gate', label: `From ${minQty} pcs` })
      if (archetype.priceCurve.source === 'mocked') badges.push({ kind: 'mocked_price', label: 'Estimated price' })
      sortRank = 3
      selectable = false
    } else {
      selectable = true
      if (price.overBudgetPct == null) {
        badges.push({ kind: 'in_budget', label: 'In budget' })
        sortRank = 0
      } else if (price.upsellAvailable && price.upsellQuantity) {
        badges.push({ kind: 'over_budget', label: `${formatPct(price.overBudgetPct)} over budget` })
        badges.push({ kind: 'upsell', label: `Fits at ${price.upsellQuantity} pcs` })
        sortRank = 1
      } else {
        badges.push({ kind: 'over_budget', label: `${formatPct(price.overBudgetPct)} over budget` })
        sortRank = 2
      }
      if (badges.length < 2 && archetype.priceCurve.source === 'mocked') {
        badges.push({ kind: 'mocked_price', label: 'Estimated price' })
      }
    }

    cards.push({ direction, archetype, sizeCode, price, selectable, badges: badges.slice(0, 2), sortRank })
  }

  cards.sort((a, b) => a.sortRank - b.sortRank || (a.price.unit ?? Infinity) - (b.price.unit ?? Infinity))

  return applyFilter(cards, filter)
}

function applyFilter(cards: DirectionCard[], filter: GridFilter): DirectionCard[] {
  switch (filter) {
    case 'in_budget':
      return cards.filter((c) => c.badges.some((b) => b.kind === 'in_budget'))
    case 'worth_stretch':
      return cards.filter((c) => c.badges.some((b) => b.kind === 'upsell'))
    case 'cheapest':
      return [...cards].sort((a, b) => (a.price.unit ?? Infinity) - (b.price.unit ?? Infinity))
    default:
      return cards
  }
}

export function distributeMasonry<T>(items: T[], columns: number, measure?: (item: T) => number): T[][] {
  const cols: T[][] = Array.from({ length: columns }, () => [])
  // Without a measure this stays the old round-robin. With one, each item goes
  // to whichever column is currently shortest, so staggered tiles still end up
  // with roughly level column bottoms.
  const heights = Array.from({ length: columns }, () => 0)
  items.forEach((item, i) => {
    const target = measure ? heights.indexOf(Math.min(...heights)) : i % columns
    cols[target].push(item)
    if (measure) heights[target] += measure(item)
  })
  return cols
}

export const totalArchetypeCount = archetypeCatalog.length
