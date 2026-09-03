import { asset } from '../lib/asset'
import type { CoverageChoice, MaterialChoice, Slots, StripChoice } from '../types'

/**
 * The spec-level questions a real product page asks once you know which
 * packaging you're looking at (material colour, print coverage, adhesive
 * strip). They come *after* the grid rather than before it: each one narrows
 * an already-visible list, so the answer has something to act on.
 *
 * Every option maps onto the modifier ids the directions actually carry — see
 * engine/grid.ts, which does the matching.
 */
export interface RefinementOption<T extends string> {
  value: T
  title: string
  description: string
  /** Board swatch from public/photos/materials/. */
  photo?: string
}

export const MATERIAL_OPTIONS: RefinementOption<MaterialChoice>[] = [
  { value: 'kraft', title: 'Kraft', description: 'Natural brown board — the plainest, cheapest surface.', photo: asset('/photos/materials/material-kraft.png') },
  { value: 'white', title: 'White', description: 'Bleached board — colours print truer on it.', photo: asset('/photos/materials/material-white.png') },
  { value: 'coated', title: 'Coated', description: 'Smooth coated stock for saturated, photographic print.', photo: asset('/photos/materials/material-white-premium.png') },
  { value: 'any', title: 'No preference', description: "Show every material — I'll judge by the look." },
]

export const COVERAGE_OPTIONS: RefinementOption<CoverageChoice>[] = [
  { value: 'outside', title: 'Outside only', description: 'Print where the courier and the shelf see it.' },
  { value: 'inside_outside', title: 'Inside and outside', description: 'The unboxing moment gets a printed interior too.' },
  { value: 'any', title: 'No preference', description: 'Either is fine.' },
]

export const STRIP_OPTIONS: RefinementOption<StripChoice>[] = [
  { value: 'with', title: 'With an adhesive strip', description: 'Seals without tape; a double strip also covers returns.' },
  { value: 'without', title: 'Without', description: 'Sealed with tape or a closure of its own.' },
  { value: 'any', title: 'No preference', description: 'Either is fine.' },
]

export const REFINEMENT_QUESTIONS = ['Material colour?', 'Print coverage?', 'Adhesive strip?'] as const

export type RefineStepIndex = 0 | 1 | 2

/** First unanswered refinement, in fixed order — null once all three are set. */
export function nextRefinement(slots: Slots): RefineStepIndex | null {
  if (slots.materialColour === undefined) return 0
  if (slots.printCoverage === undefined) return 1
  if (slots.adhesiveStrip === undefined) return 2
  return null
}
