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

/** Ignore layout noise smaller than this (hover borders, flex, sub-pixel). */
const LAYOUT_STABILITY_PX = 4;

type CardLayoutSize = { width: number; height: number };

export const CardComponent: React.FC<CardProps> = ({
  card,
  style,
  isHovered = false,
  isInteractive = true,
}) => {
  const [dimensions, setDimensions] = React.useState<CardLayoutSize>({ width: 80, height: 120 });
  const hasSizedRef = React.useRef(false);
  const suitColor = SUIT_COLORS[card.suit] || COLORS.spades;

  const cornerMetrics = React.useMemo(() => {
    const w = dimensions.width;
    return {
      cornerRankFontSize: w * 0.3,
      cornerSuitSize: w * 0.25,
      cornerSuitVertical: w * 0.1,
      cornerRankVertical: w * 0.05,
      cornerRankSuitHorizontal: w * 0.1,
    };
  }, [dimensions.width]);

  const onLayout = React.useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    const w = Math.round(width);
    const h = Math.round(height);
    if (w <= 0 || h <= 0) return;

    setDimensions((prev) => {
      if (!hasSizedRef.current) {
        hasSizedRef.current = true;
        return { width: w, height: h };
      }
      const dw = Math.abs(prev.width - w);
      const dh = Math.abs(prev.height - h);
      if (dw < LAYOUT_STABILITY_PX && dh < LAYOUT_STABILITY_PX) {
        return prev;
      }
      return { width: w, height: h };
    });
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

          {/* Top-left corner - Rank */}
          <View style={[styles.topLeftCorner, { top: cornerMetrics.cornerRankVertical, left: cornerMetrics.cornerRankSuitHorizontal }]}>
            <Text style={[styles.cornerRank, { color: suitColor, fontSize: cornerMetrics.cornerRankFontSize }]}>
              {card.rank}
            </Text>
          </View>

          {/* Top-right corner - Suit */}
          <View style={[styles.topRightCorner, { top: cornerMetrics.cornerSuitVertical, right: cornerMetrics.cornerRankSuitHorizontal }]}>
            <Image
              source={IMAGES[card.suit]}
              style={[
                styles.cornerSuit,
                {
                  tintColor: suitColor,
                  width: cornerMetrics.cornerSuitSize,
                  height: cornerMetrics.cornerSuitSize,
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
          <View style={[styles.bottomLeftCorner, { bottom: cornerMetrics.cornerSuitVertical, left: cornerMetrics.cornerRankSuitHorizontal }]}>
            <Image
              source={IMAGES[card.suit]}
              style={[
                styles.cornerSuit,
                {
                  tintColor: suitColor,
                  width: cornerMetrics.cornerSuitSize,
                  height: cornerMetrics.cornerSuitSize,
                  transform: [{ rotate: '180deg' }],
                },
              ]}
            />
          </View>

          {/* Bottom-right corner - Rank */}
          <View style={[styles.bottomRightCorner, { bottom: cornerMetrics.cornerRankVertical, right: cornerMetrics.cornerRankSuitHorizontal }]}>
            <Text style={[styles.cornerRank, {
              color: suitColor,
              fontSize: cornerMetrics.cornerRankFontSize,
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
