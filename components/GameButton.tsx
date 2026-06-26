import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants/Colors';

export type GameButtonVariant = 'new' | 'deal' | 'solve' | 'undo' | 'help';

const VARIANT_STYLES: Record<GameButtonVariant, { face: string; shadow: string }> = {
  new: { face: COLORS.buttonNew, shadow: COLORS.buttonNewDark },
  deal: { face: COLORS.buttonDeal, shadow: COLORS.buttonDealDark },
  solve: { face: COLORS.buttonSolve, shadow: COLORS.buttonSolveDark },
  undo: { face: COLORS.buttonUndo, shadow: COLORS.buttonUndoDark },
  help: { face: COLORS.buttonHelp, shadow: COLORS.buttonHelpDark },
};

interface GameButtonProps {
  variant: GameButtonVariant;
  label: string;
  icon: string;
  onPress: () => void;
  disabled?: boolean;
  onPressIn?: () => void;
  onPressOut?: () => void;
}

export const GameButton: React.FC<GameButtonProps> = ({
  variant,
  label,
  icon,
  onPress,
  disabled = false,
  onPressIn,
  onPressOut,
}) => {
  const colors = VARIANT_STYLES[variant];

  return (
    <View style={[styles.wrapper, disabled && styles.wrapperDisabled]}>
      <View style={[styles.shadowPlate, { backgroundColor: colors.shadow }]} />
      <TouchableOpacity
        style={[styles.face, { backgroundColor: colors.face }]}
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={0.85}
        disabled={disabled}
      >
        <View style={styles.highlight} />
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.label}>{label}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    position: 'relative',
    minHeight: 52,
  },
  wrapperDisabled: {
    opacity: 0.55,
  },
  shadowPlate: {
    position: 'absolute',
    left: 2,
    right: 2,
    bottom: 0,
    top: 4,
    borderRadius: 10,
  },
  face: {
    flex: 1,
    marginBottom: 4,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    overflow: 'hidden',
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
    backgroundColor: COLORS.buttonHighlight,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  icon: {
    fontSize: 16,
    color: COLORS.buttonText,
    marginBottom: 2,
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  label: {
    color: COLORS.buttonText,
    fontWeight: '800',
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
