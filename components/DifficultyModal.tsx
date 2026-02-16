import React, { useState } from 'react';
import { Keyboard, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants/Colors';

interface DifficultyModalProps {
  visible: boolean;
  onClose: () => void;
  onDifficultySelect: (difficulty: number) => void;
  currentDifficulty: number;
}

const DIFFICULTY_LABELS: Record<number, string> = {
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

export const DifficultyModal: React.FC<DifficultyModalProps> = ({
  visible,
  onClose,
  onDifficultySelect,
  currentDifficulty,
}) => {
  const [inputValue, setInputValue] = useState<string>(currentDifficulty.toString());
  const [error, setError] = useState<string>('');

  if (!visible) return null;

  const handleSubmit = () => {
    Keyboard.dismiss();
    const num = parseInt(inputValue);
    if (isNaN(num)) {
      setError('Please enter a valid number');
      return;
    }
    if (num < 0 || num > 9) {
      setError('Difficulty must be between 0 and 9');
      return;
    }
    setError('');
    onDifficultySelect(num);
    onClose();
  };

  const diffLabel = DIFFICULTY_LABELS[parseInt(inputValue)] || '';

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>Difficulty</Text>
        <Text style={styles.modalSubtitle}>Choose your challenge level</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={inputValue}
            onChangeText={(text) => setInputValue(text.replace(/[^0-9]/g, ''))}
            maxLength={1}
            autoFocus={true}
            onSubmitEditing={handleSubmit}
            placeholderTextColor="rgba(255,255,255,0.3)"
          />
          {diffLabel ? (
            <Text style={styles.diffLabel}>{diffLabel}</Text>
          ) : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <View style={styles.scaleRow}>
          <Text style={styles.scaleText}>0</Text>
          <View style={styles.scaleBar}>
            <View style={[styles.scaleFill, { width: `${(parseInt(inputValue) || 0) / 9 * 100}%` }]} />
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
          Current: {currentDifficulty} ({DIFFICULTY_LABELS[currentDifficulty]})
        </Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    width: Platform.OS === 'web' ? '40%' : '80%',
    maxWidth: 360,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 20,
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  modalSubtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    width: 64,
    height: 64,
    borderRadius: 16,
    fontSize: 28,
    textAlign: 'center',
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  diffLabel: {
    color: COLORS.selectionBlue,
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
  scaleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
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
    backgroundColor: COLORS.selectionBlue,
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
    backgroundColor: COLORS.buttonPrimary,
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
});
