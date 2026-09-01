import { useMemo, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { DirectionPhoto } from '@/components/Photo/DirectionPhoto'
import { useSessionDispatch, useSessionState } from '@/state/SessionProvider'
import { addonLibrary, CLEARANCE_MM, getArchetype, modifierLibrary } from '@/engine/pricing'
import { priceConfiguration } from '@/engine/pricing'
import { directionsCatalog } from '@/engine/grid'
import { formatMoney } from '@/lib/format'

function categoryFor(modifierKey: string): string {
  return modifierKey.split('.')[0]
}

export function Handoff() {
  const state = useSessionState()
  const dispatch = useSessionDispatch()
  const [copied, setCopied] = useState(false)

  const direction = state.chosenDirectionId ? directionsCatalog.find((d) => d.id === state.chosenDirectionId) : undefined
  const archetype = direction ? getArchetype(direction.archetype) : undefined
  const card = state.chosenDirectionId ? state.cards.find((c) => c.direction.id === state.chosenDirectionId) : undefined

  const quantity = state.slots.quantity?.value ?? 0
  const budgetTotal = state.slots.budgetTotal?.value
  const modifiers = state.customModifiers ?? direction?.modifiers ?? []

  const price = useMemo(() => {
    if (!archetype || !card) return null
    return priceConfiguration({ archetypeId: archetype.id, sizeCode: card.sizeCode, quantity, modifiers, budgetTotal })
  }, [archetype, card, quantity, modifiers, budgetTotal])

  const payload = useMemo(() => {
    if (!direction || !archetype || !card || !price) return null
    const size = archetype.sizes.find((s) => s.code === card.sizeCode)
    const config: Record<string, string> = {}
    for (const key of modifiers) config[categoryFor(key)] = key

    const assumptions: string[] = []
    if (state.slots.dimensions?.source === 'inferred') assumptions.push('dimensions_from_category')
    if (state.slots.weight?.source === 'inferred') assumptions.push('weight_from_category')
    if (state.slots.fragility?.source === 'inferred') assumptions.push('fragility_from_category')

    return {
      archetype: archetype.id,
      direction: direction.id,
      size: {
        code: card.sizeCode,
        productMm: state.slots.dimensions
          ? [state.slots.dimensions.value.w, state.slots.dimensions.value.h, state.slots.dimensions.value.d]
          : null,
        outerMm: size?.mm ?? null,
        clearanceMm: CLEARANCE_MM,
      },
      quantity,
      config,
      addons: state.selectedAddons,
      pricing: {
        unit: price.unit,
        total: price.total,
        currency: price.currency,
        priceSource: price.priceSource,
        budgetTotal,
        budgetDelta: price.budgetDelta,
      },
      vibe: { tags: state.slots.vibe?.value ?? [], palette: [], logoRef: null },
      assumptions,
    }
  }, [direction, archetype, card, price, modifiers, quantity, budgetTotal, state.selectedAddons, state.slots])

  const open = state.screen === 'handoff'
  const total = price?.total ?? 0
  const overBudget = budgetTotal !== undefined && total > budgetTotal
  const scaleMax = budgetTotal !== undefined ? Math.max(total, budgetTotal) : total
  const fillPct = scaleMax > 0 ? (total / scaleMax) * 100 : 0
  const markerPct = budgetTotal !== undefined && scaleMax > 0 ? (budgetTotal / scaleMax) * 100 : 0

  async function copyPayload() {
    if (!payload) return
    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && dispatch({ type: 'BACK_TO_CONVERSATION' })}>
      <DialogContent className="max-h-[85vh] gap-0 overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editor preview (mock)</DialogTitle>
          <DialogDescription>The chosen direction goes to the editor with the full configuration and a budget bar.</DialogDescription>
        </DialogHeader>

        {!direction || !archetype || !card || !price?.valid ? (
          <p className="p-4 text-sm text-muted-foreground">No direction has been chosen yet.</p>
        ) : (
          <div className="flex flex-col gap-5 px-1 pb-2">
            {budgetTotal !== undefined && (
              <div className="flex items-center gap-3">
                <div className="relative h-2 flex-1 rounded-full bg-border-subtle">
                  <div
                    className={cnBar(overBudget)}
                    style={{ width: `${fillPct}%` }}
                  />
                  <div className="absolute -top-0.5 h-3 w-0.5 bg-muted-foreground" style={{ left: `${markerPct}%` }} />
                </div>
                <span className="whitespace-nowrap text-xs tabular-nums">
                  {formatMoney(total)} {overBudget ? `(${formatMoney(total - budgetTotal)} over budget)` : `of ${formatMoney(budgetTotal)}`}
                </span>
              </div>
            )}

            <div className="flex gap-4">
              <DirectionPhoto archetype={archetype} heightClassName="h-32" className="w-32 flex-none" />
              <div className="flex flex-col gap-1">
                <span className="font-semibold">{direction.label}</span>
                <span className="text-sm text-muted-foreground">{archetype.label}</span>
                <span className="text-sm text-muted-foreground">
                  {modifiers.map((m) => modifierLibrary[m]?.label).filter(Boolean).join(' · ')}
                </span>
                {state.selectedAddons.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    + {state.selectedAddons.map((id) => addonLibrary[id]?.label).filter(Boolean).join(', ')}
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/50">
              <div className="flex items-center justify-between border-b border-border px-3 py-2 text-xs text-muted-foreground">
                <span>Editor payload</span>
                <Button size="sm" variant="outline" onClick={copyPayload}>
                  {copied ? 'Copied' : 'Copy JSON'}
                </Button>
              </div>
              <pre className="max-h-72 overflow-auto p-3 text-xs leading-relaxed">{JSON.stringify(payload, null, 2)}</pre>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function cnBar(over: boolean) {
  return `h-full rounded-full ${over ? 'bg-over-bar' : 'bg-foreground'}`
}
