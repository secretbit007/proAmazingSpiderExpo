import { GameState, MoveRequest } from '../types/gameTypes';
import { API_BASE_URL, API_FETCH_TIMEOUT_MS } from '../constants/ApiConfig';
import { sessionStorage } from '../utils/sessionStorage';

const handleResponse = async (response: Response): Promise<any> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || `HTTP error! status: ${response.status}`);
  }
  const text = await response.text();
  if (!text) {
    return null;
  }
  return JSON.parse(text);
};

const apiFetch = async (path: string, init?: RequestInit): Promise<Response> => {
  const sessionId = sessionStorage.getSessionId();
  const url = `${API_BASE_URL}${path}`;
  const headers = new Headers(init?.headers);
  if (sessionId) {
    headers.set('X-Session-ID', sessionId);
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      ...init,
      headers,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
};

export const api = {
  startNewGame: async (difficulty: number): Promise<{ session_id: string; game_state: GameState }> => {
    const response = await apiFetch('/new-game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ difficulty }),
    });
    return handleResponse(response);
  },

  getGameState: async (): Promise<GameState> => {
    const response = await apiFetch('/game-state');
    return handleResponse(response);
  },

  makeMove: async (request: MoveRequest): Promise<GameState[]> => {
    const response = await apiFetch('/move', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    return handleResponse(response);
  },

  dealCards: async (): Promise<GameState> => {
    const response = await apiFetch('/deal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(response);
  },

  /** Backend returns SolveResponse: { initial_state, events, final_state }. */
  solveGame: async (): Promise<unknown> => {
    const response = await apiFetch('/solve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(response);
  },

  undoMove: async (): Promise<GameState> => {
    const response = await apiFetch('/undo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(response);
  },
};
