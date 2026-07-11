import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants/Colors';
import { IMAGES } from '../utils/assets';

interface StockPileProps {
  drawsRemaining: number;
  maxDraws?: number;
}

export const StockPile: React.FC<StockPileProps> = ({ drawsRemaining, maxDraws = 5 }) => {
  const stackDepth = Math.min(drawsRemaining, 4);

  return (
    <View style={styles.container}>
      <View style={styles.stack}>
        {drawsRemaining > 0 ? (
          <>
            {Array.from({ length: stackDepth }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.cardLayer,
                  {
                    top: i * 3,
                    left: i * 2,
                    zIndex: i,
                    opacity: 0.55 + (i / stackDepth) * 0.45,
                  },
                ]}
              >
                <Image source={IMAGES.card_back} style={styles.cardImage} />
                <View style={styles.cardShine} />
              </View>
            ))}
          </>
        ) : (
          <View style={styles.emptyStack}>
            <Text style={styles.emptyText}>EMPTY</Text>
          </View>
        )}
      </View>
      <View style={styles.countBadge}>
        <Text style={styles.countValue}>{drawsRemaining}</Text>
        <Text style={styles.countSlash}>/</Text>
        <Text style={styles.countMax}>{maxDraws}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stack: {
    width: 26,
    height: 34,
    position: 'relative',
  },
  cardLayer: {
    position: 'absolute',
    width: 24,
    height: 32,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cardShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '30%',
    backgroundColor: COLORS.cardGloss,
  },
  emptyStack: {
    width: 24,
    height: 32,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: COLORS.emptySlotBorder,
    borderStyle: 'dashed',
    backgroundColor: COLORS.emptySlot,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  countValue: {
    color: COLORS.textGold,
    fontSize: 15,
    fontWeight: '800',
  },
  countSlash: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '600',
    marginHorizontal: 1,
  },
  countMax: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
});
