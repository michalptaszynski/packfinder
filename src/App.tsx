import { useEffect, useRef, useState } from 'react'
import { CircleHelp, House } from 'lucide-react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { SessionProvider, useSessionState } from '@/state/SessionProvider'
import { quizStatus } from '@/state/quizStatus'
import { Chat } from '@/components/Chat/Chat'
import { Grid } from '@/components/Grid/Grid'
import { GeneratingState } from '@/components/Grid/GeneratingState'
import { DirectionPanel } from '@/components/Levers/DirectionPanel'
import { Handoff } from '@/components/Handoff/Handoff'
import { cn } from '@/lib/utils'

const GENERATING_MS = 2000

function Shell() {
  const state = useSessionState()
  const status = quizStatus(state.slots)
  const [isGenerating, setIsGenerating] = useState(false)
  const announcedComplete = useRef(false)

  useEffect(() => {
    if (status.complete && !announcedComplete.current) {
      announcedComplete.current = true
      setIsGenerating(true)
      const timer = window.setTimeout(() => setIsGenerating(false), GENERATING_MS)
      return () => window.clearTimeout(timer)
    }
  }, [status.complete])

  const showRightPanel = status.complete

  return (
    <div className="flex h-svh w-full gap-3 overflow-hidden bg-canvas p-3">
      <aside
        className={cn(
          'flex flex-none flex-col overflow-hidden rounded-xl border border-border bg-card transition-[width] duration-500 ease-out',
          showRightPanel ? 'w-[380px]' : 'w-full',
        )}
      >
        <div className="flex h-11 flex-none items-center justify-between px-4">
          <Button variant="ghost" size="icon-sm" className="text-muted-foreground">
            <House size={16} strokeWidth={1.75} />
          </Button>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" className="font-normal text-muted-foreground">
              Browse products
            </Button>
            <Button variant="ghost" size="icon-sm" className="text-muted-foreground">
              <CircleHelp size={16} strokeWidth={1.75} />
            </Button>
          </div>
        </div>

        <div className="relative min-h-0 flex-1">
          <Chat centered={!showRightPanel} />
        </div>
      </aside>

      {showRightPanel && (
        <main className="flex flex-1 animate-in slide-in-from-right-12 flex-col overflow-hidden duration-500 ease-out fade-in">
          {isGenerating ? <GeneratingState /> : <div className="flex-1 overflow-y-auto p-6"><Grid /></div>}
        </main>
      )}

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
