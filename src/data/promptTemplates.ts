/**
 * Slash-command templates for the composer. Typing "/" opens the menu; picking
 * an entry drops its sentence into the input with the sample value selected, so
 * the user can overwrite it and hit Enter. Every phrasing here is one the toy
 * parser in llm/interpret.ts actually understands, so answering this way fills
 * the same slots the quiz would — that's the point: a user who already knows
 * their brief never has to click through the questions.
 */
export interface PromptTemplate {
  id: string
  /** Menu label. */
  label: string
  /** One-line hint under the label. */
  hint: string
  /** Sentence inserted into the composer; {p} marks the part to select. */
  text: string
  /** Sample value dropped into {p} and pre-selected. */
  placeholder?: string
  /** Extra words the menu filter matches on. */
  keywords?: string[]
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'product',
    label: "What I'm packing",
    hint: 'Sets the product category and its default size',
    text: "I'm packing {p}",
    placeholder: 'cosmetics',
    keywords: ['category', 'product', 'contents'],
  },
  {
    id: 'purpose',
    label: 'What the packaging is for',
    hint: 'Shipping packaging, or packaging the customer sees',
    text: 'This is packaging for {p}',
    placeholder: 'courier delivery',
    keywords: ['shipping', 'courier', 'retail', 'shelf', 'channel'],
  },
  {
    id: 'dimensions',
    label: 'Product dimensions',
    hint: 'Width × height × depth in cm — clearance is added for you',
    text: 'The product measures {p} cm',
    placeholder: '6x12x6',
    keywords: ['size', 'cm', 'measurements'],
  },
  {
    id: 'quantity',
    label: 'Quantity',
    hint: 'How many pieces you plan to order',
    text: 'I need {p} pcs',
    placeholder: '250',
    keywords: ['how many', 'volume', 'run', 'pieces'],
  },
  {
    id: 'budget',
    label: 'My budget is',
    hint: 'Total budget for the whole run',
    text: 'My total budget is {p} GBP',
    placeholder: '500',
    keywords: ['price', 'cost', 'spend', 'money'],
  },
  {
    id: 'style',
    label: 'The look I want',
    hint: 'minimal, bold, lux, retro, playful',
    text: 'I want it to look {p}',
    placeholder: 'minimal',
    keywords: ['vibe', 'design', 'aesthetic', 'premium'],
  },
  {
    id: 'eco',
    label: 'It has to be eco',
    hint: 'Limits the results to recyclable, compostable materials',
    text: 'It has to be eco and recyclable',
    keywords: ['sustainable', 'green', 'compostable', 'recycled'],
  },
  {
    id: 'brief',
    label: 'My whole brief at once',
    hint: 'Answers every question in one sentence — skips the quiz',
    text: "I'm packing {p}, 6x12x6 cm, 250 pcs, budget 500 GBP, shipping by courier",
    placeholder: 'cosmetics',
    keywords: ['everything', 'all', 'skip', 'full'],
  },
]

export function filterTemplates(query: string): PromptTemplate[] {
  const q = query.trim().toLowerCase()
  if (!q) return PROMPT_TEMPLATES
  return PROMPT_TEMPLATES.filter((t) =>
    [t.label, t.hint, ...(t.keywords ?? [])].some((field) => field.toLowerCase().includes(q)),
  )
}
