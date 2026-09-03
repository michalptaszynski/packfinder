# Deploying Packfinder

The app is a static bundle plus two API routes. The routes are what the LLM
runs through, so where they can execute decides what works.

| Target | Conversation | Interface language | Everything else |
| --- | --- | --- | --- |
| `npm run dev` | Claude | follows the conversation | works |
| Vercel / Cloudflare / any host that runs functions | Claude | follows the conversation | works |
| GitHub Pages | offline rule parser | English only | works |

GitHub Pages serves files and nothing else, so `POST /api/interpret` there is a
404 and the app falls back to its offline parser. That is by design — it is a
usable demo, not a broken one — but it is not the real thing.

## Vercel

Sign in at vercel.com **with the GitHub account that owns the repo** — there is
no separate account to create, and the free plan covers this with no card.

1. **Add New → Project**, import `michalptaszynski/packfinder`. Vercel detects
   Vite; leave the build settings alone.
2. Under **Environment Variables** add:
   - `ANTHROPIC_API_KEY` — the key from console.anthropic.com. Server-side only;
     it never reaches the browser.
   - `APP_TOKEN` — any random string, e.g. `openssl rand -hex 16`.
   - `VITE_APP_TOKEN` — the same string again. This one *is* compiled into the
     bundle, which is the point: the browser sends it back on every call.
3. **Deploy.** Every push to `main` redeploys.

`api/interpret.ts` and `api/translate.ts` are picked up automatically — Vercel
turns anything under `api/` into a function. They are thin: the work lives in
`server/`, shared with the dev middleware, so local and deployed behaviour
cannot drift.

## What protects the key

Three things, in increasing order of how much they actually matter:

1. **`APP_TOKEN`** — rejects anything that does not send the header. This stops
   scanners and copy-pasted curl. It is *not* a secret: it ships in the client
   bundle and anyone who opens devtools can read it.
2. **Rate limit** — 20 requests a minute per IP, in `server/gate.ts`. Held in
   memory, so it is per running instance rather than global.
3. **A spend limit on the key, set in the Anthropic Console.** This is the only
   hard ceiling. Set one before the URL goes anywhere.

Leaving `APP_TOKEN` unset disables the check — fine locally, wrong in
production.

## GitHub Pages

Still works, and still worth keeping as the no-key fallback. The build needs the
repo subpath:

```
DEPLOY_TARGET=pages npm run build
```

Without that variable the build targets a host root, which is what Vercel needs.
Publishing is manual, via the `gh-pages` branch; the Actions route needs
`gh auth refresh -s workflow` first.
