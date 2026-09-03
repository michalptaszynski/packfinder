import { useLayoutEffect, useRef, useState } from 'react'

const MIN_TILE_WIDTH = 230
const DEFAULT_MAX_COLUMNS = 4

/**
 * Column count follows the grid's own box, not the window: the chat panel next
 * to it is resizable, so the same window can leave the grid anything from half
 * the screen to nearly all of it.
 */
export function useColumnCount(maxColumns: number = DEFAULT_MAX_COLUMNS) {
  const ref = useRef<HTMLDivElement>(null)
  const [columns, setColumns] = useState(maxColumns)

  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return
    const pick = (width: number) => Math.min(Math.max(Math.floor(width / MIN_TILE_WIDTH), 1), maxColumns)
    const observer = new ResizeObserver(([entry]) => setColumns(pick(entry.contentRect.width)))
    observer.observe(node)
    setColumns(pick(node.clientWidth))
    return () => observer.disconnect()
  }, [maxColumns])

  return { ref, columns }
}
