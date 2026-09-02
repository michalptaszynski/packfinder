import { useSessionDispatch, useSessionState } from '@/state/SessionProvider'
import { distributeMasonry } from '@/engine/grid'
import { useColumnCount } from '@/lib/useColumnCount'
import { tileHeight } from '@/lib/tileHeights'
import { DirectionCardTile } from './DirectionCardTile'
import { GridControls } from './GridControls'

/** Gap between one column landing and the next. */
const COLUMN_STAGGER_MS = 110

export function Grid() {
  const state = useSessionState()
  const dispatch = useSessionDispatch()
  const { ref: gridRef, columns } = useColumnCount()

  const cols = distributeMasonry(state.cards, columns, (card) => tileHeight(card.direction.id))

  return (
    <div ref={gridRef} className="flex flex-col gap-4">
      <GridControls />

      {state.cards.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          No direction matches this filter — try "All".
        </p>
      ) : (
        <div className="flex items-start gap-6">
          {cols.map((col, i) => (
            <div key={i} className="flex flex-1 flex-col gap-8">
              {col.map((card) => (
                <DirectionCardTile
                  key={card.direction.id}
                  card={card}
                  highlighted={state.highlightedDirectionId === card.direction.id}
                  chosen={state.chosenDirectionId === card.direction.id}
                  delayMs={i * COLUMN_STAGGER_MS}
                  onOpen={() => dispatch({ type: 'OPEN_DIRECTION', id: card.direction.id })}
                />
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
