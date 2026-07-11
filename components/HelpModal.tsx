import React from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../constants/Colors';

interface HelpModalProps {
  visible: boolean;
  onClose: () => void;
}

const HELP_PARAGRAPHS = [
  'AmazingSpider is a computerised version of Spider, which is a traditional 2 pack card patience. AmazingSpider is much faster and more fun to play.',
  'In Spider 54 cards are initially dealt in 4 columns of 6 cards and 6 columns of 5 cards. The remaining 50 cards are held in a stack, to be dealt 10 cards at a time when no more moves are possible.',
  'The aim is to order the cards in suits from king down to ace.',
  'When a whole suit of 13 cards has been formed, it can be removed from the display by clicking on the king.',
  'In Spider, cards can only be moved 1 at a time unless they are the same suit and in descending sequence. Cards can only be moved on to another card of immediately greater rank, or into empty columns. Kings can only be moved into empty columns.',
  'However, AmazingSpider allows a mixed suit column of cards to be moved, provided there is a logical path. To make that happen, click on the highest card in that mixed suit, when the program will generate the required moves.',
  'The Solve button allows same suit fragments to be joined - useful towards the end of a game.',
  'Empty columns are valuable. Therefore it is best not to move kings into empty columns as they cannot be moved again.',
  'The best strategy is to move as many cards as possible on to columns headed by a king, thereby freeing up other columns.',
  'Where columns are not headed by a king it is best to organise the cards into suits so as to facilitate later movement. But there is no hurry to organise into suits in columns headed by kings.',
  'Create as many empty columns as possible, only moving kings when nothing else appeals.',
  'Spider requires that there be no empty columns before another 10 cards are dealt. Clicking Deal will deal another 10 cards.',
];

export const HelpModal: React.FC<HelpModalProps> = ({ visible, onClose }) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close help" />

        <View style={styles.modalContainer}>
          <View style={styles.modalInner}>
            <Text style={styles.modalTitle}>How to Play AmazingSpider</Text>
            <Text style={styles.modalSubtitle}>Rules & strategy</Text>

            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              {HELP_PARAGRAPHS.map((paragraph, index) => (
                <Text key={index} style={styles.paragraph}>
                  {paragraph}
                </Text>
              ))}
            </ScrollView>

            <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.85}>
              <Text style={styles.closeButtonText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  modalContainer: {
    width: Platform.OS === 'web' ? '55%' : '100%',
    maxWidth: 560,
    maxHeight: '82%',
    backgroundColor: COLORS.woodDark,
    borderRadius: 16,
    padding: 4,
    borderWidth: 3,
    borderColor: COLORS.woodLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 24,
    zIndex: 1,
  },
  modalInner: {
    flex: 1,
    backgroundColor: COLORS.hudBg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.brass,
    padding: 18,
    overflow: 'hidden',
  },
  modalTitle: {
    color: COLORS.textGold,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.8,
    textShadowColor: COLORS.goldGlow,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  modalSubtitle: {
    color: COLORS.brassLight,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  scrollArea: {
    flexGrow: 0,
    flexShrink: 1,
    maxHeight: Platform.OS === 'web' ? 420 : 340,
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
    marginTop: 12,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: COLORS.buttonDeal,
    borderWidth: 2,
    borderColor: COLORS.brass,
    borderBottomWidth: 4,
    borderBottomColor: COLORS.buttonDealDark,
  },
  closeButtonText: {
    color: COLORS.buttonText,
    fontWeight: '800',
    fontSize: 15,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
