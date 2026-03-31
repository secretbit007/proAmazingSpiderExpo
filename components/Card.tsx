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

/**
 * Corner rank/suit scale from a fixed width, not onLayout.
 * After a move, the card remounts and can briefly lay out at a much wider parent
 * before the pile clamps to maxWidth 80 — measured width then spikes and corner
 * art looks huge for a frame (flash). Pile maxWidth matches this.
 */
const CARD_CORNER_BASE_WIDTH = 80;
const CORNER_METRICS = {
  cornerRankFontSize: CARD_CORNER_BASE_WIDTH * 0.3,
  cornerSuitSize: CARD_CORNER_BASE_WIDTH * 0.25,
  cornerSuitVertical: CARD_CORNER_BASE_WIDTH * 0.1,
  cornerRankVertical: CARD_CORNER_BASE_WIDTH * 0.05,
  cornerRankSuitHorizontal: CARD_CORNER_BASE_WIDTH * 0.1,
} as const;

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

          {/* Top-left corner - Rank */}
          <View style={[styles.topLeftCorner, { top: CORNER_METRICS.cornerRankVertical, left: CORNER_METRICS.cornerRankSuitHorizontal }]}>
            <Text style={[styles.cornerRank, { color: suitColor, fontSize: CORNER_METRICS.cornerRankFontSize }]}>
              {card.rank}
            </Text>
          </View>

          {/* Top-right corner - Suit */}
          <View style={[styles.topRightCorner, { top: CORNER_METRICS.cornerSuitVertical, right: CORNER_METRICS.cornerRankSuitHorizontal }]}>
            <Image
              source={IMAGES[card.suit]}
              style={[
                styles.cornerSuit,
                {
                  tintColor: suitColor,
                  width: CORNER_METRICS.cornerSuitSize,
                  height: CORNER_METRICS.cornerSuitSize,
                },
              ]}
            />
          </View>

          {/* Center suit symbol */}
          <View style={styles.centerSymbol}>
            <Image
              source={IMAGES[card.suit]}
              style={[styles.centerSuit, { tintColor: suitColor }]}
            />
          </View>

          {/* Bottom-left corner - Suit */}
          <View style={[styles.bottomLeftCorner, { bottom: CORNER_METRICS.cornerSuitVertical, left: CORNER_METRICS.cornerRankSuitHorizontal }]}>
            <Image
              source={IMAGES[card.suit]}
              style={[
                styles.cornerSuit,
                {
                  tintColor: suitColor,
                  width: CORNER_METRICS.cornerSuitSize,
                  height: CORNER_METRICS.cornerSuitSize,
                  transform: [{ rotate: '180deg' }],
                },
              ]}
            />
          </View>

          {/* Bottom-right corner - Rank */}
          <View style={[styles.bottomRightCorner, { bottom: CORNER_METRICS.cornerRankVertical, right: CORNER_METRICS.cornerRankSuitHorizontal }]}>
            <Text style={[styles.cornerRank, {
              color: suitColor,
              fontSize: CORNER_METRICS.cornerRankFontSize,
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
  },
  topRightCorner: {
    position: 'absolute',
    zIndex: 2,
  },
  bottomLeftCorner: {
    position: 'absolute',
    zIndex: 2,
  },
  bottomRightCorner: {
    position: 'absolute',
    zIndex: 2,
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
  },
  cornerSuit: {
    resizeMode: 'contain',
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
