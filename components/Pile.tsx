import React, { useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { CARD_ASPECT_RATIO, cardHeightForWidth } from '../constants/CardLayout';
import { COLORS } from '../constants/Colors';
import { Card } from '../types/gameTypes';
import { CardComponent } from './Card';

interface PileProps {
  cards: Card[];
  pileIndex: number;
  cardWidth: number;
  columnHeight: number;
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

interface GapMetrics {
  cardHeight: number;
  gapByWidth: number;
  baseGapSize: number;
  requiresExpansion: boolean;
  containerHeight: number;
}

interface ExpansionRange {
  start: number;
  end: number;
}

function getInteractiveStartIndex(cards: Card[]): number {
  const firstFaceUpIndex = cards.findIndex((card) => card.isFaceUp);
  return firstFaceUpIndex >= 0 ? firstFaceUpIndex : cards.length - 1;
}

function computeGapMetrics(cards: Card[], cardWidth: number, columnHeight: number): GapMetrics {
  const cardHeight = cardHeightForWidth(cardWidth);
  const gapByWidth = cardWidth * 0.5;
  const cardCount = cards.length;
  const containerHeight = Math.max(columnHeight, cardHeight);
  const gapByHeight =
    cardCount > 1 ? (containerHeight - cardHeight * 2) / cardCount : gapByWidth;
  const baseGapSize = Math.max(1, Math.min(gapByWidth, gapByHeight));
  const requiresExpansion = baseGapSize <= gapByWidth * 0.85;
  return { cardHeight, gapByWidth, baseGapSize, requiresExpansion, containerHeight };
}

function computeExpansionRange(
  cards: Card[],
  expandedCardIndex: number
): ExpansionRange | null {
  const faceUpStartIndex = getInteractiveStartIndex(cards);
  if (expandedCardIndex < faceUpStartIndex) {
    return null;
  }

  const faceUpCards = cards.slice(faceUpStartIndex);
  const faceUpCardIndex = expandedCardIndex - faceUpStartIndex;
  const faceUpCardsFromClickedToEnd = faceUpCards.length - faceUpCardIndex;

  let faceUpExpansionStartIndex: number;
  let faceUpExpansionEndIndex: number;

  if (faceUpCardsFromClickedToEnd >= 7) {
    faceUpExpansionStartIndex = faceUpCardIndex;
    faceUpExpansionEndIndex = faceUpCardIndex + 7;
  } else {
    const faceUpCardsNeededAbove = 7 - faceUpCardsFromClickedToEnd;
    faceUpExpansionStartIndex = Math.max(0, faceUpCardIndex - faceUpCardsNeededAbove);
    faceUpExpansionEndIndex = faceUpCardIndex + faceUpCardsFromClickedToEnd;
  }

  return {
    start: faceUpStartIndex + faceUpExpansionStartIndex,
    end: faceUpStartIndex + faceUpExpansionEndIndex,
  };
}

function computeGapSizes(
  cards: Card[],
  metrics: GapMetrics,
  expansionRange: ExpansionRange | null
): number[] {
  const { cardHeight, gapByWidth, baseGapSize, containerHeight } = metrics;
  const sizes = new Array<number>(cards.length).fill(baseGapSize);

  if (!expansionRange) {
    return sizes;
  }

  const { start: expansionStartIndex, end: expansionEndIndex } = expansionRange;
  const expandedCardsCount = Math.max(0, expansionEndIndex - expansionStartIndex);

  for (let i = expansionStartIndex; i < expansionEndIndex; i++) {
    sizes[i] = gapByWidth;
  }

  let totalHeightNeeded = cardHeight * cards.length;

  for (let i = 0; i < expansionStartIndex; i++) {
    totalHeightNeeded += baseGapSize;
  }
  totalHeightNeeded += gapByWidth * Math.max(0, expandedCardsCount - 1);
  for (let i = expansionEndIndex; i < cards.length; i++) {
    totalHeightNeeded += baseGapSize;
  }

  if (totalHeightNeeded > containerHeight) {
    const availableHeightForGaps = containerHeight - cardHeight * cards.length;
    const expandedCardsGapHeight = gapByWidth * Math.max(0, expandedCardsCount - 1);
    const unexpandedCardsCount = cards.length - expandedCardsCount;

    if (unexpandedCardsCount > 0) {
      const remainingHeightForUnexpanded = availableHeightForGaps - expandedCardsGapHeight;
      const reducedGapSize = Math.max(1, remainingHeightForUnexpanded / unexpandedCardsCount);

      for (let i = 0; i < cards.length; i++) {
        if (i < expansionStartIndex || i >= expansionEndIndex) {
          sizes[i] = reducedGapSize;
        }
      }
    }
  }

  return sizes;
}

function computeTopPositions(gapSizes: number[]): number[] {
  const tops = new Array<number>(gapSizes.length).fill(0);
  for (let i = 1; i < gapSizes.length; i++) {
    tops[i] = tops[i - 1] + gapSizes[i - 1];
  }
  return tops;
}

export const Pile = React.forwardRef<PileRef, PileProps>(({
  cards,
  pileIndex,
  cardWidth,
  columnHeight,
  hoveredCard,
  onCardPress,
  onCardHover,
  onExpansionChange,
  onTouchEvent,
  disabled = false,
}, ref) => {
  const [expandedPile, setExpandedPile] = useState<number | null>(null);
  const [expandedCardIndex, setExpandedCardIndex] = useState<number | null>(null);
  const prevLengthRef = useRef<number>(cards.length);
  const onExpansionChangeRef = useRef(onExpansionChange);

  useEffect(() => {
    onExpansionChangeRef.current = onExpansionChange;
  }, [onExpansionChange]);

  useEffect(() => {
    if (cards.length > prevLengthRef.current) {
      setExpandedPile(null);
      setExpandedCardIndex(null);
      onExpansionChangeRef.current?.(null);
    }
    prevLengthRef.current = cards.length;
  }, [cards.length]);

  const collapseExpansion = useCallback(() => {
    setExpandedPile((currentPile) => {
      if (currentPile === pileIndex) {
        setExpandedCardIndex(null);
        onExpansionChangeRef.current?.(null);
      }
      return null;
    });
  }, [pileIndex]);

  useImperativeHandle(ref, () => ({
    collapseExpansion,
  }), [collapseExpansion]);

  const interactiveStartIndex = getInteractiveStartIndex(cards);
  const singleCardHeight = cardHeightForWidth(cardWidth);

  const gapMetrics = useMemo(
    () => computeGapMetrics(cards, cardWidth, columnHeight),
    [cards, cardWidth, columnHeight]
  );

  const expansionRange = useMemo((): ExpansionRange | null => {
    if (expandedPile !== pileIndex || expandedCardIndex === null || !gapMetrics.requiresExpansion) {
      return null;
    }
    return computeExpansionRange(cards, expandedCardIndex);
  }, [cards, expandedPile, expandedCardIndex, pileIndex, gapMetrics.requiresExpansion]);

  const gapSizes = useMemo(
    () => computeGapSizes(cards, gapMetrics, expansionRange),
    [cards, gapMetrics, expansionRange]
  );

  const topPositions = useMemo(
    () => computeTopPositions(gapSizes),
    [gapSizes]
  );

  const isExpandedOnPile = expandedPile === pileIndex && expandedCardIndex !== null;

  const handleCardPress = useCallback((cardIndex: number) => {
    if (disabled) return;

    const faceUpStartIndex = getInteractiveStartIndex(cards);
    if (cardIndex < faceUpStartIndex) return;

    const isLastFaceUpCard = cardIndex === cards.length - 1;
    const { requiresExpansion } = computeGapMetrics(cards, cardWidth, columnHeight);

    const clearExpansion = () => {
      setExpandedPile(null);
      setExpandedCardIndex(null);
      onExpansionChangeRef.current?.(null);
    };

    if (isLastFaceUpCard) {
      if (expandedPile !== null || expandedCardIndex !== null) {
        clearExpansion();
      }
      onCardPress?.(pileIndex, cardIndex);
      return;
    }

    const isExpandedOnThisCard = expandedPile === pileIndex && expandedCardIndex === cardIndex;
    const isCurrentlyExpanded = expandedPile === pileIndex && expandedCardIndex !== null;

    if (isCurrentlyExpanded && requiresExpansion) {
      const range = computeExpansionRange(cards, expandedCardIndex!);
      const includesLastFaceUp =
        range != null &&
        cards.length - 1 >= range.start &&
        cards.length - 1 < range.end;

      if (includesLastFaceUp && cardIndex === cards.length - 1) {
        clearExpansion();
        onCardPress?.(pileIndex, cardIndex);
        return;
      }
    }

    if (requiresExpansion) {
      if (!isExpandedOnThisCard) {
        setExpandedPile(pileIndex);
        setExpandedCardIndex(cardIndex);
        onExpansionChangeRef.current?.(pileIndex);
        return;
      }

      if (isCurrentlyExpanded && cardIndex !== expandedCardIndex) {
        const range = computeExpansionRange(cards, expandedCardIndex!);
        if (range && cardIndex >= range.start && cardIndex < range.end) {
          setExpandedCardIndex(cardIndex);
          return;
        }
      }

      clearExpansion();
    } else if (expandedPile !== null || expandedCardIndex !== null) {
      clearExpansion();
    }

    onCardPress?.(pileIndex, cardIndex);
  }, [
    cards,
    cardWidth,
    columnHeight,
    disabled,
    expandedCardIndex,
    expandedPile,
    onCardPress,
    pileIndex,
  ]);

  const handleHover = useCallback((cardIndex: number, isHovered: boolean) => {
    if (!disabled) {
      onCardHover?.(pileIndex, cardIndex, isHovered);
    }
  }, [disabled, onCardHover, pileIndex]);

  if (cards.length === 0) {
    return (
      <Pressable onPress={() => onTouchEvent?.(pileIndex)}>
        <View style={[styles.pileContainer, columnHeight > 0 && { height: columnHeight }]}>
          <View style={[styles.emptySlot, { aspectRatio: CARD_ASPECT_RATIO }]}>
            <View style={styles.emptySlotInner} />
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={[styles.pileContainer, columnHeight > 0 && { height: columnHeight }]}>
      {cards.map((card, cardIndex) => {
        const isInteractive = cardIndex >= interactiveStartIndex;
        const isHovered =
          hoveredCard?.pileIndex === pileIndex && hoveredCard?.cardIndex === cardIndex;
        const isInExpandedRange =
          expansionRange != null &&
          cardIndex >= expansionRange.start &&
          cardIndex < expansionRange.end;

        return (
          <Pressable
            key={`pile-${pileIndex}-card-${cardIndex}`}
            onPress={() => {
              onTouchEvent?.(pileIndex);
              handleCardPress(cardIndex);
            }}
            onPressIn={() => isInteractive && handleHover(cardIndex, true)}
            onPressOut={() => isInteractive && handleHover(cardIndex, false)}
            disabled={!isInteractive || disabled}
            style={[
              styles.cardWrapper,
              {
                zIndex: isInExpandedRange ? 1000 + cardIndex : cardIndex,
                top: topPositions[cardIndex] ?? 0,
                width: cardWidth,
                height: singleCardHeight,
              },
            ]}
          >
            <CardComponent
              card={card}
              cardWidth={cardWidth}
              isHovered={isHovered}
              isInteractive={isInteractive && !disabled}
              isDimmed={isExpandedOnPile && !isInExpandedRange}
            />
          </Pressable>
        );
      })}
    </View>
  );
});

Pile.displayName = 'Pile';

const styles = StyleSheet.create({
  pileContainer: {
    position: 'relative',
    flex: 1,
    width: '100%',
    height: '100%',
    alignSelf: 'stretch',
  },
  emptySlot: {
    width: '100%',
    borderRadius: 7,
    borderWidth: 2,
    borderColor: COLORS.emptySlotBorder,
    borderStyle: 'dashed',
    backgroundColor: COLORS.emptySlot,
    padding: 3,
  },
  emptySlotInner: {
    flex: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 39, 0.2)',
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
  },
  cardWrapper: {
    position: 'absolute',
    left: 0,
  },
});
