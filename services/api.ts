import { GameState, MoveRequest } from '../types/gameTypes';
import { sessionStorage } from '../utils/sessionStorage';

const API_BASE_URL = 'https://guntawong1.sydney:8443/api/v1';

const handleResponse = async (response: Response): Promise<any> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || `HTTP error! status: ${response.status}`);
  }
  return await response.json();
};

const buildUrlWithSession = (endpoint: string): string => {
  const sessionId = sessionStorage.getSessionId();
  const baseUrl = `${API_BASE_URL}${endpoint}`;
  return sessionId ? `${baseUrl}?session_id=${sessionId}` : baseUrl;
};

export const api = {
  startNewGame: async (difficulty: number): Promise<{ session_id: string; game_state: GameState }> => {
    const response = await fetch(buildUrlWithSession('/new-game'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ difficulty }),
    });
    return handleResponse(response);
  },

  getGameState: async (): Promise<GameState> => {
    const response = await fetch(buildUrlWithSession('/game-state'));
    return handleResponse(response);
  },

  makeMove: async (request: MoveRequest): Promise<GameState[]> => {
    const response = await fetch(buildUrlWithSession('/move'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    return handleResponse(response);
  },

  dealCards: async (): Promise<GameState> => {
    const response = await fetch(buildUrlWithSession('/deal'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(response);
  },

  solveGame: async (): Promise<GameState[]> => {
    const response = await fetch(buildUrlWithSession('/solve'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(response);
  },

  undoMove: async (): Promise<GameState> => {
    const response = await fetch(buildUrlWithSession('/undo'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(response);
  },
};