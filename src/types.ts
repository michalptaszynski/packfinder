export type Channel = 'courier' | 'parcel_locker' | 'retail_shelf' | 'hand' | 'gift'
/** Refinement answers. 'any' means the question was asked and left open. */
export type MaterialChoice = 'any' | 'kraft' | 'white' | 'coated'
export type CoverageChoice = 'any' | 'outside' | 'inside_outside'
export type StripChoice = 'any' | 'with' | 'without'
export type Protection = 'low' | 'medium' | 'high'
export type EcoRequirement = 'none' | 'preferred' | 'required'
export type Fragility = 'low' | 'medium' | 'high'

export interface ModifierDef {
  label: string
  unitDelta?: number
  unitMultiplier?: number
  minQty?: number
  eco?: boolean
  breaksEco?: boolean
}

export interface AddonDef extends ModifierDef {
  minQty: number
  source: 'observed' | 'mocked'
}

export interface ArchetypeSize {
  code: string
  mm: [number, number, number]
  fits?: string[]
}

export interface PriceCurvePoint {
  qty: number
  unit: number
}

export interface PriceCurve {
  source: 'observed' | 'mocked'
  note: string
  points: PriceCurvePoint[]
}

export interface ConstraintRule {
  if: string[]
  forbid?: string[]
  require?: string[]
  reason: string
}

export interface ArchetypeAssets {
  photo: string
  photoSource: 'packhelp' | 'stock'
  aspect: number
  fallback: string
}

export interface Archetype {
  id: string
  label: string
  story: string
  channels: Channel[]
  protection: Protection
  moq: number
  leadTimeDays: number
  foodSafe?: boolean
  assetTier: 'full' | 'placeholder'
  priceCurve: PriceCurve
  sizes: ArchetypeSize[]
  sizeMultiplier: Record<string, number>
  allowedModifiers: string[]
  constraints: ConstraintRule[]
  premiumTierAvailable?: boolean
  premiumTierMessage?: string
  assets: ArchetypeAssets
}

export interface Direction {
  id: string
  archetype: string
  label: string
  modifiers: string[]
  vibeTags: string[]
}

export interface Dimensions {
  w: number
  h: number
  d: number
}

export type SlotSource = 'quiz' | 'chat' | 'inferred' | 'default'

export interface SlotMeta<T> {
  value: T
  source: SlotSource
}

export interface Slots {
  productCategory?: SlotMeta<string>
  dimensions?: SlotMeta<Dimensions>
  weight?: SlotMeta<number>
  fragility?: SlotMeta<Fragility>
  quantity?: SlotMeta<number>
  budgetTotal?: SlotMeta<number>
  channel?: SlotMeta<Channel>
  vibe?: SlotMeta<string[]>
  ecoRequirement?: SlotMeta<EcoRequirement>
  foodContact?: SlotMeta<boolean>
  /* Asked after the grid opens; each one narrows it. */
  materialColour?: SlotMeta<MaterialChoice>
  printCoverage?: SlotMeta<CoverageChoice>
  adhesiveStrip?: SlotMeta<StripChoice>
}

export interface PriceConfigResult {
  valid: boolean
  reason?: string
  unit?: number
  total?: number
  currency?: string
  priceSource?: 'observed' | 'mocked'
  budgetDelta?: number
  overBudgetPct?: number | null
  upsellAvailable?: boolean
  upsellQuantity?: number
  upsellUnit?: number
  upsellTotal?: number
}

export type BadgeKind = 'in_budget' | 'over_budget' | 'upsell' | 'moq_gate' | 'mocked_price'

export interface DirectionBadge {
  kind: BadgeKind
  label: string
}

export type GridFilter = 'all' | 'in_budget' | 'worth_stretch' | 'cheapest'

export interface DirectionCard {
  direction: Direction
  archetype: Archetype
  sizeCode: string
  price: PriceConfigResult
  selectable: boolean
  badges: DirectionBadge[]
  sortRank: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  /** Photo of the picked option, shown above the bubble as an attachment. */
  image?: string
  /** Sizes answered on the dimensions step, redrawn above the bubble. */
  dimensions?: Dimensions
}
