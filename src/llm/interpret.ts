import { CATEGORY_PRESETS, CHANNEL_OPTIONS } from '../data/categoryPresets'
import type { Channel, Slots } from '../types'

export interface Interpretation {
  slotUpdates: Partial<Slots>
  matched: boolean
}

const VIBE_WORDS: Record<string, string> = {
  minimal: 'minimal',
  minimalist: 'minimal',
  bold: 'bold',
  eco: 'eco',
  biodegrad: 'eco',
  compost: 'eco',
  sustainab: 'eco',
  lux: 'lux',
  luxury: 'lux',
  premium: 'lux',
  retro: 'retro',
  vintage: 'retro',
  playful: 'playful',
  fun: 'playful',
  colourful: 'playful',
  colorful: 'playful',
}

const CATEGORY_KEYWORDS: Record<string, string> = {
  cloth: 'clothing',
  apparel: 'clothing',
  garment: 'clothing',
  cosmetic: 'cosmetics',
  makeup: 'cosmetics',
  skincare: 'cosmetics',
  jewel: 'jewelry',
  food: 'food',
  snack: 'food',
  bottle: 'bottles',
  liquid: 'bottles',
  drink: 'bottles',
  electronic: 'electronics',
  gadget: 'electronics',
  stationery: 'stationery',
  print: 'stationery',
  'gift set': 'gift_set',
  toy: 'toys',
  footwear: 'footwear',
  shoe: 'footwear',
  sneaker: 'footwear',
  supplement: 'health',
  vitamin: 'health',
  health: 'health',
  accessor: 'accessories',
}

const CHANNEL_KEYWORDS: Record<string, Channel> = {
  ship: 'courier',
  courier: 'courier',
  mail: 'courier',
  deliver: 'courier',
  shelf: 'retail_shelf',
  'product box': 'retail_shelf',
  retail: 'retail_shelf',
  store: 'retail_shelf',
}

/**
 * Toy intent parser standing in for Claude's update_slots tool call. It only
 * ever proposes slot updates — pricing.ts and constraints.ts still own every
 * number and every compatibility verdict. Handles both free-form chat
 * ("increase the quantity to 500") and answers to the guided quiz questions
 * typed directly into the composer instead of clicked ("cosmetics",
 * "60x120x60").
 */
export function interpretMessage(text: string, currentSlots: Slots): Interpretation {
  const lower = text.toLowerCase()
  const slotUpdates: Partial<Slots> = {}
  let matched = false

  const categoryEntry = Object.entries(CATEGORY_KEYWORDS).find(([needle]) => lower.includes(needle))
  if (categoryEntry) {
    const preset = CATEGORY_PRESETS.find((p) => p.id === categoryEntry[1])
    if (preset) {
      slotUpdates.productCategory = { value: preset.id, source: 'chat' }
      slotUpdates.dimensions = { value: preset.dimensions, source: 'inferred' }
      slotUpdates.weight = { value: preset.weight, source: 'inferred' }
      slotUpdates.fragility = { value: preset.fragility, source: 'inferred' }
      slotUpdates.foodContact = { value: Boolean(preset.foodContact), source: 'inferred' }
      matched = true
    }
  }

  const channelEntry = Object.entries(CHANNEL_KEYWORDS).find(([needle]) => lower.includes(needle))
  if (channelEntry) {
    const option = CHANNEL_OPTIONS.find((o) => o.id === channelEntry[1])
    if (option) {
      slotUpdates.channel = { value: option.id, source: 'chat' }
      matched = true
    }
  }

  const dimsMatch = lower.match(/(\d{1,4})\s*[x×]\s*(\d{1,4})\s*[x×]\s*(\d{1,4})/)
  if (dimsMatch) {
    const [w, h, d] = [Number(dimsMatch[1]), Number(dimsMatch[2]), Number(dimsMatch[3])]
    if ([w, h, d].every((v) => Number.isFinite(v) && v > 0)) {
      slotUpdates.dimensions = { value: { w, h, d }, source: 'chat' }
      matched = true
    }
  }

  const qtyMatch =
    lower.match(/(\d{2,5})\s*(?:pcs\b|pieces|units)/) ||
    lower.match(/quantity\w*[^\d]{0,15}(\d{2,5})/) ||
    lower.match(/increase\w*[^\d]{0,15}(\d{2,5})/)
  if (qtyMatch) {
    const value = Number(qtyMatch[1])
    if (Number.isFinite(value) && value > 0) {
      slotUpdates.quantity = { value, source: 'chat' }
      matched = true
    }
  }

  const budgetMatch = lower.match(/(\d{1,6}(?:[.,]\d{1,2})?)\s*(£|gbp|pound\w*|eur\w*|€|pln|zloty)/)
  if (budgetMatch) {
    const raw = Number(budgetMatch[1].replace(',', '.'))
    if (Number.isFinite(raw) && raw > 0) {
      slotUpdates.budgetTotal = { value: raw, source: 'chat' }
      matched = true
    }
  }

  const vibeTags = new Set(currentSlots.vibe?.value ?? [])
  let vibeMatched = false
  for (const [needle, tag] of Object.entries(VIBE_WORDS)) {
    if (lower.includes(needle)) {
      vibeTags.add(tag)
      vibeMatched = true
    }
  }
  if (vibeMatched) {
    slotUpdates.vibe = { value: Array.from(vibeTags), source: 'chat' }
    matched = true
  }

  if (/\beco\b|biodegrad|compost|sustainab/i.test(lower)) {
    slotUpdates.ecoRequirement = { value: 'required', source: 'chat' }
    matched = true
  }

  return { slotUpdates, matched }
}
