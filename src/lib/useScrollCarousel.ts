import { useEffect, useRef, useState } from 'react'

export function useScrollCarousel() {
  const ref = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  function update() {
    const el = ref.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

  useEffect(() => {
    update()
    const el = ref.current
    if (!el) return
    el.addEventListener('scroll', update)
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function scrollBy(direction: 1 | -1) {
    const el = ref.current
    if (!el) return
    // Capped: a page-sized jump on a barely-overflowing strip lands on an end
    // stop every time, which reads as the arrow doing nothing.
    const step = Math.min(el.clientWidth * 0.8, 360)
    el.scrollBy({ left: direction * step, behavior: 'smooth' })
  }

  return { ref, canScrollLeft, canScrollRight, scrollBy }
}
