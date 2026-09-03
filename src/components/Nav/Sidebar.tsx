import { useEffect, useRef, useState } from 'react'
import { Images, type LucideIcon, Package, PanelLeft, Sparkles, X } from 'lucide-react'
import { useSessionDispatch, useSessionState } from '@/state/SessionProvider'
import { archetypeCatalog } from '@/engine/pricing'
import { asset } from '@/lib/asset'
import { cn } from '@/lib/utils'

type Panel = 'products'

const MARK =
  'M3.96499 21.9554H0V2.09146C0 0.935741 0.887494 0 1.9825 0H18.8225C19.9175 0 20.805 0.935741 20.805 2.09146V19.8607C20.805 21.0164 19.9175 21.9522 18.8225 21.9522H6.92756V17.7692H16.8369V4.18293H3.96499V21.9522V21.9554Z'

/**
 * The Packhelp symbol at the wordmark's own height. On hover the loader's
 * stroke runs through it — the track dims so the stroke has something to
 * contrast against, since both are the same colour here.
 */
function PackhelpMark({ height = 16 }: { height?: number }) {
  return (
    <svg
      width={(height / 22) * 21}
      height={height}
      viewBox="0 0 21 22"
      fill="none"
      aria-hidden
      className="text-foreground"
    >
      <clipPath id="railMark">
        <path d={MARK} />
      </clipPath>
      <path d={MARK} className="fill-current transition-colors group-hover/logo:fill-current/25" />
      <g clipPath="url(#railMark)">
        <path className="lg-stream-rail" pathLength={100} d="M1.9825 22.6 V2.09146 H18.8225 V19.8607 H6.92756" />
      </g>
    </svg>
  )
}

interface SidebarProps {
  onReset: () => void
  /** The inspirations board takes over the workspace, so the app owns it. */
  inspirationsOpen: boolean
  onInspirationsToggle: () => void
  /** Collapsed state lives in the app: opening the results collapses the rail. */
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
}

/**
 * Left rail: four direct links, no groups. Each one opens something real —
 * the inspiration photos we ship, the archetype catalogue the engine prices
 * against, or this session's own answers — rather than standing in for
 * navigation that doesn't exist.
 */
