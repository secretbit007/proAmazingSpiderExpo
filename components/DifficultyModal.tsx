import React, { useState } from 'react';
import { Keyboard, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

interface DifficultyModalProps {
  visible: boolean;
  onClose: () => void;
  onDifficultySelect: (difficulty: number) => void;
  currentDifficulty: number;
}

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

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>Enter Difficulty Level (0-9)</Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={inputValue}
            onChangeText={(text) => setInputValue(text.replace(/[^0-9]/g, ''))}
            maxLength={1}
            autoFocus={true}
            onSubmitEditing={handleSubmit}
          />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.cancelButton]}
            onPress={onClose}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.submitButton]}
            onPress={handleSubmit}
          >
            <Text style={styles.buttonText}>Set Difficulty</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.difficultyInfo}>
          <Text style={styles.infoText}>Current: {currentDifficulty}</Text>
          <Text style={styles.infoText}>0 = Beginner (easiest)</Text>
          <Text style={styles.infoText}>9 = Legendary (hardest)</Text>
        </View>
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    width: Platform.OS === 'web' ? '40%' : '80%',
    maxWidth: 400,
    backgroundColor: '#2c3e50',
    borderRadius: 12,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
  modalTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  input: {
    backgroundColor: 'white',
    width: 60,
    height: 60,
    borderRadius: 10,
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#e74c3c',
    fontSize: 14,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  button: {
    padding: 14,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  cancelButton: {
    backgroundColor: '#7f8c8d',
  },
  submitButton: {
    backgroundColor: '#27ae60',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  difficultyInfo: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#34495e',
    paddingTop: 15,
  },
  infoText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 5,
    textAlign: 'center',
  },
});