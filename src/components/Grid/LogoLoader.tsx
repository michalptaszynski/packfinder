const MARK =
  'M3.96499 21.9554H0V2.09146C0 0.935741 0.887494 0 1.9825 0H18.8225C19.9175 0 20.805 0.935741 20.805 2.09146V19.8607C20.805 21.0164 19.9175 21.9522 18.8225 21.9522H6.92756V17.7692H16.8369V4.18293H3.96499V21.9522V21.9554Z'

/**
 * Alternate loading state: the mark drawn as a track with a stroke running
 * through it. The dash animation lives in index.css so it can carry the
 * per-step easing and the reduced-motion rule; the clip path keeps the stroke
 * inside the mark's own silhouette.
 */
export function LogoLoader({ size = 46 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={(size / 46) * 48}
      viewBox="0 0 21 22"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Loading"
    >
      <clipPath id="lgMark">
        <path d={MARK} />
      </clipPath>
      <path className="lg-track" d={MARK} />
      <g clipPath="url(#lgMark)">
        <path className="lg-stream" pathLength={100} d="M1.9825 22.6 V2.09146 H18.8225 V19.8607 H6.92756" />
      </g>
    </svg>
  )
}
