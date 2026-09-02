import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import { claudeInterpret, type InterpretRequest } from './server/claudeInterpret'

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
      server.middlewares.use('/api/interpret', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          return res.end()
        }
        if (!apiKey) {
          res.statusCode = 503
          res.setHeader('content-type', 'application/json')
          return res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY is not set — running on the offline parser.' }))
        }

        let raw = ''
        req.on('data', (chunk) => (raw += chunk))
        req.on('end', async () => {
          try {
            const body = JSON.parse(raw) as InterpretRequest
            const result = await claudeInterpret(apiKey, body)
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
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), claudeApi(mode)],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
}))
