import type { Dimensions, Fragility } from '../types'

export interface CategoryPreset {
  id: string
  label: string
  blurb: string
  dimensions: Dimensions
  weight: number
  fragility: Fragility
  foodContact?: boolean
}

export const CATEGORY_PRESETS: CategoryPreset[] = [
  {
    id: 'clothing',
    label: 'Ubrania',
    blurb: 'Miękkie opakowanie, które chroni tkaninę i dobrze wygląda przy rozpakowaniu.',
    dimensions: { w: 250, h: 350, d: 50 },
    weight: 300,
    fragility: 'low',
  },
  {
    id: 'cosmetics',
    label: 'Kosmetyki',
    blurb: 'Małe, eleganckie pudełko dopasowane do słoiczków i tubek.',
    dimensions: { w: 60, h: 120, d: 60 },
    weight: 150,
    fragility: 'low',
  },
  {
    id: 'jewelry',
    label: 'Biżuteria i drobne',
    blurb: 'Drobne, delikatne przedmioty — liczy się precyzyjne dopasowanie.',
    dimensions: { w: 80, h: 60, d: 25 },
    weight: 50,
    fragility: 'medium',
  },
  {
    id: 'food',
    label: 'Jedzenie',
    blurb: 'Kontakt z żywnością wymaga bezpiecznych materiałów.',
    dimensions: { w: 140, h: 230, d: 80 },
    weight: 400,
    fragility: 'medium',
    foodContact: true,
  },
  {
    id: 'bottles',
    label: 'Butelki i płyny',
    blurb: 'Szkło lub płyny — potrzebna solidna ochrona przed stłuczeniem.',
    dimensions: { w: 70, h: 220, d: 70 },
    weight: 500,
    fragility: 'high',
  },
  {
    id: 'electronics',
    label: 'Elektronika',
    blurb: 'Wrażliwe na wstrząsy — wymaga wzmocnionej konstrukcji.',
    dimensions: { w: 180, h: 120, d: 60 },
    weight: 350,
    fragility: 'high',
  },
  {
    id: 'stationery',
    label: 'Druk i papeteria',
    blurb: 'Płaskie, sztywne materiały — papeteria, druki, kartki.',
    dimensions: { w: 210, h: 297, d: 10 },
    weight: 100,
    fragility: 'low',
  },
  {
    id: 'gift_set',
    label: 'Zestaw prezentowy',
    blurb: 'Sztywne albo szufladkowe pudełko z efektem „wow" przy otwieraniu.',
    dimensions: { w: 230, h: 160, d: 70 },
    weight: 600,
    fragility: 'medium',
  },
  {
    id: 'other',
    label: 'Coś innego',
    blurb: 'Opisz produkt w wiadomości, a dobiorę najbliższy format.',
    dimensions: { w: 150, h: 100, d: 60 },
    weight: 250,
    fragility: 'medium',
  },
]

export const DIMENSION_REFERENCE_CHIPS = [
  { label: 'wielkość telefonu', dimensions: { w: 75, h: 150, d: 8 } as Dimensions },
  { label: 'butelka 0,5 l', dimensions: { w: 65, h: 210, d: 65 } as Dimensions },
  { label: 'kartka A5', dimensions: { w: 148, h: 210, d: 5 } as Dimensions },
]

export const CHANNEL_OPTIONS: { id: 'courier' | 'parcel_locker' | 'retail_shelf' | 'hand' | 'gift'; label: string; blurb: string }[] = [
  { id: 'courier', label: 'Kurier', blurb: 'Wysyłka kurierem, klient dostaje paczkę pod drzwi.' },
  { id: 'parcel_locker', label: 'Paczkomat', blurb: 'Odbiór z automatu paczkowego — liczy się gabaryt.' },
  { id: 'retail_shelf', label: 'Półka w sklepie', blurb: 'Stoi na półce, klient bierze je sam.' },
  { id: 'hand', label: 'Do ręki', blurb: 'Wręczane bezpośrednio, np. na evencie albo w punkcie sprzedaży.' },
  { id: 'gift', label: 'Wysyłka prezentowa', blurb: 'Wysyłane jako gotowy prezent — liczy się pierwsze wrażenie.' },
]

export const QUIZ_QUESTIONS = [
  'Co pakujesz?',
  'Czy to opakowanie trafia do wysyłki, czy stoi na półce?',
  'Jakie ma wymiary?',
  'Jaki nakład planujesz?',
  'Jaki masz budżet na sztukę?',
]
