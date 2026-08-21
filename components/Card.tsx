import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { CARD_ASPECT_RATIO } from '../constants/CardLayout';
import { COLORS } from '../constants/Colors';
import { Card } from '../types/gameTypes';
import { CardBackId } from '../constants/Themes';
import { CardFaceMetrics, CardFaceVisual, getCardFaceMetrics, getCardFaceVisual } from '../utils/cardFaceCache';
import { IMAGES } from '../utils/assets';

interface CardProps {
  card: Card;
  cardWidth: number;
  isHovered?: boolean;
  isHinted?: boolean;
  isInteractive?: boolean;
  isDimmed?: boolean;
  cardBackId?: CardBackId;
}

const CARD_BACK_IMAGES: Record<CardBackId, number> = {
  classic: IMAGES.card_back,
  navy: IMAGES.card_back_navy,
  crimson: IMAGES.card_back_crimson,
};

interface FaceUpCardFaceProps {
  visual: CardFaceVisual;
  metrics: CardFaceMetrics;
}

const FaceUpCardFace = React.memo(function FaceUpCardFace({ visual, metrics }: FaceUpCardFaceProps) {
  const { rank, suitColor, suitImage } = visual;
  const {
    cornerRankFontSize,
    cornerSuitSize,
    cornerSuitVertical,
    cornerRankVertical,
    cornerRankSuitHorizontal,
  } = metrics;

  return (
    <View style={styles.faceUpCard}>
      <View style={styles.cardWhiteBackground} />
      <View style={styles.cardGlossStrip} />

      <View style={[styles.topLeftCorner, { top: cornerRankVertical, left: cornerRankSuitHorizontal }]}>
        <Text style={[styles.cornerRank, { color: suitColor, fontSize: cornerRankFontSize }]}>
          {rank}
        </Text>
      </View>

      <View style={[styles.topRightCorner, { top: cornerSuitVertical, right: cornerRankSuitHorizontal }]}>
        <Image
          source={suitImage}
          style={[
            styles.cornerSuit,
            { tintColor: suitColor, width: cornerSuitSize, height: cornerSuitSize },
          ]}
        />
      </View>

      <View style={styles.centerSymbol}>
        <Image source={suitImage} style={[styles.centerSuit, { tintColor: suitColor }]} />
      </View>

      <View style={[styles.bottomLeftCorner, { bottom: cornerSuitVertical, left: cornerRankSuitHorizontal }]}>
        <Image
          source={suitImage}
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

      <View style={[styles.bottomRightCorner, { bottom: cornerRankVertical, right: cornerRankSuitHorizontal }]}>
        <Text
          style={[
            styles.cornerRank,
            {
              color: suitColor,
              fontSize: cornerRankFontSize,
              transform: [{ rotate: '180deg' }],
            },
          ]}
        >
          {rank}
        </Text>
      </View>
    </View>
  );
});

const CardBack = React.memo(function CardBack({ cardBackId = 'classic' }: { cardBackId?: CardBackId }) {
  return (
    <View style={styles.cardBackContainer}>
      <Image source={CARD_BACK_IMAGES[cardBackId]} style={styles.cardBackImage} />
      <View style={styles.cardBackOverlay} />
    </View>
  );
});

function CardComponentBase({
  card,
  cardWidth,
  isHovered = false,
  isHinted = false,
  isInteractive = true,
  isDimmed = false,
  cardBackId = 'classic',
}: CardProps) {
  const metrics = getCardFaceMetrics(cardWidth);
  const visual = card.isFaceUp ? getCardFaceVisual(card.rank, card.suit) : null;

  return (
    <View
      style={[
        styles.cardContainer,
        isHovered && styles.hoveredCard,
        isHinted && styles.hintedCard,
        !isInteractive && styles.nonInteractiveCard,
        isDimmed && styles.dimmedCard,
      ]}
    >
      {visual ? <FaceUpCardFace visual={visual} metrics={metrics} /> : <CardBack cardBackId={cardBackId} />}
    </View>
  );
}

function areCardPropsEqual(prev: CardProps, next: CardProps): boolean {
  return (
    prev.cardWidth === next.cardWidth &&
    prev.card.rank === next.card.rank &&
    prev.card.suit === next.card.suit &&
    prev.card.isFaceUp === next.card.isFaceUp &&
    prev.isHovered === next.isHovered &&
    prev.isHinted === next.isHinted &&
    prev.isInteractive === next.isInteractive &&
    prev.isDimmed === next.isDimmed &&
    prev.cardBackId === next.cardBackId
  );
}

export const CardComponent = React.memo(CardComponentBase, areCardPropsEqual);

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    borderRadius: 7,
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    aspectRatio: CARD_ASPECT_RATIO,
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
    borderColor: COLORS.selectionBlue,
    borderWidth: 2,
    shadowColor: COLORS.selectionBlue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.65,
    shadowRadius: 12,
    elevation: 20,
    zIndex: 100,
  },
  hintedCard: {
    transform: [{ translateY: -4 }, { scale: 1.02 }],
    borderColor: COLORS.gold,
    borderWidth: 2,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 18,
    zIndex: 90,
  },
  nonInteractiveCard: {
    opacity: 0.88,
  },
  dimmedCard: {
    opacity: 0.35,
  },
});
