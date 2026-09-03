import { useEffect, useRef, useState } from 'react'
import { Boxes, Pencil, Wallet } from 'lucide-react'
import { useSessionDispatch, useSessionState } from '@/state/SessionProvider'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Slots } from '@/types'

export function GridControls() {
  const state = useSessionState()
  const dispatch = useSessionDispatch()
  const quantity = state.slots.quantity?.value ?? 120
  const budgetTotal = state.slots.budgetTotal?.value

  function update(slots: Partial<Slots>) {
    dispatch({ type: 'REBUILD_GRID', slots })
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-3">
        <StatTile
          icon={<Boxes size={18} strokeWidth={1.75} />}
          label="Quantity"
          value={`${quantity} pcs`}
          editValue={String(quantity)}
          suffix="pcs"
          onCommit={(raw) => {
            const next = Math.round(Number(raw))
            if (Number.isFinite(next) && next > 0) update({ quantity: { value: next, source: 'chat' } })
          }}
        />
        <StatTile
          icon={<Wallet size={18} strokeWidth={1.75} />}
          label="Total budget"
          value={budgetTotal === undefined ? 'Not set' : formatMoney(budgetTotal)}
          editValue={budgetTotal === undefined ? '' : String(budgetTotal)}
          suffix="GBP"
          onCommit={(raw) => {
            const next = Number(raw.replace(',', '.'))
            if (Number.isFinite(next) && next > 0) update({ budgetTotal: { value: next, source: 'chat' } })
          }}
        />
      </div>

    </div>
  )
}

interface StatTileProps {
  icon: React.ReactNode
  label: string
  value: string
  /** Raw value the input starts from — the displayed one carries units. */
  editValue: string
  suffix: string
  onCommit: (raw: string) => void
}

/**
 * One of the two figures the whole grid is priced against. Reading them is the
 * common case, so the tile shows the number outright and keeps editing behind
 * a pencil — the slider it replaces made the number hard to read and easy to
 * nudge by accident.
 */
function StatTile({ icon, label, value, editValue, suffix, onCommit }: StatTileProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(editValue)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  function commit() {
    setEditing(false)
    if (draft.trim() !== '' && draft !== editValue) onCommit(draft)
  }

  return (
    <div className="flex min-w-[224px] flex-1 items-center gap-3 rounded-2xl bg-fill-hover px-4 py-3">
      <span className="flex size-8 flex-none items-center justify-center rounded-lg text-foreground">{icon}</span>

      <span className="flex min-w-0 flex-1 flex-col">
        {editing ? (
          <span className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              inputMode="decimal"
              value={draft}
              onChange={(e) => setDraft(e.target.value.replace(/[^\d.,]/g, ''))}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit()
                if (e.key === 'Escape') {
                  setDraft(editValue)
                  setEditing(false)
                }
              }}
              className="w-24 rounded-md border border-primary bg-card px-2 py-0.5 text-sm outline-none"
            />
            <span className="text-xs text-muted-foreground">{suffix}</span>
          </span>
        ) : (
          <span className="truncate text-sm font-medium tabular-nums">{value}</span>
        )}
        <span className="text-xs text-muted-foreground">{label}</span>
      </span>

      <button
        type="button"
        title={`Edit ${label.toLowerCase()}`}
        onClick={() => {
          setDraft(editValue)
          setEditing(true)
        }}
        className={cn(
          'flex size-8 flex-none items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-card hover:text-foreground',
          editing && 'invisible',
        )}
      >
        <Pencil size={14} strokeWidth={1.75} />
      </button>
    </div>
  )
}
