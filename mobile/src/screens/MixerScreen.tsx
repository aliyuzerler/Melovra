import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useStudio } from '../store/useStudio';
import { colors, fontSize, spacing } from '../theme';

/** Mikser ekranı: kanal ses seviyesi, sessize/al, solo ve önizleme. */
export default function MixerScreen() {
  const channels = useStudio((s) => s.project.channels);
  const setChannelProp = useStudio((s) => s.setChannelProp);
  const previewChannel = useStudio((s) => s.previewChannel);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      {channels.map((ch) => (
        <ChannelStrip
          key={ch.id}
          channel={ch}
          onChange={(patch) => setChannelProp(ch.id, patch)}
          onPreview={() => previewChannel(ch.id)}
        />
      ))}
      <Text style={styles.note}>
        Not: expo-av stereo pan desteği sınırlıdır; pan değerleri web sürümüyle senkronize
        edilmek üzere saklanır.
      </Text>
    </ScrollView>
  );
}

function ChannelStrip(props: {
  channel: import('../model/types').Channel;
  onChange: (patch: Partial<import('../model/types').Channel>) => void;
  onPreview: () => void;
}) {
  const { channel: ch, onChange, onPreview } = props;
  const [barWidth, setBarWidth] = useState(200);
  const pct = Math.round(ch.volume * 100);

  return (
    <View style={styles.strip}>
      <View style={styles.head}>
        <Pressable onPress={onPreview} style={styles.previewBtn}>
          <Text style={styles.previewTxt}>▶</Text>
        </Pressable>
        <Text style={styles.name}>{ch.name}</Text>
        <Text style={styles.pct}>{pct}%</Text>
      </View>

      {/* Ses seviyesi kaydırıcısı */}
      <View
        style={styles.track}
        onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(e) => vol(e)}
        onResponderMove={(e) => vol(e)}
      >
        <View style={[styles.fill, { width: pct * (barWidth / 100) }]} />
      </View>

      <View style={styles.btnRow}>
        <Pressable
          onPress={() => onChange({ muted: !ch.muted })}
          style={[styles.pill, ch.muted && styles.pillDanger]}
        >
          <Text style={[styles.pillTxt, ch.muted && styles.pillTxtDanger]}>
            {ch.muted ? 'Sessiz' : 'Açık'}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onChange({ solo: !ch.solo })}
          style={[styles.pill, ch.solo && styles.pillSolo]}
        >
          <Text style={[styles.pillTxt, ch.solo && styles.pillTxtSolo]}>Solo</Text>
        </Pressable>
        {/* pan: -1..1, adım 0.25 */}
        <View style={styles.panRow}>
          {[-1, -0.5, 0, 0.5, 1].map((p) => (
            <Pressable
              key={p}
              onPress={() => onChange({ pan: p })}
              style={[styles.panDot, ch.pan === p && styles.panDotActive]}
            >
              <Text style={[styles.panTxt, ch.pan === p && styles.panTxtActive]}>
                {p === 0 ? 'M' : `${p < 0 ? 'L' : 'R'}${Math.abs(p) * 100}`}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );

  function vol(e: { nativeEvent: { locationX: number } }) {
    const x = e.nativeEvent.locationX;
    const v = Math.max(0, Math.min(1, x / Math.max(1, barWidth)));
    onChange({ volume: Math.round(v * 100) / 100 });
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, gap: spacing.md },
  strip: {
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.sm,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  previewBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewTxt: { color: colors.bg, fontSize: 12, fontWeight: '700' },
  name: { color: colors.text, fontSize: fontSize.md, fontWeight: '700', flex: 1 },
  pct: { color: colors.accent, fontSize: fontSize.sm, fontWeight: '700' },
  track: {
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.bgElevated,
    overflow: 'hidden',
  },
  fill: { height: 12, backgroundColor: colors.accent, borderRadius: 6 },
  btnRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillDanger: { backgroundColor: colors.danger, borderColor: colors.danger },
  pillSolo: { backgroundColor: colors.gold, borderColor: colors.gold },
  pillTxt: { color: colors.textDim, fontSize: fontSize.xs, fontWeight: '700' },
  pillTxtDanger: { color: colors.bg },
  pillTxtSolo: { color: colors.bg },
  panRow: { flexDirection: 'row', gap: 4, marginLeft: 'auto' },
  panDot: {
    width: 28,
    height: 24,
    borderRadius: 6,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panDotActive: { backgroundColor: colors.purpleDim },
  panTxt: { color: colors.textDim, fontSize: 10, fontWeight: '700' },
  panTxtActive: { color: colors.text },
  note: { color: colors.textDim, fontSize: fontSize.xs, fontStyle: 'italic', marginTop: spacing.sm },
});
