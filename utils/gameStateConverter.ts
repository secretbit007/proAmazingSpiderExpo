import { Card, GameState, Pile, Rank, Suit } from '../types/gameTypes';

export const convertBackendToFrontend = (backendStates: any[]): GameState[] => {
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

  return backendStates.map(backendState => {
    // Convert piles
    const piles: Pile[] = backendState.piles.map((pile: any) => ({
      cards: pile.cards.map((card: any) => ({
        rank: rankMap[card.rank],
        suit: suitMap[card.suit],
        isFaceUp: card.is_face_up,
        id: card.id
      })),
      lastCardIndex: pile.last_card_index
    }));

    // Convert stock
    const stock: Card[] = backendState.stock.map((card: any) => ({
      rank: rankMap[card.rank],
      suit: suitMap[card.suit],
      isFaceUp: card.is_face_up,
      id: card.id
    }));

    return {
      piles,
      stock,
      completedSequences: backendState.completed_sequences,
      moves: backendState.moves,
      difficulty: backendState.difficulty,
      drawsRemaining: backendState.draws_remaining
    };
  });
};