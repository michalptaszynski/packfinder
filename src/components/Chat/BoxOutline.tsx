import { cn } from '@/lib/utils'
import type { Dimensions } from '@/types'

export type BoxEdge = 'w' | 'h' | 'd'

interface BoxOutlineProps {
  dimensions: Dimensions
  /** Edge to pick out — the field the user is currently filling in. */
  highlight?: BoxEdge | null
  /** Rendered square size in px. */
  size?: number
  className?: string
}

const VIEW = 110
const EXTENT = 78

/**
 * Wireframe of the package in cabinet projection: the front face is drawn true
 * to the width/height ratio and depth runs back at half scale, so a 200x100x50
 * product reads as a wide, shallow box at a glance. Proportions come straight
 * from the numbers being typed; the drawing area stays a fixed square so the
 * card doesn't reflow on every keystroke.
 */
export function BoxOutline({ dimensions, highlight = null, size = 116, className }: BoxOutlineProps) {
  const { w, h, d } = dimensions
  const empty = !(w > 0) || !(h > 0) || !(d > 0)
  const [dw, dh, dd] = empty ? [1, 1.3, 0.8] : [w, h, d]

  const max = Math.max(dw, dh, dd)
  const fw = (dw / max) * EXTENT * 0.78
  const fh = (dh / max) * EXTENT * 0.78
  const off = (dd / max) * EXTENT * 0.42

  const x0 = (VIEW - (fw + off)) / 2
  const y0 = (VIEW - (fh + off)) / 2

  // Front face corners, then the back face shifted up and to the right.
  const fl = x0
  const fr = x0 + fw
  const ft = y0 + off
  const fb = y0 + off + fh
  const bl = x0 + off
  const br = x0 + off + fw
  const bt = y0
  const bb = y0 + fh

  const base = empty ? 'stroke-muted-foreground/35' : 'stroke-foreground/70'
  const hidden = empty ? 'stroke-muted-foreground/20' : 'stroke-foreground/25'
  const lit = 'stroke-primary'

  return (
    <div className={cn('flex flex-none items-center justify-center rounded-xl bg-fill-hover p-2', className)}>
      <svg
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        width={size}
        height={size}
        className="overflow-visible"
        fill="none"
        strokeLinecap="round"
        aria-hidden
      >
        <g strokeWidth={1.5}>
          {/* Hidden back-left corner, kept faint so the form still reads as a solid. */}
          <line x1={bl} y1={bt} x2={bl} y2={bb} className={hidden} strokeDasharray="3 3" />
          <line x1={bl} y1={bb} x2={br} y2={bb} className={hidden} strokeDasharray="3 3" />
          <line x1={fl} y1={fb} x2={bl} y2={bb} className={hidden} strokeDasharray="3 3" />

          {/* Back face, visible edges */}
          <line x1={bl} y1={bt} x2={br} y2={bt} className={base} />
          <line x1={br} y1={bt} x2={br} y2={bb} className={base} />

          {/* Connectors */}
          <line x1={fl} y1={ft} x2={bl} y2={bt} className={base} />
          <line x1={fr} y1={ft} x2={br} y2={bt} className={base} />
          <line
            x1={fr}
            y1={fb}
            x2={br}
            y2={bb}
            className={highlight === 'd' ? lit : base}
            strokeWidth={highlight === 'd' ? 2.75 : 1.5}
          />

          {/* Front face */}
          <line x1={fl} y1={ft} x2={fr} y2={ft} className={base} />
          <line x1={fr} y1={ft} x2={fr} y2={fb} className={base} />
          <line
            x1={fl}
            y1={ft}
            x2={fl}
            y2={fb}
            className={highlight === 'h' ? lit : base}
            strokeWidth={highlight === 'h' ? 2.75 : 1.5}
          />
          <line
            x1={fl}
            y1={fb}
            x2={fr}
            y2={fb}
            className={highlight === 'w' ? lit : base}
            strokeWidth={highlight === 'w' ? 2.75 : 1.5}
          />
        </g>
      </svg>
    </div>
  )
}
