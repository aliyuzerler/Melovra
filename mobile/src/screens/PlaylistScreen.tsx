import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import TransportBar from '../components/TransportBar';
import { useStudio } from '../store/useStudio';
import { colors, fontSize, spacing } from '../theme';

/** Playlist ekranı: pattern'leri bar'lara dizerek şarkı yapısını kurar. */
export default function PlaylistScreen() {
  const project = useStudio((s) => s.project);
  const playlistBars = useStudio((s) => s.playlistBars);
  const setPlaylistBar = useStudio((s) => s.setPlaylistBar);
  const setPlaylistBars = useStudio((s) => s.setPlaylistBars);
  const selectPattern = useStudio((s) => s.selectPattern);
  const playing = useStudio((s) => s.playing);
  const currentPatternId = useStudio((s) => s.currentPatternId);

  const patterns = project.patterns;
  const playingPattern =
    playing && currentPatternId
      ? patterns.find((p) => p.id === currentPatternId)
      : undefined;

  return (
    <View style={styles.root}>
      <TransportBar />

      <View style={styles.lenRow}>
        <Text style={styles.lenLabel}>Şarkı uzunluğu:</Text>
        {[4, 8, 16, 32].map((n) => (
          <Pressable
            key={n}
            onPress={() => setPlaylistBars(n)}
            style={[styles.lenChip, playlistBars === n && styles.lenChipActive]}
          >
            <Text style={[styles.lenChipTxt, playlistBars === n && styles.lenChipTxtActive]}>
              {n} bar
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.gridWrap}>
        <View style={styles.header}>
          <Text style={styles.barColHead}>Bar</Text>
          <Text style={styles.patColHead}>Pattern</Text>
        </View>
        {Array.from({ length: playlistBars }, (_, bar) => {
          const slot = project.playlist[bar];
          const assigned = patterns.find((p) => p.id === slot?.patternId) ?? patterns[0];
          return (
            <View key={bar} style={styles.row}>
              <View style={[styles.barCell, assigned.id === playingPattern?.id && styles.barCellActive]}>
                <Text style={styles.barTxt}>{bar + 1}</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
                <View style={styles.patRow}>
                  {patterns.map((p) => (
                    <Pressable
                      key={p.id}
                      onPress={() => {
                        setPlaylistBar(bar, p.id);
                        selectPattern(p.id);
                      }}
                      style={[
                        styles.patCell,
                        assigned.id === p.id && styles.patCellAssigned,
                      ]}
                    >
                      <Text
                        style={[
                          styles.patCellTxt,
                          assigned.id === p.id && styles.patCellTxtAssigned,
                        ]}
                        numberOfLines={1}
                      >
                        {p.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>
          );
        })}

        <Text style={styles.hint}>
          Her bar'a bir pattern atanır; Stüdyo sekmesindeki "Şarkı" modu bu dizilimi sırayla
          çalar. Yeni pattern'lar Stüdyo ekranından eklenir.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  lenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  lenLabel: { color: colors.textDim, fontSize: fontSize.sm },
  lenChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.bgCard,
  },
  lenChipActive: { backgroundColor: colors.purpleDim },
  lenChipTxt: { color: colors.textDim, fontSize: fontSize.sm, fontWeight: '600' },
  lenChipTxtActive: { color: colors.text },
  gridWrap: { padding: spacing.md, gap: spacing.xs },
  header: { flexDirection: 'row', gap: spacing.sm },
  barColHead: { width: 44, color: colors.textDim, fontSize: fontSize.xs, fontWeight: '700' },
  patColHead: { color: colors.textDim, fontSize: fontSize.xs, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  barCell: {
    width: 44,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barCellActive: { backgroundColor: colors.accentDim },
  barTxt: { color: colors.textDim, fontSize: fontSize.sm, fontWeight: '700' },
  patRow: { flexDirection: 'row', gap: 6 },
  patCell: {
    minWidth: 84,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  patCellAssigned: { backgroundColor: colors.accentDim, borderColor: colors.accent },
  patCellTxt: { color: colors.textDim, fontSize: fontSize.xs, fontWeight: '600' },
  patCellTxtAssigned: { color: colors.text },
  hint: { color: colors.textDim, fontSize: fontSize.xs, marginTop: spacing.md, lineHeight: 18 },
});
