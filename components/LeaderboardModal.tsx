import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { COLORS } from '../constants/Colors';
import { gameService } from '../services/gameService';
import { LeaderboardResponse } from '../types/gameTypes';
import { isValidNickname, MAX_NICKNAME_LEN, sanitizeNickname } from '../utils/playerIdentity';
import { formatElapsed } from '../utils/score';

interface LeaderboardModalProps {
  visible: boolean;
  onClose: () => void;
  playerId: string;
  nickname: string;
  date?: string | null;
  onNicknameSaved: (nickname: string) => void | Promise<void>;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  visible,
  onClose,
  playerId,
  nickname,
  date,
  onNicknameSaved,
}) => {
  const [board, setBoard] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftName, setDraftName] = useState(nickname);
  const [editing, setEditing] = useState(!nickname);
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setDraftName(nickname);
    setEditing(!nickname);
  }, [visible, nickname]);

  useEffect(() => {
    if (!visible) return;
    setError(null);
    let cancelled = false;
    setLoading(true);
    gameService
      .getDailyLeaderboard(playerId, date ?? undefined)
      .then((data) => {
        if (!cancelled) setBoard(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not load the board.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [visible, playerId, date]);

  const handleSaveName = async () => {
    const cleaned = sanitizeNickname(draftName);
    if (!isValidNickname(cleaned)) {
      setError('Use 1–20 letters, numbers, or spaces.');
      return;
    }
    setSavingName(true);
    setError(null);
    try {
      await onNicknameSaved(cleaned);
      setEditing(false);
      const data = await gameService.getDailyLeaderboard(playerId, date ?? undefined);
      setBoard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save name.');
    } finally {
      setSavingName(false);
    }
  };

  const you = board?.you;
  const youOffBoard = Boolean(you && you.rank > 20);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Daily Board</Text>
          <Text style={styles.subtitle}>
            {board?.date ?? date ?? 'Today'} · same deal for everyone
          </Text>

          {editing ? (
            <View style={styles.nameBox}>
              <Text style={styles.nameLabel}>Name on the board</Text>
              <TextInput
                style={styles.nameInput}
                value={draftName}
                onChangeText={(text) => setDraftName(text.slice(0, MAX_NICKNAME_LEN))}
                placeholder="Your name"
                placeholderTextColor="rgba(255,255,255,0.3)"
                maxLength={MAX_NICKNAME_LEN}
                autoFocus
                onSubmitEditing={() => {
                  void handleSaveName();
                }}
              />
              <TouchableOpacity
                style={styles.saveNameButton}
                onPress={() => {
                  void handleSaveName();
                }}
                disabled={savingName}
                activeOpacity={0.75}
              >
                <Text style={styles.saveNameText}>{savingName ? 'Saving…' : 'Save name'}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.playingAs}
              onPress={() => setEditing(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.playingAsText}>
                Playing as {nickname || '—'} · tap to change
              </Text>
            </TouchableOpacity>
          )}

          {loading ? (
            <ActivityIndicator color={COLORS.brass} style={styles.loader} />
          ) : (
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {board && board.entries.length === 0 ? (
                <Text style={styles.empty}>
                  Win today’s Daily Challenge to post a score. Ranked by score — fewer moves and
                  less time win.
                </Text>
              ) : (
                board?.entries.map((row) => (
                  <View key={`${row.rank}-${row.nickname}`} style={[styles.row, row.is_you && styles.rowYou]}>
                    <Text style={[styles.rank, row.is_you && styles.youText]}>{row.rank}</Text>
                    <Text style={[styles.nick, row.is_you && styles.youText]} numberOfLines={1}>
                      {row.nickname}
                    </Text>
                    <Text style={[styles.score, row.is_you && styles.youText]}>{row.score}</Text>
                    <Text style={styles.meta}>
                      {row.moves}m · {formatElapsed(row.elapsed_seconds)}
                    </Text>
                  </View>
                ))
              )}
              {youOffBoard && you ? (
                <View style={[styles.row, styles.rowYou, styles.yourRank]}>
                  <Text style={[styles.rank, styles.youText]}>{you.rank}</Text>
                  <Text style={[styles.nick, styles.youText]} numberOfLines={1}>
                    {you.nickname}
                  </Text>
                  <Text style={[styles.score, styles.youText]}>{you.score}</Text>
                  <Text style={styles.meta}>
                    {you.moves}m · {formatElapsed(you.elapsed_seconds)}
                  </Text>
                </View>
              ) : null}
            </ScrollView>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

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
    width: Platform.OS === 'web' ? '48%' : '90%',
    maxWidth: 420,
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
    marginBottom: 12,
  },
  nameBox: {
    marginBottom: 12,
  },
  nameLabel: {
    color: COLORS.brassLight,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: COLORS.brass,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    backgroundColor: 'rgba(0,0,0,0.25)',
    fontSize: 15,
    marginBottom: 8,
  },
  saveNameButton: {
    backgroundColor: COLORS.buttonDeal,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.brass,
    paddingVertical: 10,
    alignItems: 'center',
  },
  saveNameText: {
    color: COLORS.buttonText,
    fontWeight: '700',
    fontSize: 14,
  },
  playingAs: {
    marginBottom: 10,
    alignItems: 'center',
  },
  playingAsText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  loader: {
    marginVertical: 24,
  },
  list: {
    maxHeight: 320,
  },
  empty: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    paddingVertical: 18,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(201, 162, 39, 0.25)',
    gap: 8,
  },
  rowYou: {
    backgroundColor: 'rgba(201, 162, 39, 0.16)',
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  yourRank: {
    marginTop: 10,
  },
  rank: {
    width: 28,
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '800',
  },
  nick: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  score: {
    color: COLORS.textGold,
    fontSize: 14,
    fontWeight: '800',
    minWidth: 52,
    textAlign: 'right',
  },
  meta: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    minWidth: 72,
    textAlign: 'right',
  },
  youText: {
    color: COLORS.textGold,
  },
  error: {
    color: '#f0a0a0',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
  },
  closeButton: {
    marginTop: 16,
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
