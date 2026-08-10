import React, { useEffect, useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../constants/Colors';
import { formatElapsed } from '../utils/score';
import { loadPlayerStats, PlayerStats } from '../utils/playerStats';

interface StatsModalProps {
  visible: boolean;
  onClose: () => void;
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export const StatsModal: React.FC<StatsModalProps> = ({ visible, onClose }) => {
  const [stats, setStats] = useState<PlayerStats | null>(null);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    loadPlayerStats().then((s) => {
      if (!cancelled) setStats(s);
    });
    return () => {
      cancelled = true;
    };
  }, [visible]);

  const winRate =
    stats && stats.gamesPlayed > 0
      ? `${Math.round((stats.gamesWon / stats.gamesPlayed) * 100)}%`
      : '—';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Your Stats</Text>
          <Text style={styles.subtitle}>Saved on this device</Text>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {stats ? (
              <>
                <StatRow label="Games played" value={String(stats.gamesPlayed)} />
                <StatRow label="Games won" value={String(stats.gamesWon)} />
                <StatRow label="Win rate" value={winRate} />
                <StatRow
                  label="Best moves"
                  value={stats.bestMoves != null ? String(stats.bestMoves) : '—'}
                />
                <StatRow
                  label="Best time"
                  value={
                    stats.bestTimeSeconds != null
                      ? formatElapsed(stats.bestTimeSeconds)
                      : '—'
                  }
                />
                <StatRow
                  label="Best score"
                  value={stats.bestScore != null ? String(stats.bestScore) : '—'}
                />
                <StatRow label="Win streak" value={String(stats.currentStreak)} />
                <StatRow label="Best streak" value={String(stats.bestStreak)} />
              </>
            ) : (
              <Text style={styles.loading}>Loading…</Text>
            )}
          </ScrollView>

          <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.75}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: Platform.OS === 'web' ? '40%' : '88%',
    maxWidth: 380,
    backgroundColor: COLORS.woodDark,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.brass,
    padding: 22,
  },
  title: {
    color: COLORS.textGold,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  list: {
    maxHeight: 320,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(201, 162, 39, 0.25)',
  },
  rowLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  rowValue: {
    color: COLORS.textGold,
    fontSize: 15,
    fontWeight: '800',
  },
  loading: {
    color: COLORS.textMuted,
    textAlign: 'center',
    paddingVertical: 20,
  },
  closeButton: {
    marginTop: 18,
    backgroundColor: COLORS.buttonDeal,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.brass,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: COLORS.buttonText,
    fontWeight: '700',
    fontSize: 15,
  },
});
