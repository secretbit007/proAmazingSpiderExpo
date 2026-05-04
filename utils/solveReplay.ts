import { GameState } from '../types/gameTypes';
import { convertBackendToFrontend } from './gameStateConverter';

/** Internal grid row base; must match ProAmazingSpiderAPI `rowbase`. */
const ROWBASE = 5;

type BackendCard = { rank: number; suit: number; is_face_up: boolean };
type BackendPile = { cards: BackendCard[]; last_card_index: number };

export type BackendSolveEvent = {
  type: string;
  from_row?: number;
  from_col?: number;
  to_row?: number;
  to_col?: number;
  rank?: number;
  suit?: number;
};

export type BackendSolveResponse = {
  initial_state: Record<string, unknown>;
  events: BackendSolveEvent[];
  final_state: Record<string, unknown>;
};

function cloneDeep<T>(x: T): T {
  return JSON.parse(JSON.stringify(x));
}

function recomputeLastCardIndices(piles: BackendPile[]): void {
  for (const pile of piles) {
    const { cards } = pile;
    let last = -1;
    for (let i = 0; i < cards.length; i++) {
      if (cards[i].is_face_up) {
        last = i + 1;
      }
    }
    if (last >= 0) {
      pile.last_card_index = last;
    } else if (cards.length > 0) {
      pile.last_card_index = cards[cards.length - 1].is_face_up ? cards.length : -1;
    } else {
      pile.last_card_index = -1;
    }
  }
}

function applySolveEvent(state: Record<string, unknown>, event: BackendSolveEvent): void {
  const piles = state.piles as BackendPile[];
  if (event.type === 'move_card') {
    const fr = event.from_row;
    const fc = event.from_col;
    const tr = event.to_row;
    const tc = event.to_col;
    if (fr === undefined || fc === undefined || tr === undefined || tc === undefined) {
      throw new Error('solve replay move_card missing coordinates');
    }
    const fromIdx = fr - ROWBASE;
    const toIdx = tr - ROWBASE;
    const fromPile = piles[fc].cards;
    const toPile = piles[tc].cards;
    if (fromIdx < 0 || fromIdx >= fromPile.length) {
      throw new Error(`solve replay move_card invalid from_idx ${fromIdx} (from_row=${fr})`);
    }
    fromPile.splice(fromIdx, 1);
    let insertIdx = toIdx;
    if (fc === tc && fromIdx < insertIdx) {
      insertIdx -= 1;
    }
    insertIdx = Math.max(0, Math.min(insertIdx, toPile.length));
    const placed: BackendCard = {
      rank: event.rank ?? 0,
      suit: event.suit ?? 0,
      is_face_up: true,
    };
    toPile.splice(insertIdx, 0, placed);
    recomputeLastCardIndices(piles);
  } else if (event.type === 'flip_card') {
    const fr = event.from_row;
    const fc = event.from_col;
    if (fr === undefined || fc === undefined) {
      throw new Error('solve replay flip_card missing coordinates');
    }
    const idx = fr - ROWBASE;
    const card = piles[fc].cards[idx];
    if (!card) {
      throw new Error(`solve replay flip_card invalid idx ${idx}`);
    }
    if (event.rank !== undefined) card.rank = event.rank;
    if (event.suit !== undefined) card.suit = event.suit;
    card.is_face_up = true;
    recomputeLastCardIndices(piles);
  }
}

function isSolveResponse(body: unknown): body is BackendSolveResponse {
  if (typeof body !== 'object' || body === null) return false;
  const o = body as Record<string, unknown>;
  return (
    o.initial_state !== undefined &&
    typeof o.initial_state === 'object' &&
    o.initial_state !== null &&
    Array.isArray(o.events) &&
    o.final_state !== undefined &&
    typeof o.final_state === 'object' &&
    o.final_state !== null
  );
}

/**
 * Turns POST /solve JSON into a list of frontend game states for replay.
 * New API: { initial_state, events, final_state }. Legacy: GameState[].
 */
export function buildSolveReplayStates(body: unknown): GameState[] {
  if (Array.isArray(body)) {
    return convertBackendToFrontend(body);
  }
  if (!isSolveResponse(body)) {
    throw new Error('Invalid solve response: expected { initial_state, events, final_state } or GameState[]');
  }

  const working = cloneDeep(body.initial_state);
  const out: GameState[] = [...convertBackendToFrontend([working])];

  for (const ev of body.events) {
    applySolveEvent(working, ev);
    out.push(convertBackendToFrontend([working])[0]);
  }

  const finalConverted = convertBackendToFrontend([body.final_state])[0];
  if (out.length === 0) {
    return [finalConverted];
  }
  out[out.length - 1] = finalConverted;
  return out;
}
