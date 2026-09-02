import { useSessionDispatch, useSessionState } from '@/state/SessionProvider'
import { buildFlow } from '@/engine/flow'
import { DirectionPhoto } from '@/components/Photo/DirectionPhoto'
import { cn } from '@/lib/utils'
import type { FlowStage } from '@/engine/flow'

const NODE_W = 232
const CONNECTOR_W = 64
/** Every other node drops by this much, so the connectors have a curve to draw. */
const STAGGER_Y = 36

/**
 * The same results, read as a funnel: each answer is a node, and the line
 * between two nodes is what that answer did to the catalogue. Every stage is a
 * real re-run of the grid engine, so a node that says "nothing dropped out" is
 * reporting the truth rather than decoration.
 */
export function FlowView() {
  const state = useSessionState()
  const dispatch = useSessionDispatch()
  const stages = buildFlow(state.slots)

  return (
    <div className="flex-1 overflow-auto p-6 pb-24">
      <div className="flex min-w-max items-start pt-2">
        {stages.map((stage, index) => (
          <div key={stage.id} className="flex items-start">
            {index > 0 && <Connector fromLower={index % 2 === 1} />}
            <div style={{ width: NODE_W, marginTop: index % 2 === 1 ? STAGGER_Y : 0 }}>
              <StageNode
                stage={stage}
                isLast={index === stages.length - 1}
                onOpen={(id) => dispatch({ type: 'OPEN_DIRECTION', id })}
                highlightedId={state.highlightedDirectionId}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Bezier between two node mid-points, one of them offset by the stagger. */
function Connector({ fromLower }: { fromLower: boolean }) {
  const height = STAGGER_Y * 2
  const y1 = fromLower ? height / 2 - STAGGER_Y / 2 : height / 2 + STAGGER_Y / 2
  const y2 = fromLower ? height / 2 + STAGGER_Y / 2 : height / 2 - STAGGER_Y / 2

  return (
    <svg
      width={CONNECTOR_W}
      height={height}
      viewBox={`0 0 ${CONNECTOR_W} ${height}`}
      className="mt-24 flex-none overflow-visible"
      fill="none"
      aria-hidden
    >
      <path
        d={`M0 ${y1} C ${CONNECTOR_W * 0.5} ${y1}, ${CONNECTOR_W * 0.5} ${y2}, ${CONNECTOR_W} ${y2}`}
        className="stroke-border"
        strokeWidth={1.5}
      />
      <circle cx={CONNECTOR_W} cy={y2} r={3} className="fill-primary" />
    </svg>
  )
}

interface StageNodeProps {
  stage: FlowStage
  isLast: boolean
  highlightedId: string | null
  onOpen: (id: string) => void
}

function StageNode({ stage, isLast, highlightedId, onOpen }: StageNodeProps) {
  // One representative per stage — the engine's own top-ranked direction at
  // that point, so the picture changes only when the narrowing changes it.
  const lead = stage.cards[0]

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-2xl border bg-card p-3',
        isLast ? 'border-primary' : 'border-border',
      )}
    >
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-muted-foreground">{stage.question}</span>
        <span className="text-sm font-medium">{stage.answer}</span>
      </div>

      {lead && (
        <button type="button" onClick={() => onOpen(lead.direction.id)} className="flex flex-col gap-1.5 text-left">
          <DirectionPhoto
            archetype={lead.archetype}
            aspect={1.15}
            className={cn(
              'transition-shadow',
              // Only the final node echoes the panel's highlight; the same
              // direction leads several stages, and ringing each one made the
              // whole chain look selected.
              isLast && highlightedId === lead.direction.id && 'ring-2 ring-state-fg/50 ring-offset-2 ring-offset-background',
            )}
          />
          <span className="truncate text-xs text-muted-foreground">
            {lead.direction.label} — {lead.archetype.label}
          </span>
        </button>
      )}

      <div className="flex flex-col gap-0.5 text-xs">
        <span className="font-medium tabular-nums">
          {stage.cards.length} {stage.cards.length === 1 ? 'direction' : 'directions'}
        </span>
        <span className="text-muted-foreground tabular-nums">
          {stage.removed > 0 ? `${stage.removed} dropped out` : 'nothing dropped out'}
          {stage.inBudget > 0 && ` · ${stage.inBudget} in budget`}
        </span>
      </div>
    </div>
  )
}
