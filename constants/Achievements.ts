export type AchievementId = 'streak7' | 'hardWin' | 'noUndo';

export interface AchievementDef {
  id: AchievementId;
  title: string;
  description: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'streak7',
    title: '7-Day Streak',
    description: 'Win the Daily Challenge 7 days in a row',
  },
  {
    id: 'hardWin',
    title: 'Hard Win',
    description: 'Win a game on Hard or tougher',
  },
  {
    id: 'noUndo',
    title: 'Clean Sweep',
    description: 'Win without using Undo',
  },
];

export const ACHIEVEMENT_BY_ID: Record<AchievementId, AchievementDef> = {
  streak7: ACHIEVEMENTS[0],
  hardWin: ACHIEVEMENTS[1],
  noUndo: ACHIEVEMENTS[2],
};

export const HARD_DIFFICULTY_MIN = 6;
