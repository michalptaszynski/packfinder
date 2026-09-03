import { jsPDF } from 'jspdf'
import { asset } from './asset'
import { formatMoney } from './format'
import { formatCm } from './units'
import { CATEGORY_PRESETS, CHANNEL_OPTIONS } from '@/data/categoryPresets'
import { COVERAGE_OPTIONS, MATERIAL_OPTIONS, STRIP_OPTIONS } from '@/data/refinements'
import { getArchetype } from '@/engine/pricing'
import type { DirectionCard, Slots } from '@/types'

/**
 * The brief as a one-page PDF, on Packhelp letterhead.
 *
 * Everything on the page has already been agreed in the conversation — this
 * writes it down, it does not decide anything. Prices come from the card the
 * person picked, carrying the same "estimated" caveat the tile does.
 */

const PAGE = { w: 210, h: 297 }
const MARGIN = 16
const BLUE = [39, 87, 255] as const
const INK = [26, 26, 25] as const
const MUTED = [139, 139, 135] as const
const RULE = [232, 232, 230] as const

type Translate = (id: string, fallback: string) => string

async function loadFont(path: string): Promise<string> {
  const response = await fetch(asset(path))
  if (!response.ok) throw new Error(`Missing font ${path}`)
  const buffer = new Uint8Array(await response.arrayBuffer())
  let binary = ''
  // Chunked: a spread over a 40k array blows the argument limit.
  for (let i = 0; i < buffer.length; i += 8192) {
    binary += String.fromCharCode(...buffer.subarray(i, i + 8192))
  }
  return btoa(binary)
}

/** The wordmark ships as SVG; jsPDF takes raster, so it goes through a canvas. */
async function loadLogo(): Promise<{ data: string; ratio: number }> {
  const image = new Image()
  image.src = asset('/brand/packhelp-logo.svg')
  await image.decode()
  const scale = 8
  const canvas = document.createElement('canvas')
  canvas.width = image.width * scale
  canvas.height = image.height * scale
  const context = canvas.getContext('2d')
  if (!context) throw new Error('No 2D context')
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  return { data: canvas.toDataURL('image/png'), ratio: image.width / image.height }
}

interface Row {
  label: string
  value: string
}

function briefRows(slots: Slots, t: Translate): Row[] {
  const rows: Row[] = []
  const missing = t('spec.notSet', 'not set')

  const preset = CATEGORY_PRESETS.find((p) => p.id === slots.productCategory?.value)
  if (preset) {
    rows.push({ label: t('spec.product', 'What is being packed'), value: t(`cat.${preset.id}.label`, preset.label) })
  }

  const channel = CHANNEL_OPTIONS.find((option) => option.id === slots.channel?.value)
  if (channel) {
    rows.push({ label: t('spec.purpose', 'Packaging purpose'), value: t(`channel.${channel.id}.label`, channel.label) })
  }

  const dimensions = slots.dimensions?.value
  if (dimensions) {
    rows.push({
      label: t('spec.dimensions', 'Product dimensions'),
      value: `${formatCm(dimensions.w)} × ${formatCm(dimensions.h)} × ${formatCm(dimensions.d)} cm`,
    })
  }

  rows.push({
    label: t('spec.quantity', 'Quantity'),
    value: slots.quantity ? `${slots.quantity.value} ${t('chrome.pcs', 'pcs')}` : missing,
  })
  rows.push({
    label: t('spec.budget', 'Budget for the run'),
    value: slots.budgetTotal ? formatMoney(slots.budgetTotal.value) : missing,
  })

  if (slots.vibe?.value?.length) {
    rows.push({ label: t('spec.look', 'Look'), value: slots.vibe.value.join(', ') })
  }
  if (slots.ecoRequirement?.value === 'required') {
    rows.push({ label: t('spec.eco', 'Recycled or recyclable required'), value: t('spec.yes', 'Yes') })
  }
  if (slots.foodContact?.value) {
    rows.push({ label: t('spec.food', 'Food contact'), value: t('spec.yes', 'Yes') })
  }

  return rows
}

