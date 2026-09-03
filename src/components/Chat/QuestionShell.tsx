import { useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useT } from '@/i18n/LanguageProvider'
import { cn } from '@/lib/utils'

interface QuestionShellProps {
  title: string
  children: ReactNode
  onBack: () => void
  canGoBack: boolean
  onSkipAll: () => void
  onNext: () => void
  nextDisabled: boolean
}

export function QuestionShell({ title, children, onBack, canGoBack, onSkipAll, onNext, nextDisabled }: QuestionShellProps) {
  const { t } = useT()
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
      <div className="border-b border-border bg-muted/50 px-4 py-3">
        <p className="text-sm font-medium leading-snug">{title}</p>
      </div>

      <div className="flex max-h-[min(48svh,440px)] flex-col divide-y divide-border overflow-y-auto">{children}</div>

      <div className="flex items-center justify-between border-t border-border px-3 py-2">
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            disabled={!canGoBack}
            onClick={onBack}
            className="flex size-8 items-center justify-center rounded-md text-muted-foreground disabled:opacity-30 enabled:hover:bg-muted"
          >
            <ChevronLeft size={15} />
          </button>
          <button type="button" disabled className="flex size-8 items-center justify-center rounded-md text-muted-foreground opacity-30">
            <ChevronRight size={15} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button type="button" onClick={onSkipAll} className="text-xs text-muted-foreground hover:text-foreground">
            {t('chrome.skipAll', 'Skip all')}
          </button>
          <Button size="sm" onClick={onNext} disabled={nextDisabled}>
            {t('chrome.next', 'Next')}
          </Button>
        </div>
      </div>
    </div>
  )
}

interface OptionRowProps {
  selected: boolean
  title: string
  description?: string
  /** Optional image for the swatch on the right; falls back to an empty tile. */
  thumb?: string
  /** Reserve the swatch even without an image, so rows stay a uniform height. */
  showThumb?: boolean
  onClick: () => void
}

export function OptionRow({ selected, title, description, thumb, showThumb, onClick }: OptionRowProps) {
  // A missing file must not render a broken image — the swatch just stays
  // empty, which is also the state the not-yet-photographed questions use.
  const [failed, setFailed] = useState(false)

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={cn('flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50', selected && 'bg-state-bg/60')}
    >
      <RadioDot selected={selected} />
      <span className="flex-1">
        <span className="block text-sm font-medium">{title}</span>
        {description && <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{description}</span>}
      </span>
      {(showThumb || thumb) && (
        <span className="flex size-14 flex-none items-center justify-center overflow-hidden rounded-md border border-border bg-fill-hover">
          {thumb && !failed && <img src={thumb} alt="" onError={() => setFailed(true)} className="size-full object-cover" />}
        </span>
      )}
    </button>
  )
}

export function RadioDot({ selected, className }: { selected: boolean; className?: string }) {
  return (
    <span
      className={cn(
        // Its own surface, so the dot still reads as a control when the row or
        // card behind it is filled rather than white.
        'mt-0.5 flex size-4 flex-none items-center justify-center rounded-full border bg-card',
        selected ? 'border-primary' : 'border-input',
        className,
      )}
    >
      {selected && <span className="size-2 rounded-full bg-primary" />}
    </span>
  )
}
