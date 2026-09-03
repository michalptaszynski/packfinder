import { asset } from '../lib/asset'

export interface PackagingIdea {
  brand: string
  /** The case study this shot comes from, on packhelp.com. */
  href: string
  /** What was actually made — taken from that case study, not inferred. */
  product: string
  photo: string
  /** Real height/width of the file, so tiles are never cropped. */
  ratio: number
}

/**
 * Real work from packhelp.com/packaging-ideas — the tile from the index plus
 * the editorial shots on each case study, downloaded into public/ rather than
 * hotlinked (the brief: "hotlinked images rot within days").
 */
export const PACKAGING_IDEAS: PackagingIdea[] = [
  { brand: 'Djuce', product: 'Four-can gift pack with a handle', href: 'https://packhelp.com/case-study/djuce/', photo: asset('/photos/ideas/djuce-1.jpg'), ratio: 0.75 },
  { brand: 'Djuce', product: 'Four-can gift pack with a handle', href: 'https://packhelp.com/case-study/djuce/', photo: asset('/photos/ideas/djuce-2.jpg'), ratio: 0.75 },
  { brand: 'Djuce', product: 'Mailer box with a custom can divider', href: 'https://packhelp.com/case-study/djuce/', photo: asset('/photos/ideas/djuce-3.jpg'), ratio: 2.298 },
  { brand: 'Kuyichi', product: 'Paper mailer with a return strip', href: 'https://packhelp.com/case-study/kuyichi/', photo: asset('/photos/ideas/kuyichi-1.jpg'), ratio: 0.666 },
  { brand: 'Kuyichi', product: 'Paper mailer with a return strip', href: 'https://packhelp.com/case-study/kuyichi/', photo: asset('/photos/ideas/kuyichi-2.jpg'), ratio: 0.667 },
  { brand: 'Kuyichi', product: 'Paper mailer with a return strip', href: 'https://packhelp.com/case-study/kuyichi/', photo: asset('/photos/ideas/kuyichi-3.jpg'), ratio: 1.506 },
  { brand: 'Oase', product: 'Rigid box with a custom insert', href: 'https://packhelp.com/inspiration/oase-hair-vitamins/', photo: asset('/photos/ideas/oase-1.jpg'), ratio: 0.667 },
  { brand: 'Psi Bufet', product: 'Insulated shipping box, honeycomb lining', href: 'https://packhelp.com/case-study/insulated-shipping-boxes-psi-bufet-case-study/', photo: asset('/photos/ideas/psi-bufet-1.jpg'), ratio: 0.667 },
  { brand: 'Psi Bufet', product: 'Insulated shipping box, honeycomb lining', href: 'https://packhelp.com/case-study/insulated-shipping-boxes-psi-bufet-case-study/', photo: asset('/photos/ideas/psi-bufet-2.jpg'), ratio: 0.508 },
  { brand: 'Your KAYA', product: 'Rigid drawer box, 1.5 mm solid board', href: 'https://packhelp.com/case-study/your-kaya-multiple-use-gift-set-box/', photo: asset('/photos/ideas/your-kaya-1.jpg'), ratio: 0.694 },
  { brand: 'Your KAYA', product: 'Rigid drawer box, 1.5 mm solid board', href: 'https://packhelp.com/case-study/your-kaya-multiple-use-gift-set-box/', photo: asset('/photos/ideas/your-kaya-2.jpg'), ratio: 0.508 },
  { brand: 'Your KAYA', product: 'Rigid drawer box, 1.5 mm solid board', href: 'https://packhelp.com/case-study/your-kaya-multiple-use-gift-set-box/', photo: asset('/photos/ideas/your-kaya-3.jpg'), ratio: 1.773 },
  { brand: 'Hemp Juice', product: 'Product box, full-colour print', href: 'https://packhelp.com/case-study/hemp-juice-dietary-supplement-packaging/', photo: asset('/photos/ideas/hemp-juice-1.jpg'), ratio: 0.727 },
  { brand: 'Hemp Juice', product: 'Product box, full-colour print', href: 'https://packhelp.com/case-study/hemp-juice-dietary-supplement-packaging/', photo: asset('/photos/ideas/hemp-juice-2.jpg'), ratio: 0.508 },
  { brand: 'Hemp Juice', product: 'Product box, full-colour print', href: 'https://packhelp.com/case-study/hemp-juice-dietary-supplement-packaging/', photo: asset('/photos/ideas/hemp-juice-3.jpg'), ratio: 1.419 },
  { brand: 'Fluus', product: 'Letterbox-sized flat-pack mailer', href: 'https://packhelp.com/case-study/fluus/', photo: asset('/photos/ideas/fluus-1.jpg'), ratio: 0.595 },
  { brand: 'Fluus', product: 'Letterbox-sized flat-pack mailer', href: 'https://packhelp.com/case-study/fluus/', photo: asset('/photos/ideas/fluus-2.jpg'), ratio: 0.595 },
  { brand: 'Fluus', product: 'Product wrap for the pads', href: 'https://packhelp.com/case-study/fluus/', photo: asset('/photos/ideas/fluus-3.jpg'), ratio: 1.777 },
  { brand: 'XLASH', product: 'Mailer box with an adhesive strip', href: 'https://packhelp.com/case-study/xlash-cosmetics-packaging/', photo: asset('/photos/ideas/xlash-1.jpg'), ratio: 0.602 },
  { brand: 'XLASH', product: 'Mailer box with an adhesive strip', href: 'https://packhelp.com/case-study/xlash-cosmetics-packaging/', photo: asset('/photos/ideas/xlash-2.jpg'), ratio: 0.602 },
  { brand: 'XLASH', product: 'Mailer box with an adhesive strip', href: 'https://packhelp.com/case-study/xlash-cosmetics-packaging/', photo: asset('/photos/ideas/xlash-3.jpg'), ratio: 1.595 },
]
