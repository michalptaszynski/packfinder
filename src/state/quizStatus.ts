import type { Slots } from '../types'

export type QuizStepIndex = 0 | 1 | 2 | 3 | 4

export interface QuizStatus {
  complete: boolean
  /** First unanswered question, in fixed order — null once complete. */
  nextStep: QuizStepIndex | null
}

/**
 * Derived entirely from slots (never stored separately) so an answer can
 * come from either the guided question cards or free text typed into the
 * always-open composer — whichever fills the slot first "answers" the step.
 * Order: category -> channel (shipping vs shelf, asked early on purpose) ->
 * dimensions -> quantity -> budget per piece.
 */
export function quizStatus(slots: Slots): QuizStatus {
  const categoryDone = slots.productCategory !== undefined
  const channelDone = slots.channel !== undefined
  const dimsDone = slots.dimensions !== undefined && slots.dimensions.source !== 'inferred'
  const quantityDone = slots.quantity !== undefined
  const budgetDone = slots.budgetTotal !== undefined

  if (!categoryDone) return { complete: false, nextStep: 0 }
  if (!channelDone) return { complete: false, nextStep: 1 }
  if (!dimsDone) return { complete: false, nextStep: 2 }
  if (!quantityDone) return { complete: false, nextStep: 3 }
  if (!budgetDone) return { complete: false, nextStep: 4 }
  return { complete: true, nextStep: null }
}
