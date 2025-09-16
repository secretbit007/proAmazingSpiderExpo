// In-memory session storage
let currentSessionId: string | null = null;

export const sessionStorage = {
  setSessionId: (sessionId: string): void => {
    currentSessionId = sessionId;
  },

  getSessionId: (): string | null => {
    return currentSessionId;
  },

  clearSessionId: (): void => {
    currentSessionId = null;
  },

  hasSessionId: (): boolean => {
    return currentSessionId !== null;
  }
};
