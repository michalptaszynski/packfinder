import type { Dimensions, Fragility } from '../types'

export interface CategoryPreset {
  id: string
  label: string
  dimensions: Dimensions
  weight: number
  fragility: Fragility
  foodContact?: boolean
}

export const CATEGORY_PRESETS: CategoryPreset[] = [
  { id: 'clothing', label: 'Ubrania', dimensions: { w: 250, h: 350, d: 50 }, weight: 300, fragility: 'low' },
  { id: 'cosmetics', label: 'Kosmetyki', dimensions: { w: 60, h: 120, d: 60 }, weight: 150, fragility: 'low' },
  { id: 'jewelry', label: 'Biżuteria i drobne', dimensions: { w: 80, h: 60, d: 25 }, weight: 50, fragility: 'medium' },
  { id: 'food', label: 'Jedzenie', dimensions: { w: 140, h: 230, d: 80 }, weight: 400, fragility: 'medium', foodContact: true },
  { id: 'bottles', label: 'Butelki i płyny', dimensions: { w: 70, h: 220, d: 70 }, weight: 500, fragility: 'high' },
  { id: 'electronics', label: 'Elektronika', dimensions: { w: 180, h: 120, d: 60 }, weight: 350, fragility: 'high' },
  { id: 'stationery', label: 'Druk i papeteria', dimensions: { w: 210, h: 297, d: 10 }, weight: 100, fragility: 'low' },
  { id: 'gift_set', label: 'Zestaw prezentowy', dimensions: { w: 230, h: 160, d: 70 }, weight: 600, fragility: 'medium' },
  { id: 'other', label: 'Coś innego', dimensions: { w: 150, h: 100, d: 60 }, weight: 250, fragility: 'medium' },
]

export const DIMENSION_REFERENCE_CHIPS = [
  { label: 'wielkość telefonu', dimensions: { w: 75, h: 150, d: 8 } as Dimensions },
  { label: 'butelka 0,5 l', dimensions: { w: 65, h: 210, d: 65 } as Dimensions },
  { label: 'kartka A5', dimensions: { w: 148, h: 210, d: 5 } as Dimensions },
]

export const CHANNEL_OPTIONS: { id: 'courier' | 'parcel_locker' | 'retail_shelf' | 'hand' | 'gift'; label: string }[] = [
  { id: 'courier', label: 'Kurier' },
  { id: 'parcel_locker', label: 'Paczkomat' },
  { id: 'retail_shelf', label: 'Półka w sklepie' },
  { id: 'hand', label: 'Do ręki' },
  { id: 'gift', label: 'Wysyłka prezentowa' },
]

export const QUIZ_QUESTIONS = [
  'Co pakujesz?',
  'Jakie ma wymiary? (mm)',
  'Jak to trafia do klienta?',
  'Jaki nakład i budżet masz na myśli?',
]
