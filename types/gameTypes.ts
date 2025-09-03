export type Suit = 'spades' | 'clubs' | 'hearts' | 'diamonds';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  rank: Rank;
  suit: Suit;
  isFaceUp: boolean;
}

export interface Pile {
  cards: Card[];
  lastCardIndex: number;
}

export interface GameState {
  piles: Pile[];
  stock: Card[];
  completedSequences: number;
  moves: number;
  difficulty: number;
  drawsRemaining: number;
}

export interface MoveRequest {
  from_row: number;
  from_col: number;
  to_row?: number;
  to_col?: number;
}