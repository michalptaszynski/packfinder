import { ArrowUpRight, X } from 'lucide-react'
import { PACKAGING_IDEAS } from '@/data/packagingIdeas'
import { getProjectSpec, type ProjectSpec } from '@/data/packagingProjects'
import { useSessionDispatch } from '@/state/SessionProvider'
import { distributeMasonry } from '@/engine/grid'
import { useColumnCount } from '@/lib/useColumnCount'
import { cn } from '@/lib/utils'
import type { ChatMessage, CoverageChoice, MaterialChoice, Slots, StripChoice } from '@/types'
import { CATEGORY_PRESETS } from '@/data/categoryPresets'

/** Same entrance as the results grid: column by column, from below. */
const COLUMN_STAGGER_MS = 110


/**
 * The packaging-ideas board: real work from packhelp.com, laid out with the
 * same masonry the results grid uses, so the two screens read as one app.
 */
export function InspirationsBoard({ onClose }: { onClose: () => void }) {
  const dispatch = useSessionDispatch()
  // Five across: the board has the whole window, where the results grid shares
  // it with the chat panel.
  const { ref, columns } = useColumnCount(5)

  /**
   * Opens a brief that already holds what this project settled, and says so in
   * the transcript — the point of the board is to start from real work rather
   * than to admire it.
   */
  function startFrom(spec: ProjectSpec, photo: string) {
    const preset = CATEGORY_PRESETS.find((p) => p.id === spec.seed.productCategory)
    const slots: Slots = {
      productCategory: { value: spec.seed.productCategory, source: 'quiz' },
      channel: { value: spec.seed.channel, source: 'quiz' },
    }
    // The category's own physical profile, exactly as picking it in the quiz
    // would set it — the case studies do not publish product dimensions.
    if (preset) {
      slots.dimensions = { value: preset.dimensions, source: 'inferred' }
      slots.weight = { value: preset.weight, source: 'inferred' }
      slots.fragility = { value: preset.fragility, source: 'inferred' }
      slots.foodContact = { value: Boolean(preset.foodContact), source: 'inferred' }
    }
    if (spec.seed.materialColour) slots.materialColour = { value: spec.seed.materialColour as MaterialChoice, source: 'quiz' }
    if (spec.seed.printCoverage) slots.printCoverage = { value: spec.seed.printCoverage as CoverageChoice, source: 'quiz' }
    if (spec.seed.adhesiveStrip) slots.adhesiveStrip = { value: spec.seed.adhesiveStrip as StripChoice, source: 'quiz' }
    if (spec.seed.eco) slots.ecoRequirement = { value: 'required', source: 'quiz' }
    if (spec.seed.vibe?.length) slots.vibe = { value: spec.seed.vibe, source: 'quiz' }

    const messages: ChatMessage[] = [
      { id: crypto.randomUUID(), role: 'user', text: `Start from ${spec.brand}`, image: photo },
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: [
          `${spec.brand} — ${spec.who}`,
          '',
          `Format: ${spec.format}`,
          `Material: ${spec.material}`,
          `Construction: ${spec.construction}`,
          `Print and finish: ${spec.finish}`,
          `What it had to do: ${spec.goal}`,
        ].join('\n'),
      },
      {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: "I've taken that as your starting point — change anything that doesn't fit yours.",
      },
    ]

    dispatch({ type: 'START_FROM_PROJECT', slots, messages })
    onClose()
  }
  // Weighed by each photo's real proportions, so columns land level and no
  // tile is cropped to a made-up shape.
  const cols = distributeMasonry(PACKAGING_IDEAS, columns, (idea) => idea.ratio * 260 + 28)

  return (
    <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
      <div className="flex flex-none items-center justify-between px-6 pt-6 pb-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-lg font-medium">Inspirations</h2>
          <p className="text-xs text-muted-foreground">
            Work Packhelp has done — pick one to start a brief from its specification.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          title="Close"
          className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-fill-hover hover:text-foreground"
        >
          <X size={16} />
        </button>
      </div>

      <div ref={ref} className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
        <div className="flex items-start gap-6">
          {cols.map((col, i) => (
            <div key={i} className="flex min-w-0 flex-1 flex-col gap-8">
              {col.map((idea) => {
                const spec = getProjectSpec(idea.brand)
                return (
                  <div
                    key={idea.photo}
                    style={{ animationDelay: `${i * COLUMN_STAGGER_MS}ms` }}
                    className={cn(
                      'group/idea flex w-full flex-col gap-2',
                      'animate-in fade-in slide-in-from-bottom-6 fill-mode-both duration-500 ease-out',
                    )}
                  >
                    {/* The tile itself starts a brief; the case study is a
                        separate, smaller affordance so one does not swallow
                        the other. */}
                    <button
                      type="button"
                      onClick={() => spec && startFrom(spec, idea.photo)}
                      disabled={!spec}
                      className="w-full text-left"
                    >
                      <img
                        src={idea.photo}
                        alt=""
                        loading="lazy"
                        style={{ aspectRatio: `1 / ${idea.ratio}` }}
                        className="w-full rounded-xl bg-fill-hover object-cover transition-opacity group-hover/idea:opacity-90"
                      />
                    </button>

                    <span className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium">{idea.brand}</span>
                      {/* What Packhelp actually built for them — the shot alone
                          rarely tells you whether that is a mailer, a rigid box
                          or a carton. */}
                      <span className="text-xs text-muted-foreground">{idea.product}</span>
                      <a
                        href={idea.href}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                      >
                        Case study
                        <ArrowUpRight size={12} strokeWidth={2} />
                      </a>
                    </span>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
