import { Platform, ViewStyle } from 'react-native';

interface ShadowConfig {
  shadowColor?: string;
  shadowOffset?: { width: number; height: number };
  shadowOpacity?: number;
  shadowRadius?: number;
  elevation?: number;
}

export const createShadowStyle = (config: ShadowConfig): ViewStyle => {
  const {
    shadowColor = '#000',
    shadowOffset = { width: 0, height: 2 },
    shadowOpacity = 0.25,
    shadowRadius = 3.84,
    elevation = 5,
  } = config;

  if (Platform.OS === 'ios') {
    return {
      shadowColor,
      shadowOffset,
      shadowOpacity,
      shadowRadius,
    };
  } else if (Platform.OS === 'android') {
    return {
      elevation,
    };
  } else {
    // For web, use a combination of box-shadow and elevation
    return {
      elevation,
      // Web-specific shadow (will be ignored on mobile)
      ...(Platform.OS === 'web' && {
        boxShadow: `${shadowOffset.width}px ${shadowOffset.height}px ${shadowRadius}px ${shadowColor}${Math.round(shadowOpacity * 255).toString(16).padStart(2, '0')}`,
      }),
    };
  }
};
