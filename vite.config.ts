import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { claudeInterpret, type InterpretRequest } from './server/claudeInterpret'
import { translateUi, type TranslateRequest } from './server/translateUi'
import { checkRequest, clientIp } from './server/gate'

/**
 * Exposes POST /api/interpret during `vite dev`. The Anthropic key is read
 * here, in Node, and never reaches the browser bundle — only VITE_-prefixed
 * variables are exposed to client code, and this one deliberately is not.
 * Without a key the route answers 503 and the app falls back to its offline
 * rule-based parser, so the prototype still runs for anyone without one.
 */
function claudeApi(mode: string): Plugin {
  const env = loadEnv(mode, process.cwd(), '')
  const apiKey = env.ANTHROPIC_API_KEY ?? process.env.ANTHROPIC_API_KEY

  return {
    name: 'packfinder-claude-api',
    configureServer(server) {
      /** Both routes read the same body and answer the same way. */
      function post<T>(path: string, handler: (body: T) => Promise<unknown>) {
        server.middlewares.use(path, (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405
            return res.end()
          }
          if (!apiKey) {
            res.statusCode = 503
            res.setHeader('content-type', 'application/json')
            return res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY is not set — running on the offline parser.' }))
          }

          // Same gate as the deployed functions, so a local run cannot pass
          // something production would reject.
          const gate = checkRequest(req.headers as Record<string, string | string[] | undefined>, clientIp(req.headers as Record<string, string | string[] | undefined>))
          if (!gate.ok) {
            res.statusCode = gate.status
            res.setHeader('content-type', 'application/json')
            return res.end(JSON.stringify({ error: gate.error }))
          }

          let raw = ''
          req.on('data', (chunk) => (raw += chunk))
          req.on('end', async () => {
            try {
              const result = await handler(JSON.parse(raw) as T)
              res.setHeader('content-type', 'application/json')
              res.end(JSON.stringify(result))
            } catch (error) {
              server.config.logger.error(`[claude] ${String(error)}`)
              res.statusCode = 502
              res.setHeader('content-type', 'application/json')
              res.end(JSON.stringify({ error: String(error) }))
            }
          })
        })
      }

      post<InterpretRequest>('/api/interpret', (body) => claudeInterpret(apiKey!, body))
      post<TranslateRequest>('/api/translate', (body) => translateUi(apiKey!, body))

    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // GitHub Pages serves from a repo subpath, so that build needs a prefix;
  // everywhere else — dev, and any host that serves the app at its own root —
  // must not have one, or every asset URL points at a directory that is not
  // there. Set DEPLOY_TARGET=pages for the Pages build only.
  base: process.env.DEPLOY_TARGET === 'pages' ? '/packfinder/' : '/',
  plugins: [react(), tailwindcss(), claudeApi(mode)],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
}))
