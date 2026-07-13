import { cardHeightForWidth } from '../constants/CardLayout';
import { COLORS } from '../constants/Colors';
import { Rank, Suit } from '../types/gameTypes';
import { IMAGES } from './assets';

export interface CardFaceVisual {
  rank: Rank;
  suit: Suit;
  suitColor: string;
  suitImage: (typeof IMAGES)[Suit];
}

export interface CardFaceMetrics {
  width: number;
  height: number;
  cornerRankFontSize: number;
  cornerSuitSize: number;
  cornerSuitVertical: number;
  cornerRankVertical: number;
  cornerRankSuitHorizontal: number;
}

const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUITS: Suit[] = ['spades', 'clubs', 'hearts', 'diamonds'];

const SUIT_COLORS: Record<Suit, string> = {
  hearts: COLORS.hearts,
  diamonds: COLORS.diamonds,
  clubs: COLORS.clubs,
  spades: COLORS.spades,
};

function faceKey(rank: Rank, suit: Suit): string {
  return `${rank}:${suit}`;
}

/** All 52 face-up card visuals, built once at module load. */
export const CARD_FACE_VISUALS: Record<string, CardFaceVisual> = Object.fromEntries(
  SUITS.flatMap((suit) =>
    RANKS.map((rank) => {
      const key = faceKey(rank, suit);
      return [
        key,
        {
          rank,
          suit,
          suitColor: SUIT_COLORS[suit],
          suitImage: IMAGES[suit],
        } satisfies CardFaceVisual,
      ];
    })
  )
);

export function getCardFaceVisual(rank: Rank, suit: Suit): CardFaceVisual {
  return CARD_FACE_VISUALS[faceKey(rank, suit)];
}

const metricsCache = new Map<number, CardFaceMetrics>();

/** Layout sizes for a card width; cached by rounded pixel width. */
export function getCardFaceMetrics(cardWidth: number): CardFaceMetrics {
  const key = Math.max(1, Math.round(cardWidth));
  let metrics = metricsCache.get(key);
  if (!metrics) {
    metrics = {
      width: key,
      height: cardHeightForWidth(key),
      cornerRankFontSize: key * 0.3,
      cornerSuitSize: key * 0.25,
      cornerSuitVertical: key * 0.1,
      cornerRankVertical: key * 0.05,
      cornerRankSuitHorizontal: key * 0.1,
    };
    metricsCache.set(key, metrics);
  }
  return metrics;
}

/** Pre-warm caches for the current card width so first paint avoids cold lookups. */
export function warmCardFaceCache(cardWidth: number): void {
  getCardFaceMetrics(cardWidth);
}
