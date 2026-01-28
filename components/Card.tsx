import React from 'react';
import { Image, LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { Card } from '../types/gameTypes';
import { IMAGES } from '../utils/assets';

interface CardProps {
  card: Card;
  style?: object;
  isHovered?: boolean;
  isInteractive?: boolean;
}

export const CardComponent: React.FC<CardProps> = ({
  card,
  style,
  isHovered = false,
  isInteractive = true,
}) => {
  const [dimensions, setDimensions] = React.useState({ width: 80, height: 120 });
  const suitColor = card.suit === 'hearts' ? '#FF4444' :
    card.suit === 'diamonds' ? '#ffa500ff' :
      card.suit === 'clubs' ? '#197a29ff' : '#333333';

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
          {/* White card background */}
          <View style={styles.cardWhiteBackground} />

          {/* Top row: rank on left, suit on right */}

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

          {/* Bottom row: suit on left, rank on right (both positioned at opposite corners) */}

          {/* Bottom-left corner - Suit (positioned like bottom-left rank would be) */}
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

          {/* Bottom-right corner - Rank (positioned like bottom-right rank would be) */}
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
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    aspectRatio: 80 / 120,
  },
  faceUpCard: {
    flex: 1,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 1,
    padding: 8,
    borderColor: 'rgba(0,0,0,0.15)',
    overflow: 'hidden',
    position: 'relative',
  },
  cardWhiteBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
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
  },
  cardBackContainer: {
    flex: 1,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
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
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  hoveredCard: {
    transform: [{ translateY: -5 }],
    borderColor: '#4a90e2',
    borderWidth: 2,
    shadowColor: '#4a90e2',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 16,
    zIndex: 100,
  },
  nonInteractiveCard: {
    opacity: 0.9,
  },
});
