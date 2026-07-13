/** Standard playing-card proportions (width : height). */
export const CARD_ASPECT_RATIO = 80 / 120;

export const PILE_COUNT = 10;
export const PILE_GAP = 2;

/** Upper cap in portrait / general use. */
export const MAX_CARD_WIDTH = 104;
/** Tighter cap in landscape so cards do not dominate the shorter viewport. */
export const MAX_CARD_WIDTH_LANDSCAPE = 68;

/** Approx. horizontal space lost to table frame, margins, and padding. */
export const TABLE_HORIZONTAL_INSET = 28;

export interface CardLayoutMetrics {
  cardWidth: number;
  cardHeight: number;
  tableauWidth: number;
}

export interface CardLayoutOptions {
  /** Measured inner table width (preferred). */
  availableWidth: number;
  /** Measured inner table height; used to cap card size in landscape. */
  availableHeight?: number;
  /** Screen width for orientation detection when height not passed. */
  screenWidth?: number;
  /** Screen height for orientation detection. */
  screenHeight?: number;
}

function isLandscapeLayout(
  availableHeight: number | undefined,
  screenWidth: number | undefined,
  screenHeight: number | undefined
): boolean {
  if (screenWidth != null && screenHeight != null && screenWidth > screenHeight) {
    return true;
  }
  if (availableHeight != null && screenWidth != null && screenWidth > availableHeight * 1.15) {
    return true;
  }
  return false;
}

export function computeCardLayout(screenWidth: number, screenHeight?: number): CardLayoutMetrics {
  return computeCardLayoutFromWidth(screenWidth - TABLE_HORIZONTAL_INSET, undefined, screenWidth, screenHeight);
}

export function computeCardLayoutFromWidth(
  availableWidth: number,
  availableHeight?: number,
  screenWidth?: number,
  screenHeight?: number
): CardLayoutMetrics {
  const gaps = PILE_GAP * (PILE_COUNT - 1);
  const fitWidth = Math.floor((Math.max(0, availableWidth) - gaps) / PILE_COUNT);

  const landscape = isLandscapeLayout(availableHeight, screenWidth, screenHeight);
  let maxWidth = landscape ? MAX_CARD_WIDTH_LANDSCAPE : MAX_CARD_WIDTH;

  if (landscape && availableHeight != null && availableHeight > 0) {
    // Keep card height from dominating a short landscape column.
    const maxByColumnHeight = Math.floor((availableHeight * 0.2) * CARD_ASPECT_RATIO);
    if (maxByColumnHeight > 0) {
      maxWidth = Math.min(maxWidth, maxByColumnHeight);
    }
  }

  const cardWidth = Math.min(maxWidth, Math.max(1, fitWidth));
  const cardHeight = Math.round(cardWidth / CARD_ASPECT_RATIO);
  const tableauWidth = cardWidth * PILE_COUNT + gaps;

  return { cardWidth, cardHeight, tableauWidth };
}

export function cardHeightForWidth(width: number): number {
  return width / CARD_ASPECT_RATIO;
}
