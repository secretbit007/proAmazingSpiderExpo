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
  isInteractive = true
}) => {
  const [dimensions, setDimensions] = React.useState({ width: 80, height: 120 })
  const suitColor = card.suit === 'hearts' ? '#FF4444' : 
                    card.suit === 'diamonds' ? '#494bd8ff' : 
                    card.suit === 'clubs' ? '#197a29ff' : '#333333';

  const cornerRankFontSize = dimensions.width * 0.3;
  const cornerRankSuitVertical = dimensions.width * 0.05;
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
      !isInteractive && styles.nonInteractiveCard
    ]}
    onLayout={onLayout}
    >
      {card.isFaceUp ? (
        <View style={styles.faceUpCard}>
          {/* White card background */}
          <View style={styles.cardWhiteBackground} />
          
          {/* Top left corner (rank + suit) */}
          <View style={[styles.topLeftCorner, { top: cornerRankSuitVertical, left: cornerRankSuitHorizontal }]}>
            <Text style={[styles.cornerRank, { color: suitColor, fontSize: cornerRankFontSize }]}>
              {card.rank}
            </Text>
          </View>

          {/* Center suit symbols */}
          <View style={styles.verticalSymbols}>
            {/* <Image 
              source={IMAGES[card.suit]} 
              style={[styles.verticalSuit, { tintColor: isRed ? redColor : blackColor, marginVertical: cornerRankSuitVertical }]} 
            /> */}
            
            <Image 
              source={IMAGES[card.suit]} 
              style={[styles.centerSuit, { tintColor: suitColor }]} 
            />
            
            {/* <Image 
              source={IMAGES[card.suit]} 
              style={[styles.verticalSuit, { 
                tintColor: isRed ? redColor : blackColor,
                transform: [{ rotate: '180deg' }] ,
                marginVertical: cornerRankSuitVertical
              }]} 
            /> */}
          </View>

          {/* Bottom right corner (upside down rank + suit) */}
          <View style={[styles.bottomRightCorner, { bottom: cornerRankSuitVertical, right: cornerRankSuitHorizontal }]}>
            <Text style={[styles.cornerRank, { color: suitColor, fontSize: cornerRankFontSize }]}>
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
  // All original styles preserved exactly as they were
  cardContainer: {
    maxHeight: 120,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    aspectRatio: 80 / 120
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
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    zIndex: 2,
  },
  bottomRightCorner: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    transform: [{ rotate: '180deg' }],
    zIndex: 2,
  },
  verticalSymbols: {
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
  verticalSuit: {
    height: '17%',
    aspectRatio: 1,
    resizeMode: 'contain',
  },
  centerSuit: {
    height: '43%',
    resizeMode: 'contain',
    aspectRatio: 1
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
    resizeMode: 'cover'
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
  // Only added these new styles for hover functionality
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