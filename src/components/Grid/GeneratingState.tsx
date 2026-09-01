import { Loader2, Package } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * The brief itself explicitly rules out hotlinking real Pinterest images
 * ("hotlinkowanie rozjeżdża się po kilku dniach" — brief-doradca-opakowan.md
 * section 9) — so this fans out styled placeholder cards instead of real
 * photos. Same spirit as the "search Pinterest for packaging ideas" ask
 * (a loose moodboard collage while the grid is being put together) without
 * the dead-link risk the brief was written to avoid.
 */
const COLLAGE_CARDS = [
  { rotate: -8, x: -92, y: 14, gradient: 'from-amber-100 to-amber-200/70', delay: '0ms' },
  { rotate: 6, x: 88, y: -8, gradient: 'from-emerald-100 to-emerald-200/70', delay: '90ms' },
  { rotate: -3, x: -30, y: -46, gradient: 'from-sky-100 to-sky-200/70', delay: '180ms' },
  { rotate: 9, x: 34, y: 40, gradient: 'from-rose-100 to-rose-200/70', delay: '270ms' },
  { rotate: 0, x: 0, y: -2, gradient: 'from-stone-100 to-stone-200/80', delay: '0ms', center: true },
]

export function GeneratingState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
      <span className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm text-muted-foreground shadow-sm">
        <Loader2 size={15} className="animate-spin" />
        Szukam inspiracji do Twojego opakowania...
      </span>

      <div className="relative h-56 w-64">
        {COLLAGE_CARDS.map((card, i) => (
          <div
            key={i}
            className={cn(
              'absolute left-1/2 top-1/2 flex h-32 w-24 animate-in fade-in zoom-in-95 items-center justify-center rounded-xl border border-border/60 bg-gradient-to-br shadow-md duration-700',
              card.gradient,
              card.center && 'z-10',
            )}
            style={{
              transform: `translate(-50%, -50%) translate(${card.x}px, ${card.y}px) rotate(${card.rotate}deg)`,
              animationDelay: card.delay,
              animationFillMode: 'backwards',
            }}
          >
            <Package size={22} strokeWidth={1.25} className="text-foreground/30" />
          </div>
        ))}
      </div>

      <p className="max-w-[220px] text-center text-xs leading-relaxed text-muted-foreground">
        Dobieram kierunki pasujące do tego, co pakujesz, i Twojego budżetu.
      </p>
    </div>
  )
}
