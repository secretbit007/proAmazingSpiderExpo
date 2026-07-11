import * as Haptics from 'expo-haptics';
import React, { useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
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
  const pressAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(pressAnim, {
      toValue: 1,
      friction: 6,
      tension: 280,
      useNativeDriver: true,
    }).start();
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    onPressIn?.();
  };

  const handlePressOut = () => {
    Animated.spring(pressAnim, {
      toValue: 0,
      friction: 5,
      tension: 200,
      useNativeDriver: true,
    }).start();
    onPressOut?.();
  };

  const translateY = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 2],
  });

  return (
    <View style={[styles.wrapper, disabled && styles.wrapperDisabled]}>
      <View style={[styles.baseShadow, { backgroundColor: colors.shadow }]} />
      <TouchableWithoutFeedback
        onPress={disabled ? undefined : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
      >
        <Animated.View
          style={[
            styles.face,
            { backgroundColor: colors.face, transform: [{ translateY }] },
          ]}
        >
          <Text style={styles.icon}>{icon}</Text>
          <Text style={styles.label}>{label}</Text>
        </Animated.View>
      </TouchableWithoutFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    minHeight: 40,
    position: 'relative',
  },
  wrapperDisabled: {
    opacity: 0.5,
  },
  baseShadow: {
    position: 'absolute',
    left: 1,
    right: 1,
    bottom: 0,
    top: 2,
    borderRadius: 8,
  },
  face: {
    flex: 1,
    marginBottom: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  icon: {
    fontSize: 13,
    color: COLORS.buttonText,
    fontWeight: '800',
    marginBottom: 1,
  },
  label: {
    color: COLORS.buttonText,
    fontWeight: '700',
    fontSize: 8,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
