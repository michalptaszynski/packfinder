import { useLayoutEffect, useRef, useState } from 'react'

const MIN_TILE_WIDTH = 230
const MAX_COLUMNS = 4

/**
 * Column count follows the grid's own box, not the window: the chat panel next
 * to it is resizable, so the same window can leave the grid anything from half
 * the screen to nearly all of it.
 */
export function useColumnCount() {
  const ref = useRef<HTMLDivElement>(null)
  const [columns, setColumns] = useState(MAX_COLUMNS)

  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new ResizeObserver(([entry]) => setColumns(pick(entry.contentRect.width)))
    observer.observe(node)
    setColumns(pick(node.clientWidth))
    return () => observer.disconnect()
  }, [])

  return { ref, columns }
}

function pick(width: number): number {
  return Math.min(Math.max(Math.floor(width / MIN_TILE_WIDTH), 1), MAX_COLUMNS)
}
