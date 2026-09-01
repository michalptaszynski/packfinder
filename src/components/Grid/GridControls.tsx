import { Slider } from '@/components/ui/slider'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useSessionDispatch, useSessionState } from '@/state/SessionProvider'
import { QUANTITY_STEPS, quantityToStepIndex } from '@/lib/quantitySteps'
import { formatMoney } from '@/lib/format'
import type { GridFilter } from '@/types'

export function GridControls() {
  const state = useSessionState()
  const dispatch = useSessionDispatch()
  const quantity = state.slots.quantity?.value ?? 120
  const budgetTotal = state.slots.budgetTotal?.value
  const stepIndex = quantityToStepIndex(quantity)

  function setQuantity(index: number) {
    dispatch({ type: 'REBUILD_GRID', slots: { quantity: { value: QUANTITY_STEPS[index], source: 'chat' } } })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
        <span className="whitespace-nowrap text-sm font-medium">
          Quantity: <span className="tabular-nums">{quantity} pcs</span>
        </span>
        <Slider
          min={0}
          max={QUANTITY_STEPS.length - 1}
          step={1}
          value={[stepIndex]}
          onValueChange={(value) => setQuantity(Array.isArray(value) ? value[0] : value)}
          className="flex-1"
        />
        {budgetTotal !== undefined && (
          <span className="whitespace-nowrap text-sm text-muted-foreground">
            Budget: <span className="tabular-nums font-medium text-foreground">{formatMoney(budgetTotal)}</span>
          </span>
        )}
      </div>

      <ToggleGroup
        value={[state.gridFilter]}
        onValueChange={(values) => {
          const next = values[0] as GridFilter | undefined
          if (next) dispatch({ type: 'SET_GRID_FILTER', filter: next })
        }}
        className="justify-start gap-2"
        variant="outline"
      >
        <ToggleGroupItem value="all" className="rounded-full px-3 data-[state=on]:bg-fill-hover">
          All
        </ToggleGroupItem>
        <ToggleGroupItem value="in_budget" className="rounded-full px-3 data-[state=on]:bg-fill-hover">
          In budget
        </ToggleGroupItem>
        <ToggleGroupItem value="worth_stretch" className="rounded-full px-3 data-[state=on]:bg-fill-hover">
          Worth stretching for
        </ToggleGroupItem>
        <ToggleGroupItem value="cheapest" className="rounded-full px-3 data-[state=on]:bg-fill-hover">
          Cheapest
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}
