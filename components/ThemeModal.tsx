import React from 'react';
import { Image, Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants/Colors';
import {
  CARD_BACK_IDS,
  CARD_BACK_LABELS,
  CardBackId,
  TABLE_THEME_IDS,
  TABLE_THEMES,
  TableThemeId,
} from '../constants/Themes';
import { IMAGES } from '../utils/assets';

interface ThemeModalProps {
  visible: boolean;
  onClose: () => void;
  tableTheme: TableThemeId;
  cardBack: CardBackId;
  soundEnabled: boolean;
  onSelectTable: (id: TableThemeId) => void;
  onSelectCardBack: (id: CardBackId) => void;
  onToggleSound: () => void;
}

const BACK_IMAGES: Record<CardBackId, number> = {
  classic: IMAGES.card_back,
  navy: IMAGES.card_back_navy,
  crimson: IMAGES.card_back_crimson,
};

export const ThemeModal: React.FC<ThemeModalProps> = ({
  visible,
  onClose,
  tableTheme,
  cardBack,
  soundEnabled,
  onSelectTable,
  onSelectCardBack,
  onToggleSound,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Look & Sound</Text>
          <Text style={styles.subtitle}>Saved on this device</Text>

          <Text style={styles.section}>Table</Text>
          <View style={styles.row}>
            {TABLE_THEME_IDS.map((id) => (
              <TouchableOpacity
                key={id}
                style={[styles.chip, tableTheme === id && styles.chipActive]}
                onPress={() => onSelectTable(id)}
                activeOpacity={0.75}
              >
                <View style={[styles.swatch, { backgroundColor: TABLE_THEMES[id].felt }]} />
                <Text style={[styles.chipText, tableTheme === id && styles.chipTextActive]}>
                  {TABLE_THEMES[id].label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.section}>Card back</Text>
          <View style={styles.row}>
            {CARD_BACK_IDS.map((id) => (
              <TouchableOpacity
                key={id}
                style={[styles.backChoice, cardBack === id && styles.backChoiceActive]}
                onPress={() => onSelectCardBack(id)}
                activeOpacity={0.75}
              >
                <Image source={BACK_IMAGES[id]} style={styles.backPreview} />
                <Text style={[styles.chipText, cardBack === id && styles.chipTextActive]}>
                  {CARD_BACK_LABELS[id]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.soundRow} onPress={onToggleSound} activeOpacity={0.75}>
            <Text style={styles.soundLabel}>Sound effects</Text>
            <Text style={styles.soundValue}>{soundEnabled ? 'On' : 'Off'}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.75}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: Platform.OS === 'web' ? '42%' : '88%',
    maxWidth: 400,
    backgroundColor: COLORS.woodDark,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.brass,
    padding: 22,
  },
  title: {
    color: COLORS.textGold,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  section: {
    color: COLORS.brassLight,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 39, 0.35)',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  chipActive: {
    borderColor: COLORS.brassLight,
    backgroundColor: 'rgba(201, 162, 39, 0.18)',
  },
  swatch: {
    width: 28,
    height: 18,
    borderRadius: 4,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  chipText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  chipTextActive: {
    color: COLORS.textGold,
  },
  backChoice: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 39, 0.35)',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  backChoiceActive: {
    borderColor: COLORS.brassLight,
    backgroundColor: 'rgba(201, 162, 39, 0.18)',
  },
  backPreview: {
    width: 36,
    height: 52,
    borderRadius: 4,
    marginBottom: 6,
  },
  soundRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(201, 162, 39, 0.25)',
    marginTop: 4,
  },
  soundLabel: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '700',
  },
  soundValue: {
    color: COLORS.textGold,
    fontSize: 15,
    fontWeight: '800',
  },
  closeButton: {
    marginTop: 10,
    backgroundColor: COLORS.buttonDeal,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.brass,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: COLORS.buttonText,
    fontWeight: '700',
    fontSize: 15,
  },
});
