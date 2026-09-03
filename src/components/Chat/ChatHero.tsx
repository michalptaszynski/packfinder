import { Coins, PackageOpen, Sparkles, Store, Truck, Wallet } from 'lucide-react'
import { CATEGORY_PRESETS, CHANNEL_OPTIONS } from '@/data/categoryPresets'
import { useSessionDispatch, useSessionState } from '@/state/SessionProvider'
import { formatMoney } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { CategoryPreset } from '@/data/categoryPresets'
import type { Slots } from '@/types'
import { AltHeroStrip } from './ChatHeroAlt'

const FEATURED = ['clothing', 'cosmetics', 'gift_set', 'bottles', 'food', 'jewelry']

/** Per-piece bands, turned into a total once a quantity is known. */
const BUDGET_STARTERS = [
  { id: 'lean', title: 'As cheap as it goes', hint: 'Up to £0.50 a piece — plain and functional', perPiece: 0.4, icon: Coins },
  { id: 'standard', title: 'The usual e-commerce spend', hint: '£0.50 – £1.00 a piece', perPiece: 0.75, icon: Wallet },
  { id: 'better', title: 'Room for finishing', hint: '£1 – £3 a piece — print, inserts, texture', perPiece: 2, icon: Sparkles },
  { id: 'premium', title: 'Make it a gift', hint: 'Over £3 a piece — rigid boxes, foiling', perPiece: 4, icon: PackageOpen },
]

/** Sits above the composer, which is pinned outside this component. */
export function ChatHeroHeadline() {
  return (
    <div className="pointer-events-none flex flex-col items-center gap-3 pb-2 text-center">
      <h2 className="text-4xl font-light tracking-tight text-balance">What are you packing?</h2>
      <p className="text-sm whitespace-nowrap text-muted-foreground">
        Answer whichever question you can. One is enough to start — I'll ask for the rest.
      </p>
    </div>
  )
}

/**
 * The default empty state, for someone who needs packaging and doesn't know
 * where to begin. Three ways in — what goes inside, what it may cost, how it
 * reaches people — because those are the three the engine can actually act on:
 * each card fills a real slot and starts the conversation at that point.
 */
export function ChatHero() {
  const state = useSessionState()
  const dispatch = useSessionDispatch()

  function answer(text: string, slots: Partial<Slots>, image?: string) {
    dispatch({ type: 'ADD_MESSAGE', message: { id: crypto.randomUUID(), role: 'user', text, image } })
    dispatch({ type: 'REBUILD_GRID', slots })
  }

  function pickCategory(preset: CategoryPreset) {
    answer(
      preset.label,
      {
        productCategory: { value: preset.id, source: 'quiz' },
        dimensions: { value: preset.dimensions, source: 'inferred' },
        weight: { value: preset.weight, source: 'inferred' },
        fragility: { value: preset.fragility, source: 'inferred' },
        foodContact: { value: Boolean(preset.foodContact), source: 'inferred' },
      },
      preset.photo,
    )
  }

  const featured = FEATURED.map((id) => CATEGORY_PRESETS.find((p) => p.id === id)).filter(
    (preset): preset is CategoryPreset => Boolean(preset),
  )
  const quantity = state.slots.quantity?.value ?? 120

  return (
    <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-10">
      {/* Every category as a quick tag, for anyone who already knows. Capped at
          the composer's width so the row reads as belonging to it. */}
      <div className="mx-auto flex max-w-[832px] flex-wrap justify-center gap-2">
        {CATEGORY_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => pickCategory(preset)}
            className="rounded-full border border-border px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-fill-hover hover:text-foreground"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* The same strip the alternate hero carries, minus its fallback tile. */}
      <AltHeroStrip showOther={false} wide />

      <Section title="Start from what's going inside">
        {featured.map((preset) => (
          <Card
            key={preset.id}
            title={preset.label}
            hint={preset.blurb}
            photo={preset.photo}
            onClick={() => pickCategory(preset)}
          />
        ))}
      </Section>

      <Section title="Start from what you want to spend">
        {BUDGET_STARTERS.map((band) => (
          <Card
            key={band.id}
            title={band.title}
            hint={band.hint}
            icon={<band.icon size={18} strokeWidth={1.75} />}
            onClick={() => {
              const total = Math.round(band.perPiece * quantity * 100) / 100
              answer(`${formatMoney(band.perPiece)}/pc (${formatMoney(total)} total)`, {
                budgetTotal: { value: total, source: 'quiz' },
              })
            }}
          />
        ))}
      </Section>

      <Section title="Start from how it reaches people">
        {CHANNEL_OPTIONS.map((option) => (
          <Card
            key={option.id}
            title={option.label}
            hint={option.blurb}
            icon={option.id === 'courier' ? <Truck size={18} strokeWidth={1.75} /> : <Store size={18} strokeWidth={1.75} />}
            onClick={() => answer(option.label, { channel: { value: option.id, source: 'quiz' } })}
          />
        ))}
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </div>
  )
}

interface CardProps {
  title: string
  hint: string
  photo?: string
  icon?: React.ReactNode
  onClick: () => void
}

function Card({ title, hint, photo, icon, onClick }: CardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group/card flex items-center gap-3 rounded-xl bg-fill-hover p-3 text-left transition-colors hover:bg-card"
    >
      <span
        className={cn(
          'flex size-12 flex-none items-center justify-center overflow-hidden rounded-lg',
          photo ? '' : 'bg-card text-muted-foreground group-hover/card:text-foreground',
        )}
      >
        {photo ? <img src={photo} alt="" className="size-full object-cover" /> : icon}
      </span>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-sm font-medium">{title}</span>
        <span className="line-clamp-2 text-xs leading-snug text-muted-foreground">{hint}</span>
      </span>
    </button>
  )
}
