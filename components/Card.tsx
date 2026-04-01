import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Card } from '../types/gameTypes';
import { COLORS } from '../constants/Colors';
import { IMAGES } from '../utils/assets';

interface CardProps {
  card: Card;
  style?: object;
  isHovered?: boolean;
  isInteractive?: boolean;
}

const SUIT_COLORS: Record<string, string> = {
  hearts: COLORS.hearts,
  diamonds: COLORS.diamonds,
  clubs: COLORS.clubs,
  spades: COLORS.spades,
};

/** Matches card aspect ratio / pile maxWidth — corner art uses this, not onLayout, so positions never jitter. */
const ART_W = 80;

const styles = StyleSheet.create({
  cardContainer: {
    maxHeight: 120,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.15)',
    aspectRatio: 80 / 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 4,
  },
  faceUpCard: {
    flex: 1,
    justifyContent: 'space-between',
    borderRadius: 5,
    padding: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  cardWhiteBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.cardFace,
  },
  topLeftCorner: {
    position: 'absolute',
    zIndex: 2,
    top: ART_W * 0.05,
    left: ART_W * 0.1,
  },
  topRightCorner: {
    position: 'absolute',
    zIndex: 2,
    top: ART_W * 0.1,
    right: ART_W * 0.1,
  },
  bottomLeftCorner: {
    position: 'absolute',
    zIndex: 2,
    bottom: ART_W * 0.1,
    left: ART_W * 0.1,
  },
  bottomRightCorner: {
    position: 'absolute',
    zIndex: 2,
    bottom: ART_W * 0.05,
    right: ART_W * 0.1,
  },
  centerSymbol: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cornerRank: {
    fontWeight: '800',
    fontSize: ART_W * 0.3,
  },
  cornerSuit: {
    width: ART_W * 0.25,
    height: ART_W * 0.25,
    resizeMode: 'contain',
  },
  cornerSuitRotated: {
    width: ART_W * 0.25,
    height: ART_W * 0.25,
    resizeMode: 'contain',
    transform: [{ rotate: '180deg' }],
  },
  centerSuit: {
    height: '43%',
    resizeMode: 'contain',
    aspectRatio: 1,
    opacity: 0.85,
  },
  cardBackContainer: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: 5,
  },
  cardBackImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardBackOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 20, 40, 0.15)',
    borderRadius: 5,
  },
  hoveredCard: {
    transform: [{ translateY: -4 }],
    borderColor: COLORS.selectionBlue,
    borderWidth: 2,
    shadowColor: COLORS.selectionBlue,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 16,
    zIndex: 100,
  },
  nonInteractiveCard: {
    opacity: 0.88,
  },
});

export const CardComponent: React.FC<CardProps> = ({
  card,
  style,
  isHovered = false,
  isInteractive = true,
}) => {
  const suitColor = SUIT_COLORS[card.suit] || COLORS.spades;

  return (
    <View style={[
      styles.cardContainer,
      style,
      isHovered && styles.hoveredCard,
      !isInteractive && styles.nonInteractiveCard,
    ]}
    >
      {card.isFaceUp ? (
        <View style={styles.faceUpCard}>
          <View style={styles.cardWhiteBackground} />

          <View style={styles.topLeftCorner}>
            <Text style={[styles.cornerRank, { color: suitColor }]}>
              {card.rank}
            </Text>
          </View>

          <View style={styles.topRightCorner}>
            <Image
              source={IMAGES[card.suit]}
              style={[styles.cornerSuit, { tintColor: suitColor }]}
            />
          </View>

          <View style={styles.centerSymbol}>
            <Image
              source={IMAGES[card.suit]}
              style={[styles.centerSuit, { tintColor: suitColor }]}
            />
          </View>

          <View style={styles.bottomLeftCorner}>
            <Image
              source={IMAGES[card.suit]}
              style={[styles.cornerSuitRotated, { tintColor: suitColor }]}
            />
          </View>

          <View style={styles.bottomRightCorner}>
            <Text style={[styles.cornerRank, {
              color: suitColor,
              transform: [{ rotate: '180deg' }],
            }]}>
              {card.rank}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.cardBackContainer}>
          <Image source={IMAGES.card_back} style={styles.cardBackImage} />
          <View style={styles.cardBackOverlay} />
        </View>
      )}
    </View>
  );
};
