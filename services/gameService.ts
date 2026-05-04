import { GameState } from '../types/gameTypes';
import { convertBackendToFrontend } from '../utils/gameStateConverter';
import { buildSolveReplayStates } from '../utils/solveReplay';
import { sessionStorage } from '../utils/sessionStorage';
import { api } from './api';

export const gameService = {
  startNewGame: async (difficulty: number): Promise<GameState[]> => {
    try {
      // Clear any existing session before starting a new game
      sessionStorage.clearSessionId();
      
      const response = await api.startNewGame(difficulty);
      
      // Extract and store session_id if present
      if (response.session_id) {
        sessionStorage.setSessionId(response.session_id);
      }
      
      // The actual game state is nested under 'game_state'
      return convertBackendToFrontend([response.game_state]);
    } catch (error) {
      console.error('Error starting new game:', error);
      throw error;
    }
  },

  getGameState: async (): Promise<GameState[]> => {
    try {
      const backendState = await api.getGameState();
      return convertBackendToFrontend([backendState]);
    } catch (error) {
      // console.error('Error getting game state:', error);
      throw error;
    }
  },

  makeMove: async (
    fromRow: number,
    fromCol: number,
    toRow?: number,
    toCol?: number
  ): Promise<GameState[]> => {
    try {
      const backendState = await api.makeMove({
        from_row: fromRow,
        from_col: fromCol,
        to_row: toRow,
        to_col: toCol,
      });
      return convertBackendToFrontend(backendState);
    } catch (error) {
      // console.error('Error making move:', error);
      throw error;
    }
  },

  dealCards: async (): Promise<GameState[]> => {
    try {
      const backendState = await api.dealCards();
      return convertBackendToFrontend([backendState]);
    } catch (error) {
      // console.error('Error dealing cards:', error);
      throw error;
    }
  },

  solveGame: async (): Promise<GameState[]> => {
    try {
      const raw = await api.solveGame();
      return buildSolveReplayStates(raw);
    } catch (error) {
      // console.error('Error solving game:', error);
      throw error;
    }
  },

  undoMove: async (): Promise<GameState[]> => {
    try {
      const backendState = await api.undoMove();
      return convertBackendToFrontend([backendState]);
    } catch (error) {
      // console.error('Error undoing move:', error);
      throw error;
    }
  },

  clearSession: (): void => {
    sessionStorage.clearSessionId();
  },
};