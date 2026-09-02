import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowUp, Mic, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useDictation } from '@/lib/useDictation'
import { useSessionDispatch, useSessionState } from '@/state/SessionProvider'
import { quizStatus } from '@/state/quizStatus'
import { buildGrid } from '@/engine/grid'
import { interpretMessage } from '@/llm/interpret'
import { clarify } from '@/llm/clarify'
import { interpretRemote } from '@/llm/remote'
import type { Clarification } from '@/llm/clarify'
import { defaultSuggestions, narrateDirectionChosen, narrateGridSummary, narrateUpsell } from '@/llm/narrator'
import { QUIZ_QUESTIONS } from '@/data/categoryPresets'
import { REFINEMENT_QUESTIONS, nextRefinement } from '@/data/refinements'
import { getArchetype } from '@/engine/pricing'
import { priceConfiguration } from '@/engine/pricing'
import type { ChatMessage, Slots } from '@/types'
import { filterTemplates } from '@/data/promptTemplates'
import type { PromptTemplate } from '@/data/promptTemplates'
import { SlashMenu } from './SlashMenu'
import { BoxOutline } from './BoxOutline'
import { QuizControls } from './QuizControls'
import { ChatHero } from './ChatHero'
import { AltHeroHeadline, AltHeroStrip } from './ChatHeroAlt'
import { cn } from '@/lib/utils'

/** Space the pill's own controls take from the text line: + , mic, send, padding. */
const PILL_RESERVED_PX = 150
/** The send button only exists once there is text, so it frees this much back. */
const SEND_BUTTON_PX = 42
const MAX_COMPOSER_PX = 220

