import { useRef } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { SessionProvider, useSessionDispatch, useSessionState } from '@/state/SessionProvider'
import { Chat } from '@/components/Chat/Chat'
import { Grid } from '@/components/Grid/Grid'
import { DirectionPanel } from '@/components/Levers/DirectionPanel'
import { Handoff } from '@/components/Handoff/Handoff'

function Shell() {
  const state = useSessionState()
  const dispatch = useSessionDispatch()
  const gridRef = useRef<HTMLDivElement>(null)

  function handleCta() {
    if (state.chosenDirectionId) {
      dispatch({ type: 'GO_TO_HANDOFF' })
    } else {
      gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="flex h-svh w-full bg-canvas">
      <aside className="flex w-[380px] flex-none flex-col gap-4 border-r border-border bg-card p-5">
        <div>
          <h1 className="text-lg font-semibold">Packfinder</h1>
          <p className="text-xs text-muted-foreground">Doradca opakowań</p>
        </div>
        <Chat />
      </aside>

      <main className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          <div ref={gridRef}>
            <Grid />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border bg-card px-6 py-3.5">
          <span className="text-xs text-muted-foreground">
            {state.chosenDirectionId ? 'Kierunek wybrany — gotowe do edytora.' : 'Otwórz kafel i potwierdź wybór, żeby przejść dalej.'}
          </span>
          <Button onClick={handleCta}>{state.chosenDirectionId ? 'Otwórz w edytorze' : 'Wybierz kierunek'}</Button>
        </div>
      </main>

      <DirectionPanel />
      <Handoff />
    </div>
  )
}

function App() {
  return (
    <SessionProvider>
      <TooltipProvider>
        <Shell />
      </TooltipProvider>
    </SessionProvider>
  )
}

export default App
