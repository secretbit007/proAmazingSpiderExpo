export const DIFFICULTY_LABELS: Record<number, string> = {
  0: 'Beginner',
  1: 'Novice',
  2: 'Easy',
  3: 'Normal',
  4: 'Medium',
  5: 'Tricky',
  6: 'Hard',
  7: 'Expert',
  8: 'Master',
  9: 'Legendary',
};

export const DEFAULT_DIFFICULTY = 3;
export const MIN_DIFFICULTY = 0;
export const MAX_DIFFICULTY = 9;

export type SuitCount = 1 | 2 | 4;

export const DEFAULT_SUIT_COUNT: SuitCount = 4;

export const SUIT_COUNT_LABELS: Record<SuitCount, string> = {
  1: '1 suit',
  2: '2 suits',
  4: '4 suits',
};

export function clampDifficulty(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_DIFFICULTY;
  return Math.min(MAX_DIFFICULTY, Math.max(MIN_DIFFICULTY, Math.round(value)));
}

export function difficultyLabel(value: number): string {
  return DIFFICULTY_LABELS[clampDifficulty(value)] ?? 'Normal';
}

export function clampSuitCount(value: number): SuitCount {
  if (value === 1 || value === 2) return value;
  return 4;
}
