import { CATEGORY_PRESETS } from '@/data/categoryPresets'
import { useSessionDispatch } from '@/state/SessionProvider'
import { useScrollCarousel } from '@/lib/useScrollCarousel'
import { CarouselHeader } from './CarouselHeader'
import type { CategoryPreset } from '@/data/categoryPresets'

const FEATURED_ORDER = ['clothing', 'cosmetics', 'gift_set', 'bottles', 'food']

/**
 * The empty-state screen shown before the user has answered anything.
 * Two horizontally-scrolling sections, mirroring a "try a style" /
 * "discover something new" template picker: main categories as bigger
 * portrait cards, everything else as a compact two-column list. Categories
 * without a `photo` fall back to a plain placeholder block.
 */
export function ChatHero() {
  const dispatch = useSessionDispatch()
  const { ref: mainRef, canScrollLeft: mainCanScrollLeft, canScrollRight: mainCanScrollRight, scrollBy: mainScrollBy } = useScrollCarousel()

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

  const main = FEATURED_ORDER.map((id) => CATEGORY_PRESETS.find((p) => p.id === id)).filter((p): p is CategoryPreset => Boolean(p))
  const rest = CATEGORY_PRESETS.filter((p) => !FEATURED_ORDER.includes(p.id))

  return (
    <div className="flex flex-col gap-7">
      <div>
        <h2 className="text-4xl font-light tracking-tight text-balance">Find your packaging</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Tell me what you're packing and I'll show you matching directions. Or pick one of the options below.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <CarouselHeader
          title="Main categories"
          canScrollLeft={mainCanScrollLeft}
          canScrollRight={mainCanScrollRight}
          onScrollLeft={() => mainScrollBy(-1)}
          onScrollRight={() => mainScrollBy(1)}
        />
        <div ref={mainRef} className="flex gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {main.map((preset) => (
            <button key={preset.id} type="button" onClick={() => pick(preset)} className="group flex min-w-0 flex-1 flex-col gap-2 text-left">
              {preset.photo ? (
                <div className="aspect-[3/4] w-full overflow-hidden rounded-xl">
                  <img
                    src={preset.photo}
                    alt=""
                    className="size-full object-cover transition-transform duration-300 ease-out group-hover:scale-110"
                  />
                </div>
              ) : (
                <div className="aspect-[3/4] w-full rounded-xl bg-muted transition-colors hover:bg-muted/70" />
              )}
              <span className="text-xs text-muted-foreground">{preset.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">More categories</h3>
        {/* Two fixed columns rather than a scroller: the eight remaining
            categories fit on one screen, so there is nothing to page through. */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {rest.map((preset) => (
            <button key={preset.id} type="button" onClick={() => pick(preset)} className="group flex w-full min-w-0 items-center gap-3 text-left">
              {preset.photo ? (
                <span className="size-16 flex-none overflow-hidden rounded-xl">
                  <img
                    src={preset.photo}
                    alt=""
                    className="size-full object-cover transition-transform duration-300 ease-out group-hover:scale-110"
                  />
                </span>
              ) : (
                <span className="size-16 flex-none rounded-xl bg-muted" />
              )}
              <span className="truncate text-sm text-muted-foreground">{preset.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
