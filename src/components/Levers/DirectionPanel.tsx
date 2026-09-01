import { useMemo } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { DirectionPhoto } from '@/components/Photo/DirectionPhoto'
import { useSessionDispatch, useSessionState } from '@/state/SessionProvider'
import { addonLibrary, getArchetype, modifierLibrary, priceConfiguration } from '@/engine/pricing'
import { validateConfiguration } from '@/engine/constraints'
import { directionsCatalog } from '@/engine/grid'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'

const CATEGORIES: { key: string; label: string; options: string[] }[] = [
  {
    key: 'print',
    label: 'Druk',
    options: ['print.none', 'print.one_colour', 'print.white_uv', 'print.multicolour_muted', 'print.multicolour_saturated', 'print.multicolour_premium'],
  },
  { key: 'material', label: 'Materiał', options: ['material.kraft', 'material.white', 'material.white_both', 'material.coated'] },
  { key: 'coverage', label: 'Pokrycie', options: ['coverage.outside', 'coverage.inside', 'coverage.inside_outside'] },
  { key: 'finish', label: 'Wykończenie', options: ['finish.none', 'finish.matte_foil', 'finish.glossy_foil', 'finish.hot_stamping', 'finish.embossing'] },
  { key: 'closure', label: 'Zamknięcie', options: ['closure.none', 'closure.single_strip', 'closure.double_strip'] },
]

export function DirectionPanel() {
  const state = useSessionState()
  const dispatch = useSessionDispatch()

  const direction = state.openDirectionId ? directionsCatalog.find((d) => d.id === state.openDirectionId) : undefined
  const archetype = direction ? getArchetype(direction.archetype) : undefined
  const openCard = state.openDirectionId ? state.cards.find((c) => c.direction.id === state.openDirectionId) : undefined

  const quantity = state.slots.quantity?.value ?? 120
  const budgetTotal = state.slots.budgetTotal?.value
  const modifiers = state.customModifiers ?? direction?.modifiers ?? []
  const sizeCode = openCard?.sizeCode ?? archetype?.sizes[0]?.code ?? 'S'

  const price = useMemo(() => {
    if (!archetype) return null
    return priceConfiguration({ archetypeId: archetype.id, sizeCode, quantity, modifiers, budgetTotal })
  }, [archetype, sizeCode, quantity, modifiers, budgetTotal])

  const availableAddons = Object.entries(addonLibrary).filter(([, def]) => def.minQty <= quantity)

  if (!direction || !archetype) {
    return (
      <Sheet open={false} onOpenChange={(open) => !open && dispatch({ type: 'CLOSE_DIRECTION_PANEL' })}>
        <SheetContent />
      </Sheet>
    )
  }

  function selectModifier(category: string[], key: string) {
    const withoutCategory = modifiers.filter((m) => !category.includes(m))
    dispatch({ type: 'SET_CUSTOM_MODIFIERS', modifiers: [...withoutCategory, key] })
  }

  return (
    <Sheet open={Boolean(state.openDirectionId)} onOpenChange={(open) => !open && dispatch({ type: 'CLOSE_DIRECTION_PANEL' })}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{direction.label}</SheetTitle>
          <SheetDescription>
            {archetype.label} · {archetype.story}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-5 px-4 pb-4">
          <DirectionPhoto archetype={archetype} heightClassName="h-48" />

          {price?.valid ? (
            <div className="flex items-baseline justify-between rounded-lg border border-border bg-muted/50 p-3">
              <span className="text-lg font-semibold tabular-nums">{formatMoney(price.unit ?? 0)}/szt.</span>
              <span className="text-sm text-muted-foreground tabular-nums">razem {formatMoney(price.total ?? 0)}</span>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-muted/50 p-3 text-sm text-muted-foreground">{price?.reason}</div>
          )}

          {CATEGORIES.map((category) => {
            const relevantOptions = category.options.filter((o) => archetype.allowedModifiers.includes(o))
            if (relevantOptions.length === 0) return null
            const current = relevantOptions.find((o) => modifiers.includes(o))

            return (
              <div key={category.key} className="flex flex-col gap-2">
                <span className="text-xs font-medium text-muted-foreground">{category.label}</span>
                <div className="flex flex-wrap gap-1.5">
                  {relevantOptions.map((option) => {
                    const candidate = [...modifiers.filter((m) => !category.options.includes(m)), option]
                    const check = validateConfiguration(archetype.id, quantity, candidate)
                    const candidatePrice = check.valid
                      ? priceConfiguration({ archetypeId: archetype.id, sizeCode, quantity, modifiers: candidate })
                      : null
                    const delta = candidatePrice?.valid && price?.valid ? (candidatePrice.unit ?? 0) - (price.unit ?? 0) : null
                    const isCurrent = option === current

                    return (
                      <button
                        key={option}
                        type="button"
                        disabled={!check.valid}
                        title={!check.valid ? check.reason : undefined}
                        onClick={() => selectModifier(category.options, option)}
                        className={cn(
                          'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs',
                          isCurrent ? 'border-state-fg bg-state-bg text-state-fg' : 'border-border bg-card',
                          !check.valid && 'cursor-not-allowed opacity-40',
                        )}
                      >
                        {modifierLibrary[option]?.label}
                        {delta !== null && delta !== 0 && (
                          <span className="tabular-nums text-muted-foreground">
                            {delta > 0 ? '+' : ''}
                            {formatMoney(delta)}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {availableAddons.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium text-muted-foreground">Dodatki</span>
              <div className="flex flex-wrap gap-1.5">
                {availableAddons.map(([id, def]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => dispatch({ type: 'TOGGLE_ADDON', addonId: id })}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs',
                      state.selectedAddons.includes(id) ? 'border-state-fg bg-state-bg text-state-fg' : 'border-border bg-card',
                    )}
                  >
                    {def.label}
                    <span className="tabular-nums text-muted-foreground">+{formatMoney(def.unitDelta ?? 0)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <SheetFooter>
          <Button
            className="w-full"
            disabled={!price?.valid}
            onClick={() => {
              dispatch({ type: 'CONFIRM_DIRECTION', id: direction.id })
              dispatch({ type: 'GO_TO_HANDOFF' })
            }}
          >
            Otwórz w edytorze
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
