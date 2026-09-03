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
/**
 * Openers offered under the composer. Picking one drops it into the field with
 * the caret at the end rather than sending it — each is a half-sentence the
 * user finishes, which is also what makes them parseable.
 */
const OPENERS = [
  'I need an aesthetic package for shipping',
  'I want a beautiful package for',
  'I need an economic mailer box for',
]

export function AltHeroPrompts({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="pointer-events-auto flex flex-wrap justify-center gap-2">
      {OPENERS.map((opener) => (
        <button
          key={opener}
          type="button"
          onClick={() => onPick(`${opener} `)}
          className="rounded-full border border-border bg-card px-3 py-2 text-xs text-muted-foreground transition-colors hover:bg-fill-hover hover:text-foreground"
        >
          {opener}…
        </button>
      ))}
    </div>
  )
}

const STRIP_ORDER = ['clothing', 'cosmetics', 'bottles', 'food', 'gift_set', 'jewelry', 'electronics', 'footwear', 'toys', 'stationery', 'health', 'accessories']

export function AltHeroStrip({ showOther = true, wide = false }: { showOther?: boolean; wide?: boolean }) {
  // The default hero has the full panel to play with, so its tiles run at
  // twice the width of the ones packed under the alternate hero's composer.
  const tile = wide ? 'w-48' : 'w-24'
  const thumb = wide ? 'h-40' : 'h-32'
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

  // The default hero already opens on a board of starting points, so it takes
  // the strip without the "Not sure yet" tile — there is nothing to fall back
  // from at the top of the page.
  const other = showOther ? CATEGORY_PRESETS.find((preset) => preset.id === 'other') : undefined

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
            'pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-background to-transparent transition-opacity duration-200',
            canScrollLeft ? 'opacity-100' : 'opacity-0',
          )}
        />
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-background to-transparent transition-opacity duration-200',
            canScrollRight ? 'opacity-100' : 'opacity-0',
          )}
        />

        <div ref={ref} className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {other && (
            <>
              <button type="button" onClick={() => pick(other)} className={cn('group flex flex-none flex-col gap-2 text-left', tile)}>
                <span className={cn('flex w-full items-center justify-center rounded-xl bg-fill-hover text-muted-foreground transition-colors group-hover:bg-muted', thumb)}>
                  <Sparkles size={20} strokeWidth={1.5} />
                </span>
                <span className="truncate text-center text-xs text-muted-foreground">Not sure yet</span>
              </button>
              <span className="my-1 w-px flex-none bg-border" />
            </>
          )}

          {presets.map((preset) => (
            <button key={preset.id} type="button" onClick={() => pick(preset)} className={cn('group flex flex-none flex-col gap-2 text-left', tile)}>
              {preset.photo ? (
                <span className={cn('w-full overflow-hidden rounded-xl', thumb)}>
                  <img
                    src={preset.photo}
                    alt=""
                    className="size-full object-cover transition-transform duration-300 ease-out group-hover:scale-110"
                  />
                </span>
              ) : (
                <span className={cn('w-full rounded-xl bg-muted transition-colors group-hover:bg-fill-hover', thumb)} />
              )}
              <span className="truncate text-center text-xs text-muted-foreground">{preset.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
