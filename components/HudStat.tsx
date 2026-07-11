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
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 56,
  },
  label: {
    color: COLORS.brassLight,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 1,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  value: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '800',
  },
  valueAccent: {
    color: COLORS.textGold,
  },
  suffix: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 1,
  },
});
