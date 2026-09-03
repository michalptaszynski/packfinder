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
  | { kind: 'slots'; slots: ModelSlots; reply: string | null; language: string | null }
  | {
      kind: 'clarify'
      message: string
      question: string
      language: string | null
      options: { label: string; description: string; slots: ModelSlots }[]
    }

export interface RemoteInterpretation {
  slotUpdates: Partial<Slots>
  clarification: Clarification | null
  /** Prose answer, when the message asked something rather than stated it. */
  reply: string | null
  /** Language the message was written in, which the question cards follow. */
  language: string | null
}

// The system prompt now carries the whole catalogue, so a reply that also has
// to be written takes longer than the original extraction-only call did. Below
// this the app was silently falling back to the offline parser mid-conversation.
const TIMEOUT_MS = 60_000

/**
 * Identifies the app to its own API. Not a secret — it ships in this bundle —
 * it only keeps the deployed route from answering anything that finds the URL.
 */
export function appHeader(): Record<string, string> {
  const token = import.meta.env.VITE_APP_TOKEN
  return token ? { 'x-packfinder-app': token } : {}
}

/** Turns the model's flat, user-facing shape into engine slots (mm, sourced). */
function toSlots(model: ModelSlots, current: Slots): Partial<Slots> {
  const updates: Partial<Slots> = {}

  if (model.productCategory) {
    const preset = CATEGORY_PRESETS.find((p) => p.id === model.productCategory)
    if (preset) {
      updates.productCategory = { value: preset.id, source: 'chat' }
      // Same defaults the quiz applies when a category is picked — the model
      // supplies the category, the preset supplies its physical profile. What
      // the person has already told us outranks them: a category named later
      // in the conversation must not wipe the size they typed earlier and
      // send the quiz back a step.
      const keep = (slot?: { source: string }) => slot !== undefined && slot.source !== 'inferred'
      if (!keep(current.dimensions)) updates.dimensions = { value: preset.dimensions, source: 'inferred' }
      if (!keep(current.weight)) updates.weight = { value: preset.weight, source: 'inferred' }
      if (!keep(current.fragility)) updates.fragility = { value: preset.fragility, source: 'inferred' }
      if (!keep(current.foodContact)) updates.foodContact = { value: Boolean(preset.foodContact), source: 'inferred' }
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

export async function interpretRemote(text: string, slots: Slots, pending: string | null): Promise<RemoteInterpretation | null> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch('/api/interpret', {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...appHeader() },
      body: JSON.stringify({ text, known: summariseKnown(slots), pending }),
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
        slots: toSlots(option.slots, slots),
      }))
      return {
        slotUpdates: {},
        clarification: { text: data.message, question: data.question, options },
        reply: null,
        language: data.language ?? null,
      }
    }

    return {
      slotUpdates: toSlots(data.slots, slots),
      clarification: null,
      reply: data.reply ?? null,
      language: data.language ?? null,
    }
  } catch {
    return null
  } finally {
    window.clearTimeout(timer)
  }
}
