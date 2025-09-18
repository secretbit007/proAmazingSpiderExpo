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
  onExpansionChange?: (pileIndex: number | null) => void;
  onTouchEvent?: (targetPileIndex: number | null) => void;
  disabled?: boolean;
}

export interface PileRef {
  collapseExpansion: () => void;
}

export const Pile = React.forwardRef<PileRef, PileProps>(({
  cards,
  pileIndex,
  hoveredCard,
  onCardPress,
  onCardHover,
  onExpansionChange,
  onTouchEvent,
  disabled = false,
}, ref) => {
  const [dimensions, setDimensions] = React.useState({ width: 80, height: 120 });
  const [expandedPile, setExpandedPile] = React.useState<number | null>(null);
  const [expandedCardIndex, setExpandedCardIndex] = React.useState<number | null>(null);
  const prevLengthRef = React.useRef<number>(cards.length);

  // Collapse this pile automatically if cards were dealt to it (length increased)
  React.useEffect(() => {
    if (cards.length > prevLengthRef.current) {
      setExpandedPile(null);
      setExpandedCardIndex(null);
      onExpansionChange?.(null);
    }
    prevLengthRef.current = cards.length;
  }, [cards.length, onExpansionChange]);

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
        onExpansionChange?.(null);
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
    const gapByHeight = (dimensions.height - cardHeight * 2) / cardCount;
    const baseGapSize = Math.min(gapByWidth, gapByHeight);
    const requiresExpansion = baseGapSize <= gapByWidth * 0.85;

    const isExpandedOnThisCard = expandedPile === pileIndex && expandedCardIndex === cardIndex;

    // Check if we're currently in an expanded state and if the expansion includes the last card
    const isCurrentlyExpanded = expandedPile === pileIndex && expandedCardIndex !== null;
    let expansionIncludesLastCard = false;
    
    if (isCurrentlyExpanded && requiresExpansion) {
      // Calculate the 7-card expansion range (same logic as calculateGapSize)
      const cardsFromClickedToEnd = cards.length - expandedCardIndex;
      
      let expansionStartIndex, expansionEndIndex;
      
      if (cardsFromClickedToEnd >= 7) {
        // Enough cards from clicked position, expand 7 cards from clicked card
        expansionStartIndex = expandedCardIndex;
        expansionEndIndex = expandedCardIndex + 7;
      } else {
        // Not enough cards from clicked position, expand cards above as well
        const cardsNeededAbove = 7 - cardsFromClickedToEnd;
        expansionStartIndex = Math.max(0, expandedCardIndex - cardsNeededAbove);
        expansionEndIndex = expandedCardIndex + cardsFromClickedToEnd;
      }
      
      // Check if the expansion includes the last card (cards.length - 1)
      expansionIncludesLastCard = (cards.length - 1) >= expansionStartIndex && (cards.length - 1) < expansionEndIndex;
    }

    // If expansion includes the last card and we're clicking within the expanded range, move immediately
    if (isCurrentlyExpanded && expansionIncludesLastCard && requiresExpansion) {
      const cardsFromClickedToEnd = cards.length - expandedCardIndex;
      
      let expansionStartIndex, expansionEndIndex;
      
      if (cardsFromClickedToEnd >= 7) {
        expansionStartIndex = expandedCardIndex;
        expansionEndIndex = expandedCardIndex + 7;
      } else {
        const cardsNeededAbove = 7 - cardsFromClickedToEnd;
        expansionStartIndex = Math.max(0, expandedCardIndex - cardsNeededAbove);
        expansionEndIndex = expandedCardIndex + cardsFromClickedToEnd;
      }
      
      // Check if current card is within the expanded range
      if (cardIndex >= expansionStartIndex && cardIndex < expansionEndIndex) {
        // Collapse expansion and move immediately
        setExpandedPile(null);
        setExpandedCardIndex(null);
        onExpansionChange?.(null);
        if (onCardPress) {
          onCardPress(pileIndex, cardIndex);
        }
        return;
      }
    }

    // Expanded status should be true only if threshold holds
    if (requiresExpansion) {
      // First click under threshold expands and stops (no move yet)
      if (!isExpandedOnThisCard) {
        setExpandedPile(pileIndex);
        setExpandedCardIndex(cardIndex);
        onExpansionChange?.(pileIndex);
        return;
      }
      // Already expanded on this card: collapse then proceed to move
      setExpandedPile(null);
      setExpandedCardIndex(null);
      onExpansionChange?.(null);
    } else {
      // Threshold not met: ensure not expanded
      if (expandedPile !== null || expandedCardIndex !== null) {
        setExpandedPile(null);
        setExpandedCardIndex(null);
        onExpansionChange?.(null);
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


  // Function to collapse this pile's expansion
  const collapseExpansion = () => {
    if (expandedPile === pileIndex && expandedCardIndex !== null) {
      setExpandedPile(null);
      setExpandedCardIndex(null);
      onExpansionChange?.(null);
    }
  };

  // Expose collapse function to parent via ref
  React.useImperativeHandle(ref, () => ({
    collapseExpansion
  }), [expandedPile, expandedCardIndex, pileIndex]);

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
    const gapByHeight = (dimensions.height - cardHeight * 2) / cardCount;

    const baseGapSize = Math.min(gapByWidth, gapByHeight);
    
    // If this pile is expanded, calculate the 7-card expansion range
    if (expandedPile === pileIndex && expandedCardIndex !== null && baseGapSize <= gapByWidth * 0.85) {
      // Calculate how many cards are available from clicked card to end
      const cardsFromClickedToEnd = cards.length - expandedCardIndex;
      
      // Determine the start and end indices for the 7-card expansion
      let expansionStartIndex, expansionEndIndex;
      
      if (cardsFromClickedToEnd >= 7) {
        // Enough cards from clicked position, expand 7 cards from clicked card
        expansionStartIndex = expandedCardIndex;
        expansionEndIndex = expandedCardIndex + 7;
      } else {
        // Not enough cards from clicked position, expand cards above as well
        const cardsNeededAbove = 7 - cardsFromClickedToEnd;
        expansionStartIndex = Math.max(0, expandedCardIndex - cardsNeededAbove);
        expansionEndIndex = expandedCardIndex + cardsFromClickedToEnd;
      }
      
      // Check if current card is within the 7-card expansion range
      if (cardIndex >= expansionStartIndex && cardIndex < expansionEndIndex) {
        return gapByWidth; // Expanded gap size for the 7 cards
      }
      
      // For unexpanded cards, check if we need to reduce gap to prevent overflow
      // Calculate total height needed for all cards with current gap sizes
      let totalHeightNeeded = 0;
      
      // Calculate height for cards before expansion
      for (let i = 0; i < expansionStartIndex; i++) {
        totalHeightNeeded += baseGapSize;
      }
      
      // Calculate height for expanded cards
      const expandedCardsCount = expansionEndIndex - expansionStartIndex;
      totalHeightNeeded += gapByWidth * (expandedCardsCount - 1);
      
      // Calculate height for cards after expansion
      for (let i = expansionEndIndex; i < cards.length; i++) {
        totalHeightNeeded += baseGapSize;
      }
      
      // Add card heights (all cards have the same height)
      totalHeightNeeded += cardHeight * cards.length;
      
      // If total height exceeds container height, reduce gap for unexpanded cards
      if (totalHeightNeeded > dimensions.height) {
        const availableHeightForGaps = dimensions.height - (cardHeight * cards.length);
        const expandedCardsGapHeight = gapByWidth * (expandedCardsCount - 1);
        const unexpandedCardsCount = cards.length - expandedCardsCount;
        
        if (unexpandedCardsCount > 0) {
          const remainingHeightForUnexpanded = availableHeightForGaps - expandedCardsGapHeight;
          const reducedGapSize = Math.max(1, remainingHeightForUnexpanded / unexpandedCardsCount);
          
          // Return reduced gap size for unexpanded cards
          return reducedGapSize;
        }
      }
    }

    return baseGapSize; // Normal gap size for other cards
  };

  const calculateTopPosition = (cardIndex: number) => {
    // Normal positioning for all cards - maintain original positions
    let topPosition = 0;
    for (let i = 0; i < cardIndex; i++) {
      topPosition += calculateGapSize(i);
    }
    return topPosition;
  };

  const isCardInExpandedRange = (cardIndex: number) => {
    // Check if this pile is expanded and if the card is in the expanded range
    if (expandedPile === pileIndex && expandedCardIndex !== null) {
      const cardHeight = dimensions.width * 80 / 120;
      const gapByWidth = dimensions.width * 0.3;
      const cardCount = cards.length;
      const gapByHeight = (dimensions.height - cardHeight) / cardCount;
      const baseGapSize = Math.min(gapByWidth, gapByHeight);
      const requiresExpansion = baseGapSize <= gapByWidth * 0.85;
      
      if (requiresExpansion) {
        // Calculate the 7-card expansion range (same logic as calculateGapSize)
        const cardsFromClickedToEnd = cards.length - expandedCardIndex;
        
        let expansionStartIndex, expansionEndIndex;
        
        if (cardsFromClickedToEnd >= 7) {
          // Enough cards from clicked position, expand 7 cards from clicked card
          expansionStartIndex = expandedCardIndex;
          expansionEndIndex = expandedCardIndex + 7;
        } else {
          // Not enough cards from clicked position, expand cards above as well
          const cardsNeededAbove = 7 - cardsFromClickedToEnd;
          expansionStartIndex = Math.max(0, expandedCardIndex - cardsNeededAbove);
          expansionEndIndex = expandedCardIndex + cardsFromClickedToEnd;
        }
        
        // Check if current card is within the 7-card expansion range
        return cardIndex >= expansionStartIndex && cardIndex < expansionEndIndex;
      }
    }
    
    return false;
  };

  const getCardZIndex = (cardIndex: number) => {
    // If this pile is expanded, give expanded cards higher z-index
    if (expandedPile === pileIndex && expandedCardIndex !== null) {
      const cardHeight = dimensions.width * 80 / 120;
      const gapByWidth = dimensions.width * 0.3;
      const cardCount = cards.length;
      const gapByHeight = (dimensions.height - cardHeight) / cardCount;
      const baseGapSize = Math.min(gapByWidth, gapByHeight);
      const requiresExpansion = baseGapSize <= gapByWidth * 0.85;
      
      if (requiresExpansion) {
        // Calculate the 7-card expansion range (same logic as calculateGapSize)
        const cardsFromClickedToEnd = cards.length - expandedCardIndex;
        
        let expansionStartIndex, expansionEndIndex;
        
        if (cardsFromClickedToEnd >= 7) {
          // Enough cards from clicked position, expand 7 cards from clicked card
          expansionStartIndex = expandedCardIndex;
          expansionEndIndex = expandedCardIndex + 7;
        } else {
          // Not enough cards from clicked position, expand cards above as well
          const cardsNeededAbove = 7 - cardsFromClickedToEnd;
          expansionStartIndex = Math.max(0, expandedCardIndex - cardsNeededAbove);
          expansionEndIndex = expandedCardIndex + cardsFromClickedToEnd;
        }
        
        // Check if current card is within the 7-card expansion range
        if (cardIndex >= expansionStartIndex && cardIndex < expansionEndIndex) {
          // Expanded cards get higher z-index (1000 + cardIndex to maintain order)
          return 1000 + cardIndex;
        }
      }
    }
    
    // Normal z-index for non-expanded cards
    return cardIndex;
  };


  const interactiveStartIndex = getInteractiveStartIndex();

  return (
    <TouchableWithoutFeedback onPress={() => onTouchEvent?.(pileIndex)}>
      <View style={styles.pileContainer} onLayout={onLayout}>
        {cards.map((card, cardIndex) => {
        const isInteractive = cardIndex >= interactiveStartIndex;
        const isHovered = hoveredCard?.pileIndex === pileIndex && 
                          hoveredCard?.cardIndex === cardIndex;
        const isInExpandedRange = isCardInExpandedRange(cardIndex);
        const isPileExpanded = expandedPile === pileIndex && expandedCardIndex !== null;

        const topPosition = calculateTopPosition(cardIndex);

        return (
          <TouchableWithoutFeedback
            key={`pile-${pileIndex}-card-${cardIndex}`}
            onPress={() => {
              onTouchEvent?.(pileIndex);
              handleCardPress(cardIndex);
            }}
            onPressIn={() => isInteractive && handleHover(cardIndex, true)}
            onPressOut={() => isInteractive && handleHover(cardIndex, false)}
            disabled={!isInteractive || disabled}
          >
            <View style={[
              styles.cardWrapper,
              {
                zIndex: getCardZIndex(cardIndex),
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
                  isPileExpanded && !isInExpandedRange && styles.unexpandedCard,
                ]}
              />
            </View>
          </TouchableWithoutFeedback>
        );
      })}
      </View>
    </TouchableWithoutFeedback>
  );
});

const styles = StyleSheet.create({
  pileContainer: {
    flex: 1,
    maxWidth: 80,
    position: 'relative',
    marginHorizontal: 4,
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
  unexpandedCard: {
    opacity: 0.4,
  },
});