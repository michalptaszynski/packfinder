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
    return `Znalazłem ${cards.length} kierunków, które mogą pasować. Powiedz mi jeszcze nakład i budżet, żebym mógł pokazać, co się mieści.`
  }

  const fitLabels = inBudget.slice(0, 3).map((c) => c.direction.label + ' (' + c.archetype.label + ')')
  const head =
    fitLabels.length > 0
      ? `Przy ${quantity} szt. i ${formatMoney(budget)} całkowitych mieszczą się: ${fitLabels.join(', ')}${inBudget.length > 3 ? ` i ${inBudget.length - 3} więcej` : ''}.`
      : `Przy ${quantity} szt. i ${formatMoney(budget)} całkowitych żaden kierunek nie mieści się dokładnie w budżecie.`

  const stretchNote =
    worthStretch.length > 0
      ? ` ${worthStretch.length === 1 ? 'Jeden kierunek' : `${worthStretch.length} kierunki`} zmieści się przy większym nakładzie — zobaczysz to na badge'u „Mieści się przy N szt.".`
      : ''

  return head + stretchNote
}

export function narrateDirectionChosen(label: string, archetypeLabel: string, unit: number, total: number, budgetDelta?: number): string {
  const budgetLine =
    budgetDelta !== undefined
      ? budgetDelta >= 0
        ? ` Zostaje Ci jeszcze ${formatMoney(budgetDelta)} w budżecie.`
        : ` To ${formatMoney(Math.abs(budgetDelta))} ponad Twój budżet.`
      : ''
  return `Wybrano: ${label} (${archetypeLabel}) za ${formatMoney(unit)}/szt. (razem ${formatMoney(total)}).${budgetLine}`
}

export function narrateUpsell(upsellQuantity: number, upsellUnit: number): string {
  return `Przy ${upsellQuantity} szt. cena spada do ${formatMoney(upsellUnit)}/szt. i ta konfiguracja mieści się w Twoim budżecie.`
}

export function defaultSuggestions(cards: DirectionCard[]): string[] {
  const suggestions: string[] = []
  const anyUpsell = cards.some((c) => c.badges.some((b) => b.kind === 'upsell'))
  if (anyUpsell) suggestions.push('Zwiększ nakład, żeby więcej się zmieściło')
  suggestions.push('Pokaż tylko materiały biodegradowalne')
  suggestions.push('Chcę zadruk w środku')
  return suggestions.slice(0, 3)
}
