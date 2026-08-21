import AsyncStorage from '@react-native-async-storage/async-storage';
import { clampDifficulty, clampSuitCount, DEFAULT_DIFFICULTY, DEFAULT_SUIT_COUNT, SuitCount } from '../constants/Difficulty';

const STATS_KEY = '@proAmazingSpider/playerStats';
const DIFFICULTY_KEY = '@proAmazingSpider/preferredDifficulty';
const SUIT_KEY = '@proAmazingSpider/preferredSuitCount';
const LAST_DAILY_WIN_KEY = '@proAmazingSpider/lastDailyWinDate';

export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  bestMoves: number | null;
  bestTimeSeconds: number | null;
  bestScore: number | null;
  currentStreak: number;
  bestStreak: number;
  /** YYYY-MM-DD of last recorded win (for streak). */
  lastWinDate: string | null;
}

export interface WinRecord {
  moves: number;
  elapsedSeconds: number;
  score: number;
  difficulty: number;
  isDaily?: boolean;
}

const EMPTY_STATS: PlayerStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  bestMoves: null,
  bestTimeSeconds: null,
  bestScore: null,
  currentStreak: 0,
  bestStreak: 0,
  lastWinDate: null,
};

function todayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number);
  const [by, bm, bd] = b.split('-').map(Number);
  const start = Date.UTC(ay, am - 1, ad);
  const end = Date.UTC(by, bm - 1, bd);
  return Math.round((end - start) / 86400000);
}

export async function loadPreferredDifficulty(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(DIFFICULTY_KEY);
    if (raw == null) return DEFAULT_DIFFICULTY;
    return clampDifficulty(parseInt(raw, 10));
  } catch {
    return DEFAULT_DIFFICULTY;
  }
}

export async function savePreferredDifficulty(difficulty: number): Promise<void> {
  try {
    await AsyncStorage.setItem(DIFFICULTY_KEY, String(clampDifficulty(difficulty)));
  } catch {
    // Ignore persistence errors — game still works.
  }
}

export async function loadPreferredSuitCount(): Promise<SuitCount> {
  try {
    const raw = await AsyncStorage.getItem(SUIT_KEY);
    if (raw == null) return DEFAULT_SUIT_COUNT;
    return clampSuitCount(parseInt(raw, 10));
  } catch {
    return DEFAULT_SUIT_COUNT;
  }
}

export async function savePreferredSuitCount(suitCount: number): Promise<void> {
  try {
    await AsyncStorage.setItem(SUIT_KEY, String(clampSuitCount(suitCount)));
  } catch {
    // Ignore persistence errors.
  }
}

export async function loadLastDailyWinDate(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(LAST_DAILY_WIN_KEY);
  } catch {
    return null;
  }
}

export async function loadPlayerStats(): Promise<PlayerStats> {
  try {
    const raw = await AsyncStorage.getItem(STATS_KEY);
    if (!raw) return { ...EMPTY_STATS };
    const parsed = JSON.parse(raw) as Partial<PlayerStats>;
    return { ...EMPTY_STATS, ...parsed };
  } catch {
    return { ...EMPTY_STATS };
  }
}

async function savePlayerStats(stats: PlayerStats): Promise<void> {
  try {
    await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    // Ignore persistence errors.
  }
}

export async function recordGameStarted(): Promise<PlayerStats> {
  const stats = await loadPlayerStats();
  const next = { ...stats, gamesPlayed: stats.gamesPlayed + 1 };
  await savePlayerStats(next);
  return next;
}

export async function recordWin(win: WinRecord): Promise<PlayerStats> {
  const stats = await loadPlayerStats();
  const today = todayKey();
  let currentStreak = stats.currentStreak;

  if (stats.lastWinDate === today) {
    // Already won today — streak unchanged.
  } else if (stats.lastWinDate && daysBetween(stats.lastWinDate, today) === 1) {
    currentStreak += 1;
  } else {
    currentStreak = 1;
  }

  const bestStreak = Math.max(stats.bestStreak, currentStreak);
  const bestMoves =
    stats.bestMoves == null ? win.moves : Math.min(stats.bestMoves, win.moves);
  const bestTimeSeconds =
    stats.bestTimeSeconds == null
      ? win.elapsedSeconds
      : Math.min(stats.bestTimeSeconds, win.elapsedSeconds);
  const bestScore =
    stats.bestScore == null ? win.score : Math.max(stats.bestScore, win.score);

  const next: PlayerStats = {
    ...stats,
    gamesWon: stats.gamesWon + 1,
    bestMoves,
    bestTimeSeconds,
    bestScore,
    currentStreak,
    bestStreak,
    lastWinDate: today,
  };
  await savePlayerStats(next);
  if (win.isDaily) {
    try {
      await AsyncStorage.setItem(LAST_DAILY_WIN_KEY, today);
    } catch {
      // Ignore persistence errors.
    }
  }
  return next;
}
