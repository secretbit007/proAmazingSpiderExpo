import * as Haptics from 'expo-haptics';
import React, { useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants/Colors';

export type GameButtonVariant = 'new' | 'deal' | 'solve' | 'undo' | 'help' | 'hint';

const VARIANT_ACCENT: Record<GameButtonVariant, string> = {
  new: '#5ecf7a',
  deal: '#6eb5ff',
  solve: '#d4b8ff',
  undo: '#b0bcc8',
  help: '#f0b429',
  hint: '#ff9f43',
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
  const accent = VARIANT_ACCENT[variant];
  const pressAnim = useRef(new Animated.Value(0)).current;

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(pressAnim, {
      toValue: 1,
      friction: 7,
      tension: 320,
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
      friction: 6,
      tension: 220,
      useNativeDriver: true,
    }).start();
    onPressOut?.();
  };

  const scale = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.93],
  });

  return (
    <View style={[styles.wrapper, disabled && styles.wrapperDisabled]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        disabled={disabled}
        style={styles.touchTarget}
      >
        <Animated.View style={[styles.bezel, { transform: [{ scale }] }]}>
          <View style={styles.outerFrame}>
            <View style={styles.insetWell}>
              <View style={[styles.iconMedallion, { borderColor: accent, backgroundColor: `${accent}22` }]}>
                <Text style={[styles.icon, { color: accent }]}>{icon}</Text>
              </View>
              <Text style={styles.label}>{label}</Text>
            </View>
          </View>
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
    opacity: 0.42,
  },
  touchTarget: {
    flex: 1,
    height: '100%',
  },
  bezel: {
    flex: 1,
  },
  outerFrame: {
    flex: 1,
    borderRadius: 9,
    padding: 2,
    backgroundColor: COLORS.woodMid,
    borderWidth: 1,
    borderColor: COLORS.brass,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 2,
    elevation: 4,
  },
  insetWell: {
    flex: 1,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#120c06',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.07)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.55)',
    paddingVertical: 2,
    paddingHorizontal: 1,
  },
  iconMedallion: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
  },
  icon: {
    fontSize: 11,
    fontWeight: '900',
    lineHeight: 13,
    textAlign: 'center',
  },
  label: {
    color: COLORS.brassLight,
    fontWeight: '800',
    fontSize: 7,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    lineHeight: 9,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
});
