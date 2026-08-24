import { DailyChallenge, GameState, HintResponse, LeaderboardResponse, MoveRequest } from '../types/gameTypes';
import { API_BASE_URL, API_FETCH_TIMEOUT_MS } from '../constants/ApiConfig';
import { sessionStorage } from '../utils/sessionStorage';

function formatErrorDetail(detail: unknown): string {
  if (detail == null || detail === '') return '';
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((e: unknown) =>
        typeof e === 'object' && e !== null && 'msg' in e
          ? String((e as { msg: string }).msg)
          : JSON.stringify(e)
      )
      .join('; ');
  }
  if (typeof detail === 'object') return JSON.stringify(detail);
  return String(detail);
}

const handleResponse = async (response: Response): Promise<any> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const detail = errorData?.detail;
    const msg = formatErrorDetail(detail) || `HTTP error! status: ${response.status}`;
    throw new Error(msg);
  }
  const text = await response.text();
  if (!text.trim()) {
    throw new Error('Empty response from server');
  }
  try {
    return JSON.parse(text);
  } catch {
    const ct = response.headers.get('content-type') ?? '';
    const snippet = text.replace(/\s+/g, ' ').trim().slice(0, 120);
    throw new Error(
      `Invalid JSON from server (content-type: ${ct || 'none'}). Start of body: ${snippet || '(empty)'}`
    );
  }
};

/** Session is sent via header and query so proxies / RN stacks that drop custom headers still work. */
const urlWithSession = (path: string): string => {
  const sessionId = sessionStorage.getSessionId();
  let url = `${API_BASE_URL}${path}`;
  if (!sessionId) return url;
  const join = path.includes('?') ? '&' : '?';
  url += `${join}session_id=${encodeURIComponent(sessionId)}`;
  return url;
};

const apiFetch = async (path: string, init?: RequestInit): Promise<Response> => {
  const sessionId = sessionStorage.getSessionId();
  const url = urlWithSession(path);
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
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error(`Request timed out after ${API_FETCH_TIMEOUT_MS / 1000}s`);
    }
    throw e;
  } finally {
    clearTimeout(timeoutId);
  }
};

export const api = {
  startNewGame: async (
    difficulty: number,
    options?: { suitCount?: number; seed?: number }
  ): Promise<{ session_id: string; game_state: GameState }> => {
    const response = await apiFetch('/new-game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        difficulty,
        suit_count: options?.suitCount ?? 4,
        seed: options?.seed ?? null,
      }),
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
    const data = await handleResponse(response);
    if (!Array.isArray(data)) {
      throw new Error('Unexpected move response: expected JSON array');
    }
    return data;
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

  getHint: async (): Promise<HintResponse> => {
    const response = await apiFetch('/hint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(response);
  },

  getDailyChallenge: async (): Promise<DailyChallenge> => {
    const response = await apiFetch('/daily');
    return handleResponse(response);
  },

  getDailyLeaderboard: async (playerId: string, date?: string): Promise<LeaderboardResponse> => {
    const params = new URLSearchParams();
    if (playerId) params.set('player_id', playerId);
    if (date) params.set('date', date);
    const query = params.toString();
    const response = await apiFetch(`/leaderboard/daily${query ? `?${query}` : ''}`);
    return handleResponse(response);
  },

  submitDailyScore: async (payload: {
    playerId: string;
    nickname: string;
    elapsedSeconds: number;
    date?: string;
  }): Promise<LeaderboardResponse> => {
    const response = await apiFetch('/leaderboard/daily', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player_id: payload.playerId,
        nickname: payload.nickname,
        elapsed_seconds: payload.elapsedSeconds,
        date: payload.date ?? null,
      }),
    });
    return handleResponse(response);
  },
};
