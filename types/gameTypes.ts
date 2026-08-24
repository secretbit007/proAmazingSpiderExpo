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
  sessionId?: string;
  piles: Pile[];
  /** Face-down stock cards not yet dealt (synthetic placeholders). */
  stock: Card[];
  /** From API `stock_count` when wire format omits bulky stock array. */
  stockCount?: number;
  completedSequences: number;
  completedSequencesBySuit: Record<number, number>; // suit -> count mapping
  moves: number;
  difficulty: number;
  drawsRemaining: number;
  suitCount?: number;
  seed?: number | null;
}

export interface MoveRequest {
  from_row: number;
  from_col: number;
  to_row?: number;
  to_col?: number;
}

export interface HintResponse {
  from_row: number | null;
  from_col: number | null;
  to_col: number | null;
  reason: string;
  message: string;
}

export interface DailyChallenge {
  date: string;
  seed: number;
  difficulty: number;
  suit_count: number;
  label?: string;
}

export interface LeaderboardEntry {
  rank: number;
  nickname: string;
  score: number;
  moves: number;
  elapsed_seconds: number;
  is_you: boolean;
}

export interface LeaderboardYou {
  rank: number;
  nickname: string;
  score: number;
  moves: number;
  elapsed_seconds: number;
}

export interface LeaderboardResponse {
  date: string;
  entries: LeaderboardEntry[];
  you: LeaderboardYou | null;
  total: number;
}