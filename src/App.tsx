import { useCallback, useEffect, useRef, useState } from 'react'
import { Check, CircleHelp, House, Settings } from 'lucide-react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { SessionProvider, useSessionDispatch, useSessionState } from '@/state/SessionProvider'
import { quizStatus } from '@/state/quizStatus'
import { Chat } from '@/components/Chat/Chat'
import { Grid } from '@/components/Grid/Grid'
import { GridFilterBar, type ViewMode } from '@/components/Grid/GridFilterBar'
import { FlowView } from '@/components/Grid/FlowView'
import { GeneratingState } from '@/components/Grid/GeneratingState'
import { DirectionPanel } from '@/components/Levers/DirectionPanel'
import { Handoff } from '@/components/Handoff/Handoff'
import { cn } from '@/lib/utils'

const GENERATING_MS = 8000

const DEFAULT_PANEL_WIDTH = 580
const MIN_PANEL_WIDTH = 320
/** The chat may take at most half the window — past that it stops being a side panel. */
const maxPanelWidth = () => Math.round(window.innerWidth / 2)

function Shell() {
  const state = useSessionState()
  const dispatch = useSessionDispatch()
  const status = quizStatus(state.slots)
  const [isGenerating, setIsGenerating] = useState(false)
  const [panelWidth, setPanelWidth] = useState(DEFAULT_PANEL_WIDTH)
  const [altHero, setAltHero] = useState(true)
  const [altQuiz, setAltQuiz] = useState(true)
  const [logoLoader, setLogoLoader] = useState(true)
  const [view, setView] = useState<ViewMode>('grid')
  const [dark, setDark] = useState(true)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])
  const [isDragging, setIsDragging] = useState(false)
  const announcedComplete = useRef(false)

  const clampWidth = useCallback((width: number) => Math.min(Math.max(width, MIN_PANEL_WIDTH), maxPanelWidth()), [])

  // A window that shrinks below twice the panel width would otherwise leave the
  // grid with no room at all.
  useEffect(() => {
    const onResize = () => setPanelWidth((current) => clampWidth(current))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [clampWidth])

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
        style={showRightPanel ? { width: panelWidth } : undefined}
        className={cn(
          'flex flex-none flex-col overflow-hidden rounded-xl border border-border bg-card',
          // The width animation is what makes the panel slide in; while a drag
          // is running it has to be off, or every pointer move would be eased
          // and the handle would lag behind the cursor.
          isDragging ? 'transition-none' : 'transition-[width] duration-500 ease-out',
          !showRightPanel && 'w-full',
        )}
      >
        <div className="flex h-11 flex-none items-center justify-between border-b border-border px-4">
          <Button
            variant="ghost"
            size="icon-sm"
            title="Start over"
            onClick={() => {
              announcedComplete.current = false
              setIsGenerating(false)
              dispatch({ type: 'RESET_SESSION' })
            }}
            className="text-muted-foreground"
          >
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
          <Chat centered={!showRightPanel} altHero={altHero} altQuiz={altQuiz} />
        </div>
      </aside>

      {showRightPanel && (
        <PanelResizer
          width={panelWidth}
          isDragging={isDragging}
          onDragChange={setIsDragging}
          onResize={(width) => setPanelWidth(clampWidth(width))}
          onReset={() => setPanelWidth(DEFAULT_PANEL_WIDTH)}
          max={maxPanelWidth}
        />
      )}

      {showRightPanel && (
        <main className="relative flex flex-1 animate-in slide-in-from-right-12 flex-col overflow-hidden duration-500 ease-out fade-in">
          {isGenerating ? (
            <GeneratingState logo={logoLoader} />
          ) : (
            <>
              {view === 'grid' ? (
                <div className="flex-1 overflow-y-auto p-6 pb-24">
                  <Grid />
                </div>
              ) : (
                <FlowView />
              )}
              <GridFilterBar view={view} onViewChange={setView} />
            </>
          )}
        </main>
      )}

      <DirectionPanel />
      <Handoff />
      <SettingsMenu
        altHero={altHero}
        onAltHeroChange={setAltHero}
        altQuiz={altQuiz}
        onAltQuizChange={setAltQuiz}
        logoLoader={logoLoader}
        onLogoLoaderChange={setLogoLoader}
        dark={dark}
        onDarkChange={setDark}
      />
    </div>
  )
}

