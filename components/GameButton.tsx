import * as Haptics from 'expo-haptics';
import React, { useRef } from 'react';
import { Animated, Platform, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import { COLORS } from '../constants/Colors';

export type GameButtonVariant = 'new' | 'deal' | 'solve' | 'undo' | 'help';

const VARIANT_STYLES: Record<
  GameButtonVariant,
  { face: string; rim: string; glow: string; iconBg: string }
> = {
  new: {
    face: COLORS.buttonNew,
    rim: '#1e6b38',
    glow: 'rgba(45, 143, 78, 0.55)',
    iconBg: '#3aad62',
  },
  deal: {
    face: COLORS.buttonDeal,
    rim: '#1a5088',
    glow: 'rgba(43, 108, 176, 0.55)',
    iconBg: '#3d8fd4',
  },
  solve: {
    face: COLORS.buttonSolve,
    rim: '#5b21b6',
    glow: 'rgba(124, 58, 237, 0.55)',
    iconBg: '#9f67ff',
  },
  undo: {
    face: COLORS.buttonUndo,
    rim: '#2d3338',
    glow: 'rgba(90, 98, 104, 0.45)',
    iconBg: '#7a848c',
  },
  help: {
    face: COLORS.buttonHelp,
    rim: '#92400e',
    glow: 'rgba(194, 120, 3, 0.55)',
    iconBg: '#e8a020',
  },
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
    outputRange: [0, 5],
  });

  const scale = pressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.94],
  });

  return (
    <View style={[styles.wrapper, disabled && styles.wrapperDisabled]}>
      <View style={[styles.baseShadow, { backgroundColor: colors.rim }]} />

      <TouchableWithoutFeedback
        onPress={disabled ? undefined : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
      >
        <Animated.View
          style={[
            styles.token,
            {
              backgroundColor: colors.face,
              transform: [{ translateY }, { scale }],
              shadowColor: colors.glow,
            },
          ]}
        >
          <View style={styles.tokenHighlight} />
          <View style={styles.tokenRim} />

          <View style={[styles.medallionOuter, { borderColor: COLORS.brass }]}>
            <View style={[styles.medallionInner, { backgroundColor: colors.iconBg }]}>
              <Text style={styles.icon}>{icon}</Text>
            </View>
          </View>

          <View style={styles.labelPlaque}>
            <Text style={styles.label}>{label}</Text>
          </View>
        </Animated.View>
      </TouchableWithoutFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    alignItems: 'center',
    minHeight: 78,
    position: 'relative',
  },
  wrapperDisabled: {
    opacity: 0.5,
  },
  baseShadow: {
    position: 'absolute',
    bottom: 0,
    left: 4,
    right: 4,
    height: 68,
    borderRadius: 14,
  },
  token: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 5,
    paddingHorizontal: 2,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderBottomWidth: 4,
    borderBottomColor: 'rgba(0, 0, 0, 0.35)',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 8,
  },
  tokenHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '38%',
    backgroundColor: COLORS.buttonHighlight,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  tokenRim: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.12)',
  },
  medallionOuter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2.5,
    padding: 2,
    backgroundColor: COLORS.woodDark,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 4,
  },
  medallionInner: {
    flex: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  icon: {
    fontSize: 17,
    color: COLORS.buttonText,
    fontWeight: '900',
    textShadowColor: 'rgba(0, 0, 0, 0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginTop: -1,
  },
  labelPlaque: {
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  label: {
    color: COLORS.textGold,
    fontWeight: '800',
    fontSize: 9,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
});
