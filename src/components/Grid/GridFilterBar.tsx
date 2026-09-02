import { useLayoutEffect, useRef, useState } from 'react'
import { LayoutGrid, Workflow } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { useSessionDispatch, useSessionState } from '@/state/SessionProvider'
import { FiltersMenu } from './FiltersMenu'
import type { GridFilter } from '@/types'

const FILTERS: { value: GridFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'in_budget', label: 'In budget' },
  { value: 'worth_stretch', label: 'Worth stretching for' },
  { value: 'cheapest', label: 'Cheapest' },
]

/**
 * Floating filter bar. It sits over the grid rather than above it so the
 * controls stay reachable however far the masonry has been scrolled — with a
 * list this long, a bar pinned to the top of the page is out of reach exactly
 * when you decide you want to narrow it.
 */
export type ViewMode = 'grid' | 'flow'

export function GridFilterBar({ view, onViewChange }: { view: ViewMode; onViewChange: (view: ViewMode) => void }) {
  const state = useSessionState()
  const dispatch = useSessionDispatch()
  const groupRef = useRef<HTMLDivElement>(null)
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null)

  // The active background is one element that slides between options rather
  // than a class on each button, so switching reads as movement. Measured from
  // the live DOM because the labels have very different widths.
  useLayoutEffect(() => {
    const group = groupRef.current
    if (!group) return

    function measure() {
      const active = group?.querySelector<HTMLElement>('[aria-pressed="true"]')
      if (!group || !active) return
      setPill({ left: active.offsetLeft, width: active.offsetWidth })
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(group)
    return () => observer.disconnect()
  }, [state.gridFilter])

  return (
    // Three floating bars: the view switch on the left edge, the result
    // filters centred on the panel, and Filters on the right edge. Equal outer
    // grid tracks keep the middle bar centred whatever the other two measure.
    <div className="pointer-events-none absolute inset-x-0 bottom-5 z-30 grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-6">
      {/* Its own bar on the far left: switching what you are looking at is a
          different job from narrowing what is in it. */}
      <div className="pointer-events-auto justify-self-start flex items-center gap-0.5 rounded-full border border-border bg-card/80 p-1 shadow-[0_1px_2px_rgba(0,0,0,0.08)] backdrop-blur-[8px]">
        {(
          [
            { value: 'grid' as const, icon: LayoutGrid, label: 'Grid' },
            { value: 'flow' as const, icon: Workflow, label: 'How it narrowed' },
          ] as const
        ).map((option) => (
          <button
            key={option.value}
            type="button"
            title={option.label}
            aria-pressed={view === option.value}
            onClick={() => onViewChange(option.value)}
            className={cn(
              'flex size-8 items-center justify-center rounded-full transition-colors',
              view === option.value ? 'bg-fill-hover text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <option.icon size={16} strokeWidth={1.75} />
          </button>
        ))}
      </div>

      <div className="justify-self-center">
      <div
        // Same glass recipe as the sticky summary bar in the redesign's
        // build-your-box: 80% white, 8px backdrop blur, a 1px shadow and no
        // border.
        className="pointer-events-auto flex items-center gap-1 rounded-full border border-border bg-card/80 p-1 shadow-[0_1px_2px_rgba(0,0,0,0.08)] backdrop-blur-[8px]"
      >
        <div ref={groupRef} className="relative">
          {pill && (
            <span
              aria-hidden
              className="absolute inset-y-0 rounded-full bg-fill-hover transition-[left,width] duration-300 ease-out"
              style={{ left: pill.left, width: pill.width }}
            />
          )}

          <ToggleGroup
            value={[state.gridFilter]}
            onValueChange={(values) => {
              const next = values[0] as GridFilter | undefined
              if (next) dispatch({ type: 'SET_GRID_FILTER', filter: next })
            }}
            className="relative gap-1"
          >
            {FILTERS.map((filter) => (
              <ToggleGroupItem
                key={filter.value}
                value={filter.value}
                // The toggle's own pressed background is switched off — the
                // sliding pill behind it is the active state now.
                className="relative rounded-full bg-transparent px-3 font-normal text-muted-foreground hover:bg-transparent hover:text-foreground aria-pressed:bg-transparent aria-pressed:text-foreground"
              >
                {filter.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        </div>
      </div>

      {/* No wrapper chrome — the trigger itself is the bar, otherwise its own
          border sits inside a second one. */}
      <div className="pointer-events-auto justify-self-end">
        <FiltersMenu />
      </div>
    </div>
  )
}
