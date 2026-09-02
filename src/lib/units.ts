/**
 * Everything the user types or reads is in centimetres; every slot, preset and
 * engine rule stays in millimetres. The conversion lives here so the boundary
 * is in exactly one place.
 */
export const MM_PER_CM = 10

export function cmToMm(cm: number): number {
  return Math.round(cm * MM_PER_CM)
}

export function mmToCm(mm: number): number {
  return Math.round((mm / MM_PER_CM) * 10) / 10
}

/** Trims the trailing ".0" so 60 mm reads as "6", not "6.0". */
export function formatCm(mm: number): string {
  return String(mmToCm(mm))
}
