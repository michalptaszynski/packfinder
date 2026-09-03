import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import { BUNDLE_VERSION, buildBundle, type Dict } from './bundle'
import { appHeader } from '@/llm/remote'

/**
 * The question cards follow the language the conversation is being held in.
 *
 * English is the source and needs no round trip; any other language is
 * translated once by the model and kept in localStorage, so a conversation pays
 * for it at most once and a returning visitor not at all.
 */

interface LanguageValue {
  language: string
  /** Looks a string up, falling back to the English source. */
  t: (id: string, fallback: string) => string
  /** Switches language, fetching the bundle if this is the first time. Awaited so the next question is not pushed in the old language. */
  setLanguage: (language: string) => Promise<void>
}

const LanguageContext = createContext<LanguageValue | null>(null)

const cacheKey = (language: string) => `packfinder.i18n.${BUNDLE_VERSION}.${language}`

/**
 * Strings per request. The whole bundle in one call was slow enough to look
 * broken and, worse, came back with the tail of the object missing — the
 * server fills gaps with English, so the loss showed up as a half-translated
 * interface rather than an error. Chunks run in parallel.
 */
const CHUNK = 30

async function translateChunk(language: string, strings: Dict): Promise<Dict | null> {
  const response = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...appHeader() },
    body: JSON.stringify({ language, strings }),
  })
  if (!response.ok) return null
  return (await response.json()) as Dict
}

async function translateBundle(language: string, source: Dict): Promise<Dict | null> {
  const entries = Object.entries(source)
  const chunks: Dict[] = []
  for (let i = 0; i < entries.length; i += CHUNK) {
    chunks.push(Object.fromEntries(entries.slice(i, i + CHUNK)))
  }

  const results = await Promise.all(chunks.map((chunk) => translateChunk(language, chunk)))
  // One failed chunk would leave a patchwork interface, so the lot is dropped.
  if (results.some((result) => result === null)) return null
  return Object.assign({}, ...(results as Dict[])) as Dict
}

function readCache(language: string): Dict | null {
  try {
    const raw = window.localStorage.getItem(cacheKey(language))
    return raw ? (JSON.parse(raw) as Dict) : null
  } catch {
    // Private windows and blocked site data both throw here; a miss is fine.
    return null
  }
}

function writeCache(language: string, dict: Dict) {
  try {
    window.localStorage.setItem(cacheKey(language), JSON.stringify(dict))
  } catch {
    /* nothing to do — the dictionary still works for this session */
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState('en')
  const [dict, setDict] = useState<Dict | null>(null)
  const source = useMemo(buildBundle, [])
  const inFlight = useRef<string | null>(null)

  const setLanguage = useCallback(
    async (next: string) => {
      const code = next.slice(0, 2).toLowerCase()
      if (!code || code === language) return

      if (code === 'en') {
        setDict(null)
        setLanguageState('en')
        return
      }

      const cached = readCache(code)
      if (cached) {
        setDict(cached)
        setLanguageState(code)
        return
      }

      if (inFlight.current === code) return
      inFlight.current = code
      try {
        const translated = await translateBundle(code, source)
        if (!translated) return
        writeCache(code, translated)
        setDict(translated)
        setLanguageState(code)
      } catch {
        // No route, no key, or a slow network: the cards stay in English.
      } finally {
        inFlight.current = null
      }
    },
    [language, source],
  )

  const value = useMemo<LanguageValue>(
    () => ({
      language,
      t: (id, fallback) => dict?.[id] ?? fallback,
      setLanguage,
    }),
    [language, dict, setLanguage],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useT() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error('useT must be used inside a LanguageProvider')
  return context
}
