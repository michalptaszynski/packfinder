/**
 * Resolves a path in public/ against the deployment base. On GitHub Pages the
 * app is served from /packfinder/, so a literal "/photos/..." would resolve to
 * the domain root and 404. Guarded because vite.config.ts imports the data
 * files that use this, and there is no import.meta.env in that context.
 */
const BASE = (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL ?? '/'

export function asset(path: string): string {
  return `${BASE.replace(/\/$/, '')}${path}`
}
