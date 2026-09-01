import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { cn } from '@/lib/utils'

export function Chat() {
  const state = useSessionState()
  const dispatch = useSessionDispatch()
  const [input, setInput] = useState('')
  const lastAskedStep = useRef<number | null>(0)
  const announcedComplete = useRef(false)
  const lastAnnouncedChoice = useRef<string | null>(null)
  const logRef = useRef<HTMLDivElement>(null)

  const status = quizStatus(state.slots)

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
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' })
  }, [state.messages])

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
            ? 'Nie jestem pewien, co masz na myśli — możesz podać nakład, budżet albo styl (np. minimal, eco, lux)?'
            : 'Nie jestem pewien, co masz na myśli — możesz też kliknąć jedną z opcji poniżej.',
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
    <div className="flex h-full flex-col gap-3">
      <div ref={logRef} className="flex flex-1 flex-col gap-2.5 overflow-y-auto pr-1">
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

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          handleSend(input)
        }}
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={status.complete ? 'np. Zwiększ nakład do 250 albo chcę eco' : 'albo po prostu wpisz, np. kosmetyki, 60x120x60...'}
        />
        <Button type="submit" disabled={!input.trim()}>
          Wyślij
        </Button>
      </form>
    </div>
  )
}

function ChatBubble({ message }: { message: ChatMessage }) {
  return (
    <div
      className={cn(
        'max-w-[92%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed',
        message.role === 'user' ? 'self-end bg-state-bg text-state-fg' : 'self-start border border-border bg-card',
      )}
    >
      {message.text}
    </div>
  )
}
