import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { useSessionDispatch, useSessionState } from '@/state/SessionProvider'
import { quizStatus } from '@/state/quizStatus'
import { CATEGORY_PRESETS, CHANNEL_OPTIONS, QUIZ_QUESTIONS } from '@/data/categoryPresets'
import {
  COVERAGE_OPTIONS,
  MATERIAL_OPTIONS,
  REFINEMENT_QUESTIONS,
  STRIP_OPTIONS,
  nextRefinement,
  type RefinementOption,
} from '@/data/refinements'
import { formatMoney } from '@/lib/format'
import { cmToMm, formatCm } from '@/lib/units'
import { cn } from '@/lib/utils'
import { OptionRow, QuestionShell, RadioDot } from './QuestionShell'
import { OptionCards, type ChoiceOption } from './OptionCards'
import { BoxOutline } from './BoxOutline'
import type { BoxEdge } from './BoxOutline'
import type { CoverageChoice, Dimensions, MaterialChoice, Slots, StripChoice } from '@/types'
import type { Clarification } from '@/llm/clarify'

const QUANTITY_BANDS = [
  { id: 'q1', title: '30–100 pcs', description: 'A first small batch, testing the market.', value: 65 },
  { id: 'q2', title: '100–300 pcs', description: 'A standard first production run.', value: 180 },
  { id: 'q3', title: '300–1000 pcs', description: 'A bigger batch, better unit price.', value: 600 },
  { id: 'q4', title: '1000+ pcs', description: 'High volume, the lowest price per piece.', value: 1500 },
]

const BUDGET_BANDS = [
  { id: 'b1', title: 'Up to £0.50 / pc', description: 'A very lean option, functional packaging.', value: 0.4 },
  { id: 'b2', title: '£0.50 – £1.00 / pc', description: 'A reasonable e-commerce standard.', value: 0.75 },
  { id: 'b3', title: '£1.00 – £3.00 / pc', description: 'A step up, more finishing options.', value: 2 },
  { id: 'b4', title: 'Above £3.00 / pc', description: 'Premium — rigid boxes, foiling.', value: 4 },
]

const CUSTOM = 'custom'

function buildSkipDefaults(slots: Slots): Partial<Slots> {
  const updates: Partial<Slots> = {}

  if (!slots.productCategory) {
    const preset = CATEGORY_PRESETS.find((p) => p.id === 'other')!
    updates.productCategory = { value: preset.id, source: 'quiz' }
    updates.dimensions = { value: preset.dimensions, source: 'inferred' }
    updates.weight = { value: preset.weight, source: 'inferred' }
    updates.fragility = { value: preset.fragility, source: 'inferred' }
    updates.foodContact = { value: false, source: 'inferred' }
  }

  if (!slots.channel) updates.channel = { value: 'courier', source: 'quiz' }

  if (!slots.dimensions || slots.dimensions.source === 'inferred') {
    const dims = updates.dimensions?.value ?? slots.dimensions?.value ?? { w: 150, h: 100, d: 60 }
    updates.dimensions = { value: dims, source: 'quiz' }
  }

  const quantity = slots.quantity?.value ?? 120
  if (!slots.quantity) updates.quantity = { value: quantity, source: 'quiz' }
  if (!slots.budgetTotal) updates.budgetTotal = { value: Math.round(quantity * 100) / 100, source: 'quiz' }

  return updates
}

/** Anything a step wants to hang on the message it posts. */
interface MessageExtra {
  image?: string
  dimensions?: Dimensions
}

interface QuizControlsProps {
  /** When set, the card asks this instead of the current quiz step. */
  clarification?: Clarification | null
  /** Sends an answer back through the chat's normal parse path. */
  onSend: (text: string) => void
  /** Answers as side-by-side cards instead of one bordered list. */
  altQuiz: boolean
}

