import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { formatMoney } from '@/lib/format'
import { DirectionPhoto } from '@/components/Photo/DirectionPhoto'
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
  onOpen: () => void
}

export function DirectionCardTile({ card, highlighted, chosen, onOpen }: DirectionCardTileProps) {
  const { direction, archetype, price, badges, selectable } = card

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'flex w-full flex-col gap-2.5 rounded-xl border bg-card p-3 text-left transition-colors',
        'hover:border-foreground/20',
        highlighted && 'border-state-fg',
        chosen && 'border-state-fg bg-state-bg',
        !selectable && 'opacity-70',
      )}
    >
      <DirectionPhoto archetype={archetype} />

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium leading-snug">{direction.label}</span>
        <span className="flex items-baseline justify-between text-xs text-muted-foreground">
          <span>{archetype.label}</span>
          {price.valid && <span className="tabular-nums font-medium text-foreground">{formatMoney(price.unit ?? 0)}/pc</span>}
        </span>
      </div>

      {badges.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
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
