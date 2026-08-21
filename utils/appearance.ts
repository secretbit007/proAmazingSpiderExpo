import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CardBackId,
  DEFAULT_CARD_BACK,
  DEFAULT_TABLE_THEME,
  TableThemeId,
} from '../constants/Themes';

const TABLE_KEY = '@proAmazingSpider/tableTheme';
const BACK_KEY = '@proAmazingSpider/cardBack';
const SOUND_KEY = '@proAmazingSpider/soundEnabled';

function asTableTheme(value: string | null): TableThemeId {
  if (value === 'midnight' || value === 'burgundy' || value === 'classic') return value;
  return DEFAULT_TABLE_THEME;
}

function asCardBack(value: string | null): CardBackId {
  if (value === 'navy' || value === 'crimson' || value === 'classic') return value;
  return DEFAULT_CARD_BACK;
}

export async function loadTableTheme(): Promise<TableThemeId> {
  try {
    return asTableTheme(await AsyncStorage.getItem(TABLE_KEY));
  } catch {
    return DEFAULT_TABLE_THEME;
  }
}

export async function saveTableTheme(id: TableThemeId): Promise<void> {
  try {
    await AsyncStorage.setItem(TABLE_KEY, id);
  } catch {
    // Ignore persistence errors.
  }
}

export async function loadCardBack(): Promise<CardBackId> {
  try {
    return asCardBack(await AsyncStorage.getItem(BACK_KEY));
  } catch {
    return DEFAULT_CARD_BACK;
  }
}

export async function saveCardBack(id: CardBackId): Promise<void> {
  try {
    await AsyncStorage.setItem(BACK_KEY, id);
  } catch {
    // Ignore persistence errors.
  }
}

export async function loadSoundEnabled(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(SOUND_KEY);
    if (raw == null) return true;
    return raw !== '0';
  } catch {
    return true;
  }
}

export async function saveSoundEnabled(enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(SOUND_KEY, enabled ? '1' : '0');
  } catch {
    // Ignore persistence errors.
  }
}