export function QuizControls({ clarification, onSend, altQuiz }: QuizControlsProps) {
  const state = useSessionState()
  const dispatch = useSessionDispatch()
  const status = quizStatus(state.slots)

  function commit(summaryText: string, slots: Partial<Slots>, extra?: MessageExtra) {
    dispatch({ type: 'ADD_MESSAGE', message: { id: crypto.randomUUID(), role: 'user', text: summaryText, ...extra } })
    dispatch({ type: 'REBUILD_GRID', slots })
  }

  function goBack() {
    if (status.nextStep === null || status.nextStep === 0) return
    const clearers: Record<number, Partial<Slots>> = {
      0: { productCategory: undefined, dimensions: undefined, weight: undefined, fragility: undefined, foodContact: undefined },
      1: { channel: undefined },
      2: { dimensions: undefined },
      3: { quantity: undefined },
      4: { budgetTotal: undefined },
    }
    dispatch({ type: 'REBUILD_GRID', slots: clearers[status.nextStep - 1] })
  }

  /** Leaves every remaining refinement open rather than guessing a preference. */
  function skipRefinements() {
    dispatch({ type: 'ADD_MESSAGE', message: { id: crypto.randomUUID(), role: 'user', text: 'No preference on the rest' } })
    dispatch({
      type: 'REBUILD_GRID',
      slots: {
        materialColour: state.slots.materialColour ?? { value: 'any', source: 'quiz' },
        printCoverage: state.slots.printCoverage ?? { value: 'any', source: 'quiz' },
        adhesiveStrip: state.slots.adhesiveStrip ?? { value: 'any', source: 'quiz' },
      },
    })
  }

  function skipAll() {
    dispatch({ type: 'ADD_MESSAGE', message: { id: crypto.randomUUID(), role: 'user', text: 'Skip the rest of the questions' } })
    dispatch({ type: 'REBUILD_GRID', slots: buildSkipDefaults(state.slots) })
  }

  const shared = { alt: altQuiz, onBack: goBack, canGoBack: status.nextStep !== null && status.nextStep > 0, onSkipAll: skipAll }

  if (clarification && clarification.options.length > 0) {
    return (
      <ChoiceStep
        key="clarify"
        {...shared}
        title={clarification.question}
        options={clarification.options.map((option) => ({
          value: option.label,
          title: option.label,
          description: option.description,
        }))}
        onPick={(value) => {
          const option = clarification.options.find((o) => o.label === value)
          if (!option) return
          // Model-authored options already carry the resolved reading; rule-based
          // ones carry a sentence the offline parser knows how to read.
          if (option.slots) commit(option.label, option.slots)
          else onSend(option.message)
        }}
      />
    )
  }

  if (status.nextStep === null) {
    const refineStep = nextRefinement(state.slots)
    if (refineStep === null) return null
    const { question, slot, options } = REFINE_STEPS[refineStep]
    return (
      <ChoiceStep
        key={`refine-${refineStep}`}
        {...shared}
        canGoBack={false}
        onSkipAll={skipRefinements}
        title={question}
        showThumbs
        options={(options as readonly RefinementOption<string>[]).map((option) => ({
          value: option.value,
          title: option.title,
          description: option.description,
          photo: option.photo,
          photoShort: true,
        }))}
        onPick={(value) => {
          const option = (options as readonly RefinementOption<string>[]).find((o) => o.value === value)
          if (!option) return
          commit(
            option.title,
            { [slot]: { value: option.value as MaterialChoice & CoverageChoice & StripChoice, source: 'quiz' } } as Partial<Slots>,
            { image: option.photo },
          )
        }}
      />
    )
  }

  switch (status.nextStep) {
    case 0:
      return (
        <ChoiceStep
          key={0}
          {...shared}
          title={QUIZ_QUESTIONS[0]}
          options={CATEGORY_PRESETS.map((preset) => ({
            value: preset.id,
            title: preset.label,
            description: preset.blurb,
            photo: preset.photo,
          }))}
          onPick={(value) => {
            const preset = CATEGORY_PRESETS.find((p) => p.id === value)
            if (!preset) return
            commit(
              preset.label,
              {
                productCategory: { value: preset.id, source: 'quiz' },
                dimensions: { value: preset.dimensions, source: 'inferred' },
                weight: { value: preset.weight, source: 'inferred' },
                fragility: { value: preset.fragility, source: 'inferred' },
                foodContact: { value: Boolean(preset.foodContact), source: 'inferred' },
              },
              { image: preset.photo },
            )
          }}
        />
      )

    case 1:
      return (
        <ChoiceStep
          key={1}
          {...shared}
          title={QUIZ_QUESTIONS[1]}
          options={CHANNEL_OPTIONS.map((option) => ({ value: option.id, title: option.label, description: option.blurb }))}
          onPick={(value) => {
            const option = CHANNEL_OPTIONS.find((o) => o.id === value)
            if (!option) return
            commit(option.label, { channel: { value: option.id, source: 'quiz' } })
          }}
        />
      )

    case 2:
      return <DimensionsStep key={2} alt={altQuiz} slots={state.slots} onCommit={commit} onBack={goBack} canGoBack onSkipAll={skipAll} />

    case 3:
      return (
        <ChoiceStep
          key={3}
          {...shared}
          title={QUIZ_QUESTIONS[3]}
          options={[
            ...QUANTITY_BANDS.map((band) => ({ value: band.id, title: band.title, description: band.description })),
            { value: CUSTOM, title: 'An exact number', input: { placeholder: 'e.g. 250', suffix: 'pcs' } },
          ]}
          onPick={(value, draft) => {
            if (value === CUSTOM) {
              const exact = Math.round(Number(draft.replace(',', '.')))
              if (!Number.isFinite(exact) || exact <= 0) return
              commit(`${exact} pcs`, { quantity: { value: exact, source: 'quiz' } })
              return
            }
            const band = QUANTITY_BANDS.find((b) => b.id === value)
            if (!band) return
            commit(band.title, { quantity: { value: band.value, source: 'quiz' } })
          }}
        />
      )

    case 4: {
      const quantity = state.slots.quantity?.value ?? 120
      return (
        <ChoiceStep
          key={4}
          {...shared}
          title={QUIZ_QUESTIONS[4]}
          options={[
            ...BUDGET_BANDS.map((band) => ({ value: band.id, title: band.title, description: band.description })),
            { value: CUSTOM, title: 'An exact amount', input: { placeholder: 'e.g. 1.20', prefix: '£', suffix: '/pc' } },
          ]}
          onPick={(value, draft) => {
            const perPiece =
              value === CUSTOM ? Number(draft.replace(',', '.')) : (BUDGET_BANDS.find((b) => b.id === value)?.value ?? 0)
            if (!Number.isFinite(perPiece) || perPiece <= 0) return
            const total = Math.round(perPiece * quantity * 100) / 100
            commit(`${formatMoney(perPiece)}/pc (${formatMoney(total)} total)`, { budgetTotal: { value: total, source: 'quiz' } })
          }}
        />
      )
    }

    default:
      return null
  }
}

