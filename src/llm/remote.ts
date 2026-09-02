import { cmToMm } from '@/lib/units'
import { CATEGORY_PRESETS } from '@/data/categoryPresets'
import type { Channel, Slots } from '@/types'
import type { ClarifyOption, Clarification } from './clarify'

/**
 * Client half of the Claude integration. Talks to the dev-server route in
 * vite.config.ts, which holds the API key. Everything here is defensive: if the
 * route is missing (production build), unauthorised (no key) or slow, the
 * caller falls back to the offline rule-based parser rather than breaking the
 * conversation.
 */

interface ModelSlots {
  productCategory?: string | null
  channel?: string | null
  dimensionsCm?: { w: number; h: number; d: number } | null
  quantity?: number | null
  budgetTotalGbp?: number | null
  vibe?: string[] | null
  ecoRequired?: boolean | null
}

type RemoteResponse =
  | { kind: 'slots'; slots: ModelSlots }
  | { kind: 'clarify'; message: string; question: string; options: { label: string; description: string; slots: ModelSlots }[] }

export interface RemoteInterpretation {
  slotUpdates: Partial<Slots>
  clarification: Clarification | null
}

const TIMEOUT_MS = 20_000

/** Turns the model's flat, user-facing shape into engine slots (mm, sourced). */
function toSlots(model: ModelSlots): Partial<Slots> {
  const updates: Partial<Slots> = {}

  if (model.productCategory) {
    const preset = CATEGORY_PRESETS.find((p) => p.id === model.productCategory)
    if (preset) {
      updates.productCategory = { value: preset.id, source: 'chat' }
      // Same defaults the quiz applies when a category is picked — the model
      // supplies the category, the preset supplies its physical profile.
      updates.dimensions = { value: preset.dimensions, source: 'inferred' }
      updates.weight = { value: preset.weight, source: 'inferred' }
      updates.fragility = { value: preset.fragility, source: 'inferred' }
      updates.foodContact = { value: Boolean(preset.foodContact), source: 'inferred' }
    }
  }

  if (model.channel === 'courier' || model.channel === 'retail_shelf') {
    updates.channel = { value: model.channel as Channel, source: 'chat' }
  }

  const dims = model.dimensionsCm
  if (dims && [dims.w, dims.h, dims.d].every((v) => Number.isFinite(v) && v > 0)) {
    updates.dimensions = { value: { w: cmToMm(dims.w), h: cmToMm(dims.h), d: cmToMm(dims.d) }, source: 'chat' }
  }

  if (typeof model.quantity === 'number' && model.quantity > 0) {
    updates.quantity = { value: Math.round(model.quantity), source: 'chat' }
  }

  if (typeof model.budgetTotalGbp === 'number' && model.budgetTotalGbp > 0) {
    updates.budgetTotal = { value: model.budgetTotalGbp, source: 'chat' }
  }

  if (model.vibe && model.vibe.length > 0) {
    updates.vibe = { value: model.vibe, source: 'chat' }
  }

  if (model.ecoRequired) {
    updates.ecoRequirement = { value: 'required', source: 'chat' }
  }

  return updates
}

/** What the UI already knows, so the model isn't asked to re-derive it. */
function summariseKnown(slots: Slots): Record<string, unknown> {
  return {
    productCategory: slots.productCategory?.value ?? null,
    channel: slots.channel?.value ?? null,
    quantity: slots.quantity?.value ?? null,
    budgetTotalGbp: slots.budgetTotal?.value ?? null,
  }
}

export async function interpretRemote(text: string, slots: Slots): Promise<RemoteInterpretation | null> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch('/api/interpret', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text, known: summariseKnown(slots) }),
      signal: controller.signal,
    })
    if (!response.ok) return null

    const data = (await response.json()) as RemoteResponse

    if (data.kind === 'clarify') {
      const options: ClarifyOption[] = data.options.map((option) => ({
        label: option.label,
        description: option.description,
        // The chip's own text is never re-parsed — the slots the model attached
        // to this reading are applied directly.
        message: option.label,
        slots: toSlots(option.slots),
      }))
      return {
        slotUpdates: {},
        clarification: { text: data.message, question: data.question, options },
      }
    }

    return { slotUpdates: toSlots(data.slots), clarification: null }
  } catch {
    return null
  } finally {
    window.clearTimeout(timer)
  }
}
