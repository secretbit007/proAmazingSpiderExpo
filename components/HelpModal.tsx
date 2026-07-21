import React from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { COLORS } from '../constants/Colors';

interface HelpModalProps {
  visible: boolean;
  onClose: () => void;
}

const HELP_PARAGRAPHS = [
  'proAmazingSpider is a computerised version of Spider, which is a traditional 2 pack card patience. proAmazingSpider is much faster and more fun to play.',
  'In Spider 54 cards are initially dealt in 4 columns of 6 cards and 6 columns of 5 cards. The remaining 50 cards are held in a stack, to be dealt 10 cards at a time when no more moves are possible.',
  'The aim is to order the cards in suits from king down to ace.',
  'When a whole suit of 13 cards has been formed, it can be removed from the display by clicking on the king.',
  'In Spider, cards can only be moved 1 at a time unless they are the same suit and in descending sequence. Cards can only be moved on to another card of immediately greater rank, or into empty columns. Kings can only be moved into empty columns.',
  'However, proAmazingSpider allows a mixed suit column of cards to be moved, provided there is a logical path. To make that happen, click on the highest card in that mixed suit, when the program will generate the required moves.',
  'The Solve button allows same suit fragments to be joined - useful towards the end of a game.',
  'Empty columns are valuable. Therefore it is best not to move kings into empty columns as they cannot be moved again.',
  'The best strategy is to move as many cards as possible on to columns headed by a king, thereby freeing up other columns.',
  'Where columns are not headed by a king it is best to organise the cards into suits so as to facilitate later movement. But there is no hurry to organise into suits in columns headed by kings.',
  'Create as many empty columns as possible, only moving kings when nothing else appeals.',
  'Spider requires that there be no empty columns before another 10 cards are dealt. Clicking Deal will deal another 10 cards.',
];

export const HelpModal: React.FC<HelpModalProps> = ({ visible, onClose }) => {
  const { height: windowHeight } = useWindowDimensions();
  const scrollHeight = Math.min(380, Math.max(200, windowHeight * 0.42));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close help" />

        <View style={styles.sheet}>
          <Text style={styles.title}>How to Play proAmazingSpider</Text>
          <Text style={styles.subtitle}>Rules & strategy</Text>

          <ScrollView
            style={[styles.scrollArea, { maxHeight: scrollHeight }]}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator
            nestedScrollEnabled
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
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  sheet: {
    width: Platform.OS === 'web' ? '55%' : '100%',
    maxWidth: 520,
    backgroundColor: COLORS.hudBg,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.brass,
    padding: 16,
    zIndex: 2,
    elevation: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
  },
  title: {
    color: COLORS.textGold,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: COLORS.brassLight,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 10,
    fontWeight: '600',
  },
  scrollArea: {
    width: '100%',
  },
  scrollContent: {
    paddingBottom: 4,
  },
  paragraph: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  closeButton: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: COLORS.buttonDeal,
  },
  closeButtonText: {
    color: COLORS.buttonText,
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.4,
  },
});
