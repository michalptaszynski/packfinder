import { useEffect, useRef, useState } from 'react'
import { ArrowUp, Mic, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useDictation } from '@/lib/useDictation'
import { useSessionDispatch, useSessionState } from '@/state/SessionProvider'
import { quizStatus } from '@/state/quizStatus'
import { buildGrid } from '@/engine/grid'
import { interpretMessage } from '@/llm/interpret'
import { defaultSuggestions, narrateDirectionChosen, narrateGridSummary, narrateUpsell } from '@/llm/narrator'
import { QUIZ_QUESTIONS } from '@/data/categoryPresets'
import { getArchetype } from '@/engine/pricing'
import { priceConfiguration } from '@/engine/pricing'
import type { ChatMessage } from '@/types'
import { QuizControls } from './QuizControls'
import { ChatHero } from './ChatHero'
import { cn } from '@/lib/utils'

export function Chat({ centered }: { centered: boolean }) {
  const state = useSessionState()
  const dispatch = useSessionDispatch()
  const [input, setInput] = useState('')
  const lastAskedStep = useRef<number | null>(0)
  const announcedComplete = useRef(false)
  const lastAnnouncedChoice = useRef<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const status = quizStatus(state.slots)
  const isFresh = status.nextStep === 0 && !state.messages.some((m) => m.role === 'user')
  const dictation = useDictation((transcript) => setInput((prev) => (prev ? `${prev} ${transcript}` : transcript)))

  useEffect(() => {
    if (status.complete) {
      if (!announcedComplete.current) {
        announcedComplete.current = true
        pushAssistant(narrateGridSummary(state.slots, state.cards))
        dispatch({ type: 'SET_SUGGESTIONS', suggestions: defaultSuggestions(state.cards) })
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

  useEffect(() => {
    if (isFresh) return
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [state.messages, isFresh])

  function pushAssistant(text: string) {
    dispatch({ type: 'ADD_MESSAGE', message: { id: crypto.randomUUID(), role: 'assistant', text } })
  }

  function handleSend(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    dispatch({ type: 'ADD_MESSAGE', message: { id: crypto.randomUUID(), role: 'user', text: trimmed } })
    setInput('')

    const interpretation = interpretMessage(trimmed, state.slots)
    const mergedSlots = { ...state.slots, ...interpretation.slotUpdates }

    if (Object.keys(interpretation.slotUpdates).length > 0) {
      dispatch({ type: 'REBUILD_GRID', slots: interpretation.slotUpdates })
    }

    if (!interpretation.matched) {
      window.setTimeout(() => {
        pushAssistant(
          status.complete
            ? "I'm not sure what you mean — you could give me a quantity, a budget, or a style (e.g. minimal, eco, lux)?"
            : "I'm not sure what you mean — you can also just click one of the options below.",
        )
      }, 250)
      return
    }

    if (status.complete) {
      const freshCards = buildGrid(mergedSlots, state.gridFilter)
      window.setTimeout(() => {
        pushAssistant(narrateGridSummary(mergedSlots, freshCards))
        dispatch({ type: 'SET_SUGGESTIONS', suggestions: defaultSuggestions(freshCards) })
      }, 250)
    }
  }

  return (
    <div className="relative h-full">
      <div ref={scrollRef} className="absolute inset-0 overflow-y-auto">
        <div className={cn('mx-auto flex w-full flex-col gap-4 p-5 pb-40', centered && 'max-w-[832px]')}>
          {isFresh ? (
            <ChatHero />
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2.5">
                {state.messages.map((message) => (
                  <ChatBubble key={message.id} message={message} />
                ))}
              </div>

              {!status.complete && <QuizControls />}

              {state.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {state.suggestions.map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      className="rounded-full text-xs font-normal text-muted-foreground"
                      onClick={() => handleSend(suggestion)}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <form
        className={cn('absolute inset-x-5 bottom-5 mx-auto flex flex-col gap-2 rounded-2xl border border-border bg-card p-3 shadow-xl', centered && 'max-w-[832px]')}
        onSubmit={(e) => {
          e.preventDefault()
          handleSend(input)
        }}
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend(input)
            }
          }}
          placeholder={
            isFresh
              ? "Describe what you're packing..."
              : status.complete
                ? 'e.g. Increase the quantity to 250, or I want eco'
                : 'or just type it, e.g. cosmetics, 60x120x60...'
          }
          rows={2}
          className="min-h-16 resize-none border-none bg-transparent px-1 text-base shadow-none focus-visible:ring-0"
        />
        <div className="flex items-center justify-between">
          <Button type="button" variant="ghost" size="icon" disabled title="Coming soon" className="size-9 rounded-full text-muted-foreground">
            <Plus size={18} strokeWidth={1.75} />
          </Button>

          <div className="flex items-center gap-1.5">
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
        </div>
      </form>
    </div>
  )
}

function ChatBubble({ message }: { message: ChatMessage }) {
  if (message.role === 'user') {
    return <div className="max-w-[92%] self-end rounded-full bg-muted px-4 py-2.5 text-sm leading-relaxed text-foreground">{message.text}</div>
  }
  return <div className="max-w-[92%] self-start px-1 text-sm leading-relaxed text-foreground">{message.text}</div>
}
