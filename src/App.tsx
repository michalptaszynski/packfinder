import { useEffect, useRef, useState } from 'react'
import { TooltipProvider } from '@/components/ui/tooltip'
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
    <div className="flex h-svh w-full overflow-hidden bg-canvas">
      <aside
        className={cn(
          'flex flex-none flex-col bg-card transition-[width] duration-500 ease-out',
          showRightPanel ? 'w-[380px] border-r border-border' : 'w-full',
        )}
      >
        <div className={cn('mx-auto flex h-full w-full flex-col gap-4 p-5', !showRightPanel && 'max-w-2xl')}>
          <div>
            <img src="/brand/packhelp-logo.svg" alt="Packhelp" className="h-6 w-auto" />
          </div>
          <Chat />
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
