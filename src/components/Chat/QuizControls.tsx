import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useSessionDispatch, useSessionState } from '@/state/SessionProvider'
import { quizStatus } from '@/state/quizStatus'
import { CATEGORY_PRESETS, CHANNEL_OPTIONS, DIMENSION_REFERENCE_CHIPS } from '@/data/categoryPresets'
import { formatMoney } from '@/lib/format'
import type { Dimensions, Slots } from '@/types'

export function QuizControls() {
  const state = useSessionState()
  const dispatch = useSessionDispatch()
  const status = quizStatus(state.slots)

  function answer(userText: string, slots: Partial<Slots>) {
    dispatch({ type: 'ADD_MESSAGE', message: { id: crypto.randomUUID(), role: 'user', text: userText } })
    dispatch({ type: 'REBUILD_GRID', slots })
  }

  if (status.nextStep === 0) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {CATEGORY_PRESETS.map((preset) => (
          <Button
            key={preset.id}
            variant="outline"
            className="h-auto justify-start whitespace-normal py-2.5 text-left font-normal"
            onClick={() =>
              answer(preset.label, {
                productCategory: { value: preset.id, source: 'quiz' },
                dimensions: { value: preset.dimensions, source: 'inferred' },
                weight: { value: preset.weight, source: 'inferred' },
                fragility: { value: preset.fragility, source: 'inferred' },
                foodContact: { value: Boolean(preset.foodContact), source: 'inferred' },
              })
            }
          >
            {preset.label}
          </Button>
        ))}
      </div>
    )
  }

  if (status.nextStep === 1) {
    const dims = state.slots.dimensions?.value ?? { w: 0, h: 0, d: 0 }

    function setDim(axis: keyof Dimensions, value: number) {
      dispatch({ type: 'REBUILD_GRID', slots: { dimensions: { value: { ...dims, [axis]: value }, source: 'quiz' } } })
    }

    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-end gap-2">
          <label className="flex flex-1 flex-col gap-1 text-xs text-muted-foreground">
            Szer.
            <Input type="number" value={dims.w} onChange={(e) => setDim('w', Number(e.target.value))} />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-xs text-muted-foreground">
            Wys.
            <Input type="number" value={dims.h} onChange={(e) => setDim('h', Number(e.target.value))} />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-xs text-muted-foreground">
            Głęb.
            <Input type="number" value={dims.d} onChange={(e) => setDim('d', Number(e.target.value))} />
          </label>
          <Button onClick={() => answer(`${dims.w} × ${dims.h} × ${dims.d} mm`, { dimensions: { value: dims, source: 'quiz' } })}>
            Dalej
          </Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {DIMENSION_REFERENCE_CHIPS.map((chip) => (
            <Button
              key={chip.label}
              variant="outline"
              size="sm"
              className="rounded-full text-xs font-normal text-muted-foreground"
              onClick={() => dispatch({ type: 'REBUILD_GRID', slots: { dimensions: { value: chip.dimensions, source: 'quiz' } } })}
            >
              {chip.label}
            </Button>
          ))}
        </div>
      </div>
    )
  }

  if (status.nextStep === 2) {
    return (
      <div className="grid grid-cols-2 gap-2">
        {CHANNEL_OPTIONS.map((option) => (
          <Button
            key={option.id}
            variant="outline"
            className="h-auto justify-start whitespace-normal py-2.5 text-left font-normal"
            onClick={() => answer(option.label, { channel: { value: option.id, source: 'quiz' } })}
          >
            {option.label}
          </Button>
        ))}
      </div>
    )
  }

  if (status.nextStep === 3) {
    const quantity = state.slots.quantity?.value ?? 120
    const budgetTotal = state.slots.budgetTotal?.value ?? 108

    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-end gap-2">
          <label className="flex flex-1 flex-col gap-1 text-xs text-muted-foreground">
            Nakład (szt.)
            <Input
              type="number"
              value={quantity}
              onChange={(e) =>
                dispatch({ type: 'REBUILD_GRID', slots: { quantity: { value: Number(e.target.value), source: 'quiz' } } })
              }
            />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-xs text-muted-foreground">
            Budżet całkowity
            <Input
              key={budgetTotal}
              type="text"
              inputMode="decimal"
              defaultValue={String(budgetTotal)}
              onBlur={(e) => {
                const parsed = Number(e.target.value)
                if (Number.isFinite(parsed) && parsed > 0) {
                  dispatch({ type: 'REBUILD_GRID', slots: { budgetTotal: { value: parsed, source: 'quiz' } } })
                }
              }}
            />
          </label>
        </div>
        <Button
          onClick={() =>
            answer(`${quantity} szt., budżet ${formatMoney(budgetTotal)}`, {
              quantity: { value: quantity, source: 'quiz' },
              budgetTotal: { value: budgetTotal, source: 'quiz' },
            })
          }
        >
          Zobacz kierunki
        </Button>
      </div>
    )
  }

  return null
}
