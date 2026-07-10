/** Standard playing-card proportions (width : height). */
export const CARD_ASPECT_RATIO = 80 / 120;

export const PILE_COUNT = 10;
export const PILE_GAP = 2;

/** Upper cap so cards do not dominate on very wide screens. */
export const MAX_CARD_WIDTH = 104;

/** Approx. horizontal space lost to table frame, margins, and padding. */
export const TABLE_HORIZONTAL_INSET = 28;

export interface CardLayoutMetrics {
  cardWidth: number;
  cardHeight: number;
  tableauWidth: number;
}

export function computeCardLayout(screenWidth: number): CardLayoutMetrics {
  return computeCardLayoutFromWidth(screenWidth - TABLE_HORIZONTAL_INSET);
}

export function computeCardLayoutFromWidth(availableWidth: number): CardLayoutMetrics {
  const gaps = PILE_GAP * (PILE_COUNT - 1);
  const fitWidth = Math.floor((Math.max(0, availableWidth) - gaps) / PILE_COUNT);
  const cardWidth = Math.min(MAX_CARD_WIDTH, Math.max(1, fitWidth));
  const cardHeight = Math.round(cardWidth / CARD_ASPECT_RATIO);
  const tableauWidth = cardWidth * PILE_COUNT + gaps;

  return { cardWidth, cardHeight, tableauWidth };
}

export function cardHeightForWidth(width: number): number {
  return width / CARD_ASPECT_RATIO;
}
