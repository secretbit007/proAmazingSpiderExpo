import { Card, GameState, Pile, Rank, Suit } from '../types/gameTypes';

export const convertBackendToFrontend = (backendStates: any[]): GameState[] => {
  // Handle both direct game state and nested API response format
  const states = backendStates.map(state => 
    state.game_state ? { ...state.game_state, session_id: state.session_id } : state
  );
  const suitMap: Record<number, Suit> = {
    1: 'spades',
    2: 'clubs',
    3: 'hearts',
    4: 'diamonds',
  };

  const rankMap: Record<number, Rank> = {
    1: 'A', 2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7',
    8: '8', 9: '9', 10: '10', 11: 'J', 12: 'Q', 13: 'K'
  };

  return states.map(backendState => {
    // Convert piles
    const piles: Pile[] = backendState.piles.map((pile: any) => ({
      cards: pile.cards.map((card: any) => {
        // Handle placeholder cards (rank: 0, suit: 0)
        if (card.rank === 0 && card.suit === 0) {
          return {
            rank: 'A' as Rank, // Default rank for placeholder
            suit: 'spades' as Suit, // Default suit for placeholder
            isFaceUp: false, // Placeholder cards should be face down
          };
        }
        return {
          rank: rankMap[card.rank],
          suit: suitMap[card.suit],
          isFaceUp: card.is_face_up,
        };
      }),
      lastCardIndex: pile.last_card_index
    }));

    const stockCountRaw =
      typeof backendState.stock_count === 'number'
        ? backendState.stock_count
        : Array.isArray(backendState.stock)
          ? backendState.stock.length
          : 0;

    // Prefer compact API: stock_count with empty stock; legacy: long placeholder list.
    const stock: Card[] = [];
    const placeholder = (): Card => ({
      rank: 'A' as Rank,
      suit: 'spades' as Suit,
      isFaceUp: false,
    });
    if (Array.isArray(backendState.stock) && backendState.stock.length > 0) {
      for (const card of backendState.stock) {
        if (card.rank === 0 && card.suit === 0) {
          stock.push(placeholder());
        } else {
          stock.push({
            rank: rankMap[card.rank],
            suit: suitMap[card.suit],
            isFaceUp: card.is_face_up,
          });
        }
      }
    }
    // Compact wire format (stock_count, empty stock): keep stock empty in memory; UI uses drawsRemaining / stockCount.

    return {
      sessionId: backendState.session_id,
      piles,
      stock,
      stockCount: stockCountRaw,
      completedSequences: backendState.completed_sequences,
      completedSequencesBySuit: backendState.completed_sequences_by_suit || {},
      moves: backendState.moves,
      difficulty: backendState.difficulty,
      drawsRemaining: backendState.draws_remaining
    };
  });
};