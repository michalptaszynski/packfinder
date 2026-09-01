import { useState } from 'react'
import { useSessionDispatch, useSessionState } from '@/state/SessionProvider'
import { quizStatus } from '@/state/quizStatus'
import { CATEGORY_PRESETS, CHANNEL_OPTIONS, QUIZ_QUESTIONS } from '@/data/categoryPresets'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import { OptionRow, QuestionShell, RadioDot } from './QuestionShell'
import type { CategoryPreset } from '@/data/categoryPresets'
import type { Dimensions, Slots } from '@/types'

const SIZE_BANDS = [
  { id: 'small', title: 'Małe (do ok. 10 cm)', description: 'Biżuteria, kosmetyki, drobiazgi.', dims: { w: 60, h: 80, d: 30 } as Dimensions },
  {
    id: 'medium',
    title: 'Średnie (10–20 cm)',
    description: 'Ubrania złożone, butelki, pudełka prezentowe.',
    dims: { w: 150, h: 200, d: 80 } as Dimensions,
  },
  { id: 'large', title: 'Duże (powyżej 20 cm)', description: 'Ubrania rozłożone, większe zestawy.', dims: { w: 280, h: 350, d: 120 } as Dimensions },
]

const QUANTITY_BANDS = [
  { id: 'q1', title: '30–100 szt.', description: 'Pierwsza mała partia, testowanie rynku.', value: 65 },
  { id: 'q2', title: '100–300 szt.', description: 'Standardowy pierwszy nakład.', value: 180 },
  { id: 'q3', title: '300–1000 szt.', description: 'Większa partia, lepsza cena jednostkowa.', value: 600 },
  { id: 'q4', title: '1000+ szt.', description: 'Duży wolumen, najniższa cena za sztukę.', value: 1500 },
]

const BUDGET_BANDS = [
  { id: 'b1', title: 'Do £0.50 / szt.', description: 'Bardzo oszczędny wariant, funkcjonalne opakowanie.', value: 0.4 },
  { id: 'b2', title: '£0.50 – £1.00 / szt.', description: 'Rozsądny standard e-commerce.', value: 0.75 },
  { id: 'b3', title: '£1.00 – £3.00 / szt.', description: 'Podniesiony standard, więcej opcji wykończenia.', value: 2 },
  { id: 'b4', title: 'Powyżej £3.00 / szt.', description: 'Premium — pudełka sztywne, złocenia.', value: 4 },
]

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

interface StepProps {
  slots: Slots
  onCommit: (summaryText: string, slots: Partial<Slots>) => void
  onBack: () => void
  canGoBack: boolean
  onSkipAll: () => void
}

