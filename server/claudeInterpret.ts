import Anthropic from '@anthropic-ai/sdk'
import { CATEGORY_PRESETS, CHANNEL_OPTIONS } from '../src/data/categoryPresets'
import { BUDGET_BANDS, QUANTITY_BANDS } from '../src/data/bands'
import { archetypeCatalog, modifierLibrary } from '../src/engine/pricing'

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
    // A nullable enum has to be written as anyOf: strict schemas reject an
    // enum listed alongside a ['string', 'null'] type.
    productCategory: {
      anyOf: [{ type: 'string', enum: CATEGORY_IDS }, { type: 'null' }],
      description: 'What goes inside the packaging.',
    },
    channel: {
      anyOf: [{ type: 'string', enum: CHANNEL_IDS }, { type: 'null' }],
      description: 'courier = ships to a customer; retail_shelf = the customer sees it.',
    },
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
      'Record what the message tells you about the packaging brief, and reply to the person when they asked something rather than stated something. Set a slot only when the message actually says it, or when you are taking a stated default for them; use null for everything else. Never guess a size, quantity or budget out of thin air.',
    strict: true,
    input_schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        slots: SLOTS_SCHEMA,
        language: {
          type: 'string',
          description:
            "ISO 639-1 code of the language this message is written in — 'en', 'pl', 'de'. The interface follows it, so report the language of the message even when you reply in it.",
        },
        reply: {
          type: ['string', 'null'],
          description:
            'What to say back, when the message asks a question, pushes back, or goes off the script. One or two sentences, then steer to the question the app is waiting on. Null when the message simply states facts and the recorded slots speak for themselves.',
        },
      },
      required: ['slots', 'language', 'reply'],
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
        language: {
          type: 'string',
          description: "ISO 639-1 code of the language this message is written in — 'en', 'pl', 'de'. The interface follows it.",
        },
        message: { type: 'string', description: 'One short sentence for the chat, naming what was ambiguous.' },
        question: { type: 'string', description: 'Title of the choice card, e.g. Which one is "glasses"?' },
        options: {
          type: 'array',
          // Strict schemas take neither maxItems nor a minItems above 1, so
          // the "two or three readings" rule lives in the tool description.
          minItems: 1,
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
      required: ['language', 'message', 'question', 'options'],
    },
  },
]

