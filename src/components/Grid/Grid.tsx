import { useSessionDispatch, useSessionState } from '@/state/SessionProvider'
import { distributeMasonry } from '@/engine/grid'
import { useColumnCount } from '@/lib/useColumnCount'
import { DirectionCardTile } from './DirectionCardTile'
import { GridControls } from './GridControls'

export function Grid() {
  const state = useSessionState()
  const dispatch = useSessionDispatch()
  const columns = useColumnCount()

  const cols = distributeMasonry(state.cards, columns)

  return (
    <div className="flex flex-col gap-4">
      <GridControls />

      {state.cards.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Żaden kierunek nie pasuje przy tym filtrze — spróbuj „Wszystkie".
        </p>
      ) : (
        <div className="flex gap-3">
          {cols.map((col, i) => (
            <div key={i} className="flex flex-1 flex-col gap-3">
              {col.map((card) => (
                <DirectionCardTile
                  key={card.direction.id}
                  card={card}
                  highlighted={state.highlightedDirectionId === card.direction.id}
                  chosen={state.chosenDirectionId === card.direction.id}
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
