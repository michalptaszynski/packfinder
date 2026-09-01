import { archetypeCatalog } from '@/engine/pricing'

/**
 * shadcn's Slider only does a uniform step, but the quantity thresholds that
 * actually matter (30, 60, 90, 120, 240, 500, 1000, 2000, ...) are not
 * evenly spaced — so the slider drives an index into this array rather than
 * a raw quantity, per the brief's explicit deviation from Radix defaults.
 */
export const QUANTITY_STEPS: number[] = Array.from(
  new Set(archetypeCatalog.flatMap((a) => a.priceCurve.points.map((p) => p.qty))),
).sort((a, b) => a - b)

export function quantityToStepIndex(quantity: number): number {
  let closest = 0
  let closestDiff = Infinity
  QUANTITY_STEPS.forEach((step, i) => {
    const diff = Math.abs(step - quantity)
    if (diff < closestDiff) {
      closestDiff = diff
      closest = i
    }
  })
  return closest
}