const REFINE_STEPS = [
  { question: REFINEMENT_QUESTIONS[0], slot: 'materialColour', options: MATERIAL_OPTIONS },
  { question: REFINEMENT_QUESTIONS[1], slot: 'printCoverage', options: COVERAGE_OPTIONS },
  { question: REFINEMENT_QUESTIONS[2], slot: 'adhesiveStrip', options: STRIP_OPTIONS },
] as const

interface ChoiceStepProps {
  title: string
  options: ChoiceOption[]
  alt: boolean
  /** Reserve a swatch on each row even where there is no image yet. */
  showThumbs?: boolean
  onPick: (value: string, draft: string) => void
  onBack: () => void
  canGoBack: boolean
  onSkipAll: () => void
}

/**
 * One question, two layouts. The options and what picking one does are shared;
 * only the presentation differs — a bordered list with a Next button, or cards
 * that answer on click.
 */
function ChoiceStep({ title, options, alt, showThumbs, onPick, onBack, canGoBack, onSkipAll }: ChoiceStepProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  const active = options.find((option) => option.value === selected)
  const draftValue = Number(draft.replace(',', '.'))
  const ready = selected !== null && (!active?.input || (draft.trim() !== '' && Number.isFinite(draftValue) && draftValue > 0))

  if (alt) {
    return (
      <OptionCards
        options={options}
        selected={selected}
        draft={draft}
        onSelect={setSelected}
        onDraftChange={setDraft}
        onCommit={(value) => {
          const option = options.find((o) => o.value === value)
          if (option?.input && (draft.trim() === '' || !Number.isFinite(draftValue) || draftValue <= 0)) return
          onPick(value, draft)
        }}
      />
    )
  }

  return (
    <QuestionShell
      title={title}
      onBack={onBack}
      canGoBack={canGoBack}
      onSkipAll={onSkipAll}
      onNext={() => ready && selected && onPick(selected, draft)}
      nextDisabled={!ready}
    >
      {options.map((option) =>
        option.input ? (
          <div key={option.value} className={cn('flex items-center gap-3 px-4 py-3', selected === option.value && 'bg-state-bg/60')}>
            <button type="button" onClick={() => setSelected(option.value)} className="flex-none">
              <RadioDot selected={selected === option.value} />
            </button>
            {option.input.prefix && <span className="flex-none text-xs text-muted-foreground">{option.input.prefix}</span>}
            <input
              type="text"
              inputMode="decimal"
              value={draft}
              onFocus={() => setSelected(option.value)}
              onChange={(e) => setDraft(e.target.value.replace(/[^\d.,]/g, ''))}
              placeholder={option.input.placeholder}
              className="w-full rounded-md border border-input bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring"
            />
            {option.input.suffix && <span className="flex-none text-xs text-muted-foreground">{option.input.suffix}</span>}
          </div>
        ) : (
          <OptionRow
            key={option.value}
            selected={selected === option.value}
            title={option.title}
            description={option.description}
            thumb={option.photo}
            // "No preference" isn't a material or a setting to picture — it opts
            // out of the choice, so it gets no swatch.
            showThumb={showThumbs && option.value !== 'any'}
            onClick={() => setSelected(option.value)}
          />
        ),
      )}
    </QuestionShell>
  )
}

