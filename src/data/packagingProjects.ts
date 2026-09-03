import type { CoverageChoice, MaterialChoice, StripChoice } from '@/types'

/**
 * The work behind the inspirations board, written up as a starting point.
 *
 * Every line here comes from that project's own case study on packhelp.com —
 * the flute, the grammage, the closure. Nothing is inferred: if a study does
 * not say what board was used, this file does not either.
 *
 * Picking one seeds a fresh brief with what that project settled, so the
 * conversation starts from a real specification instead of a blank page.
 */

export interface ProjectSpec {
  brand: string
  /** Matches PACKAGING_IDEAS.brand — the board groups its photos by it. */
  href: string
  /** One line on who they are, for the opening message. */
  who: string
  /** What was made. */
  format: string
  /** Board, grammage, flute — whatever the study actually states. */
  material: string
  /** Construction details: dividers, inserts, closures, cut-outs. */
  construction: string
  /** Print and finishing. */
  finish: string
  /** What the packaging had to achieve. */
  goal: string
  seed: {
    productCategory: string
    channel: 'courier' | 'retail_shelf'
    materialColour?: MaterialChoice
    printCoverage?: CoverageChoice
    adhesiveStrip?: StripChoice
    eco?: boolean
    vibe?: string[]
  }
}

export const PROJECT_SPECS: ProjectSpec[] = [
  {
    brand: 'Djuce',
    href: 'https://packhelp.com/case-study/djuce/',
    who: 'A canned wine brand that moved off glass bottles to cut packaging emissions.',
    format: 'One-level mailer box, plus a four-can gift pack with a handle',
    material: '4.5 mm EB flute for the outer box, 2 mm E flute for the divider. FSC-certified, recyclable paper',
    construction: 'A custom grid divider sized to the cans, so nothing moves and no void fill is needed',
    finish: 'Printed outside; hidden messages under the cans',
    goal: 'Show the cans off, limit air in the parcel, survive transit',
    seed: { productCategory: 'bottles', channel: 'courier', materialColour: 'kraft', printCoverage: 'outside', eco: true },
  },
  {
    brand: 'Kuyichi',
    href: 'https://packhelp.com/case-study/kuyichi/',
    who: 'A Dutch denim brand built against fast fashion, working towards circular packaging.',
    format: 'Paper mailer, foldable so one size covers several order sizes',
    material: 'FSC-certified paper, produced in Poland to shorten the haul into the EU',
    construction: 'Double closure strip, so the same mailer goes back as a return',
    finish: 'Printed outside',
    goal: 'One recyclable mailer that handles both deliveries and returns',
    seed: {
      productCategory: 'clothing',
      channel: 'courier',
      materialColour: 'kraft',
      printCoverage: 'outside',
      adhesiveStrip: 'with',
      eco: true,
    },
  },
  {
    brand: 'Oase',
    href: 'https://packhelp.com/inspiration/oase-hair-vitamins/',
    who: 'Hair vitamins sold as a considered, shelf-first product.',
    format: 'Rigid box for the product, Eco White mailer boxes for shipping',
    material: 'Rigid board with a smooth white finish',
    construction: 'A custom insert holds the bottle in place inside the box',
    finish: 'Minimal print, gold accents',
    goal: 'Make a supplement read as a classy, desirable object',
    seed: {
      productCategory: 'health',
      channel: 'retail_shelf',
      materialColour: 'coated',
      printCoverage: 'outside',
      vibe: ['lux', 'minimal'],
    },
  },
  {
    brand: 'Psi Bufet',
    href: 'https://packhelp.com/case-study/insulated-shipping-boxes-psi-bufet-case-study/',
    who: 'Fresh, frozen dog food delivered to the door.',
    format: 'Insulated shipping box, engineered from scratch through prototyping and testing',
    material: 'Corrugated cardboard with an organic honeycomb liner — no plastics',
    construction: 'Holds under 4 °C for 48 hours, twice the brief',
    finish: 'Printed outside',
    goal: 'Keep frozen food cold without polystyrene, under 2.24 EUR a piece',
    seed: { productCategory: 'food', channel: 'courier', materialColour: 'kraft', printCoverage: 'outside', eco: true },
  },
  {
    brand: 'Your KAYA',
    href: 'https://packhelp.com/case-study/your-kaya-multiple-use-gift-set-box/',
    who: 'Natural period care, sold on subscription, with an educational mission.',
    format: 'Rigid drawer box for a "my first period" gift set',
    material: 'Durable 1.5 mm solid cardboard',
    construction: 'Drawer design with a bespoke cut-out, sized to the kit and meant to be kept',
    finish: 'Minimal print',
    goal: 'A box worth reusing, with weight and space kept down',
    seed: {
      productCategory: 'gift_set',
      channel: 'courier',
      materialColour: 'white',
      printCoverage: 'outside',
      vibe: ['minimal'],
    },
  },
  {
    brand: 'Hemp Juice',
    href: 'https://packhelp.com/case-study/hemp-juice-dietary-supplement-packaging/',
    who: 'A CBD oil range of six products, each with its own visual character.',
    format: 'Product boxes for the bottles, mailer boxes for shipping',
    material: 'GC1 board at 400 gsm; mailers from 90% recycled corrugated',
    construction: 'One product box size across the range — the bottles share a format',
    finish: 'Offset print with matt foil, natural water-based inks',
    goal: 'One coherent range across six products, 25% off production and fulfilment costs',
    seed: {
      productCategory: 'health',
      channel: 'retail_shelf',
      materialColour: 'coated',
      printCoverage: 'outside',
      eco: true,
    },
  },
  {
    brand: 'Fluus',
    href: 'https://packhelp.com/case-study/fluus/',
    who: 'The first certified flushable, microplastic-free period pad.',
    format: 'Letterbox-sized flat-pack mailer, plus the product wrap',
    material: 'FSC-certified, recyclable board',
    construction: 'Custom flat-pack with no open corners, sized to fit a UK letterbox',
    finish: 'Full-colour print',
    goal: 'No void fill, no shipping air, and an end of life for everything sent out',
    seed: {
      productCategory: 'health',
      channel: 'courier',
      materialColour: 'white',
      printCoverage: 'inside_outside',
      eco: true,
    },
  },
  {
    brand: 'XLASH',
    href: 'https://packhelp.com/case-study/xlash-cosmetics-packaging/',
    who: 'A cosmetics brand that pulled every piece of plastic out of its e-commerce packaging.',
    format: 'Fully customised mailer box for e-commerce delivery',
    material: 'Corrugated board, printed in full colour',
    construction: 'Adhesive strip and tamper-evident sealing tabs',
    finish: 'Printed inside and out, with custom tissue paper',
    goal: 'Drop plastic wrap and mailing bags, keep the unboxing exclusive, cut annual spend by 16%',
    seed: {
      productCategory: 'cosmetics',
      channel: 'courier',
      materialColour: 'kraft',
      printCoverage: 'inside_outside',
      adhesiveStrip: 'with',
      eco: true,
    },
  },
]

export const getProjectSpec = (brand: string) => PROJECT_SPECS.find((spec) => spec.brand === brand)