/** Prototype switches, parked in the corner so they stay out of the layout. */
function SettingsMenu({
  altHero,
  onAltHeroChange,
  altQuiz,
  onAltQuizChange,
  logoLoader,
  onLogoLoaderChange,
  dark,
  onDarkChange,
}: {
  altHero: boolean
  onAltHeroChange: (value: boolean) => void
  altQuiz: boolean
  onAltQuizChange: (value: boolean) => void
  logoLoader: boolean
  onLogoLoaderChange: (value: boolean) => void
  dark: boolean
  onDarkChange: (value: boolean) => void
}) {
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

  return (
    <div ref={rootRef} className="fixed right-4 bottom-4 z-50">
      {open && (
        <div className="absolute right-0 bottom-11 w-56 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-xl">
          <p className="px-3 py-1.5 text-xs text-muted-foreground">Layout</p>
          <button
            type="button"
            onClick={() => onAltHeroChange(!altHero)}
            className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-fill-hover"
          >
            Alt hero
            {altHero && <Check size={15} className="text-primary" />}
          </button>
          <button
            type="button"
            onClick={() => onAltQuizChange(!altQuiz)}
            className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-fill-hover"
          >
            Alt quiz
            {altQuiz && <Check size={15} className="text-primary" />}
          </button>

          <p className="border-t border-border px-3 pt-2 pb-1.5 text-xs text-muted-foreground">Loading</p>
          <button
            type="button"
            onClick={() => onLogoLoaderChange(!logoLoader)}
            className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-fill-hover"
          >
            Logo instead of the grid
            {logoLoader && <Check size={15} className="text-primary" />}
          </button>

          <p className="border-t border-border px-3 pt-2 pb-1.5 text-xs text-muted-foreground">Appearance</p>
          <button
            type="button"
            onClick={() => onDarkChange(!dark)}
            className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-fill-hover"
          >
            Dark mode
            {dark && <Check size={15} className="text-primary" />}
          </button>
        </div>
      )}

      <button
        type="button"
        title="Prototype settings"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'flex size-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-colors',
          open ? 'bg-fill-hover text-foreground' : 'hover:text-foreground',
        )}
      >
        <Settings size={16} strokeWidth={1.75} />
      </button>
    </div>
  )
}

interface PanelResizerProps {
  width: number
  isDragging: boolean
  onDragChange: (dragging: boolean) => void
  onResize: (width: number) => void
  onReset: () => void
  max: () => number
}

/** Drag handle sitting in the gutter between the chat panel and the grid. */
function PanelResizer({ width, isDragging, onDragChange, onResize, onReset, max }: PanelResizerProps) {
  const origin = useRef({ x: 0, width: 0 })

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize the chat panel"
      aria-valuenow={width}
      aria-valuemin={MIN_PANEL_WIDTH}
      aria-valuemax={max()}
      tabIndex={0}
      onPointerDown={(e) => {
        origin.current = { x: e.clientX, width }
        e.currentTarget.setPointerCapture(e.pointerId)
        onDragChange(true)
      }}
      onPointerMove={(e) => {
        if (!isDragging) return
        onResize(origin.current.width + (e.clientX - origin.current.x))
      }}
      onPointerUp={(e) => {
        e.currentTarget.releasePointerCapture(e.pointerId)
        onDragChange(false)
      }}
      onDoubleClick={onReset}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') onResize(width - 24)
        else if (e.key === 'ArrowRight') onResize(width + 24)
        else return
        e.preventDefault()
      }}
      className={cn(
        'group/resizer relative -mx-1.5 flex w-3 flex-none cursor-col-resize items-center justify-center outline-none',
        // While dragging, the cursor can outrun the handle; a full-screen
        // overlay keeps the pointer events coming and stops text selection.
        isDragging && 'z-30',
      )}
    >
      <span
        className={cn(
          'h-10 w-1 rounded-full bg-border opacity-0 transition-opacity',
          'group-hover/resizer:opacity-100 group-focus-visible/resizer:opacity-100',
          isDragging && 'bg-primary opacity-100',
        )}
      />
      {isDragging && <span className="fixed inset-0 cursor-col-resize" />}
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