interface DimensionsStepProps {
  alt: boolean
  slots: Slots
  onCommit: (summaryText: string, slots: Partial<Slots>, extra?: MessageExtra) => void
  onBack: () => void
  canGoBack: boolean
  onSkipAll: () => void
}

function DimensionsStep({ alt, slots, onCommit, onBack, canGoBack, onSkipAll }: DimensionsStepProps) {
  // Kept as raw strings so a half-typed decimal ("12.") survives a re-render;
  // millimetres are derived on the way out.
  const [raw, setRaw] = useState(() => {
    const value = slots.dimensions?.value
    return {
      w: value ? formatCm(value.w) : '',
      h: value ? formatCm(value.h) : '',
      d: value ? formatCm(value.d) : '',
    }
  })
  const [focused, setFocused] = useState<BoxEdge | null>(null)

  const toMm = (input: string) => {
    const value = Number(input.replace(',', '.'))
    return Number.isFinite(value) && value > 0 ? cmToMm(value) : 0
  }
  const dims: Dimensions = { w: toMm(raw.w), h: toMm(raw.h), d: toMm(raw.d) }
  const canProceed = dims.w > 0 && dims.h > 0 && dims.d > 0

  function handleNext() {
    onCommit(
      `${formatCm(dims.w)} × ${formatCm(dims.h)} × ${formatCm(dims.d)} cm`,
      { dimensions: { value: dims, source: 'quiz' } },
      { dimensions: dims },
    )
  }

  const fields = (
    <div className="flex items-center gap-4">
      <BoxOutline dimensions={dims} highlight={focused} size={112} />
      <div className="flex min-w-0 flex-1 items-end gap-2">
        <DimField
          label="Width"
          active={focused === 'w'}
          value={raw.w}
          onChange={(w) => setRaw((c) => ({ ...c, w }))}
          onFocusChange={(on) => setFocused(on ? 'w' : null)}
          onSubmit={() => canProceed && handleNext()}
        />
        <DimField
          label="Height"
          active={focused === 'h'}
          value={raw.h}
          onChange={(h) => setRaw((c) => ({ ...c, h }))}
          onFocusChange={(on) => setFocused(on ? 'h' : null)}
          onSubmit={() => canProceed && handleNext()}
        />
        <DimField
          label="Depth"
          active={focused === 'd'}
          value={raw.d}
          onChange={(d) => setRaw((c) => ({ ...c, d }))}
          onFocusChange={(on) => setFocused(on ? 'd' : null)}
          onSubmit={() => canProceed && handleNext()}
        />
        {alt && (
          // The card layout has no footer to put Next in, so the row carries
          // its own confirm — Enter in any field does the same thing.
          <button
            type="button"
            disabled={!canProceed}
            onClick={handleNext}
            title="Confirm dimensions"
            className="mb-0.5 flex size-8 flex-none items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-30"
          >
            <ArrowRight size={15} strokeWidth={2.25} />
          </button>
        )}
      </div>
    </div>
  )

  if (alt) {
    return (
      <div
        style={{ animationDelay: '260ms' }}
        className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both rounded-xl border border-border bg-card p-3 duration-300 ease-out"
      >
        {fields}
      </div>
    )
  }

  return (
    <QuestionShell title={QUIZ_QUESTIONS[2]} onBack={onBack} canGoBack={canGoBack} onSkipAll={onSkipAll} onNext={handleNext} nextDisabled={!canProceed}>
      <div className="flex flex-col gap-3 px-4 py-4">
        <p className="text-xs text-muted-foreground">
          Give the product's exact dimensions (cm) — the engine adds clearance and shows the package's outer size.
        </p>
        {fields}
      </div>
    </QuestionShell>
  )
}

function DimField({
  label,
  active,
  value,
  onChange,
  onFocusChange,
  onSubmit,
}: {
  label: string
  active: boolean
  value: string
  onChange: (v: string) => void
  onFocusChange: (focused: boolean) => void
  onSubmit: () => void
}) {
  return (
    <label
      className={cn('flex min-w-0 flex-1 flex-col gap-1 text-xs text-muted-foreground', active && 'text-primary')}
      // Hovering the field lights its edge too, so the mapping is discoverable
      // without having to click into every input.
      onMouseEnter={() => onFocusChange(true)}
      onMouseLeave={() => onFocusChange(false)}
    >
      {label}
      <span className="relative block">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ''))}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return
            e.preventDefault()
            onSubmit()
          }}
          onFocus={() => onFocusChange(true)}
          onBlur={() => onFocusChange(false)}
          className={cn(
            'w-full min-w-0 rounded-md border border-input bg-transparent py-1.5 pr-8 pl-2 text-sm text-foreground outline-none focus-visible:border-ring',
            active && 'border-primary',
          )}
        />
        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-muted-foreground">cm</span>
      </span>
    </label>
  )
}
