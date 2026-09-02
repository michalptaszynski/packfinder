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
  /**
   * Words people actually type for this category. Deliberately *not* fed to
   * the main parser — several are ambiguous across categories ("glasses",
   * "jar", "watch") — they only power the clarifier, which proposes a
   * rephrasing instead of silently guessing.
   */
  hints?: string[]
}

export const CATEGORY_PRESETS: CategoryPreset[] = [
  {
    id: 'clothing',
    hints: ['t-shirt', 'shirt', 'hoodie', 'dress', 'socks', 'textile', 'fabric', 'sweater', 'underwear'],
    label: 'Clothing',
    blurb: 'Soft packaging that protects fabric and looks great when unboxed.',
    dimensions: { w: 250, h: 350, d: 50 },
    weight: 300,
    fragility: 'low',
    photo: '/photos/main/clothing.jpg',
  },
  {
    id: 'cosmetics',
    hints: ['cream', 'serum', 'lipstick', 'perfume', 'soap', 'shampoo', 'tube', 'sachet'],
    label: 'Cosmetics',
    blurb: 'A small, elegant box fitted to jars and tubes.',
    dimensions: { w: 60, h: 120, d: 60 },
    weight: 150,
    fragility: 'low',
    photo: '/photos/main/cosmetics.jpg',
  },
  {
    id: 'gift_set',
    hints: ['hamper', 'bundle', 'present', 'christmas', 'set', 'kit', 'box set'],
    label: 'Gift set',
    blurb: 'A rigid or drawer box with a real "wow" factor on opening.',
    dimensions: { w: 230, h: 160, d: 70 },
    weight: 600,
    fragility: 'medium',
    photo: '/photos/main/gift_set.jpg',
  },
  {
    id: 'bottles',
    hints: ['glass', 'glassware', 'drinking glasses', 'bottle', 'jar', 'vial', 'wine', 'beer', 'oil', 'juice', 'tumbler'],
    label: 'Bottles & liquids',
    blurb: 'Glass or liquids — needs solid protection against breakage.',
    dimensions: { w: 70, h: 220, d: 70 },
    weight: 500,
    fragility: 'high',
    photo: '/photos/main/bottles.jpg',
  },
  {
    id: 'food',
    hints: ['coffee', 'tea', 'chocolate', 'snack', 'candy', 'sweets', 'pasta', 'spices', 'granola'],
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
    hints: ['ring', 'necklace', 'earrings', 'bracelet', 'pendant', 'watch', 'charm'],
    label: 'Jewelry & small items',
    blurb: 'Delicate, small items — a precise fit matters most.',
    dimensions: { w: 80, h: 60, d: 25 },
    weight: 50,
    fragility: 'medium',
    photo: '/photos/main/jewelry.jpg',
  },
  {
    id: 'electronics',
    hints: ['cable', 'charger', 'headphones', 'phone', 'device', 'sensor', 'battery', 'lamp'],
    label: 'Electronics',
    blurb: 'Shock-sensitive — needs reinforced construction.',
    dimensions: { w: 180, h: 120, d: 60 },
    weight: 350,
    fragility: 'high',
    photo: '/photos/main/electronics.jpg',
  },
  {
    id: 'stationery',
    hints: ['notebook', 'poster', 'card', 'paper', 'planner', 'sticker', 'calendar', 'print'],
    label: 'Print & stationery',
    blurb: 'Flat, rigid materials — stationery, prints, cards.',
    dimensions: { w: 210, h: 297, d: 10 },
    weight: 100,
    fragility: 'low',
    photo: '/photos/main/stationery.jpg',
  },
  {
    id: 'toys',
    hints: ['plush', 'puzzle', 'game', 'figurine', 'blocks', 'doll'],
    label: 'Toys',
    blurb: 'Playful, often irregular shapes — durability matters as much as looks.',
    dimensions: { w: 200, h: 150, d: 100 },
    weight: 400,
    fragility: 'medium',
    photo: '/photos/main/toys.jpg',
  },
  {
    id: 'footwear',
    hints: ['shoes', 'sneakers', 'boots', 'sandals', 'slippers', 'trainers'],
    label: 'Footwear',
    blurb: 'Needs room for the shoebox itself, plus a bit of structure.',
    dimensions: { w: 330, h: 200, d: 120 },
    weight: 800,
    fragility: 'low',
    photo: '/photos/main/footwear.jpg',
  },
  {
    id: 'health',
    hints: ['supplement', 'vitamin', 'tablets', 'capsules', 'medical', 'pharmacy', 'blister', 'ointment'],
    label: 'Health & supplements',
    blurb: 'Bottles, jars, or blister packs — tamper-evidence often matters.',
    dimensions: { w: 80, h: 150, d: 80 },
    weight: 200,
    fragility: 'medium',
    photo: '/photos/main/health.jpg',
  },
  {
    id: 'accessories',
    hints: ['glasses', 'sunglasses', 'eyewear', 'belt', 'wallet', 'scarf', 'handbag', 'keychain', 'umbrella', 'gloves'],
    label: 'Accessories',
    blurb: 'Bags, belts, small leather goods — presentation-first packaging.',
    dimensions: { w: 200, h: 150, d: 80 },
    weight: 250,
    fragility: 'low',
    photo: '/photos/main/accessories.jpg',
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

export const CHANNEL_OPTIONS: { id: 'courier' | 'parcel_locker' | 'retail_shelf' | 'hand' | 'gift'; label: string; blurb: string }[] = [
  { id: 'courier', label: 'Shipping packaging', blurb: 'Goes out by courier or parcel locker — a box, mailer or poly mailer, whatever survives transit.' },
  { id: 'retail_shelf', label: 'Product packaging', blurb: 'Sits on a shelf, in a hand or under a bow — a box, bag or wrap where looks come first.' },
]

export const QUIZ_QUESTIONS = [
  'What are you packing?',
  'Is this shipping packaging or product packaging?',
  'What are its dimensions?',
  'What quantity are you planning?',
  "What's your budget per piece?",
]
