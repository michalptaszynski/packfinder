import { translateUi, type TranslateRequest } from '../server/translateUi'
import { checkRequest, clientIp, requireKey } from '../server/gate'
import type { ApiRequest, ApiResponse } from '../server/http'

/** Serverless twin of the dev-server route in vite.config.ts. */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const gate = checkRequest(req.headers, clientIp(req.headers))
  if (!gate.ok) return res.status(gate.status).json({ error: gate.error })

  try {
    const result = await translateUi(requireKey(), req.body as TranslateRequest)
    return res.status(200).json(result)
  } catch (error) {
    console.error('[claude]', error)
    return res.status(502).json({ error: String(error) })
  }
}
