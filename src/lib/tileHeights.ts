/**
 * Pinterest-style staggering. Shapes are derived from the direction id rather
 * than drawn at random, so a tile keeps its proportions across re-renders,
 * filter changes and quantity tweaks — a card that changed shape every time
 * the grid rebuilt would be unusable.
 *
 * Stored as height/width ratios rather than pixel heights so the tiles stay
 * portrait at any column width; every value is > 1, i.e. taller than wide.
 */
const PHOTO_RATIOS = [1.15, 1.3, 1.45, 1.62, 1.8]

/** Everything under the photo: title, archetype row, badges, gaps. */
const TILE_TEXT_HEIGHT = 74

/** Only used to weigh columns against each other, so a rough width is fine. */
const NOMINAL_COLUMN_WIDTH = 260

export function photoAspect(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return PHOTO_RATIOS[hash % PHOTO_RATIOS.length]
}

export function tileHeight(id: string): number {
  return photoAspect(id) * NOMINAL_COLUMN_WIDTH + TILE_TEXT_HEIGHT
}
