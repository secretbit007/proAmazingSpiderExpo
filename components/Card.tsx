import React from 'react';
import { Image, LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { Card, Suit } from '../types/gameTypes';
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

const CORNER_SUIT_DISPLAY_SIZE = 80 * 0.25;

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
  cornerSuitImage: {
    width: CORNER_SUIT_DISPLAY_SIZE,
    height: CORNER_SUIT_DISPLAY_SIZE,
    resizeMode: 'contain',
  },
  cornerSuitImageRotated: {
    width: CORNER_SUIT_DISPLAY_SIZE,
    height: CORNER_SUIT_DISPLAY_SIZE,
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

/** Suit images skip re-renders when only hover / pile chrome changes — avoids native Image relayout flicker. */
const CardCornerSuit = React.memo(function CardCornerSuit({
  suit,
  tintColor,
  rotated,
}: {
  suit: Suit;
  tintColor: string;
  rotated?: boolean;
}) {
  return (
    <Image
      source={IMAGES[suit]}
      style={
        rotated
          ? [styles.cornerSuitImageRotated, { tintColor }]
          : [styles.cornerSuitImage, { tintColor }]
      }
    />
  );
});

const CardCenterSuit = React.memo(function CardCenterSuit({
  suit,
  tintColor,
}: {
  suit: Suit;
  tintColor: string;
}) {
  return (
    <Image
      source={IMAGES[suit]}
      style={[styles.centerSuit, { tintColor }]}
    />
  );
});

export const CardComponent: React.FC<CardProps> = ({
  card,
  style,
  isHovered = false,
  isInteractive = true,
}) => {
  const [dimensions, setDimensions] = React.useState({ width: 80, height: 120 });
  const suitColor = SUIT_COLORS[card.suit] || COLORS.spades;

  const cornerRankFontSize = dimensions.width * 0.3;
  const cornerSuitVertical = dimensions.width * 0.1;
  const cornerRankVertical = dimensions.width * 0.05;
  const cornerRankSuitHorizontal = dimensions.width * 0.1;

  const onLayout = React.useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    const w = Math.round(width);
    const h = Math.round(height);
    if (w <= 0 || h <= 0) return;
    setDimensions((prev) =>
      prev.width === w && prev.height === h ? prev : { width: w, height: h },
    );
  }, []);

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

          <View style={[styles.topLeftCorner, { top: cornerRankVertical, left: cornerRankSuitHorizontal }]}>
            <Text style={[styles.cornerRank, { color: suitColor, fontSize: cornerRankFontSize }]}>
              {card.rank}
            </Text>
          </View>

          <View style={[styles.topRightCorner, { top: cornerSuitVertical, right: cornerRankSuitHorizontal }]}>
            <CardCornerSuit suit={card.suit} tintColor={suitColor} />
          </View>

          <View style={styles.centerSymbol}>
            <CardCenterSuit suit={card.suit} tintColor={suitColor} />
          </View>

          <View style={[styles.bottomLeftCorner, { bottom: cornerSuitVertical, left: cornerRankSuitHorizontal }]}>
            <CardCornerSuit suit={card.suit} tintColor={suitColor} rotated />
          </View>

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
