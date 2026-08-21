import AsyncStorage from '@react-native-async-storage/async-storage';
import { AchievementId, ACHIEVEMENTS, HARD_DIFFICULTY_MIN } from '../constants/Achievements';

const UNLOCKED_KEY = '@proAmazingSpider/achievements';

export type UnlockedMap = Partial<Record<AchievementId, string>>;

export async function loadUnlockedAchievements(): Promise<UnlockedMap> {
  try {
    const raw = await AsyncStorage.getItem(UNLOCKED_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as UnlockedMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

async function saveUnlockedAchievements(map: UnlockedMap): Promise<void> {
  try {
    await AsyncStorage.setItem(UNLOCKED_KEY, JSON.stringify(map));
  } catch {
    // Ignore persistence errors.
  }
}

export interface WinUnlockInput {
  isDaily: boolean;
  dailyStreak: number;
  difficulty: number;
  usedUndo: boolean;
}

export async function unlockAchievementsForWin(input: WinUnlockInput): Promise<AchievementId[]> {
  const current = await loadUnlockedAchievements();
  const newly: AchievementId[] = [];
  const today = new Date().toISOString().slice(0, 10);

  const earned: AchievementId[] = [];
  if (input.isDaily && input.dailyStreak >= 7) earned.push('streak7');
  if (input.difficulty >= HARD_DIFFICULTY_MIN) earned.push('hardWin');
  if (!input.usedUndo) earned.push('noUndo');

  for (const id of earned) {
    if (!current[id]) {
      current[id] = today;
      newly.push(id);
    }
  }

  if (newly.length > 0) {
    await saveUnlockedAchievements(current);
  }
  return newly;
}

export function achievementTitle(id: AchievementId): string {
  return ACHIEVEMENTS.find((a) => a.id === id)?.title ?? id;
}
