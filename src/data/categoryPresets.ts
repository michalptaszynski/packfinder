import type { Dimensions, Fragility } from '../types'

export interface CategoryPreset {
  id: string
  label: string
  blurb: string
  dimensions: Dimensions
  weight: number
  fragility: Fragility
  foodContact?: boolean
  photo?: string
}

export const CATEGORY_PRESETS: CategoryPreset[] = [
  {
    id: 'clothing',
    label: 'Clothing',
    blurb: 'Soft packaging that protects fabric and looks great when unboxed.',
    dimensions: { w: 250, h: 350, d: 50 },
    weight: 300,
    fragility: 'low',
    photo: '/photos/main/clothing.jpg',
  },
  {
    id: 'cosmetics',
    label: 'Cosmetics',
    blurb: 'A small, elegant box fitted to jars and tubes.',
    dimensions: { w: 60, h: 120, d: 60 },
    weight: 150,
    fragility: 'low',
    photo: '/photos/main/cosmetics.jpg',
  },
  {
    id: 'gift_set',
    label: 'Gift set',
    blurb: 'A rigid or drawer box with a real "wow" factor on opening.',
    dimensions: { w: 230, h: 160, d: 70 },
    weight: 600,
    fragility: 'medium',
  },
  {
    id: 'bottles',
    label: 'Bottles & liquids',
    blurb: 'Glass or liquids — needs solid protection against breakage.',
    dimensions: { w: 70, h: 220, d: 70 },
    weight: 500,
    fragility: 'high',
    photo: '/photos/main/bottles.jpg',
  },
  {
    id: 'food',
    label: 'Food',
    blurb: 'Contact with food requires safe materials.',
    dimensions: { w: 140, h: 230, d: 80 },
    weight: 400,
    fragility: 'medium',
    foodContact: true,
    photo: '/photos/main/food.jpg',
  },
  {
    id: 'jewelry',
    label: 'Jewelry & small items',
    blurb: 'Delicate, small items — a precise fit matters most.',
    dimensions: { w: 80, h: 60, d: 25 },
    weight: 50,
    fragility: 'medium',
    photo: '/photos/main/jewelry.jpg',
  },
  {
    id: 'electronics',
    label: 'Electronics',
    blurb: 'Shock-sensitive — needs reinforced construction.',
    dimensions: { w: 180, h: 120, d: 60 },
    weight: 350,
    fragility: 'high',
    photo: '/photos/main/electronics.jpg',
  },
  {
    id: 'stationery',
    label: 'Print & stationery',
    blurb: 'Flat, rigid materials — stationery, prints, cards.',
    dimensions: { w: 210, h: 297, d: 10 },
    weight: 100,
    fragility: 'low',
  },
  {
    id: 'toys',
    label: 'Toys',
    blurb: 'Playful, often irregular shapes — durability matters as much as looks.',
    dimensions: { w: 200, h: 150, d: 100 },
    weight: 400,
    fragility: 'medium',
  },
  {
    id: 'footwear',
    label: 'Footwear',
    blurb: 'Needs room for the shoebox itself, plus a bit of structure.',
    dimensions: { w: 330, h: 200, d: 120 },
    weight: 800,
    fragility: 'low',
  },
  {
    id: 'health',
    label: 'Health & supplements',
    blurb: 'Bottles, jars, or blister packs — tamper-evidence often matters.',
    dimensions: { w: 80, h: 150, d: 80 },
    weight: 200,
    fragility: 'medium',
  },
  {
    id: 'accessories',
    label: 'Accessories',
    blurb: 'Bags, belts, small leather goods — presentation-first packaging.',
    dimensions: { w: 200, h: 150, d: 80 },
    weight: 250,
    fragility: 'low',
  },
  {
    id: 'other',
    label: 'Something else',
    blurb: "Describe the product in the chat and I'll find the closest match.",
    dimensions: { w: 150, h: 100, d: 60 },
    weight: 250,
    fragility: 'medium',
  },
]

export const DIMENSION_REFERENCE_CHIPS = [
  { label: 'phone-sized', dimensions: { w: 75, h: 150, d: 8 } as Dimensions },
  { label: '0.5l bottle', dimensions: { w: 65, h: 210, d: 65 } as Dimensions },
  { label: 'A5 sheet', dimensions: { w: 148, h: 210, d: 5 } as Dimensions },
]

export const CHANNEL_OPTIONS: { id: 'courier' | 'parcel_locker' | 'retail_shelf' | 'hand' | 'gift'; label: string; blurb: string }[] = [
  { id: 'courier', label: 'Shipping box', blurb: 'Goes out by courier or parcel locker — protection in transit is the priority.' },
  { id: 'retail_shelf', label: 'Product box', blurb: 'Sits on a shelf, in a hand, or as a gift — looks are the priority.' },
]

export const QUIZ_QUESTIONS = [
  'What are you packing?',
  'Is this a shipping box or a product box?',
  'What are its dimensions?',
  'What quantity are you planning?',
  "What's your budget per piece?",
]
