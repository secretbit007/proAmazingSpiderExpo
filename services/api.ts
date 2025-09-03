import { GameState, MoveRequest } from '../types/gameTypes';

const API_BASE_URL = 'http://80.92.204.119:8000/api/v1';

const handleResponse = async (response: Response): Promise<any> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.detail || `HTTP error! status: ${response.status}`);
  }
  return await response.json();
};

export const api = {
  startNewGame: async (difficulty: number): Promise<GameState> => {
    const response = await fetch(`${API_BASE_URL}/new-game`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ difficulty }),
    });
    return handleResponse(response);
  },

  getGameState: async (): Promise<GameState> => {
    const response = await fetch(`${API_BASE_URL}/game-state`);
    return handleResponse(response);
  },

  makeMove: async (request: MoveRequest): Promise<GameState[]> => {
    const response = await fetch(`${API_BASE_URL}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    return handleResponse(response);
  },

  dealCards: async (): Promise<GameState> => {
    const response = await fetch(`${API_BASE_URL}/deal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(response);
  },

  solveGame: async (): Promise<GameState[]> => {
    const response = await fetch(`${API_BASE_URL}/solve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(response);
  },

  undoMove: async (): Promise<GameState> => {
    const response = await fetch(`${API_BASE_URL}/undo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return handleResponse(response);
  },
};