import { useEffect } from 'react'
import { useRef } from 'react'
import { useScrollCarousel } from '@/lib/useScrollCarousel'
import { cn } from '@/lib/utils'
import { RadioDot } from './QuestionShell'

/** Beat between the question landing and the answers arriving. */
const ENTRANCE_DELAY_MS = 260
/** Per-card offset, so the row deals in rather than appearing as a block. */
const STAGGER_MS = 45

export interface ChoiceOption {
  value: string
  title: string
  description?: string
  photo?: string
  /** Landscape source (the board swatches) — kept short instead of square. */
  photoShort?: boolean
  /** Renders an inline field instead of a fixed answer (e.g. "exact amount"). */
  input?: { placeholder: string; prefix?: string; suffix?: string }
}

interface OptionCardsProps {
  options: ChoiceOption[]
  selected: string | null
  draft: string
  onSelect: (value: string) => void
  onDraftChange: (value: string) => void
  /** Card layout commits on click; the classic list waits for Next. */
  onCommit: (value: string) => void
}

/**
 * The alternate quiz layout: answers as cards in one horizontally scrolling
 * row, sitting directly under the question in the transcript. The question is
 * already in the bubble above, so there is no shell, no header and no Next —
 * clicking a card answers, and only the free-text card waits for Enter.
 */
export function OptionCards({ options, selected, draft, onSelect, onDraftChange, onCommit }: OptionCardsProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { ref: scrollerRef, canScrollLeft, canScrollRight } = useScrollCarousel()
  // Once any card carries a photo the rest need a stand-in, or their text
  // starts higher than their neighbours' and the row loses its baseline.
  const anyPhoto = options.some((option) => option.photo)
  const shortPhotos = options.some((option) => option.photoShort)

  useEffect(() => {
    const active = options.find((option) => option.value === selected)
    if (active?.input) inputRef.current?.focus()
  }, [selected, options])

  return (
    <div className="relative">
      {/* Fades on whichever side still has cards, so a half-scrolled row reads
          as continuing rather than clipped. */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-card to-transparent transition-opacity duration-200',
          canScrollLeft ? 'opacity-100' : 'opacity-0',
        )}
      />
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-card to-transparent transition-opacity duration-200',
          canScrollRight ? 'opacity-100' : 'opacity-0',
        )}
      />

      <div
        ref={scrollerRef}
        className="flex gap-2.5 overflow-x-auto p-0.5 pb-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {options.map((option, index) => {
          const isSelected = selected === option.value
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => {
                onSelect(option.value)
                if (!option.input) onCommit(option.value)
              }}
              // Held back a beat, then dealt in from below: the answers arrive
              // after the question has been read, which is what draws the eye
              // to them. fill-mode-both keeps each card invisible until its own
              // delay elapses, instead of flashing in place first.
              style={{ animationDelay: `${ENTRANCE_DELAY_MS + index * STAGGER_MS}ms` }}
              className={cn(
                // Grow to share the row when there is space; the min-width
                // makes the row overflow — and so scroll — once there isn't.
                'flex min-w-[204px] flex-1 basis-[204px] flex-col overflow-hidden rounded-xl border text-left transition-colors',
                'animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-300 ease-out',
                // Filled at rest, clearing on hover — the inverse of the usual
                // direction, so pointing at a card lifts it off the row.
                isSelected ? 'border-primary bg-state-bg/50' : 'border-border bg-fill-hover hover:bg-card',
              )}
            >
              {option.photo ? (
                // Square to the card's width, except for the board swatches:
                // those are wide, flat shots and a square crop eats the very
                // corner that shows the flute. Full-bleed either way — a framed
                // inset would read as a thumbnail pasted onto the card.
                <img
                  src={option.photo}
                  alt=""
                  className={cn('w-full object-cover', option.photoShort ? 'h-24' : 'aspect-square')}
                />
              ) : (
                anyPhoto && <span className={cn('w-full bg-muted', shortPhotos ? 'h-24' : 'aspect-square')} />
              )}

              <span className="flex flex-col gap-2 p-3">
                <RadioDot selected={isSelected} />
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{option.title}</span>
                  {option.description && (
                    <span className="text-xs leading-snug text-muted-foreground">{option.description}</span>
                  )}
                </span>

                {option.input && (
                  <span className="flex items-center gap-1.5">
                    {option.input.prefix && <span className="text-xs text-muted-foreground">{option.input.prefix}</span>}
                    <input
                      ref={inputRef}
                      type="text"
                      inputMode="decimal"
                      value={draft}
                      placeholder={option.input.placeholder}
                      onChange={(e) => onDraftChange(e.target.value.replace(/[^\d.,]/g, ''))}
                      onKeyDown={(e) => {
                        if (e.key !== 'Enter') return
                        e.preventDefault()
                        onCommit(option.value)
                      }}
                      className="w-full min-w-0 rounded-md border border-input bg-transparent px-2 py-1 text-sm outline-none focus-visible:border-ring"
                    />
                    {option.input.suffix && <span className="text-xs text-muted-foreground">{option.input.suffix}</span>}
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
