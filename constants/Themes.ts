export type TableThemeId = 'classic' | 'midnight' | 'burgundy';
export type CardBackId = 'classic' | 'navy' | 'crimson';

export interface TableTheme {
  id: TableThemeId;
  label: string;
  feltTint: string;
  felt: string;
  feltLight: string;
  emptySlot: string;
  emptySlotBorder: string;
}

export const TABLE_THEMES: Record<TableThemeId, TableTheme> = {
  classic: {
    id: 'classic',
    label: 'Classic Felt',
    feltTint: 'rgba(26, 92, 52, 0.22)',
    felt: '#1a5c34',
    feltLight: '#2a7a4a',
    emptySlot: 'rgba(201, 162, 39, 0.25)',
    emptySlotBorder: 'rgba(201, 162, 39, 0.55)',
  },
  midnight: {
    id: 'midnight',
    label: 'Midnight',
    feltTint: 'rgba(10, 24, 52, 0.48)',
    felt: '#16324d',
    feltLight: '#2a4a6a',
    emptySlot: 'rgba(120, 170, 220, 0.22)',
    emptySlotBorder: 'rgba(160, 200, 240, 0.5)',
  },
  burgundy: {
    id: 'burgundy',
    label: 'Burgundy',
    feltTint: 'rgba(78, 16, 32, 0.42)',
    felt: '#5c1a2e',
    feltLight: '#7a2a42',
    emptySlot: 'rgba(232, 190, 140, 0.22)',
    emptySlotBorder: 'rgba(232, 190, 140, 0.5)',
  },
};

export const TABLE_THEME_IDS: TableThemeId[] = ['classic', 'midnight', 'burgundy'];
export const CARD_BACK_IDS: CardBackId[] = ['classic', 'navy', 'crimson'];

export const CARD_BACK_LABELS: Record<CardBackId, string> = {
  classic: 'Classic',
  navy: 'Navy',
  crimson: 'Crimson',
};

export const DEFAULT_TABLE_THEME: TableThemeId = 'classic';
export const DEFAULT_CARD_BACK: CardBackId = 'classic';
