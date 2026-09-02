import { CATEGORY_PRESETS } from '../data/categoryPresets'
import { quizStatus } from '../state/quizStatus'
import { interpretMessage } from './interpret'
import type { Slots } from '../types'

/** Used when the clarification has no options of its own to show. */
const QUESTION_FALLBACK = ''

export interface ClarifyOption {
  /** Row title, phrased like a quiz answer. */
  label: string
  description?: string
  /** Sent verbatim on Next; guaranteed to parse into the promised slot. */
  message: string
  /**
   * Set when the option came from the model: the reading is already resolved,
   * so picking it applies these slots instead of re-parsing `message`.
   */
  slots?: Partial<Slots>
}

export interface Clarification {
  /** What the assistant says in the log. */
  text: string
  /** Title of the question card standing in for the quiz step. */
  question: string
  /** Empty when there is nothing honest to propose — the quiz card stays. */
  options: ClarifyOption[]
}

const STOPWORDS = new Set([
  'the','a','an','and','or','for','with','into','need','want','some','this','that','they','them','its','it',
  'packaging','package','packing','pack','box','boxes','have','has','are','you','your','can','could','would',
  'please','looking','look','make','made','something','stuff','things','thing','about','from','out','get',
])

/** Classic Levenshtein, capped — inputs here are single words. */
function distance(a: string, b: string): number {
  const rows = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array<number>(b.length).fill(0)])
  for (let j = 0; j <= b.length; j++) rows[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost)
    }
  }
  return rows[a.length][b.length]
}

/** How close one typed word is to one vocabulary term. 0 = unrelated. */
function score(token: string, term: string): number {
  if (token === term) return 4
  if (term.length >= 4 && (term.includes(token) || token.includes(term))) return 3
  if (token.length >= 4 && term.length >= 4) {
    const d = distance(token, term)
    if (d <= 1) return 2
    if (d <= 2 && token.length >= 6) return 1
  }
  return 0
}

interface Candidate {
  id: string
  label: string
  blurb: string
  /** The word the user actually typed — named back to them in the question. */
  token: string
  /** The vocabulary word that earned the match. */
  term: string
  score: number
}

function rankCategories(text: string): Candidate[] {
  const tokens = text
    .toLowerCase()
    .split(/[^a-z0-9-]+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t))
  if (tokens.length === 0) return []

  const ranked: Candidate[] = []
  for (const preset of CATEGORY_PRESETS) {
    if (preset.id === 'other') continue
    const terms = [...(preset.hints ?? []), ...preset.label.toLowerCase().split(/[^a-z]+/).filter((w) => w.length >= 4)]
    let best: Candidate | null = null
    for (const token of tokens) {
      for (const term of terms) {
        // Multi-word hints ("drinking glasses") are matched word by word.
        const points = Math.max(...term.split(' ').map((word) => score(token, word)))
        if (points > 0 && (!best || points > best.score)) {
          best = { id: preset.id, label: preset.label, blurb: preset.blurb, token, term, score: points }
        }
      }
    }
    if (best) ranked.push(best)
  }

  return ranked.sort((a, b) => b.score - a.score).slice(0, 3)
}

/**
 * Builds the answer for a candidate and proves it out: the phrasing only ships
 * if the parser reads it back as the category we meant. That keeps the
 * clarifier honest — it can never offer an option that does nothing, or one
 * that lands on a different category than the label promises.
 */
function verifiedOption(candidate: Candidate, slots: Slots): ClarifyOption | null {
  const message = `I'm packing ${candidate.label.toLowerCase()}`
  if (interpretMessage(message, slots).slotUpdates.productCategory?.value !== candidate.id) return null
  return { label: candidate.label, description: candidate.blurb, message }
}

/**
 * The reply for a message the parser could not place. Rather than listing
 * every option again, it guesses what the user might have meant from a wider
 * synonym vocabulary and offers those readings as one-click rephrasings.
 */
export function clarify(text: string, slots: Slots): Clarification {
  const status = quizStatus(slots)

  if (status.nextStep === 0) {
    const candidates = rankCategories(text)
    const options = candidates
      .map((candidate) => verifiedOption(candidate, slots))
      .filter((option): option is ClarifyOption => option !== null)

    if (options.length > 0) {
      const tokens = Array.from(new Set(candidates.map((c) => c.token)))
      const quoted = tokens.length === 1 ? `"${tokens[0]}"` : null
      const escapeHatch = verifiedOption(
        { id: 'other', label: 'Something else', blurb: CATEGORY_PRESETS.find((p) => p.id === 'other')!.blurb, token: '', term: '', score: 0 },
        slots,
      )
      return {
        text: quoted
          ? `I'm not sure I've got that — ${quoted} could go a couple of ways.`
          : "I'm not sure I've got that, but here's what came closest.",
        question: quoted ? `Which one is ${quoted}?` : 'Which of these is closest?',
        options: escapeHatch ? [...options, escapeHatch] : options,
      }
    }
    return {
      text: "I couldn't place that one. Tell me roughly what goes inside — or pick a category below.",
      question: QUESTION_FALLBACK,
      options: [],
    }
  }

  if (status.nextStep === 1) {
    return { text: "I'm not sure I've got that. Is it packaging that travels, or packaging the customer sees?", question: QUESTION_FALLBACK, options: [] }
  }

  if (status.nextStep === 2) {
    return {
      text: 'I\'m not sure I\'ve got that. Give me the product\'s size as three numbers in cm — e.g. "6x12x6" — or fill in the fields below.',
      question: QUESTION_FALLBACK,
      options: [],
    }
  }

  if (status.nextStep === 3) {
    return { text: 'I\'m not sure I\'ve got that. For quantity, something like "I need 250 pcs" works — or pick a band below.', question: QUESTION_FALLBACK, options: [] }
  }

  if (status.nextStep === 4) {
    return { text: 'I\'m not sure I\'ve got that. For budget, something like "My total budget is 500 GBP" works — or pick a band below.', question: QUESTION_FALLBACK, options: [] }
  }

  // Past the quiz there is no card to borrow, so refinements go out as the
  // suggestion chips the grid already uses.
  const refinements = ['It has to be eco and recyclable', 'I want it to look minimal', 'I want it to look lux']
  return {
    text: "I'm not sure I've got that. You can change the quantity or budget, or steer the look:",
    question: QUESTION_FALLBACK,
    options: refinements
      .filter((message) => interpretMessage(message, slots).matched)
      .map((message) => ({ label: message, message })),
  }
}
