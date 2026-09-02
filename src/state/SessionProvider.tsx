import { createContext, useContext, useReducer } from 'react'
import type { Dispatch, ReactNode } from 'react'
import type { ChatMessage, DirectionCard, GridFilter, Slots } from '../types'
import { buildGrid } from '../engine/grid'
import { QUIZ_QUESTIONS } from '../data/categoryPresets'

export type Screen = 'conversation' | 'handoff'

export interface SessionState {
  screen: Screen
  slots: Slots
  gridFilter: GridFilter
  cards: DirectionCard[]
  /** First-ranked card shown as a suggestion — not a user choice yet. */
  highlightedDirectionId: string | null
  /** Which card's configuration panel is currently open. */
  openDirectionId: string | null
  /** Set only once the user deliberately confirms inside the panel — gates handoff. */
  chosenDirectionId: string | null
  customModifiers: string[] | null
  selectedAddons: string[]
  messages: ChatMessage[]
  suggestions: string[]
}

export type Action =
  | { type: 'MERGE_SLOTS'; slots: Partial<Slots> }
  | { type: 'REBUILD_GRID'; slots?: Partial<Slots> }
  | { type: 'SET_GRID_FILTER'; filter: GridFilter }
  | { type: 'ADD_MESSAGE'; message: ChatMessage }
  | { type: 'SET_SUGGESTIONS'; suggestions: string[] }
  | { type: 'OPEN_DIRECTION'; id: string }
  | { type: 'CLOSE_DIRECTION_PANEL' }
  | { type: 'CONFIRM_DIRECTION'; id: string }
  | { type: 'SET_CUSTOM_MODIFIERS'; modifiers: string[] }
  | { type: 'TOGGLE_ADDON'; addonId: string }
  | { type: 'GO_TO_HANDOFF' }
  | { type: 'BACK_TO_CONVERSATION' }
  | { type: 'RESET_SESSION' }

function defaultHighlight(cards: DirectionCard[]): string | null {
  const firstSelectable = cards.find((c) => c.selectable)
  return firstSelectable?.direction.id ?? cards[0]?.direction.id ?? null
}

const initialCards = buildGrid({})

const initialState: SessionState = {
  screen: 'conversation',
  slots: {},
  gridFilter: 'all',
  cards: initialCards,
  highlightedDirectionId: defaultHighlight(initialCards),
  openDirectionId: null,
  chosenDirectionId: null,
  customModifiers: null,
  selectedAddons: [],
  messages: [{ id: 'quiz-q0', role: 'assistant', text: QUIZ_QUESTIONS[0] }],
  suggestions: [],
}

function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    // Back to a blank brief. The message list is rebuilt from initialState, so
    // the first question is asked again rather than duplicated.
    case 'RESET_SESSION':
      return { ...initialState, messages: [...initialState.messages] }

    case 'MERGE_SLOTS':
      return { ...state, slots: { ...state.slots, ...action.slots } }

    case 'REBUILD_GRID': {
      const slots = action.slots ? { ...state.slots, ...action.slots } : state.slots
      const cards = buildGrid(slots, state.gridFilter)
      const stillExists = (id: string | null) => id !== null && cards.some((c) => c.direction.id === id)
      const chosenStillSelectable = state.chosenDirectionId
        ? (cards.find((c) => c.direction.id === state.chosenDirectionId)?.selectable ?? false)
        : false

      return {
        ...state,
        slots,
        cards,
        highlightedDirectionId: stillExists(state.highlightedDirectionId) ? state.highlightedDirectionId : defaultHighlight(cards),
        chosenDirectionId: chosenStillSelectable ? state.chosenDirectionId : null,
        customModifiers: null,
      }
    }

    case 'SET_GRID_FILTER': {
      const cards = buildGrid(state.slots, action.filter)
      return { ...state, gridFilter: action.filter, cards }
    }

    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.message] }

    case 'SET_SUGGESTIONS':
      return { ...state, suggestions: action.suggestions }

    case 'OPEN_DIRECTION':
      return { ...state, openDirectionId: action.id, customModifiers: null, selectedAddons: [] }

    case 'CLOSE_DIRECTION_PANEL':
      return { ...state, openDirectionId: null }

    case 'CONFIRM_DIRECTION':
      return { ...state, chosenDirectionId: action.id, openDirectionId: null }

    case 'SET_CUSTOM_MODIFIERS':
      return { ...state, customModifiers: action.modifiers }

    case 'TOGGLE_ADDON': {
      const has = state.selectedAddons.includes(action.addonId)
      return {
        ...state,
        selectedAddons: has ? state.selectedAddons.filter((id) => id !== action.addonId) : [...state.selectedAddons, action.addonId],
      }
    }

    case 'GO_TO_HANDOFF':
      return { ...state, screen: 'handoff' }

    case 'BACK_TO_CONVERSATION':
      return { ...state, screen: 'conversation' }

    default:
      return state
  }
}

const StateContext = createContext<SessionState | null>(null)
const DispatchContext = createContext<Dispatch<Action> | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>{children}</DispatchContext.Provider>
    </StateContext.Provider>
  )
}

export function useSessionState(): SessionState {
  const ctx = useContext(StateContext)
  if (!ctx) throw new Error('useSessionState must be used within SessionProvider')
  return ctx
}

export function useSessionDispatch(): Dispatch<Action> {
  const ctx = useContext(DispatchContext)
  if (!ctx) throw new Error('useSessionDispatch must be used within SessionProvider')
  return ctx
}
