import Anthropic from '@anthropic-ai/sdk'
import { CATEGORY_PRESETS, CHANNEL_OPTIONS } from '../src/data/categoryPresets'

/**
 * Server-side understanding layer. This is the half of the app that reads free
 * text; every number that reaches the user still comes from pricing.ts and
 * constraints.ts, so the model can propose what the user meant but can never
 * quote a price or claim something fits.
 *
 * It runs in Node (behind the Vite dev middleware) because the API key must
 * never reach the browser bundle.
 */

const MODEL = 'claude-opus-5'

const CATEGORY_IDS = CATEGORY_PRESETS.map((preset) => preset.id)
const CHANNEL_IDS = CHANNEL_OPTIONS.map((option) => option.id)
const VIBES = ['minimal', 'bold', 'eco', 'lux', 'retro', 'playful']

/** Shared shape for "what the user told us", in the units the UI speaks. */
const SLOTS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    productCategory: { type: ['string', 'null'], enum: [...CATEGORY_IDS, null], description: 'What goes inside the packaging.' },
    channel: { type: ['string', 'null'], enum: [...CHANNEL_IDS, null], description: 'courier = ships to a customer; retail_shelf = the customer sees it.' },
    dimensionsCm: {
      type: ['object', 'null'],
      additionalProperties: false,
      properties: { w: { type: 'number' }, h: { type: 'number' }, d: { type: 'number' } },
      required: ['w', 'h', 'd'],
      description: "The product's own size in centimetres, not the package's.",
    },
    quantity: { type: ['integer', 'null'], description: 'Pieces the user plans to order.' },
    budgetTotalGbp: { type: ['number', 'null'], description: 'Total budget in GBP for the whole run, not per piece.' },
    vibe: { type: ['array', 'null'], items: { type: 'string', enum: VIBES } },
    ecoRequired: { type: ['boolean', 'null'] },
  },
  required: ['productCategory', 'channel', 'dimensionsCm', 'quantity', 'budgetTotalGbp', 'vibe', 'ecoRequired'],
} as const

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'update_slots',
    description:
      'Record what the message tells you about the packaging brief. Set a field only when the message actually says it; use null for everything else. Never guess a size, quantity or budget the user did not give.',
    strict: true,
    input_schema: {
      type: 'object',
      additionalProperties: false,
      properties: { slots: SLOTS_SCHEMA },
      required: ['slots'],
    },
  },
  {
    name: 'ask_clarification',
    description:
      'Use when the message is about packaging but too ambiguous to record — e.g. a word that could mean several product categories, or a negation you cannot resolve. Offer the two or three readings that are actually plausible.',
    strict: true,
    input_schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        message: { type: 'string', description: 'One short sentence for the chat, naming what was ambiguous.' },
        question: { type: 'string', description: 'Title of the choice card, e.g. Which one is "glasses"?' },
        options: {
          type: 'array',
          minItems: 2,
          maxItems: 4,
          items: {
            type: 'object',
            additionalProperties: false,
            properties: {
              label: { type: 'string', description: 'Short answer label, e.g. Bottles & liquids.' },
              description: { type: 'string', description: 'One line saying what this reading means.' },
              slots: SLOTS_SCHEMA,
            },
            required: ['label', 'description', 'slots'],
          },
        },
      },
      required: ['message', 'question', 'options'],
    },
  },
]

function systemPrompt(): string {
  const categories = CATEGORY_PRESETS.map((preset) => `- ${preset.id}: ${preset.label} — ${preset.blurb}`).join('\n')
  const channels = CHANNEL_OPTIONS.map((option) => `- ${option.id}: ${option.label} — ${option.blurb}`).join('\n')
  return [
    'You are the understanding layer of Packfinder, a packaging advisor. You read one message from a person describing what they need to pack and turn it into structured fields.',
    '',
    'Product categories:',
    categories,
    '',
    'Packaging purpose:',
    channels,
    '',
    'Rules:',
    '- Always answer with exactly one tool call.',
    '- Record only what the message states or clearly implies. A negation ("not for food") is not a value — leave the field null.',
    '- Sizes are centimetres. If the person gives millimetres or inches, convert.',
    '- Budget is the total for the whole run. If they give a per-piece price and a quantity, multiply; if there is no quantity, leave the budget null.',
    '- If a word could plausibly mean two or more of the categories above, call ask_clarification instead of picking one. Each option must set the fields that reading implies.',
    '- You never see prices and never state one. Do not comment on cost, feasibility or what fits a budget — the pricing engine owns that.',
  ].join('\n')
}

export interface InterpretRequest {
  text: string
  /** Slots already filled, so the model does not re-ask what it knows. */
  known?: Record<string, unknown>
}

export type InterpretResponse =
  | { kind: 'slots'; slots: Record<string, unknown> }
  | { kind: 'clarify'; message: string; question: string; options: { label: string; description: string; slots: Record<string, unknown> }[] }

export async function claudeInterpret(apiKey: string, body: InterpretRequest): Promise<InterpretResponse> {
  const client = new Anthropic({ apiKey })

  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 2048,
    // Extraction, not deliberation — low effort keeps the round trip short.
    output_config: { effort: 'low' },
    // Route around a safety refusal instead of failing the request outright.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: systemPrompt(),
    tools: TOOLS,
    tool_choice: { type: 'any' },
    messages: [
      {
        role: 'user',
        content: [
          `Already known (do not repeat): ${JSON.stringify(body.known ?? {})}`,
          `Message: ${body.text}`,
        ].join('\n'),
      },
    ],
  })

  const call = response.content.find((block) => block.type === 'tool_use')
  if (!call || call.type !== 'tool_use') throw new Error('Model returned no tool call')

  // Tool inputs are JSON — the SDK has already parsed them, but the escaping
  // inside strings varies by model, so never string-match on them.
  const input = call.input as unknown

  if (call.name === 'ask_clarification') {
    const clarification = input as Omit<Extract<InterpretResponse, { kind: 'clarify' }>, 'kind'>
    return { kind: 'clarify', ...clarification }
  }
  return { kind: 'slots', slots: (input as { slots: Record<string, unknown> }).slots }
}
