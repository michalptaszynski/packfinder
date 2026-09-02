import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { CATEGORY_PRESETS } from '@/data/categoryPresets'
import { useSessionDispatch } from '@/state/SessionProvider'
import { useScrollCarousel } from '@/lib/useScrollCarousel'
import { CarouselHeader } from './CarouselHeader'
import type { CategoryPreset } from '@/data/categoryPresets'

/**
 * Alternate empty state: headline and composer centred on the panel, with a
 * single scrolling strip of starting points underneath — the composer-first
 * shape, as opposed to the default hero where the categories carry the page
 * and the composer sits at the bottom.
 *
 * Split into two exports because the two halves live on opposite sides of the
 * composer in Chat.tsx, and the composer must stay one element across every
 * layout change or the textarea remounts mid-typing.
 */

export function AltHeroHeadline() {
  return (
    <div className="pointer-events-none flex flex-col items-center gap-2 pb-2 text-center">
      <h2 className="text-4xl font-light tracking-tight text-balance">What are you packing?</h2>
      <p className="text-sm text-muted-foreground">Describe it, or start from one of these.</p>
    </div>
  )
}

/** Featured first, then the rest — the strip holds the whole catalogue. */
const STRIP_ORDER = ['clothing', 'cosmetics', 'bottles', 'food', 'gift_set', 'jewelry', 'electronics', 'footwear', 'toys', 'stationery', 'health', 'accessories']

export function AltHeroStrip() {
  const dispatch = useSessionDispatch()
  const { ref, canScrollLeft, canScrollRight, scrollBy } = useScrollCarousel()

  const presets = STRIP_ORDER.map((id) => CATEGORY_PRESETS.find((p) => p.id === id)).filter(
    (preset): preset is CategoryPreset => Boolean(preset),
  )

  function pick(preset: CategoryPreset) {
    dispatch({ type: 'ADD_MESSAGE', message: { id: crypto.randomUUID(), role: 'user', text: preset.label, image: preset.photo } })
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

  const other = CATEGORY_PRESETS.find((preset) => preset.id === 'other')

  return (
    <div className="pointer-events-auto flex flex-col gap-2">
      <CarouselHeader
        title=""
        canScrollLeft={canScrollLeft}
        canScrollRight={canScrollRight}
        onScrollLeft={() => scrollBy(-1)}
        onScrollRight={() => scrollBy(1)}
      />

      <div className="relative">
        {/* Edge fades, each shown only while there is more strip that way, so
            a tile scrolled halfway out reads as continuing rather than cut. */}
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-card to-transparent transition-opacity duration-200',
            canScrollLeft ? 'opacity-100' : 'opacity-0',
          )}
        />
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-card to-transparent transition-opacity duration-200',
            canScrollRight ? 'opacity-100' : 'opacity-0',
          )}
        />

        <div ref={ref} className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {other && (
            <>
              <button type="button" onClick={() => pick(other)} className="group flex w-24 flex-none flex-col gap-2 text-left">
                <span className="flex h-32 w-full items-center justify-center rounded-xl bg-fill-hover text-muted-foreground transition-colors group-hover:bg-muted">
                  <Sparkles size={20} strokeWidth={1.5} />
                </span>
                <span className="truncate text-center text-xs text-muted-foreground">Not sure yet</span>
              </button>
              <span className="my-1 w-px flex-none bg-border" />
            </>
          )}

          {presets.map((preset) => (
            <button key={preset.id} type="button" onClick={() => pick(preset)} className="group flex w-24 flex-none flex-col gap-2 text-left">
              {preset.photo ? (
                <span className="h-32 w-full overflow-hidden rounded-xl">
                  <img
                    src={preset.photo}
                    alt=""
                    className="size-full object-cover transition-transform duration-300 ease-out group-hover:scale-110"
                  />
                </span>
              ) : (
                <span className="h-32 w-full rounded-xl bg-muted transition-colors group-hover:bg-fill-hover" />
              )}
              <span className="truncate text-center text-xs text-muted-foreground">{preset.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
