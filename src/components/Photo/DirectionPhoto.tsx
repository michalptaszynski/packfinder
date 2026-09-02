import { cn } from '@/lib/utils'
import type { Archetype } from '@/types'

interface DirectionPhotoProps {
  archetype: Archetype
  className?: string
  heightClassName?: string
  /** Height/width ratio; overrides heightClassName for staggered grid tiles. */
  aspect?: number
}

/**
 * The brief calls for real product photography (own Packhelp photos for the
 * four hero archetypes, stock elsewhere) — none of that exists yet, so this
 * always renders the spec's own documented fallback: a neutral tile with a
 * "schematic preview" badge. Swap in real <img src={archetype.assets.photo}>
 * once photography is available.
 */
export function DirectionPhoto({ archetype: _archetype, className, heightClassName = 'h-40', aspect }: DirectionPhotoProps) {
  return (
    <div
      className={cn('relative rounded-2xl bg-muted', aspect === undefined && heightClassName, className)}
      style={aspect === undefined ? undefined : { aspectRatio: `1 / ${aspect}` }}
    >
      <span className="absolute bottom-2 left-2 rounded-full border border-border bg-card px-2 py-0.5 text-[10px] text-muted-foreground">
        schematic preview
      </span>
    </div>
  )
}
