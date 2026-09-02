import { buildGrid } from './grid'
import { CATEGORY_PRESETS, CHANNEL_OPTIONS } from '../data/categoryPresets'
import { COVERAGE_OPTIONS, MATERIAL_OPTIONS, STRIP_OPTIONS } from '../data/refinements'
import { formatCm } from '../lib/units'
import { formatMoney } from '../lib/format'
import type { DirectionCard, Slots } from '../types'

export interface FlowStage {
  id: string
  /** What was asked. */
  question: string
  /** What was answered. */
  answer: string
  cards: DirectionCard[]
  inBudget: number
  /** Directions this answer removed from the previous stage. */
  removed: number
}

function inBudgetCount(cards: DirectionCard[]): number {
  return cards.filter((card) => card.badges.some((badge) => badge.kind === 'in_budget')).length
}

/**
 * The narrowing, stage by stage: start from every direction in the catalogue,
 * then re-run the real grid engine after each answer. Nothing here re-implements
 * the filtering — each stage is a genuine buildGrid() over the slots known so
 * far, so a stage that removes nothing is shown as removing nothing.
 */
export function buildFlow(slots: Slots): FlowStage[] {
  const accumulated: Slots = {}
  const stages: FlowStage[] = []

  const start = buildGrid(accumulated, 'all')
  stages.push({
    id: 'start',
    question: 'Everything we make',
    answer: 'No constraints yet',
    cards: start,
    inBudget: inBudgetCount(start),
    removed: 0,
  })

  const steps: { id: string; question: string; answer: string; apply: () => void }[] = []

  const preset = CATEGORY_PRESETS.find((p) => p.id === slots.productCategory?.value)
  if (preset) {
    steps.push({
      id: 'category',
      question: 'What are you packing?',
      answer: preset.label,
      apply: () => {
        accumulated.productCategory = slots.productCategory
        accumulated.weight = slots.weight
        accumulated.fragility = slots.fragility
        accumulated.foodContact = slots.foodContact
      },
    })
  }

  const channel = CHANNEL_OPTIONS.find((o) => o.id === slots.channel?.value)
  if (channel) {
    steps.push({
      id: 'channel',
      question: 'Shipping or product packaging?',
      answer: channel.label,
      apply: () => {
        accumulated.channel = slots.channel
      },
    })
  }

  const dims = slots.dimensions?.value
  if (dims && slots.dimensions?.source !== 'inferred') {
    steps.push({
      id: 'dimensions',
      question: 'Product size',
      answer: `${formatCm(dims.w)} × ${formatCm(dims.h)} × ${formatCm(dims.d)} cm`,
      apply: () => {
        accumulated.dimensions = slots.dimensions
      },
    })
  }

  if (slots.quantity) {
    steps.push({
      id: 'quantity',
      question: 'Quantity',
      answer: `${slots.quantity.value} pcs`,
      apply: () => {
        accumulated.quantity = slots.quantity
      },
    })
  }

  if (slots.budgetTotal) {
    steps.push({
      id: 'budget',
      question: 'Budget',
      answer: `${formatMoney(slots.budgetTotal.value)} total`,
      apply: () => {
        accumulated.budgetTotal = slots.budgetTotal
      },
    })
  }

  const refinements: { id: string; question: string; label?: string; apply: () => void }[] = [
    {
      id: 'material',
      question: 'Material colour',
      label: MATERIAL_OPTIONS.find((o) => o.value === slots.materialColour?.value)?.title,
      apply: () => {
        accumulated.materialColour = slots.materialColour
      },
    },
    {
      id: 'coverage',
      question: 'Print coverage',
      label: COVERAGE_OPTIONS.find((o) => o.value === slots.printCoverage?.value)?.title,
      apply: () => {
        accumulated.printCoverage = slots.printCoverage
      },
    },
    {
      id: 'strip',
      question: 'Adhesive strip',
      label: STRIP_OPTIONS.find((o) => o.value === slots.adhesiveStrip?.value)?.title,
      apply: () => {
        accumulated.adhesiveStrip = slots.adhesiveStrip
      },
    },
  ]

  for (const refinement of refinements) {
    if (!refinement.label) continue
    steps.push({ id: refinement.id, question: refinement.question, answer: refinement.label, apply: refinement.apply })
  }

  for (const step of steps) {
    const before = stages[stages.length - 1].cards.length
    step.apply()
    const cards = buildGrid(accumulated, 'all')
    stages.push({
      id: step.id,
      question: step.question,
      answer: step.answer,
      cards,
      inBudget: inBudgetCount(cards),
      removed: Math.max(0, before - cards.length),
    })
  }

  return stages
}
