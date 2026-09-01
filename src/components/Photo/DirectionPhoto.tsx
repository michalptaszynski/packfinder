import { Package, Package2, ShoppingBag } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Archetype } from '@/types'

interface DirectionPhotoProps {
  archetype: Archetype
  className?: string
  heightClassName?: string
}

const ARCHETYPE_ICON: Record<string, typeof Package> = {
  paper_bag: ShoppingBag,
  tube: Package2,
}

/**
 * The brief calls for real product photography (own Packhelp photos for the
 * four hero archetypes, stock elsewhere) — none of that exists yet, so this
 * always renders the spec's own documented fallback: a neutral tile with an
 * archetype silhouette and a "podgląd schematyczny" badge. Swap in real
 * <img src={archetype.assets.photo}> once photography is available.
 */
export function DirectionPhoto({ archetype, className, heightClassName = 'h-40' }: DirectionPhotoProps) {
  const Icon = ARCHETYPE_ICON[archetype.id] ?? Package
  return (
    <div className={cn('relative flex items-center justify-center rounded-lg bg-muted', heightClassName, className)}>
      <Icon size={40} strokeWidth={1.25} className="text-muted-foreground" />
      <span className="absolute bottom-2 left-2 rounded-full border border-border bg-card px-2 py-0.5 text-[10px] text-muted-foreground">
        podgląd schematyczny
      </span>
    </div>
  )
}
