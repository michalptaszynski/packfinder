import type { Slots } from '../types'

export type QuizStepIndex = 0 | 1 | 2 | 3

export interface QuizStatus {
  complete: boolean
  nextStep: QuizStepIndex | null
}

/**
 * Derived entirely from slots (never stored separately) so an answer can
 * come from either the guided tiles/sliders or free text typed into the
 * always-open composer — whichever fills the slot first "answers" the step.
 */
export function quizStatus(slots: Slots): QuizStatus {
  const categoryDone = slots.productCategory !== undefined
  const dimsDone = slots.dimensions !== undefined && slots.dimensions.source !== 'inferred'
  const channelDone = slots.channel !== undefined
  const qtyBudgetDone = slots.quantity !== undefined && slots.budgetTotal !== undefined

  if (!categoryDone) return { complete: false, nextStep: 0 }
  if (!dimsDone) return { complete: false, nextStep: 1 }
  if (!channelDone) return { complete: false, nextStep: 2 }
  if (!qtyBudgetDone) return { complete: false, nextStep: 3 }
  return { complete: true, nextStep: null }
}
