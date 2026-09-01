import type { DirectionCard, Slots } from '../types'
import { formatMoney } from '../lib/format'

/**
 * Rule-based stand-in for the Claude tool-calling narrator described in
 * llm-contract.md. It never invents a price or a compatibility verdict —
 * every number and every "fits / doesn't fit" claim below is read straight
 * off the DirectionCard list that the engine (pricing.ts + constraints.ts +
 * grid.ts) already computed.
 */

export function narrateGridSummary(slots: Slots, cards: DirectionCard[]): string {
  const quantity = slots.quantity?.value
  const budget = slots.budgetTotal?.value

  const inBudget = cards.filter((c) => c.badges.some((b) => b.kind === 'in_budget'))
  const worthStretch = cards.filter((c) => c.badges.some((b) => b.kind === 'upsell'))

  if (quantity === undefined || budget === undefined) {
    return `I found ${cards.length} directions that could work. Tell me the quantity and budget too, so I can show you what fits.`
  }

  const fitLabels = inBudget.slice(0, 3).map((c) => c.direction.label + ' (' + c.archetype.label + ')')
  const head =
    fitLabels.length > 0
      ? `At ${quantity} pcs and ${formatMoney(budget)} total, these fit: ${fitLabels.join(', ')}${inBudget.length > 3 ? ` and ${inBudget.length - 3} more` : ''}.`
      : `At ${quantity} pcs and ${formatMoney(budget)} total, no direction fits your budget exactly.`

  const stretchNote =
    worthStretch.length > 0
      ? ` ${worthStretch.length === 1 ? 'One direction' : `${worthStretch.length} directions`} would fit at a higher quantity — look for the "Fits at N pcs" badge.`
      : ''

  return head + stretchNote
}

export function narrateDirectionChosen(label: string, archetypeLabel: string, unit: number, total: number, budgetDelta?: number): string {
  const budgetLine =
    budgetDelta !== undefined
      ? budgetDelta >= 0
        ? ` You have ${formatMoney(budgetDelta)} left in your budget.`
        : ` That's ${formatMoney(Math.abs(budgetDelta))} over your budget.`
      : ''
  return `Selected: ${label} (${archetypeLabel}) at ${formatMoney(unit)}/pc (${formatMoney(total)} total).${budgetLine}`
}

export function narrateUpsell(upsellQuantity: number, upsellUnit: number): string {
  return `At ${upsellQuantity} pcs the price drops to ${formatMoney(upsellUnit)}/pc, and that configuration fits your budget.`
}

export function defaultSuggestions(cards: DirectionCard[]): string[] {
  const suggestions: string[] = []
  const anyUpsell = cards.some((c) => c.badges.some((b) => b.kind === 'upsell'))
  if (anyUpsell) suggestions.push('Increase the quantity so more fits')
  suggestions.push('Show only biodegradable materials')
  suggestions.push('I want printing on the inside')
  return suggestions.slice(0, 3)
}
