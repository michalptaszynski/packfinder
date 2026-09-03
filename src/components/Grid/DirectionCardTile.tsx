import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { formatMoney } from '@/lib/format'
import { DirectionPhoto } from '@/components/Photo/DirectionPhoto'
import { photoAspect } from '@/lib/tileHeights'
import type { BadgeKind, DirectionCard } from '@/types'

const BADGE_CLASS: Record<BadgeKind, string> = {
  in_budget: 'bg-muted text-muted-foreground border-transparent',
  moq_gate: 'bg-muted text-muted-foreground border-transparent',
  mocked_price: 'bg-muted text-muted-foreground border-transparent',
  over_budget: 'bg-over-bg text-over-fg border-transparent',
  upsell: 'bg-state-bg text-state-fg border-transparent',
}

interface DirectionCardTileProps {
  card: DirectionCard
  highlighted: boolean
  chosen: boolean
  /** Staggers the entrance so columns arrive one after another. */
  delayMs: number
  onOpen: () => void
}

export function DirectionCardTile({ card, highlighted, chosen, delayMs, onOpen }: DirectionCardTileProps) {
  const { direction, archetype, price, badges, selectable } = card

  return (
    <button
      type="button"
      onClick={onOpen}
      // fill-mode-both holds the tile invisible until its column's turn comes,
      // instead of showing it and then animating.
      style={{ animationDelay: `${delayMs}ms` }}
      className={cn(
        'group/tile flex w-full flex-col gap-2 text-left',
        'animate-in fade-in slide-in-from-bottom-6 fill-mode-both duration-500 ease-out',
        !selectable && 'opacity-70',
      )}
    >
      {/* With the frame gone, selection reads as a ring around the photo
          rather than around the whole tile. */}
      <DirectionPhoto
        archetype={archetype}
        aspect={photoAspect(direction.id)}
        className={cn(
          'ring-offset-2 ring-offset-background transition-shadow',
          highlighted && 'ring-2 ring-state-fg/50',
          chosen && 'ring-2 ring-state-fg',
        )}
      />

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium leading-snug">{direction.label}</span>
        <span className="flex items-baseline justify-between text-xs text-muted-foreground">
          <span>{archetype.label}</span>
          {price.valid && <span className="tabular-nums font-medium text-foreground">{formatMoney(price.unit ?? 0)}/pc</span>}
        </span>
      </div>

      {badges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {badges.map((badge) => (
            <Badge key={badge.kind} variant="outline" className={cn('rounded-full px-2 py-0.5 text-[10px] font-normal', BADGE_CLASS[badge.kind])}>
              {badge.label}
            </Badge>
          ))}
        </div>
      )}
    </button>
  )
}
