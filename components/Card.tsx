import React from 'react';
import { Image, LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
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

export const CardComponent: React.FC<CardProps> = ({
  card,
  style,
  isHovered = false,
  isInteractive = true,
}) => {
  const [dimensions, setDimensions] = React.useState({ width: 80, height: 120 });
  const suitColor = SUIT_COLORS[card.suit] || COLORS.spades;

  const cornerRankFontSize = dimensions.width * 0.3;
  const cornerSuitSize = dimensions.width * 0.25;
  const cornerSuitVertical = dimensions.width * 0.1;
  const cornerRankVertical = dimensions.width * 0.05;
  const cornerRankSuitHorizontal = dimensions.width * 0.1;

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setDimensions({ width, height });
  };

  return (
    <View style={[
      styles.cardContainer,
      style,
      isHovered && styles.hoveredCard,
      !isInteractive && styles.nonInteractiveCard,
    ]}
      onLayout={onLayout}
    >
      {card.isFaceUp ? (
        <View style={styles.faceUpCard}>
          <View style={styles.cardWhiteBackground} />
          <View style={styles.cardGlossStrip} />
          <View style={styles.cardInnerFrame} />

          {/* Top-left corner - Rank */}
          <View style={[styles.topLeftCorner, { top: cornerRankVertical, left: cornerRankSuitHorizontal }]}>
            <Text style={[styles.cornerRank, { color: suitColor, fontSize: cornerRankFontSize }]}>
              {card.rank}
            </Text>
          </View>

          {/* Top-right corner - Suit */}
          <View style={[styles.topRightCorner, { top: cornerSuitVertical, right: cornerRankSuitHorizontal }]}>
            <Image
              source={IMAGES[card.suit]}
              style={[
                styles.cornerSuit,
                {
                  tintColor: suitColor,
                  width: cornerSuitSize,
                  height: cornerSuitSize,
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
          <View style={[styles.bottomLeftCorner, { bottom: cornerSuitVertical, left: cornerRankSuitHorizontal }]}>
            <Image
              source={IMAGES[card.suit]}
              style={[
                styles.cornerSuit,
                {
                  tintColor: suitColor,
                  width: cornerSuitSize,
                  height: cornerSuitSize,
                  transform: [{ rotate: '180deg' }],
                },
              ]}
            />
          </View>

          {/* Bottom-right corner - Rank */}
          <View style={[styles.bottomRightCorner, { bottom: cornerRankVertical, right: cornerRankSuitHorizontal }]}>
            <Text style={[styles.cornerRank, {
              color: suitColor,
              fontSize: cornerRankFontSize,
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
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: COLORS.cardBorder,
    aspectRatio: 80 / 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.38,
    shadowRadius: 5,
    elevation: 6,
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
  cardGlossStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '28%',
    backgroundColor: COLORS.cardGloss,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  cardInnerFrame: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
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
    transform: [{ translateY: -6 }, { scale: 1.03 }],
    borderColor: COLORS.brassLight,
    borderWidth: 2.5,
    shadowColor: COLORS.selectionBlue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.65,
    shadowRadius: 12,
    elevation: 20,
    zIndex: 100,
  },
  nonInteractiveCard: {
    opacity: 0.88,
  },
});
