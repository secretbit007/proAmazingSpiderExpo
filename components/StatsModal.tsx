import React, { useEffect, useState } from 'react';
import { Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ACHIEVEMENTS, AchievementId } from '../constants/Achievements';
import { COLORS } from '../constants/Colors';
import { loadUnlockedAchievements, UnlockedMap } from '../utils/achievements';
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

function AchievementRow({
  title,
  description,
  unlocked,
}: {
  title: string;
  description: string;
  unlocked: boolean;
}) {
  return (
    <View style={[styles.badge, unlocked ? styles.badgeOn : styles.badgeOff]}>
      <Text style={[styles.badgeTitle, unlocked && styles.badgeTitleOn]}>
        {unlocked ? '★ ' : '☆ '}
        {title}
      </Text>
      <Text style={styles.badgeDesc}>{description}</Text>
    </View>
  );
}

export const StatsModal: React.FC<StatsModalProps> = ({ visible, onClose }) => {
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [unlocked, setUnlocked] = useState<UnlockedMap>({});

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    Promise.all([loadPlayerStats(), loadUnlockedAchievements()]).then(([s, a]) => {
      if (!cancelled) {
        setStats(s);
        setUnlocked(a);
      }
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
                <StatRow label="Best win streak" value={String(stats.bestStreak)} />
                <StatRow
                  label="Daily streak"
                  value={String(stats.dailyCurrentStreak ?? 0)}
                />
                <StatRow
                  label="Best daily streak"
                  value={String(stats.dailyBestStreak ?? 0)}
                />

                <Text style={styles.section}>Achievements</Text>
                {ACHIEVEMENTS.map((item) => (
                  <AchievementRow
                    key={item.id}
                    title={item.title}
                    description={item.description}
                    unlocked={Boolean(unlocked[item.id as AchievementId])}
                  />
                ))}
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
    maxHeight: 360,
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
  section: {
    color: COLORS.brassLight,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 16,
    marginBottom: 8,
  },
  badge: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginBottom: 8,
  },
  badgeOn: {
    borderColor: COLORS.brassLight,
    backgroundColor: 'rgba(201, 162, 39, 0.16)',
  },
  badgeOff: {
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  badgeTitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    fontWeight: '800',
  },
  badgeTitleOn: {
    color: COLORS.textGold,
  },
  badgeDesc: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 3,
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
