import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../constants/Colors';

interface HudStatProps {
  label: string;
  value: string | number;
  suffix?: string;
  accent?: boolean;
}

export const HudStat: React.FC<HudStatProps> = ({ label, value, suffix, accent = false }) => (
  <View style={styles.container}>
    <Text style={styles.label}>{label}</Text>
    <View style={styles.valueRow}>
      <Text style={[styles.value, accent && styles.valueAccent]}>{value}</Text>
      {suffix != null && <Text style={styles.suffix}>{suffix}</Text>}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    minWidth: 72,
  },
  label: {
    color: COLORS.brassLight,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 2,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  valueAccent: {
    color: COLORS.textGold,
  },
  suffix: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 1,
  },
});
