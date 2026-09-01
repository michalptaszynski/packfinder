import { useEffect, useState } from 'react'

export function useColumnCount(): number {
  const [columns, setColumns] = useState(() => pick(typeof window !== 'undefined' ? window.innerWidth : 1200))

  useEffect(() => {
    function onResize() {
      setColumns(pick(window.innerWidth))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return columns
}

function pick(width: number): number {
  if (width < 640) return 2
  if (width < 1024) return 3
  return 4
}
