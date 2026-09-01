import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="border-b border-border bg-muted/50 px-4 py-3">
        <p className="text-sm font-medium leading-snug">{title}</p>
      </div>

      <div className="flex flex-col divide-y divide-border">{children}</div>

      <div className="flex items-center justify-between border-t border-border px-3 py-2">
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            disabled={!canGoBack}
            onClick={onBack}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground disabled:opacity-30 enabled:hover:bg-muted"
          >
            <ChevronLeft size={15} />
          </button>
          <button type="button" disabled className="flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-30">
            <ChevronRight size={15} />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button type="button" onClick={onSkipAll} className="text-xs text-muted-foreground hover:text-foreground">
            Pomiń wszystko
          </button>
          <Button size="sm" onClick={onNext} disabled={nextDisabled}>
            Dalej
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
  onClick: () => void
}

export function OptionRow({ selected, title, description, onClick }: OptionRowProps) {
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
    </button>
  )
}

export function RadioDot({ selected }: { selected: boolean }) {
  return (
    <span
      className={cn(
        'mt-0.5 flex size-4 flex-none items-center justify-center rounded-full border',
        selected ? 'border-foreground' : 'border-input',
      )}
    >
      {selected && <span className="size-2 rounded-full bg-foreground" />}
    </span>
  )
}
