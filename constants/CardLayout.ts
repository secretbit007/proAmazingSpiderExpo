/** Standard playing-card proportions (width : height). */
export const CARD_ASPECT_RATIO = 80 / 120;

export const PILE_COUNT = 10;
export const PILE_GAP = 3;

/** Smallest readable card width on phones (portrait may scroll). */
export const MIN_CARD_WIDTH = 56;
/** Upper cap so cards do not dominate on tablets. */
export const MAX_CARD_WIDTH = 104;

/** Approx. horizontal space lost to table frame, margins, and padding. */
export const TABLE_HORIZONTAL_INSET = 36;

export interface CardLayoutMetrics {
  cardWidth: number;
  cardHeight: number;
  tableauWidth: number;
  needsScroll: boolean;
}

export function computeCardLayout(screenWidth: number): CardLayoutMetrics {
  const gaps = PILE_GAP * (PILE_COUNT - 1);
  const available = screenWidth - TABLE_HORIZONTAL_INSET - gaps;
  const fitWidth = Math.floor(available / PILE_COUNT);

  const cardWidth = Math.min(MAX_CARD_WIDTH, Math.max(MIN_CARD_WIDTH, fitWidth));
  const cardHeight = Math.round(cardWidth / CARD_ASPECT_RATIO);
  const tableauWidth = cardWidth * PILE_COUNT + gaps;
  const needsScroll = tableauWidth > screenWidth - 12;

  return { cardWidth, cardHeight, tableauWidth, needsScroll };
}

export function cardHeightForWidth(width: number): number {
  return width / CARD_ASPECT_RATIO;
}
