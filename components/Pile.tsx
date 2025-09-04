import React from 'react';
import { LayoutChangeEvent, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { Card } from '../types/gameTypes';
import { CardComponent } from './Card';

interface PileProps {
  cards: Card[];
  pileIndex: number;
  hoveredCard: { pileIndex: number; cardIndex: number } | null;
  onCardPress?: (pileIndex: number, cardIndex: number) => void;
  onCardHover?: (pileIndex: number, cardIndex: number, isHovered: boolean) => void;
  disabled?: boolean;
}

export const Pile: React.FC<PileProps> = ({
  cards,
  pileIndex,
  hoveredCard,
  onCardPress,
  onCardHover,
  disabled = false,
}) => {
  const [dimensions, setDimensions] = React.useState({ width: 80, height: 120 });
  const [expandedPile, setExpandedPile] = React.useState<number | null>(null);
  const [expandedCardIndex, setExpandedCardIndex] = React.useState<number | null>(null);
  const prevLengthRef = React.useRef<number>(cards.length);

  // Collapse this pile automatically if cards were dealt to it (length increased)
  React.useEffect(() => {
    if (cards.length > prevLengthRef.current) {
      setExpandedPile(null);
      setExpandedCardIndex(null);
    }
    prevLengthRef.current = cards.length;
  }, [cards.length]);

  const handleCardPress = (cardIndex: number) => {
    if (disabled) return;

    const isInteractive = cardIndex >= getInteractiveStartIndex();

    if (!isInteractive) return;

    // If clicked card is the last (top) card, do not expand; move immediately
    const isLastCard = cardIndex === cards.length - 1;
    if (isLastCard) {
      if (expandedPile !== null || expandedCardIndex !== null) {
        setExpandedPile(null);
        setExpandedCardIndex(null);
      }
      if (onCardPress) {
        onCardPress(pileIndex, cardIndex);
      }
      return;
    }

    // Compute threshold condition at click time
    const cardHeight = dimensions.width * 80 / 120;
    const gapByWidth = dimensions.width * 0.3;
    const cardCount = cards.length;
    const gapByHeight = (dimensions.height - cardHeight) / Math.max(cardCount, 1);
    const baseGapSize = Math.min(gapByWidth, gapByHeight);
    const requiresExpansion = baseGapSize <= gapByWidth * 0.85;

    const isExpandedOnThisCard = expandedPile === pileIndex && expandedCardIndex === cardIndex;

    // Expanded status should be true only if threshold holds
    if (requiresExpansion) {
      // First click under threshold expands and stops (no move yet)
      if (!isExpandedOnThisCard) {
        setExpandedPile(pileIndex);
        setExpandedCardIndex(cardIndex);
        return;
      }
      // Already expanded on this card: collapse then proceed to move
      setExpandedPile(null);
      setExpandedCardIndex(null);
    } else {
      // Threshold not met: ensure not expanded
      if (expandedPile !== null || expandedCardIndex !== null) {
        setExpandedPile(null);
        setExpandedCardIndex(null);
      }
    }

    // Always trigger the original onCardPress callback
    if (onCardPress) {
      onCardPress(pileIndex, cardIndex);
    }
  };

  const handleHover = (cardIndex: number, isHovered: boolean) => {
    if (!disabled && onCardHover) {
      onCardHover(pileIndex, cardIndex, isHovered);
    }
  };

  // Find the first face-up card in the pile
  const getInteractiveStartIndex = () => {
    const firstFaceUpIndex = cards.findIndex(card => card.isFaceUp);
    return firstFaceUpIndex >= 0 ? firstFaceUpIndex : cards.length - 1;
  };

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setDimensions({ width, height });
  };

  const calculateGapSize = (cardIndex: number) => {
    const cardHeight = dimensions.width * 80 / 120;
    const gapByWidth = dimensions.width * 0.3;
    const cardCount = cards.length;
    const gapByHeight = (dimensions.height - cardHeight) / cardCount;

    const baseGapSize = Math.min(gapByWidth, gapByHeight);
    
    // If this pile is expanded and current card index is greater than or equal to expanded card index
    if (expandedPile === pileIndex && expandedCardIndex !== null && cardIndex >= expandedCardIndex && baseGapSize <= gapByWidth * 0.85) {
      return baseGapSize * 2; // Double the gap size for cards after and including the expanded card
    }

    return baseGapSize; // Normal gap size for other cards
  };

  const calculateTopPosition = (cardIndex: number) => {
    let topPosition = 0;
    for (let i = 0; i < cardIndex; i++) {
      topPosition += calculateGapSize(i);
    }
    return topPosition;
  };

  const interactiveStartIndex = getInteractiveStartIndex();

  return (
    <View style={styles.pileContainer} onLayout={onLayout}>
      {cards.map((card, cardIndex) => {
        const isInteractive = cardIndex >= interactiveStartIndex;
        const isHovered = hoveredCard?.pileIndex === pileIndex && 
                          hoveredCard?.cardIndex === cardIndex;

        const topPosition = calculateTopPosition(cardIndex);

        return (
          <TouchableWithoutFeedback
            key={`pile-${pileIndex}-card-${cardIndex}`}
            onPress={() => handleCardPress(cardIndex)}
            onPressIn={() => isInteractive && handleHover(cardIndex, true)}
            onPressOut={() => isInteractive && handleHover(cardIndex, false)}
            disabled={!isInteractive || disabled}
          >
            <View style={[
              styles.cardWrapper,
              {
                zIndex: cardIndex,
                top: topPosition,
                position: 'absolute',
              }
            ]}>
              <CardComponent
                card={card}
                isHovered={isHovered}
                isInteractive={isInteractive && !disabled}
                style={[
                  isHovered && styles.hoveredCard,
                  !isInteractive && styles.nonInteractiveCard,
                ]}
              />
            </View>
          </TouchableWithoutFeedback>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  pileContainer: {
    flex: 1,
    maxWidth: 80,
    position: 'relative',
    marginHorizontal: 4,
    marginBottom: 10,
    overflow: 'hidden', // Prevent cards from overflowing the container
    zIndex: 1, // Ensure pile stays below button bar
  },
  cardWrapper: {
    left: 0,
  },
  hoveredCard: {
    borderColor: '#4a90e2',
    borderWidth: 2,
    borderRadius: 5,
  },
  nonInteractiveCard: {
    opacity: 0.9,
  },
});