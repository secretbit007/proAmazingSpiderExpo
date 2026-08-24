import AsyncStorage from '@react-native-async-storage/async-storage';

const PLAYER_ID_KEY = '@proAmazingSpider/playerId';
const NICKNAME_KEY = '@proAmazingSpider/nickname';

export const MAX_NICKNAME_LEN = 20;

export interface PlayerIdentity {
  playerId: string;
  nickname: string;
}

function createPlayerId(): string {
  const cryptoObj = globalThis.crypto as { randomUUID?: () => string } | undefined;
  if (cryptoObj?.randomUUID) {
    return cryptoObj.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const n = (Math.random() * 16) | 0;
    const v = ch === 'x' ? n : (n & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function sanitizeNickname(value: string): string {
  return value.replace(/\s+/g, ' ').trim().slice(0, MAX_NICKNAME_LEN);
}

export function isValidNickname(value: string): boolean {
  const cleaned = sanitizeNickname(value);
  if (!cleaned) return false;
  return /^[A-Za-z0-9 .'_-]+$/.test(cleaned);
}

export async function loadPlayerIdentity(): Promise<PlayerIdentity> {
  try {
    const [existingId, nickname] = await Promise.all([
      AsyncStorage.getItem(PLAYER_ID_KEY),
      AsyncStorage.getItem(NICKNAME_KEY),
    ]);
    let playerId = existingId?.trim() ?? '';
    if (playerId.length < 8) {
      playerId = createPlayerId();
      await AsyncStorage.setItem(PLAYER_ID_KEY, playerId);
    }
    return { playerId, nickname: sanitizeNickname(nickname ?? '') };
  } catch {
    return { playerId: createPlayerId(), nickname: '' };
  }
}

export async function saveNickname(nickname: string): Promise<string> {
  const cleaned = sanitizeNickname(nickname);
  if (!isValidNickname(cleaned)) {
    throw new Error('Use 1–20 letters, numbers, or spaces.');
  }
  await AsyncStorage.setItem(NICKNAME_KEY, cleaned);
  return cleaned;
}
