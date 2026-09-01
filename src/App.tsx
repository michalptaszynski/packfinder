import { TooltipProvider } from '@/components/ui/tooltip'
import { SessionProvider } from '@/state/SessionProvider'
import { Chat } from '@/components/Chat/Chat'
import { Grid } from '@/components/Grid/Grid'
import { DirectionPanel } from '@/components/Levers/DirectionPanel'
import { Handoff } from '@/components/Handoff/Handoff'

function Shell() {
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
          <Grid />
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
