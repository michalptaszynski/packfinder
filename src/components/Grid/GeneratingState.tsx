import { useEffect, useRef, useState } from 'react'
import { asset } from '@/lib/asset'
import { LogoLoader } from './LogoLoader'

/**
 * Moodboard shown while the grid is built: real photography from Packhelp's
 * own packaging-ideas gallery, downloaded into public/ rather than hotlinked —
 * the brief is explicit that "hotlinked images rot within days"
 * (brief-doradca-opakowan.md section 9).
 *
 * The composition is fixed: six tiles in fixed slots. Movement is one step at
 * a time — a column's track slides up by exactly one slot and stops, then the
 * spent tile is dropped and a fresh one appended while the transform is reset
 * to zero with transitions off. Since the tile leaving and the tile arriving
 * belong to the same track, they move together by construction and no slot is
 * ever empty, not even for a frame.
 */

const TILE_W = 96
const TILE_H = 142
const GAP = 12
const STEP = TILE_H + GAP
const DURATION = 620
const PAUSE = 1000
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'

/** visible = tiles on screen; the track always holds one more, waiting below. */
const COLUMNS = [
  { visible: 1, top: 96 },
  { visible: 2, top: 0 },
  { visible: 2, top: 48 },
  { visible: 1, top: 120 },
]

/** Rotation that never moves two neighbouring columns back to back. */
const ORDER = [1, 3, 0, 2]

const PHOTOS = [
  'inspiration-kuyichi',
  'packhelp-27-08-2021-12715',
  'inspiration-psi-bufet',
  'packhelp-28821-b-2',
  'inspiration-hemp-juice',
  'packhelp-packshot-10270',
  'inspiration-kaya',
  'packhelp-02-03-11-2022-24734-2',
  'inspiration-fluus',
  'packhelp-26-28-05-2021-7449',
  'inspiration-oase',
  'christmas-happy-socks',
  'inspiration-xlash',
  'packhelp-09-2021-0306',
  'packhelp-28445-2',
  'packhelp-26-28-05-2021-7152',
].map((name) => asset(`/photos/inspiration/${name}.jpg`))

const columnHeight = (visible: number) => visible * TILE_H + (visible - 1) * GAP
const CLUSTER_H = Math.max(...COLUMNS.map((column) => column.top + columnHeight(column.visible)))

interface Track {
  photos: string[]
  shifting: boolean
}

export function GeneratingState({ logo = false }: { logo?: boolean }) {
  const cursor = useRef(0)
  const [tracks, setTracks] = useState<Track[]>(() =>
    COLUMNS.map((column) => ({
      photos: Array.from({ length: column.visible + 1 }, () => PHOTOS[cursor.current++ % PHOTOS.length]),
      shifting: false,
    })),
  )

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const timers: number[] = []
    const busy = COLUMNS.map(() => false)
    let turn = 0

    function step() {
      const column = ORDER[turn++ % ORDER.length]

      if (!busy[column]) {
        busy[column] = true
        setTracks((current) => current.map((track, i) => (i === column ? { ...track, shifting: true } : track)))

        timers.push(
          window.setTimeout(() => {
            // Transitions are off in the resting state, so dropping the spent
            // tile and snapping the transform back to zero is invisible: the
            // geometry after the swap is identical to before the step.
            setTracks((current) =>
              current.map((track, i) =>
                i === column
                  ? { photos: [...track.photos.slice(1), PHOTOS[cursor.current++ % PHOTOS.length]], shifting: false }
                  : track,
              ),
            )
            busy[column] = false
          }, DURATION + 30),
        )
      }

      timers.push(window.setTimeout(step, DURATION + 30 + PAUSE))
    }

    timers.push(window.setTimeout(step, PAUSE))
    return () => timers.forEach(window.clearTimeout)
  }, [])

  if (logo) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
        <LogoLoader />
        <p className="max-w-[240px] text-center text-xs leading-relaxed text-muted-foreground">
          Matching directions to what you're packing and your budget
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-10 p-6">
      <div className="relative" style={{ width: COLUMNS.length * (TILE_W + GAP) - GAP, height: CLUSTER_H }}>
        {COLUMNS.map((column, columnIndex) => (
          <div
            key={columnIndex}
            className="absolute overflow-hidden"
            style={{
              left: columnIndex * (TILE_W + GAP),
              top: column.top,
              width: TILE_W,
              height: columnHeight(column.visible),
            }}
          >
            <div
              className="absolute top-0 left-0"
              style={{
                willChange: 'transform',
                transform: tracks[columnIndex].shifting ? `translateY(-${STEP}px)` : 'translateY(0)',
                transition: tracks[columnIndex].shifting ? `transform ${DURATION}ms ${EASE}` : 'none',
              }}
            >
              {tracks[columnIndex].photos.map((photo, i) => (
                <img
                  key={`${photo}-${i}`}
                  src={photo}
                  alt=""
                  className="block rounded-xl bg-fill-hover object-cover"
                  style={{ width: TILE_W, height: TILE_H, marginBottom: GAP }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="max-w-[240px] text-center text-xs leading-relaxed text-muted-foreground">
        Matching directions to what you're packing and your budget
      </p>
    </div>
  )
}
