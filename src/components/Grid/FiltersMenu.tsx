import { useEffect, useRef, useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { useSessionDispatch, useSessionState } from '@/state/SessionProvider'
import { CATEGORY_PRESETS, CHANNEL_OPTIONS } from '@/data/categoryPresets'
import { COVERAGE_OPTIONS, MATERIAL_OPTIONS, STRIP_OPTIONS } from '@/data/refinements'
import { cmToMm, formatCm } from '@/lib/units'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Slots } from '@/types'

/**
 * Every answer the grid is currently built from, in one place and editable.
 * The chat is a transcript — you can't go back up it and change question three
 * — so this is the only surface where a decision can be revised without
 * re-typing it.
 */
export function FiltersMenu() {
  const state = useSessionState()
  const dispatch = useSessionDispatch()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function update(slots: Partial<Slots>) {
    dispatch({ type: 'REBUILD_GRID', slots })
  }

  const { slots } = state
  const dims = slots.dimensions?.value
  const active = countActive(slots)

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        // Carries the same glass recipe as the other floating bars, since it
        // stands on its own now.
        className={cn(
          'flex h-10 items-center gap-2 rounded-full border border-border px-3 text-sm shadow-[0_1px_2px_rgba(0,0,0,0.08)] backdrop-blur-[8px] transition-colors',
          open ? 'bg-fill-hover' : 'bg-card/80 hover:bg-fill-hover',
        )}
      >
        Filters
        {active > 0 && (
          <span className="flex size-4 items-center justify-center rounded-full bg-state-bg text-[11px] font-medium text-state-fg tabular-nums">
            {active}
          </span>
        )}
        <ChevronDown size={14} className={cn('text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 bottom-full z-40 mb-2 flex max-h-[70svh] w-[360px] flex-col gap-4 overflow-y-auto rounded-2xl border border-border bg-card p-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Your answers</span>
            <button type="button" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X size={15} />
            </button>
          </div>

          <Row label="Packing">
            <Chips
              options={CATEGORY_PRESETS.map((preset) => ({ value: preset.id, label: preset.label }))}
              value={slots.productCategory?.value}
              onChange={(value) => {
                const preset = CATEGORY_PRESETS.find((p) => p.id === value)
                if (!preset) return
                update({
                  productCategory: { value: preset.id, source: 'chat' },
                  weight: { value: preset.weight, source: 'inferred' },
                  fragility: { value: preset.fragility, source: 'inferred' },
                  foodContact: { value: Boolean(preset.foodContact), source: 'inferred' },
                })
              }}
            />
          </Row>

          <Row label="Purpose">
            <Chips
              options={CHANNEL_OPTIONS.map((option) => ({ value: option.id, label: option.label }))}
              value={slots.channel?.value}
              onChange={(value) => update({ channel: { value: value as never, source: 'chat' } })}
            />
          </Row>

          <Row label="Product size">
            <div className="flex items-center gap-2">
              {(['w', 'h', 'd'] as const).map((axis) => (
                <input
                  key={axis}
                  type="text"
                  inputMode="decimal"
                  value={dims ? formatCm(dims[axis]) : ''}
                  onChange={(e) => {
                    const next = Number(e.target.value.replace(',', '.'))
                    if (!dims || !Number.isFinite(next) || next <= 0) return
                    update({ dimensions: { value: { ...dims, [axis]: cmToMm(next) }, source: 'chat' } })
                  }}
                  className="w-full min-w-0 rounded-md border border-input bg-transparent px-2 py-1 text-sm outline-none focus-visible:border-ring"
                />
              ))}
              <span className="flex-none text-xs text-muted-foreground">cm</span>
            </div>
          </Row>

          <Row label={`Budget: ${slots.budgetTotal ? formatMoney(slots.budgetTotal.value) : '—'}`}>
            <input
              type="text"
              inputMode="decimal"
              value={slots.budgetTotal?.value ?? ''}
              onChange={(e) => {
                const next = Number(e.target.value.replace(',', '.'))
                if (Number.isFinite(next) && next > 0) update({ budgetTotal: { value: next, source: 'chat' } })
              }}
              className="w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm outline-none focus-visible:border-ring"
            />
          </Row>

          <Row label="Material colour">
            <Chips
              options={MATERIAL_OPTIONS.map((option) => ({ value: option.value, label: option.title }))}
              value={slots.materialColour?.value}
              onChange={(value) => update({ materialColour: { value: value as never, source: 'chat' } })}
            />
          </Row>

          <Row label="Print coverage">
            <Chips
              options={COVERAGE_OPTIONS.map((option) => ({ value: option.value, label: option.title }))}
              value={slots.printCoverage?.value}
              onChange={(value) => update({ printCoverage: { value: value as never, source: 'chat' } })}
            />
          </Row>

          <Row label="Adhesive strip">
            <Chips
              options={STRIP_OPTIONS.map((option) => ({ value: option.value, label: option.title }))}
              value={slots.adhesiveStrip?.value}
              onChange={(value) => update({ adhesiveStrip: { value: value as never, source: 'chat' } })}
            />
          </Row>
        </div>
      )}
    </div>
  )
}

/** Counts only the answers that actually narrow the grid. */
function countActive(slots: Slots): number {
  const narrowing = [slots.materialColour?.value, slots.printCoverage?.value, slots.adhesiveStrip?.value]
  return narrowing.filter((value) => value !== undefined && value !== 'any').length
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </div>
  )
}

function Chips({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[]
  value?: string
  onChange: (value: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-full border px-3 py-1 text-xs transition-colors',
            option.value === value
              ? 'border-primary bg-state-bg text-state-fg'
              : 'border-input text-muted-foreground hover:bg-fill-hover',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
