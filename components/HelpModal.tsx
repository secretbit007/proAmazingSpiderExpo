import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants/Colors';

interface HelpModalProps {
  visible: boolean;
  onClose: () => void;
}

const HELP_PARAGRAPHS = [
  'AmazingSpider is a computerised version of Spider, which is a traditional 2 pack card patience. AmazingSpider is much faster and more fun to play.',
  'In Spider 54 cards are initially dealt in 4 columns of 6 cards and 6 columns of 5 cards. The remaining 50 cards are held in a stack, to be dealt 10 cards at a time when no more moves are possible.',
  'The aim is to order the cards in suits from king down to ace. When a whole suit of 13 cards has been formed, it can be removed by clicking on the king.',
  'In Spider, cards can only be moved 1 at a time unless they are the same suit and in descending sequence. Cards can only be moved on to another card of immediately greater rank, or into empty columns. Kings can only be moved into empty columns.',
  'However, AmazingSpider allows a mixed suit column of cards to be moved, provided there is a logical path.',
  'The Solve button allows same suit fragments to be joined - useful towards the end of a game.',
  'Empty columns are valuable. Therefore it is best not to move kings into empty columns as they cannot be moved again.',
  'The best strategy is to move as many cards as possible on to columns headed by a king, thereby freeing up other columns.',
  'Where columns are not headed by a king it is best to organise the cards into suits so as to facilitate later movement. But there is no hurry to organise into suits in columns headed by kings.',
  'Create as many empty columns as possible, only moving kings when nothing else appeals.',
  'Spider requires that there be no empty columns before another 10 cards are dealt.',
];

export const HelpModal: React.FC<HelpModalProps> = ({ visible, onClose }) => {
  if (!visible) return null;

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>Help & Strategy</Text>
        <Text style={styles.modalSubtitle}>Tips to play AmazingSpider better</Text>

        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
          {HELP_PARAGRAPHS.map((paragraph, index) => (
            <Text key={index} style={styles.paragraph}>
              {paragraph}
            </Text>
          ))}
        </ScrollView>

        <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
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
    width: Platform.OS === 'web' ? '55%' : '90%',
    maxWidth: 560,
    maxHeight: '80%',
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
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
    marginBottom: 14,
  },
  scrollArea: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  paragraph: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 10,
  },
  closeButton: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: COLORS.buttonPrimary,
  },
  closeButtonText: {
    color: COLORS.buttonText,
    fontWeight: '700',
    fontSize: 15,
  },
});