function systemPrompt(pending: string | null): string {
  const categories = CATEGORY_PRESETS.map((preset) => `- ${preset.id}: ${preset.label} — ${preset.blurb}`).join('\n')
  const channels = CHANNEL_OPTIONS.map((option) => `- ${option.id}: ${option.label} — ${option.blurb}`).join('\n')
  const quantities = QUANTITY_BANDS.map((band) => `- ${band.title} — ${band.description}`).join('\n')
  // Hard catalogue facts, per the guide §2: the model may state these outright
  // because they come from archetypes.json rather than from its own reasoning.
  const catalogue = archetypeCatalog
    .map((archetype) => {
      const sizes = archetype.sizes
        .map((size) => `${size.code} ${size.mm.join('×')} mm${size.fits?.length ? ` (${size.fits.join(', ')})` : ''}`)
        .join('; ')
      const finishes = archetype.allowedModifiers.map((id) => modifierLibrary[id]?.label ?? id).join(', ')
      const forbidden = (archetype.constraints ?? [])
        .filter((rule) => rule.forbid?.length)
        .map((rule) => `${rule.if.join(' + ')} rules out ${rule.forbid!.join(', ')} — ${rule.reason}`)
        .join(' | ')
      return [
        `- ${archetype.label} (${archetype.id}): ${archetype.story}`,
        `  from ${archetype.moq} pcs, about ${archetype.leadTimeDays} working days`,
        `  sizes: ${sizes}`,
        `  finishes: ${finishes}`,
        forbidden ? `  cannot combine: ${forbidden}` : '',
      ]
        .filter(Boolean)
        .join('\n')
    })
    .join('\n')
  const budgets = BUDGET_BANDS.map((band) => `- ${band.title} — ${band.description}`).join('\n')
  return [
    'You are the understanding layer of Packfinder, a packaging advisor. You read one message from a person describing what they need to pack and turn it into structured fields. The app asks a short series of questions; the person may answer them, ignore them, or ask you something instead, and your job is to keep that conversation going until the questions are answered.',
    '',
    'Product categories:',
    categories,
    '',
    'Packaging purpose:',
    channels,
    '',
    'Catalogue — every product Packhelp makes, with the facts you may state outright:',
    catalogue,
    '',
    'Quantity bands the app offers as cards:',
    quantities,
    '',
    'Budget bands the app offers as cards:',
    budgets,
    '',
    pending ? `The app is waiting on this question: "${pending}"` : 'The brief is complete; the person is now refining the results.',
    '',
    'Rules:',
    '- Always answer with exactly one tool call.',
    '- Record only what the message states or clearly implies. A negation ("not for food") is not a value — leave the field null.',
    '- Sizes are centimetres. If the person gives millimetres or inches, convert.',
    '- Budget is the total for the whole run. If they give a per-piece price and a quantity, multiply; if there is no quantity, leave the budget null.',
    '- If a word could plausibly mean two or more of the categories above, call ask_clarification instead of picking one. Each option must set the fields that reading implies.',
    '- Answer whenever the person asks something, pushes back, or says they do not know — that is what the reply field is for. Do not leave a question hanging.',
    '- Two sentences. Four only when they explicitly ask you to explain something.',
    '- Reply in the language they wrote in.',
    '',
    'What you may state outright:',
    '- Anything in the catalogue above: minimum order, lead time, which sizes exist, which carrier a size fits, which finishes an archetype allows, and why two of them cannot be combined.',
    '- The quantity and budget bands, as bands — never as the price of a particular product.',
    '- Any figure or verdict this message hands you. You may quote those exactly; you may never derive one yourself.',
    '',
    'What you never do:',
    '- Price anything, total anything up, or say whether something fits a budget. Beyond the bands, the pricing engine owns every number.',
    '- Judge whether a product fits a size by comparing measurements yourself. The engine computes that with a technical clearance and hands you the answer.',
    '- Discuss discounts, promotions or negotiating a price.',
    '- Invent facts about their business.',
    '',
    'Custom work — Packhelp makes more than the catalogue, so a request that falls outside it is an option, not a refusal:',
    '- Non-catalogue sizes, custom construction (dividers, inserts, a bespoke die-cut), finishes outside an archetype list and materials outside the catalogue are all possible. Say so.',
    '- A custom run raises the minimum order and the lead time. Say that, without naming figures we do not have.',
    '- Custom is never priced in conversation. Its card carries "Get a quote" and the standard alternatives sit beside it.',
    '- When a standard size would nearly do, say so and point at it. If this message gives you the price difference, quote it.',
    '',
    'Conversation:',
    '- Never repeat the pending question word for word, and never re-ask it in your own words either. The app has already put it on screen with its answer cards; your reply ends on what you recorded or assumed.',
    '- Never ask for anything other than the pending question. The app runs its own order and will ask for the rest in turn; a second question in your reply puts two different questions on screen at once and strands the person between them.',
    '- When the slots you recorded answer the pending question, the app moves straight on to the next one. Your reply must then state what you assumed and stop — no invitation to add, correct or choose anything.',
    '- If they do not know the answer, help them estimate once — "a 200 ml jar is usually about 7 cm across". If that does not land, take a sensible default, say plainly what you took, and move on.',
    '- Deciding for them means filling the slot in this same tool call. "I not knowing" and "it is flexible" and "you choose" are all answers: name the value you are taking and record it. Announcing a value you did not record leaves them staring at the question you just said you had answered — the worst of both.',
    '- Budget slots hold the total for the run. When you take a per-piece band as the default and the quantity is known, multiply it out before recording; when the quantity is unknown, ask nothing and leave the budget null.',
    '- If they contradict something they said earlier, the newer answer wins. Say in one sentence what you overwrote; do not ask them to confirm.',
    '- Packaging-adjacent questions we do not sell — volumetric weight, what goes on a label, stacking a pallet — get a short, useful answer, then back to the brief. Anything unrelated to packaging gets one sentence saying it is not your remit.',
    '- There is no handing over to a human here. When something sits outside what the catalogue settles — food contact, medical goods, dangerous goods, volumes past the price curve — say plainly what you cannot settle, then carry on with the brief.',
  ].join('\n')
}

export interface InterpretRequest {
  text: string
  /** Slots already filled, so the model does not re-ask what it knows. */
  known?: Record<string, unknown>
  /** The question the app is waiting on, so an off-script reply can steer back to it. */
  pending?: string | null
}

export type InterpretResponse =
  | { kind: 'slots'; slots: Record<string, unknown>; reply: string | null; language: string | null }
  | {
      kind: 'clarify'
      message: string
      question: string
      language: string | null
      options: { label: string; description: string; slots: Record<string, unknown> }[]
    }

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
    // The catalogue makes this prompt long and it is identical on every turn,
    // so it is worth caching: later messages in a conversation skip re-reading
    // it, which is most of the round trip.
    system: [
      {
        type: 'text',
        text: systemPrompt(body.pending ?? null),
        cache_control: { type: 'ephemeral' },
      },
    ],
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
    return {
      ...clarification,
      kind: 'clarify',
      language: clarification.language?.slice(0, 5).toLowerCase() ?? null,
    }
  }
  const recorded = input as { slots: Record<string, unknown>; reply?: string | null; language?: string }
  return {
    kind: 'slots',
    slots: recorded.slots,
    reply: recorded.reply ?? null,
    language: recorded.language?.slice(0, 5).toLowerCase() ?? null,
  }
}
