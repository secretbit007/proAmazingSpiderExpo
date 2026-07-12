import * as Haptics from 'expo-haptics';
import React, { useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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
    outputRange: [0, 1],
  });

  return (
    <View style={[styles.wrapper, disabled && styles.wrapperDisabled]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.85}
        disabled={disabled}
        style={styles.touchTarget}
      >
        <Animated.View
          style={[
            styles.face,
            {
              backgroundColor: colors.face,
              borderBottomColor: colors.shadow,
              transform: [{ translateY }],
            },
          ]}
        >
          <Text style={styles.icon}>{icon}</Text>
          <Text style={styles.label}>{label}</Text>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    height: '100%',
  },
  wrapperDisabled: {
    opacity: 0.5,
  },
  touchTarget: {
    flex: 1,
    height: '100%',
  },
  face: {
    flex: 1,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderBottomWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    paddingHorizontal: 1,
  },
  icon: {
    fontSize: 12,
    color: COLORS.buttonText,
    fontWeight: '800',
    lineHeight: 14,
  },
  label: {
    color: COLORS.buttonText,
    fontWeight: '700',
    fontSize: 7,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    lineHeight: 9,
  },
});
