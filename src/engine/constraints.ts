import { getArchetype, modifierLibrary } from './pricing'

export interface ValidateResult {
  valid: boolean
  reason?: string
}

/** The only source of compatibility decisions — mirrors the validate_configuration tool contract. */
export function validateConfiguration(archetypeId: string, quantity: number, modifiers: string[]): ValidateResult {
  const archetype = getArchetype(archetypeId)
  if (!archetype) return { valid: false, reason: 'Nieznany archetyp.' }

  for (const key of modifiers) {
    if (!archetype.allowedModifiers.includes(key)) {
      const label = modifierLibrary[key]?.label ?? key
      return { valid: false, reason: `${label} nie jest dostępny(a) dla formatu „${archetype.label}".` }
    }
  }

  if (quantity < archetype.moq) {
    return { valid: false, reason: `Minimalny nakład dla tego formatu to ${archetype.moq} szt.` }
  }

  for (const key of modifiers) {
    const mod = modifierLibrary[key]
    if (mod?.minQty && quantity < mod.minQty) {
      return { valid: false, reason: `${mod.label} wymaga nakładu min. ${mod.minQty} szt.` }
    }
  }

  for (const rule of archetype.constraints) {
    const applies = rule.if.includes('*') || rule.if.every((k) => modifiers.includes(k))
    if (!applies) continue

    if (rule.forbid) {
      for (const forbidden of rule.forbid) {
        if (modifiers.includes(forbidden)) return { valid: false, reason: rule.reason }
      }
    }
    if (rule.require) {
      for (const required of rule.require) {
        if (!modifiers.includes(required)) return { valid: false, reason: rule.reason }
      }
    }
  }

  return { valid: true }
}
