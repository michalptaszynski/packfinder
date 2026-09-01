import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CarouselHeaderProps {
  title: string
  canScrollLeft: boolean
  canScrollRight: boolean
  onScrollLeft: () => void
  onScrollRight: () => void
}

export function CarouselHeader({ title, canScrollLeft, canScrollRight, onScrollLeft, onScrollRight }: CarouselHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={!canScrollLeft}
          onClick={onScrollLeft}
          className={cn(
            'flex size-7 items-center justify-center rounded-full border border-border text-muted-foreground',
            canScrollLeft ? 'hover:bg-muted' : 'opacity-30',
          )}
        >
          <ChevronLeft size={14} />
        </button>
        <button
          type="button"
          disabled={!canScrollRight}
          onClick={onScrollRight}
          className={cn(
            'flex size-7 items-center justify-center rounded-full border border-border text-muted-foreground',
            canScrollRight ? 'hover:bg-muted' : 'opacity-30',
          )}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