function refinementRows(slots: Slots, t: Translate): Row[] {
  const rows: Row[] = []
  const groups = [
    ['material', 'materialColour', 'spec.material', 'Material colour', MATERIAL_OPTIONS],
    ['coverage', 'printCoverage', 'spec.coverage', 'Print coverage', COVERAGE_OPTIONS],
    ['strip', 'adhesiveStrip', 'spec.strip', 'Adhesive strip', STRIP_OPTIONS],
  ] as const

  for (const [group, slot, labelKey, labelFallback, options] of groups) {
    const value = slots[slot]?.value
    // "any" is the explicit no-preference answer; it settles nothing worth writing down.
    if (!value || value === 'any') continue
    // The English fallback is the card's own title, not the raw slot value —
    // otherwise a spec written in English reads "kraft" where the card said "Kraft".
    const option = (options as readonly { value: string; title: string }[]).find((o) => o.value === value)
    rows.push({ label: t(labelKey, labelFallback), value: t(`${group}.${value}.title`, option?.title ?? String(value)) })
  }
  return rows
}

function choiceRows(card: DirectionCard | undefined, t: Translate): Row[] {
  if (!card) return []
  const archetype = getArchetype(card.direction.archetype)
  const rows: Row[] = [
    { label: t('spec.format', 'Format'), value: archetype?.label ?? card.direction.archetype },
    { label: t('spec.size', 'Size'), value: card.sizeCode },
  ]
  if (card.price.unit != null) {
    rows.push({ label: t('spec.unitPrice', 'Price per piece'), value: `${formatMoney(card.price.unit)}/pc` })
  }
  if (card.price.total != null) {
    rows.push({ label: t('spec.total', 'Total'), value: formatMoney(card.price.total) })
  }
  return rows
}

export async function downloadSpecification(slots: Slots, chosen: DirectionCard | undefined, t: Translate) {
  const [regular, medium, logo] = await Promise.all([
    loadFont('/fonts/Geist-Regular.ttf'),
    loadFont('/fonts/Geist-Medium.ttf'),
    loadLogo(),
  ])

  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  // Embedded rather than a built-in: the standard fonts are WinAnsi, which has
  // no ł, ę or ż, and the conversation may well have been held in Polish.
  doc.addFileToVFS('Geist-Regular.ttf', regular)
  doc.addFont('Geist-Regular.ttf', 'Geist', 'normal')
  doc.addFileToVFS('Geist-Medium.ttf', medium)
  doc.addFont('Geist-Medium.ttf', 'Geist', 'bold')
  doc.setFont('Geist', 'normal')

  const logoHeight = 6
  doc.addImage(logo.data, 'PNG', MARGIN, MARGIN, logoHeight * logo.ratio, logoHeight)

  let y = MARGIN + 24

  doc.setFont('Geist', 'bold').setFontSize(20).setTextColor(...INK)
  doc.text(t('spec.title', 'Packaging specification'), MARGIN, y)
  y += 7
  doc.setFont('Geist', 'normal').setFontSize(10).setTextColor(...MUTED)
  doc.text(t('spec.subtitle', 'Everything settled in this conversation.'), MARGIN, y)
  y += 4
  doc.text(new Date().toLocaleDateString(), MARGIN, y)
  y += 12

  const section = (title: string, rows: Row[]) => {
    if (rows.length === 0) return
    doc.setFont('Geist', 'bold').setFontSize(9).setTextColor(...BLUE)
    doc.text(title.toUpperCase(), MARGIN, y)
    y += 6

    for (const row of rows) {
      doc.setDrawColor(...RULE).setLineWidth(0.2)
      doc.line(MARGIN, y - 4, PAGE.w - MARGIN, y - 4)
      doc.setFont('Geist', 'normal').setFontSize(10).setTextColor(...MUTED)
      doc.text(row.label, MARGIN, y)
      doc.setFont('Geist', 'bold').setTextColor(...INK)
      // Right-aligned so the values line up whatever the labels measure.
      doc.text(row.value, PAGE.w - MARGIN, y, { align: 'right' })
      y += 8
    }
    y += 6
  }

  section(t('spec.brief', 'The brief'), briefRows(slots, t))
  section(t('spec.refinements', 'Narrowing'), refinementRows(slots, t))
  section(t('spec.choice', 'Chosen direction'), choiceRows(chosen, t))

  if (chosen?.price.priceSource === 'mocked') {
    doc.setFont('Geist', 'normal').setFontSize(9).setTextColor(...MUTED)
    doc.text(t('spec.estimated', 'Estimated price — not a binding quote.'), MARGIN, y)
  }

  doc.setFont('Geist', 'normal').setFontSize(8).setTextColor(...MUTED)
  doc.text(t('spec.footer', 'Generated by Packfinder.'), MARGIN, PAGE.h - MARGIN)

  doc.save('packhelp-specification.pdf')
}
