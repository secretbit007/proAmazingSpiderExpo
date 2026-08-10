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

export function clampDifficulty(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_DIFFICULTY;
  return Math.min(MAX_DIFFICULTY, Math.max(MIN_DIFFICULTY, Math.round(value)));
}

export function difficultyLabel(value: number): string {
  return DIFFICULTY_LABELS[clampDifficulty(value)] ?? 'Normal';
}
