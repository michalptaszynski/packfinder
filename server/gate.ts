/**
 * What stands between a public URL and the API key.
 *
 * Two layers, and neither is a secret: the app token only keeps drive-by
 * scanners and copy-pasted curl out — it ships in the client bundle, so anyone
 * who opens devtools can read it. The rate limit is what actually caps the
 * damage from a single caller.
 *
 * The real ceiling is the spend limit set on the key in the Anthropic Console.
 * Set one; this file cannot.
 */

const WINDOW_MS = 60_000
const MAX_PER_WINDOW = 20

/** Per instance, not per deployment — a serverless fleet has one of these each. */
const hits = new Map<string, number[]>()

export interface GateResult {
  ok: boolean
  status: number
  error?: string
}

export function checkRequest(headers: Record<string, string | string[] | undefined>, ip: string): GateResult {
  const expected = process.env.APP_TOKEN
  if (expected) {
    const raw = headers['x-packfinder-app']
    const token = Array.isArray(raw) ? raw[0] : raw
    if (token !== expected) return { ok: false, status: 401, error: 'Not this app.' }
  }

  const now = Date.now()
  const recent = (hits.get(ip) ?? []).filter((at) => now - at < WINDOW_MS)
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent)
    return { ok: false, status: 429, error: 'Too many requests — give it a minute.' }
  }
  recent.push(now)
  hits.set(ip, recent)

  return { ok: true, status: 200 }
}

export function clientIp(headers: Record<string, string | string[] | undefined>, fallback = 'local'): string {
  const forwarded = headers['x-forwarded-for']
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded
  return value?.split(',')[0]?.trim() || fallback
}

export function requireKey(): string {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('ANTHROPIC_API_KEY is not set')
  return key
}
