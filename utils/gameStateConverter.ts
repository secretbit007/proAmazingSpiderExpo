import { Card, GameState, Pile, Rank, Suit } from '../types/gameTypes';

const suitMap: Record<number, Suit> = {
  1: 'spades',
  2: 'clubs',
  3: 'hearts',
  4: 'diamonds',
};

const rankMap: Record<number, Rank> = {
  1: 'A', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7',
  8: '8', 9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K',
};

function normalizeCard(card: any): Card {
  if (card == null || typeof card !== 'object') {
    return { rank: 'A', suit: 'spades', isFaceUp: false };
  }
  if (card.rank === 0 && card.suit === 0) {
    return { rank: 'A', suit: 'spades', isFaceUp: false };
  }
  const r = rankMap[card.rank as number];
  const s = suitMap[card.suit as number];
  if (r !== undefined && s !== undefined) {
    return {
      rank: r,
      suit: s,
      isFaceUp: Boolean(card.is_face_up),
    };
  }
  return { rank: 'A', suit: 'spades', isFaceUp: false };
}

export const convertBackendToFrontend = (backendStates: any[]): GameState[] => {
  if (!Array.isArray(backendStates)) {
    throw new Error('Invalid game state payload: expected JSON array');
  }

  const states = backendStates.map((state) =>
    state?.game_state ? { ...state.game_state, session_id: state.session_id } : state
  );

  return states.map((backendState) => {
    if (backendState == null || typeof backendState !== 'object') {
      throw new Error('Invalid game state: missing state object');
    }

    const pileList = Array.isArray(backendState.piles) ? backendState.piles : [];

    const piles: Pile[] = pileList.map((pile: any) => {
      const cardsRaw = Array.isArray(pile?.cards) ? pile.cards : [];
      return {
        cards: cardsRaw.map((c: any) => normalizeCard(c)),
        lastCardIndex:
          typeof pile?.last_card_index === 'number' ? pile.last_card_index : -1,
      };
    });

    const stockCountRaw =
      typeof backendState.stock_count === 'number'
        ? backendState.stock_count
        : Array.isArray(backendState.stock)
          ? backendState.stock.length
          : 0;

    const stock: Card[] = [];
    if (Array.isArray(backendState.stock) && backendState.stock.length > 0) {
      for (const card of backendState.stock) {
        stock.push(normalizeCard(card));
      }
    }

    return {
      sessionId: backendState.session_id,
      piles,
      stock,
      stockCount: stockCountRaw,
      completedSequences: Number(backendState.completed_sequences) || 0,
      completedSequencesBySuit:
        backendState.completed_sequences_by_suit &&
        typeof backendState.completed_sequences_by_suit === 'object'
          ? backendState.completed_sequences_by_suit
          : {},
      moves: Number(backendState.moves) || 0,
      difficulty: Number(backendState.difficulty) || 0,
      drawsRemaining: Number(backendState.draws_remaining) || 0,
    };
  });
};