export function Chat({ centered, altHero, altQuiz }: { centered: boolean; altHero: boolean; altQuiz: boolean }) {
  const state = useSessionState()
  const dispatch = useSessionDispatch()
  const [input, setInput] = useState('')
  const lastAskedStep = useRef<number | null>(0)
  const lastAskedRefinement = useRef<number | null>(null)
  const announcedComplete = useRef(false)
  const lastAnnouncedChoice = useRef<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [bottomHeight, setBottomHeight] = useState(0)
  const [slashIndex, setSlashIndex] = useState(0)
  const [clarification, setClarification] = useState<Clarification | null>(null)
  const [multiline, setMultiline] = useState(false)
  const [thinking, setThinking] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const mirrorRef = useRef<HTMLDivElement>(null)

  const status = quizStatus(state.slots)
  const isFresh = status.nextStep === 0 && !state.messages.some((m) => m.role === 'user')
  // Alternate empty state: the composer moves to the middle of the panel and
  // the starting points sit under it, instead of a full hero above it.
  const altFresh = altHero && isFresh
  const questionPending = !isFresh && (!status.complete || nextRefinement(state.slots) !== null)
  const dictation = useDictation((transcript) => setInput((prev) => (prev ? `${prev} ${transcript}` : transcript)))

  // A reset empties the transcript; the "already asked" refs have to go back
  // with it, or the first question gets pushed a second time.
  useEffect(() => {
    if (!isFresh) return
    lastAskedStep.current = 0
    lastAskedRefinement.current = null
    announcedComplete.current = false
    lastAnnouncedChoice.current = null
    setClarification(null)
  }, [isFresh])

  useEffect(() => {
    if (status.complete) {
      if (!announcedComplete.current) {
        announcedComplete.current = true
        pushAssistant(narrateGridSummary(state.slots, state.cards))
        dispatch({ type: 'SET_SUGGESTIONS', suggestions: defaultSuggestions(state.cards) })
      }
      // With the grid on screen there is something to narrow, so the
      // spec-level questions start here rather than in front of the results.
      const refineStep = nextRefinement(state.slots)
      if (refineStep !== null && refineStep !== lastAskedRefinement.current) {
        lastAskedRefinement.current = refineStep
        pushAssistant(REFINEMENT_QUESTIONS[refineStep])
      }
      return
    }
    if (status.nextStep !== null && status.nextStep !== lastAskedStep.current) {
      lastAskedStep.current = status.nextStep
      pushAssistant(QUIZ_QUESTIONS[status.nextStep])
    }
  }, [state.slots])

  useEffect(() => {
    if (!state.chosenDirectionId || lastAnnouncedChoice.current === state.chosenDirectionId) return
    lastAnnouncedChoice.current = state.chosenDirectionId
    const card = state.cards.find((c) => c.direction.id === state.chosenDirectionId)
    const archetype = card ? getArchetype(card.direction.archetype) : undefined
    if (card && archetype) {
      const quantity = state.slots.quantity?.value ?? 120
      const modifiers = state.customModifiers ?? card.direction.modifiers
      const price = priceConfiguration({
        archetypeId: archetype.id,
        sizeCode: card.sizeCode,
        quantity,
        modifiers,
        budgetTotal: state.slots.budgetTotal?.value,
      })
      if (price.valid) {
        pushAssistant(narrateDirectionChosen(card.direction.label, archetype.label, price.unit ?? 0, price.total ?? 0, price.budgetDelta))
        if (price.overBudgetPct != null && price.upsellAvailable && price.upsellQuantity && price.upsellUnit) {
          pushAssistant(narrateUpsell(price.upsellQuantity, price.upsellUnit))
        }
      }
    }
  }, [state.chosenDirectionId])

  /**
   * The composer is a single-line pill until the text genuinely needs a second
   * line. The decision is measured on a hidden mirror sized to the *pill's*
   * text width, never on the live textarea: once expanded the textarea runs
   * full width, so re-measuring there would report "fits on one line" and
   * collapse the pill, which would immediately wrap again — a flip-flop.
   */
  useLayoutEffect(() => {
    const mirror = mirrorRef.current
    const form = formRef.current
    const textarea = textareaRef.current
    if (!mirror || !form || !textarea) return

    const reserved = input.trim() ? PILL_RESERVED_PX : PILL_RESERVED_PX - SEND_BUTTON_PX
    mirror.style.width = `${Math.max(form.clientWidth - reserved, 80)}px`
    mirror.textContent = input
    const lineHeight = parseFloat(getComputedStyle(mirror).lineHeight) || 24
    const wraps = mirror.scrollHeight > lineHeight * 1.5
    setMultiline(wraps)

    textarea.style.height = 'auto'
    textarea.style.height = wraps ? `${Math.min(textarea.scrollHeight, MAX_COMPOSER_PX)}px` : `${lineHeight}px`
  }, [input, bottomHeight, centered])

  useEffect(() => {
    const node = bottomRef.current
    if (!node) return
    const observer = new ResizeObserver(([entry]) => setBottomHeight(entry.contentRect.height))
    observer.observe(node)
    setBottomHeight(node.getBoundingClientRect().height)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (isFresh) return
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [state.messages, isFresh, bottomHeight])

  function pushAssistant(text: string) {
    dispatch({ type: 'ADD_MESSAGE', message: { id: crypto.randomUUID(), role: 'assistant', text } })
  }

  // The menu is open whenever the composer holds a bare "/query" — no separate
  // open flag to keep in sync with the text.
  const placeholder = isFresh
    ? { before: "Describe what you're packing, or press ", after: ' for a template…' }
    : status.complete
      ? { before: 'e.g. Increase the quantity to 250, or press ', after: ' for a template' }
      : { before: 'or just type it, e.g. cosmetics, 6x12x6 — press ', after: ' for a template' }

  const slashQuery = input.startsWith('/') && !input.includes('\n') ? input.slice(1) : null
  const slashMatches = slashQuery === null ? [] : filterTemplates(slashQuery)
  const slashOpen = slashQuery !== null && slashMatches.length > 0
  const activeIndex = Math.min(slashIndex, Math.max(slashMatches.length - 1, 0))

  function applyTemplate(template: PromptTemplate) {
    const placeholder = template.placeholder ?? ''
    const text = template.text.replace('{p}', placeholder)
    const start = template.text.indexOf('{p}')
    setInput(text)
    setSlashIndex(0)
    window.requestAnimationFrame(() => {
      const node = textareaRef.current
      if (!node) return
      node.focus()
      if (start >= 0 && placeholder) node.setSelectionRange(start, start + placeholder.length)
      else node.setSelectionRange(text.length, text.length)
    })
  }

  function handleComposerKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (slashOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSlashIndex((i) => (i + 1) % slashMatches.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSlashIndex((i) => (i - 1 + slashMatches.length) % slashMatches.length)
        return
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        applyTemplate(slashMatches[activeIndex])
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        setInput('')
        return
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend(input)
    }
  }

  async function handleSend(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    setSlashIndex(0)
    setClarification(null)
    dispatch({ type: 'ADD_MESSAGE', message: { id: crypto.randomUUID(), role: 'user', text: trimmed } })
    setInput('')

    // Claude reads the message when the dev-server route is available; the
    // rule-based parser is the fallback, so the prototype still works with no
    // API key, offline, or in a static build.
    setThinking(true)
    const remote = await interpretRemote(trimmed, state.slots)
    setThinking(false)

    if (remote) {
      applyInterpretation(trimmed, remote.slotUpdates, remote.clarification)
      return
    }

    const offline = interpretMessage(trimmed, state.slots)
    applyInterpretation(trimmed, offline.slotUpdates, offline.matched ? null : clarify(trimmed, state.slots))
  }

  function applyInterpretation(text: string, slotUpdates: Partial<Slots>, next: Clarification | null) {
    const mergedSlots = { ...state.slots, ...slotUpdates }

    if (Object.keys(slotUpdates).length > 0) {
      dispatch({ type: 'REBUILD_GRID', slots: slotUpdates })
    }

    if (next) {
      pushAssistant(next.text)
      // Mid-quiz the options take over the question card; past it there is no
      // card, so they become the suggestion chips above the composer.
      if (next.options.length === 0) return
      if (status.complete) dispatch({ type: 'SET_SUGGESTIONS', suggestions: next.options.map((o) => o.message) })
      else setClarification(next)
      return
    }

    if (Object.keys(slotUpdates).length === 0) {
      pushAssistant(clarify(text, state.slots).text)
      return
    }

    if (status.complete) {
      const freshCards = buildGrid(mergedSlots, state.gridFilter)
      pushAssistant(narrateGridSummary(mergedSlots, freshCards))
      dispatch({ type: 'SET_SUGGESTIONS', suggestions: defaultSuggestions(freshCards) })
    }
  }

  return (
    <div className="relative h-full">
      <div ref={scrollRef} className="absolute inset-0 overflow-y-auto">
        <div
          className={cn('mx-auto flex w-full flex-col gap-4 p-5', centered && 'max-w-[832px]')}
          style={{ paddingBottom: bottomHeight + 40 }}
        >
          {altFresh ? null : isFresh ? (
            <ChatHero />
          ) : (
            <div className="flex flex-col gap-2.5">
              {state.messages.map((message, index) => (
                <ChatBubble
                  key={message.id}
                  message={message}
                  joinAbove={state.messages[index - 1]?.role === message.role}
                  joinBelow={state.messages[index + 1]?.role === message.role}
                />
              ))}
              {altQuiz && questionPending && (
                <QuizControls clarification={clarification} onSend={(text) => void handleSend(text)} altQuiz />
              )}
              {thinking && (
                <div className="flex max-w-[92%] items-center gap-1.5 self-start rounded-2xl bg-muted px-4 py-3.5">
                  {[0, 1, 2].map((dot) => (
                    <span
                      key={dot}
                      className="size-1.5 animate-bounce rounded-full bg-muted-foreground/60"
                      style={{ animationDelay: `${dot * 140}ms` }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div
        ref={bottomRef}
        className={cn(
          'pointer-events-none absolute inset-x-5 mx-auto flex flex-col gap-2.5',
          altFresh ? 'top-1/2 -translate-y-1/2' : 'bottom-5',
          centered && 'max-w-[832px]',
        )}
      >
        {altFresh && <AltHeroHeadline />}

        {!altQuiz && questionPending && (
          <div className="pointer-events-auto">
            <QuizControls clarification={clarification} onSend={(text) => void handleSend(text)} altQuiz={false} />
          </div>
        )}

        {!isFresh && state.suggestions.length > 0 && (
          <div className="pointer-events-auto flex flex-wrap gap-1.5">
            {state.suggestions.map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                className="rounded-full bg-card text-xs font-normal text-muted-foreground shadow-sm"
                onClick={() => void handleSend(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        )}

        <form
          ref={formRef}
          className={cn(
            // No shadow at rest — it only lifts on hover or while being typed in.
            'pointer-events-auto relative flex items-center gap-1.5 border border-foreground/15 bg-card transition-shadow duration-200',
            'hover:shadow-[0_18px_28px_-8px_rgb(0_0_0_/_0.12),0_8px_12px_-8px_rgb(0_0_0_/_0.10)]',
            'focus-within:shadow-[0_18px_28px_-8px_rgb(0_0_0_/_0.12),0_8px_12px_-8px_rgb(0_0_0_/_0.10)]',
            // One DOM order for both shapes — the textarea is re-ordered with
            // flex-wrap rather than moved, so it never remounts mid-typing and
            // the caret and focus survive the switch.
            multiline ? 'flex-wrap rounded-3xl p-3' : 'rounded-full py-2 pr-2 pl-3',
          )}
          onSubmit={(e) => {
            e.preventDefault()
            void handleSend(input)
          }}
        >
          {slashOpen && (
            <SlashMenu templates={slashMatches} activeIndex={activeIndex} onHover={setSlashIndex} onPick={applyTemplate} />
          )}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Insert a template"
            onClick={() => {
              setInput('/')
              setSlashIndex(0)
              textareaRef.current?.focus()
            }}
            className={cn('size-9 flex-none rounded-full text-muted-foreground', multiline && 'order-2')}
          >
            <Plus size={18} strokeWidth={1.75} />
          </Button>

          <span className={cn('relative min-w-0', multiline ? 'order-1 w-full basis-full' : 'flex-1')}>
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                setSlashIndex(0)
              }}
              onKeyDown={handleComposerKeyDown}
              aria-label="Message"
              rows={1}
              // dark:bg-transparent undoes the ui kit's own dark:bg-input/30, which
              // otherwise paints a panel behind the composer's text.
              className="min-h-0 w-full resize-none overflow-y-auto border-none bg-transparent px-1 py-0 text-base leading-6 shadow-none focus-visible:ring-0 dark:bg-transparent"
            />
            {/* A textarea placeholder is plain text, so the key cap is drawn as
                an overlay instead — inert, and only while the field is empty. */}
            {!input && (
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 truncate px-1 text-base leading-6 text-muted-foreground md:text-sm"
              >
                {placeholder.before}
                <kbd className="mx-px inline-flex h-[1.45em] min-w-[1.45em] -translate-y-[0.1em] items-center justify-center rounded-[4px] border border-foreground/30 px-[0.37em] align-middle text-[0.85em] leading-none font-normal">
                  /
                </kbd>
                {placeholder.after}
              </span>
            )}
          </span>

          <div className={cn('flex flex-none items-center gap-1.5', multiline && 'order-3 ml-auto')}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={!dictation.supported}
              title={dictation.supported ? 'Dictate' : "Dictation isn't available in this browser"}
              onClick={dictation.toggle}
              className={cn(
                'size-9 rounded-full text-muted-foreground',
                dictation.isListening && 'bg-over-bg text-over-fg animate-pulse hover:bg-over-bg',
              )}
            >
              <Mic size={18} strokeWidth={1.75} />
            </Button>

            {input.trim() && (
              <Button type="submit" size="icon" className="size-9 rounded-full">
                <ArrowUp size={16} strokeWidth={2.5} />
              </Button>
            )}
          </div>

          {/* Off-screen ruler for the pill/expanded decision. */}
          <div
            ref={mirrorRef}
            aria-hidden
            className="pointer-events-none invisible absolute top-0 left-0 px-1 text-base leading-6 whitespace-pre-wrap md:text-sm"
          />
        </form>

        {altFresh && <AltHeroStrip />}
      </div>
    </div>
  )
}

/** Every message slides up as it lands, the same way the answer cards do. */
const BUBBLE_ENTRANCE = 'animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out'
/**
 * Radii for a run of messages from the same side. A tucked corner only reads
 * as a join when both shapes belong to the same family, so a bubble carrying
 * an attachment drops the pill shape and takes the attachment's radius; the
 * corner where the two meet then tucks to 6px.
 */
const JOIN_TOP = 'rounded-tr-[6px]'
const JOIN_BOTTOM = 'rounded-br-[6px]'

function ChatBubble({
  message,
  joinAbove,
  joinBelow,
}: {
  message: ChatMessage
  /** The message before this one is from the same side. */
  joinAbove: boolean
  /** The message after this one is from the same side. */
  joinBelow: boolean
}) {
  if (message.role === 'user') {
    // An attachment above the text is itself a join, so the bubble's top
    // corner tucks in whether the neighbour is a sibling message or this
    // message's own image.
    const attached = Boolean(message.image || message.dimensions)

    return (
      <div className={cn('flex max-w-[92%] flex-col items-end gap-1.5 self-end', BUBBLE_ENTRANCE)}>
        {message.image && (
          <img
            src={message.image}
            alt=""
            // Scaled down to fit, never cropped: a fixed box with
            // object-cover was cutting the bottom off portrait shots.
            className={cn('max-h-72 max-w-60 rounded-xl border border-border', JOIN_BOTTOM)}
          />
        )}
        {message.dimensions && <BoxOutline dimensions={message.dimensions} size={96} className={JOIN_BOTTOM} />}
        <div
          className={cn(
            'bg-user-bg px-4 py-2.5 text-sm leading-relaxed text-user-fg',
            // A class, not an inline radius: inline styles would beat the
            // per-corner utility that does the tucking.
            attached ? 'rounded-[14px]' : 'rounded-full',
            (attached || joinAbove) && JOIN_TOP,
            joinBelow && JOIN_BOTTOM,
          )}
        >
          {message.text}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'max-w-[92%] self-start rounded-2xl bg-muted px-4 py-2.5 text-sm leading-relaxed text-foreground',
        BUBBLE_ENTRANCE,
        joinAbove && 'rounded-tl-[6px]',
        joinBelow && 'rounded-bl-[6px]',
      )}
    >
      {message.text}
    </div>
  )
}