export function QuizControls() {
  const state = useSessionState()
  const dispatch = useSessionDispatch()
  const status = quizStatus(state.slots)

  function commit(summaryText: string, slots: Partial<Slots>) {
    dispatch({ type: 'ADD_MESSAGE', message: { id: crypto.randomUUID(), role: 'user', text: summaryText } })
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

  function skipAll() {
    dispatch({ type: 'ADD_MESSAGE', message: { id: crypto.randomUUID(), role: 'user', text: 'Pomiń resztę pytań' } })
    dispatch({ type: 'REBUILD_GRID', slots: buildSkipDefaults(state.slots) })
  }

  if (status.nextStep === null) return null

  const stepProps: StepProps = { slots: state.slots, onCommit: commit, onBack: goBack, canGoBack: status.nextStep > 0, onSkipAll: skipAll }

  switch (status.nextStep) {
    case 0:
      return <CategoryStep key={0} {...stepProps} />
    case 1:
      return <ChannelStep key={1} {...stepProps} />
    case 2:
      return <DimensionsStep key={2} {...stepProps} />
    case 3:
      return <QuantityStep key={3} {...stepProps} />
    case 4:
      return <BudgetStep key={4} {...stepProps} />
    default:
      return null
  }
}

function CategoryStep({ onCommit, onBack, canGoBack, onSkipAll }: StepProps) {
  const [selected, setSelected] = useState<string | null>(null)

  function handleNext() {
    const preset = CATEGORY_PRESETS.find((p) => p.id === selected)
    if (!preset) return
    onCommit(preset.label, {
      productCategory: { value: preset.id, source: 'quiz' },
      dimensions: { value: preset.dimensions, source: 'inferred' },
      weight: { value: preset.weight, source: 'inferred' },
      fragility: { value: preset.fragility, source: 'inferred' },
      foodContact: { value: Boolean(preset.foodContact), source: 'inferred' },
    })
  }

  return (
    <QuestionShell title={QUIZ_QUESTIONS[0]} onBack={onBack} canGoBack={canGoBack} onSkipAll={onSkipAll} onNext={handleNext} nextDisabled={!selected}>
      {CATEGORY_PRESETS.map((preset: CategoryPreset) => (
        <OptionRow key={preset.id} selected={selected === preset.id} title={preset.label} description={preset.blurb} onClick={() => setSelected(preset.id)} />
      ))}
    </QuestionShell>
  )
}

function ChannelStep({ onCommit, onBack, canGoBack, onSkipAll }: StepProps) {
  const [selected, setSelected] = useState<string | null>(null)

  function handleNext() {
    const option = CHANNEL_OPTIONS.find((o) => o.id === selected)
    if (!option) return
    onCommit(option.label, { channel: { value: option.id, source: 'quiz' } })
  }

  return (
    <QuestionShell title={QUIZ_QUESTIONS[1]} onBack={onBack} canGoBack={canGoBack} onSkipAll={onSkipAll} onNext={handleNext} nextDisabled={!selected}>
      {CHANNEL_OPTIONS.map((option) => (
        <OptionRow key={option.id} selected={selected === option.id} title={option.label} description={option.blurb} onClick={() => setSelected(option.id)} />
      ))}
    </QuestionShell>
  )
}

function DimensionsStep({ slots, onCommit, onBack, canGoBack, onSkipAll }: StepProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [custom, setCustom] = useState<Dimensions>(slots.dimensions?.value ?? { w: 0, h: 0, d: 0 })

  const customValid = custom.w > 0 && custom.h > 0 && custom.d > 0
  const canProceed = selected !== null && (selected !== 'custom' || customValid)

  function handleNext() {
    if (selected === 'custom') {
      onCommit(`${custom.w} × ${custom.h} × ${custom.d} mm`, { dimensions: { value: custom, source: 'quiz' } })
      return
    }
    const band = SIZE_BANDS.find((b) => b.id === selected)
    if (!band) return
    onCommit(band.title, { dimensions: { value: band.dims, source: 'quiz' } })
  }

  return (
    <QuestionShell title={QUIZ_QUESTIONS[2]} onBack={onBack} canGoBack={canGoBack} onSkipAll={onSkipAll} onNext={handleNext} nextDisabled={!canProceed}>
      {SIZE_BANDS.map((band) => (
        <OptionRow key={band.id} selected={selected === band.id} title={band.title} description={band.description} onClick={() => setSelected(band.id)} />
      ))}
      <div className={cn('flex items-center gap-3 px-4 py-3', selected === 'custom' && 'bg-state-bg/60')}>
        <button type="button" onClick={() => setSelected('custom')} className="flex-none">
          <RadioDot selected={selected === 'custom'} />
        </button>
        <span className="flex-none text-xs text-muted-foreground">Dokładnie:</span>
        <div className="flex flex-1 items-center gap-1.5">
          <DimInput value={custom.w} onFocus={() => setSelected('custom')} onChange={(w) => setCustom((c) => ({ ...c, w }))} />
          <span className="text-xs text-muted-foreground">×</span>
          <DimInput value={custom.h} onFocus={() => setSelected('custom')} onChange={(h) => setCustom((c) => ({ ...c, h }))} />
          <span className="text-xs text-muted-foreground">×</span>
          <DimInput value={custom.d} onFocus={() => setSelected('custom')} onChange={(d) => setCustom((c) => ({ ...c, d }))} />
          <span className="text-xs text-muted-foreground">mm</span>
        </div>
      </div>
    </QuestionShell>
  )
}

function DimInput({ value, onChange, onFocus }: { value: number; onChange: (v: number) => void; onFocus: () => void }) {
  return (
    <input
      type="number"
      value={value || ''}
      onFocus={onFocus}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-14 rounded-md border border-input bg-transparent px-2 py-1 text-sm outline-none focus-visible:border-ring"
    />
  )
}

function QuantityStep({ onCommit, onBack, canGoBack, onSkipAll }: StepProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [customValue, setCustomValue] = useState('')

  const customNumber = Number(customValue)
  const canProceed = selected !== null && (selected !== 'custom' || (customValue.trim() !== '' && customNumber > 0))

  function handleNext() {
    if (selected === 'custom') {
      onCommit(`${customNumber} szt.`, { quantity: { value: customNumber, source: 'quiz' } })
      return
    }
    const band = QUANTITY_BANDS.find((b) => b.id === selected)
    if (!band) return
    onCommit(band.title, { quantity: { value: band.value, source: 'quiz' } })
  }

  return (
    <QuestionShell title={QUIZ_QUESTIONS[3]} onBack={onBack} canGoBack={canGoBack} onSkipAll={onSkipAll} onNext={handleNext} nextDisabled={!canProceed}>
      {QUANTITY_BANDS.map((band) => (
        <OptionRow key={band.id} selected={selected === band.id} title={band.title} description={band.description} onClick={() => setSelected(band.id)} />
      ))}
      <div className={cn('flex items-center gap-3 px-4 py-3', selected === 'custom' && 'bg-state-bg/60')}>
        <button type="button" onClick={() => setSelected('custom')} className="flex-none">
          <RadioDot selected={selected === 'custom'} />
        </button>
        <input
          type="number"
          value={customValue}
          onFocus={() => setSelected('custom')}
          onChange={(e) => setCustomValue(e.target.value)}
          placeholder="Podaj dokładny nakład..."
          className="w-full rounded-md border border-input bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring"
        />
        <span className="flex-none text-xs text-muted-foreground">szt.</span>
      </div>
    </QuestionShell>
  )
}

function BudgetStep({ slots, onCommit, onBack, canGoBack, onSkipAll }: StepProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [customValue, setCustomValue] = useState('')
  const quantity = slots.quantity?.value ?? 120

  const customNumber = Number(customValue.replace(',', '.'))
  const canProceed = selected !== null && (selected !== 'custom' || (customValue.trim() !== '' && customNumber > 0))

  function handleNext() {
    const perPiece = selected === 'custom' ? customNumber : (BUDGET_BANDS.find((b) => b.id === selected)?.value ?? 0)
    const total = Math.round(perPiece * quantity * 100) / 100
    onCommit(`${formatMoney(perPiece)}/szt. (razem ${formatMoney(total)})`, { budgetTotal: { value: total, source: 'quiz' } })
  }

  return (
    <QuestionShell title={QUIZ_QUESTIONS[4]} onBack={onBack} canGoBack={canGoBack} onSkipAll={onSkipAll} onNext={handleNext} nextDisabled={!canProceed}>
      {BUDGET_BANDS.map((band) => (
        <OptionRow key={band.id} selected={selected === band.id} title={band.title} description={band.description} onClick={() => setSelected(band.id)} />
      ))}
      <div className={cn('flex items-center gap-3 px-4 py-3', selected === 'custom' && 'bg-state-bg/60')}>
        <button type="button" onClick={() => setSelected('custom')} className="flex-none">
          <RadioDot selected={selected === 'custom'} />
        </button>
        <span className="flex-none text-xs text-muted-foreground">£</span>
        <input
          type="text"
          inputMode="decimal"
          value={customValue}
          onFocus={() => setSelected('custom')}
          onChange={(e) => setCustomValue(e.target.value)}
          placeholder="Podaj dokładną kwotę na sztukę..."
          className="w-full rounded-md border border-input bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring"
        />
        <span className="flex-none text-xs text-muted-foreground">/szt.</span>
      </div>
    </QuestionShell>
  )
}
