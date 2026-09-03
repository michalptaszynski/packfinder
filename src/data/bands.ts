/**
 * The quantity and budget bands the quiz cards offer. They live here rather
 * than inside QuizControls because the server-side understanding layer needs
 * them too: they are the only prices the model is allowed to quote back, so
 * suggesting a budget can never turn into inventing one.
 */

export interface Band {
  id: string
  title: string
  description: string
  /** Representative value the card commits — per piece for budget bands. */
  value: number
}

export const QUANTITY_BANDS: Band[] = [
  { id: 'q1', title: '30–100 pcs', description: 'A first small batch, testing the market.', value: 65 },
  { id: 'q2', title: '100–300 pcs', description: 'A standard first production run.', value: 180 },
  { id: 'q3', title: '300–1000 pcs', description: 'A bigger batch, better unit price.', value: 600 },
  { id: 'q4', title: '1000+ pcs', description: 'High volume, the lowest price per piece.', value: 1500 },
]

export const BUDGET_BANDS: Band[] = [
  { id: 'b1', title: 'Up to £0.50 / pc', description: 'A very lean option, functional packaging.', value: 0.4 },
  { id: 'b2', title: '£0.50 – £1.00 / pc', description: 'A reasonable e-commerce standard.', value: 0.75 },
  { id: 'b3', title: '£1.00 – £3.00 / pc', description: 'A step up, more finishing options.', value: 2 },
  { id: 'b4', title: 'Above £3.00 / pc', description: 'Premium — rigid boxes, foiling.', value: 4 },
]
