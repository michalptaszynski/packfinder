import { ChevronRight, Gift, Shirt, Sparkles } from 'lucide-react'
import { CATEGORY_PRESETS } from '@/data/categoryPresets'
import { useSessionDispatch } from '@/state/SessionProvider'
import type { CategoryPreset } from '@/data/categoryPresets'

const FEATURED: Record<string, { icon: typeof Shirt; blurb: string }> = {
  clothing: { icon: Shirt, blurb: 'Miękkie opakowanie, które chroni tkaninę i dobrze wygląda przy rozpakowaniu.' },
  cosmetics: { icon: Sparkles, blurb: 'Małe, eleganckie pudełko dopasowane do słoiczków i tubek.' },
  gift_set: { icon: Gift, blurb: 'Sztywne albo szufladkowe pudełko z efektem „wow" przy otwieraniu.' },
}

const FEATURED_ORDER = ['clothing', 'cosmetics', 'gift_set']

/**
 * The empty-state screen shown before the user has answered anything —
 * three big entry-point cards up top, the remaining categories packed into
 * a compact row below, mirroring the "Start creating" template-picker
 * pattern rather than a flat 3x3 grid of equal-weight tiles.
 */
export function ChatHero() {
  const dispatch = useSessionDispatch()

  function pick(preset: CategoryPreset) {
    dispatch({ type: 'ADD_MESSAGE', message: { id: crypto.randomUUID(), role: 'user', text: preset.label } })
    dispatch({
      type: 'REBUILD_GRID',
      slots: {
        productCategory: { value: preset.id, source: 'quiz' },
        dimensions: { value: preset.dimensions, source: 'inferred' },
        weight: { value: preset.weight, source: 'inferred' },
        fragility: { value: preset.fragility, source: 'inferred' },
        foodContact: { value: Boolean(preset.foodContact), source: 'inferred' },
      },
    })
  }

  const featured = FEATURED_ORDER.map((id) => CATEGORY_PRESETS.find((p) => p.id === id)).filter((p): p is CategoryPreset => Boolean(p))
  const rest = CATEGORY_PRESETS.filter((p) => !FEATURED_ORDER.includes(p.id))

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto pr-1">
      <div>
        <h2 className="text-4xl font-semibold tracking-tight text-balance">Znajdź opakowanie</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Powiedz mi, co pakujesz, a pokażę pasujące kierunki. Albo wybierz jedną z opcji poniżej.
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        {featured.map((preset) => {
          const meta = FEATURED[preset.id]
          const Icon = meta.icon
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => pick(preset)}
              className="flex items-center gap-3.5 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-foreground/20"
            >
              <span className="flex size-11 flex-none items-center justify-center rounded-lg bg-muted text-foreground">
                <Icon size={20} strokeWidth={1.5} />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-medium">{preset.label}</span>
                <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">{meta.blurb}</span>
              </span>
              <ChevronRight size={16} className="flex-none text-muted-foreground" />
            </button>
          )
        })}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs text-muted-foreground">albo wybierz inną kategorię</span>
        <div className="flex flex-wrap gap-1.5">
          {rest.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => pick(preset)}
              className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground transition-colors hover:border-foreground/20"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
