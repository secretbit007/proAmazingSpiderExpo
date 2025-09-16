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

    // Convert stock
    const stock: Card[] = backendState.stock.map((card: any) => {
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
    });

    return {
      sessionId: backendState.session_id,
      piles,
      stock,
      completedSequences: backendState.completed_sequences,
      moves: backendState.moves,
      difficulty: backendState.difficulty,
      drawsRemaining: backendState.draws_remaining
    };
  });
};