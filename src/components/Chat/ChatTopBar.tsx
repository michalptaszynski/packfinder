import { useEffect, useRef, useState } from 'react'
import { House, MoreHorizontal } from 'lucide-react'
import { useT } from '@/i18n/LanguageProvider'
import { cn } from '@/lib/utils'

interface ChatTopBarProps {
  onHome: () => void
  onDownloadSpec: () => void
}

/**
 * Shown once the rail is hidden behind the results. Home goes back to a blank
 * brief, which is also what brings the rail back.
 */
export function ChatTopBar({ onHome, onDownloadSpec }: ChatTopBarProps) {
  const { t } = useT()
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
    // The negative margins escape the workspace padding: -mx-3 so the rule
    // runs the full width of the panel, -mt-3 so the space above the icons is
    // the bar's own and not the padding stacked on top of it — otherwise the
    // gap above them reads as double the gap below.
    //
    // Same glass as the bars floating over the grid: 80% card, an 8px backdrop
    // blur and a 1px shadow. The transcript scrolls underneath it, which is
    // what the blur is for.
    <div className="absolute inset-x-0 top-0 z-20 -mx-3 -mt-3 flex h-14 items-center justify-between border-b border-border bg-card/80 px-6 shadow-[0_1px_2px_rgba(0,0,0,0.08)] backdrop-blur-[8px]">
      <IconButton title="Start over" onClick={onHome}>
        <House size={16} strokeWidth={1.75} />
      </IconButton>

      <div ref={rootRef} className="relative">
        <IconButton title="More" active={open} onClick={() => setOpen((value) => !value)}>
          <MoreHorizontal size={16} strokeWidth={1.75} />
        </IconButton>

        {open && (
          <div className="absolute top-full right-0 z-40 mt-1 w-48 overflow-hidden rounded-xl border border-border bg-card py-1 shadow-xl">
            <MenuItem
              label={t('chrome.downloadSpec', 'Download specification')}
              onClick={() => {
                setOpen(false)
                onDownloadSpec()
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function IconButton({
  title,
  active,
  onClick,
  children,
}: {
  title: string
  active?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        'flex size-8 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-fill-hover',
        active && 'bg-fill-hover',
      )}
    >
      {children}
    </button>
  )
}

function MenuItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="w-full px-3 py-2 text-left text-sm hover:bg-fill-hover">
      {label}
    </button>
  )
}
