import React, { useEffect, useState } from 'react';
import { Keyboard, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants/Colors';
import {
  DIFFICULTY_LABELS,
  MAX_DIFFICULTY,
  MIN_DIFFICULTY,
  SUIT_COUNT_LABELS,
  SuitCount,
  clampDifficulty,
  difficultyLabel,
} from '../constants/Difficulty';

interface DifficultyModalProps {
  visible: boolean;
  onClose: () => void;
  onDifficultySelect: (difficulty: number, suitCount: SuitCount) => void;
  onDailySelect?: () => void;
  onOpenLeaderboard?: () => void;
  currentDifficulty: number;
  currentSuitCount: SuitCount;
  dailyCompleted?: boolean;
}

export const DifficultyModal: React.FC<DifficultyModalProps> = ({
  visible,
  onClose,
  onDifficultySelect,
  onDailySelect,
  onOpenLeaderboard,
  currentDifficulty,
  currentSuitCount,
  dailyCompleted = false,
}) => {
  const [inputValue, setInputValue] = useState<string>(String(currentDifficulty));
  const [suitCount, setSuitCount] = useState<SuitCount>(currentSuitCount);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!visible) return;
    setInputValue(String(clampDifficulty(currentDifficulty)));
    setSuitCount(currentSuitCount);
    setError('');
  }, [visible, currentDifficulty, currentSuitCount]);

  if (!visible) return null;

  const handleSubmit = () => {
    Keyboard.dismiss();
    const num = parseInt(inputValue, 10);
    if (Number.isNaN(num)) {
      setError('Please enter a valid number');
      return;
    }
    if (num < MIN_DIFFICULTY || num > MAX_DIFFICULTY) {
      setError(`Difficulty must be between ${MIN_DIFFICULTY} and ${MAX_DIFFICULTY}`);
      return;
    }
    setError('');
    onDifficultySelect(num, suitCount);
    onClose();
  };

  const parsed = parseInt(inputValue, 10);
  const diffLabel = Number.isNaN(parsed) ? '' : DIFFICULTY_LABELS[parsed] || '';

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>Difficulty</Text>
        <Text style={styles.modalSubtitle}>Choose your challenge level (0 easy → 9 hard)</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={inputValue}
            onChangeText={(text) => setInputValue(text.replace(/[^0-9]/g, ''))}
            maxLength={1}
            autoFocus
            onSubmitEditing={handleSubmit}
            placeholderTextColor="rgba(255,255,255,0.3)"
          />
          {diffLabel ? <Text style={styles.diffLabel}>{diffLabel}</Text> : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <View style={styles.chipRow}>
          {([1, 2, 4] as SuitCount[]).map((count) => (
            <TouchableOpacity
              key={count}
              style={[styles.chip, suitCount === count && styles.chipActive]}
              onPress={() => setSuitCount(count)}
              activeOpacity={0.75}
            >
              <Text style={[styles.chipText, suitCount === count && styles.chipTextActive]}>
                {SUIT_COUNT_LABELS[count]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.chipRow}>
          {[0, 3, 6, 9].map((level) => (
            <TouchableOpacity
              key={level}
              style={[styles.chip, parsed === level && styles.chipActive]}
              onPress={() => {
                setInputValue(String(level));
                setError('');
              }}
              activeOpacity={0.75}
            >
              <Text style={[styles.chipText, parsed === level && styles.chipTextActive]}>
                {DIFFICULTY_LABELS[level]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.scaleRow}>
          <Text style={styles.scaleText}>0</Text>
          <View style={styles.scaleBar}>
            <View
              style={[
                styles.scaleFill,
                { width: `${((Number.isNaN(parsed) ? 0 : parsed) / MAX_DIFFICULTY) * 100}%` },
              ]}
            />
          </View>
          <Text style={styles.scaleText}>9</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.submitButton]}
            onPress={handleSubmit}
            activeOpacity={0.7}
          >
            <Text style={styles.submitButtonText}>Start Game</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.currentText}>
          Current: {clampDifficulty(currentDifficulty)} ({difficultyLabel(currentDifficulty)}) · {SUIT_COUNT_LABELS[currentSuitCount]}
        </Text>

        {onDailySelect ? (
          <TouchableOpacity
            style={styles.dailyButton}
            onPress={() => {
              onClose();
              onDailySelect();
            }}
            activeOpacity={0.75}
          >
            <Text style={styles.dailyButtonText}>
              {dailyCompleted ? 'Daily done — play again' : 'Play Daily Challenge'}
            </Text>
          </TouchableOpacity>
        ) : null}

        {onOpenLeaderboard ? (
          <TouchableOpacity
            style={styles.boardLink}
            onPress={() => {
              onClose();
              onOpenLeaderboard();
            }}
            activeOpacity={0.75}
          >
            <Text style={styles.boardLinkText}>Today’s board</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 25000,
    elevation: 400,
  },
  modalContainer: {
    width: Platform.OS === 'web' ? '40%' : '80%',
    maxWidth: 360,
    backgroundColor: COLORS.woodDark,
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: COLORS.brass,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
  },
  modalTitle: {
    color: COLORS.textGold,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  modalSubtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 14,
    alignItems: 'center',
  },
  input: {
    backgroundColor: COLORS.hudBg,
    borderWidth: 2,
    borderColor: COLORS.brass,
    width: 64,
    height: 64,
    borderRadius: 16,
    fontSize: 28,
    textAlign: 'center',
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  diffLabel: {
    color: COLORS.brassLight,
    fontSize: 15,
    fontWeight: '600',
    marginTop: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 39, 0.35)',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  chipActive: {
    borderColor: COLORS.brassLight,
    backgroundColor: 'rgba(201, 162, 39, 0.2)',
  },
  chipText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  chipTextActive: {
    color: COLORS.textGold,
  },
  scaleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 22,
    paddingHorizontal: 4,
  },
  scaleText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
    width: 16,
    textAlign: 'center',
  },
  scaleBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  scaleFill: {
    height: '100%',
    backgroundColor: COLORS.brass,
    borderRadius: 2,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  button: {
    paddingVertical: 13,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  submitButton: {
    backgroundColor: COLORS.buttonNew,
    borderWidth: 1.5,
    borderColor: COLORS.brass,
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontWeight: '600',
    fontSize: 15,
  },
  submitButtonText: {
    color: COLORS.buttonText,
    fontWeight: '700',
    fontSize: 15,
  },
  currentText: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
  dailyButton: {
    marginTop: 12,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: COLORS.buttonDeal,
    borderWidth: 1.5,
    borderColor: COLORS.brass,
  },
  dailyButtonText: {
    color: COLORS.buttonText,
    fontWeight: '700',
    fontSize: 14,
  },
  boardLink: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 4,
  },
  boardLinkText: {
    color: COLORS.textGold,
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
