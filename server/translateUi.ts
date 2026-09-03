import Anthropic from '@anthropic-ai/sdk'

/**
 * Translates the question-card copy into whatever language the conversation is
 * being held in. One call per language per browser — the client caches the
 * result — so this runs at most once mid-conversation, the first time someone
 * writes in something other than English.
 *
 * The model gets the whole bundle at once rather than string by string: the
 * options inside a card have to read as a set, and a per-string call would lose
 * that context and cost a round trip each.
 */

const MODEL = 'claude-opus-5'

export interface TranslateRequest {
  /** BCP-47 or ISO-639-1 code, as reported by the interpreter. */
  language: string
  strings: Record<string, string>
}

export async function translateUi(apiKey: string, body: TranslateRequest): Promise<Record<string, string>> {
  const client = new Anthropic({ apiKey })

  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 8192,
    output_config: { effort: 'low' },
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    system: [
      'You localise the interface of Packhelp, a packaging manufacturer, from English into another language.',
      '',
      'Rules:',
      '- Return every key you were given, unchanged, with a translated value. Never add, drop or rename a key.',
      '- Use the words a packaging manufacturer uses on its own website in that language, not a literal translation. Product names in particular are trade terms.',
      '- These are cards in a narrow panel: keep titles about as short as the English, and descriptions to one line.',
      '- Keep placeholder examples idiomatic — a number format and separator that reads naturally in that language.',
      '- Currency symbols, units (cm, mm, pcs) and brand names stay as they are unless the language genuinely writes them differently.',
      '- Answer with a single JSON object and nothing else.',
    ].join('\n'),
    messages: [
      {
        role: 'user',
        content: `Target language: ${body.language}\n\nStrings:\n${JSON.stringify(body.strings, null, 1)}`,
      },
    ],
  })

  const text = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('')

  // The model is told to answer with bare JSON, but a stray code fence would
  // otherwise take the whole translation down.
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('Translator returned no JSON')

  const parsed = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>
  const out: Record<string, string> = {}
  for (const key of Object.keys(body.strings)) {
    const value = parsed[key]
    // A missing or malformed key falls back to English rather than blanking the card.
    out[key] = typeof value === 'string' && value.trim() ? value : body.strings[key]
  }
  return out
}