export function Sidebar({ onReset, inspirationsOpen, onInspirationsToggle, collapsed, onCollapsedChange }: SidebarProps) {
  const state = useSessionState()
  const dispatch = useSessionDispatch()
  const [panel, setPanel] = useState<Panel | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!panel) return
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setPanel(null)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setPanel(null)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [panel])

  function toggle(next: Panel) {
    setPanel((current) => (current === next ? null : next))
  }

  return (
    <div ref={rootRef} className="relative flex-none">
      <nav
        className={cn(
          'flex h-full flex-col gap-1 overflow-hidden p-2 transition-[width] duration-300 ease-out',
          collapsed ? 'w-16' : 'w-60',
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            title={collapsed ? 'Expand menu' : 'Collapse menu'}
            onClick={() => {
              onCollapsedChange(!collapsed)
              setPanel(null)
            }}
            className={cn(
              'group/logo flex h-10 items-center rounded-lg transition-colors hover:bg-fill-hover',
              collapsed ? 'w-full justify-center' : 'px-2',
            )}
          >
            {collapsed ? (
              <PackhelpMark />
            ) : (
              // Masked rather than <img>: the wordmark ships in brand blue, and
              // a mask lets it take the rail's own text colour in both themes.
              <span
                role="img"
                aria-label="Packhelp"
                // Nudged down 2px: the wordmark's letters sit in the top
                // 21.8 of its 28-unit box (the rest is the "p" descender),
                // so a box-centred logo reads ~2px high next to the icon.
                // Off the 8pt scale on purpose: this is the wordmark's own
                // aspect ratio at 16px tall, not a spacing decision.
                className="block h-4 w-[83px] translate-y-[2px] bg-foreground"
                style={{
                  maskImage: `url(${asset('/brand/packhelp-logo.svg')})`,
                  WebkitMaskImage: `url(${asset('/brand/packhelp-logo.svg')})`,
                  maskSize: 'contain',
                  WebkitMaskSize: 'contain',
                  maskRepeat: 'no-repeat',
                  WebkitMaskRepeat: 'no-repeat',
                }}
              />
            )}
          </button>

          {!collapsed && (
            <button
              type="button"
              title="Collapse menu"
              onClick={() => {
                onCollapsedChange(true)
                setPanel(null)
              }}
              className="flex size-8 flex-none items-center justify-center rounded-lg text-foreground transition-colors hover:bg-fill-hover"
            >
              <PanelLeft size={16} strokeWidth={1.75} />
            </button>
          )}
        </div>

        <Group label="Discover" collapsed={collapsed}>
          <Link icon={Sparkles} label="New" collapsed={collapsed} onClick={() => { setPanel(null); onReset() }} />
          <Link
            icon={Images}
            label="Inspirations"
            collapsed={collapsed}
            active={inspirationsOpen}
            onClick={() => {
              setPanel(null)
              onInspirationsToggle()
            }}
          />
          <Link icon={Package} label="Products" collapsed={collapsed} active={panel === 'products'} onClick={() => toggle('products')} />
        </Group>

        <Group label="Recent projects" collapsed={collapsed}>
          {state.projects.length === 0 ? (
            !collapsed && (
              <p className="px-3 py-2 text-xs leading-snug text-muted-foreground">
                Briefs you leave with “New” are kept here.
              </p>
            )
          ) : (
            state.projects.map((project, index) => (
              <Link
                key={project.id}
                label={collapsed ? `#${index + 1}` : project.label}
                collapsed={collapsed}
                onClick={() => {
                  setPanel(null)
                  dispatch({ type: 'RESTORE_PROJECT', id: project.id })
                }}
              />
            ))
          )}
        </Group>

        {!collapsed && <SamplePackCard />}
      </nav>

      {panel && (
        <div className="absolute top-0 left-[calc(100%+8px)] z-40 flex h-full w-[320px] flex-col rounded-xl border border-border bg-card shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-sm font-medium capitalize">{panel}</span>
            <button type="button" onClick={() => setPanel(null)} className="text-muted-foreground hover:text-foreground">
              <X size={15} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {panel === 'products' && (
              <div className="flex flex-col gap-0.5">
                {archetypeCatalog.map((archetype) => {
                  const card = state.cards.find((c) => c.archetype.id === archetype.id)
                  return (
                    <button
                      key={archetype.id}
                      type="button"
                      disabled={!card}
                      onClick={() => card && dispatch({ type: 'OPEN_DIRECTION', id: card.direction.id })}
                      className={cn(
                        'flex flex-col gap-0.5 rounded-lg px-2 py-2 text-left',
                        card ? 'hover:bg-fill-hover' : 'cursor-default opacity-40',
                      )}
                    >
                      <span className="text-sm">{archetype.label}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        From {archetype.moq} pcs · {archetype.leadTimeDays} days
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  )
}

interface LinkProps {
  /** Optional: the recent projects are a list of names, not a set of actions. */
  icon?: LucideIcon
  label: string
  collapsed: boolean
  active?: boolean
  onClick: () => void
}

/**
 * Sits at the foot of the rail. Material is the one thing this app cannot
 * answer from a screen — kraft, white and coated differ by feel as much as by
 * look — so the offer is to put the three in someone's hands.
 */
function SamplePackCard() {
  return (
    <a
      href="https://packhelp.com/samples/"
      target="_blank"
      rel="noreferrer"
      // mt-auto pins it to the bottom however long the projects list runs.
      className="mt-auto flex flex-col gap-2 rounded-[16px] bg-gradient-to-br from-foreground/15 via-foreground/8 to-fill-hover p-4"
    >
      <span className="text-sm font-medium text-foreground">Not sure what to pick?</span>
      <span className="text-xs leading-snug text-muted-foreground">
        Kraft, white and coated read very differently in the hand. Order a sample pack and decide by touch.
      </span>
      <span className="mt-2 flex h-8 items-center justify-center rounded-full bg-foreground/10 text-xs font-medium text-foreground transition-colors hover:bg-foreground/20">
        Order a sample pack
      </span>
    </a>
  )
}

function Group({ label, collapsed, children }: { label: string; collapsed: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 pt-3">
      {/* Collapsed, the rail is icons only — a rule in place of the heading
          would read as a divider that isn't dividing anything. */}
      {!collapsed && <p className="px-3 pb-1 text-xs text-muted-foreground">{label}</p>}
      {children}
    </div>
  )
}

function Link({ icon: Icon, label, collapsed, active, onClick }: LinkProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={cn(
        'flex h-8 items-center gap-3 rounded-lg text-left text-[13px] transition-colors',
        collapsed ? 'justify-center' : 'px-3',
        active ? 'bg-fill-hover text-foreground' : 'text-foreground hover:bg-fill-hover',
      )}
    >
      {Icon && <Icon size={16} strokeWidth={1.75} className="flex-none" />}
      {/* Without an icon the label is the only thing there is, collapsed or not. */}
      {(!collapsed || !Icon) && <span className="truncate">{label}</span>}
    </button>
  )
}
