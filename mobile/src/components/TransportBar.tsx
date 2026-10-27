import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useStudio } from '../store/useStudio';
import { colors, fontSize, spacing } from '../theme';

/** Üst transport çubuğu: oynat/durdur, BPM, mod seçici ve adım göstergesi. */
export default function TransportBar() {
  const playing = useStudio((s) => s.playing);
  const mode = useStudio((s) => s.mode);
  const bpm = useStudio((s) => s.project.bpm);
  const play = useStudio((s) => s.play);
  const stop = useStudio((s) => s.stop);
  const setMode = useStudio((s) => s.setMode);
  const setBpm = useStudio((s) => s.setBpm);

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={playing ? stop : play}
        style={[styles.playBtn, playing && styles.playBtnActive]}
        accessibilityLabel={playing ? 'Durdur' : 'Oynat'}
      >
        <Text style={styles.playTxt}>{playing ? '■' : '▶'}</Text>
      </Pressable>

      <View style={styles.bpmWrap}>
        <Text style={styles.bpmLabel}>BPM</Text>
        <TextInput
          style={styles.bpmInput}
          value={String(bpm)}
          keyboardType="number-pad"
          maxLength={3}
          onChangeText={(t) => {
            const n = parseInt(t, 10);
            if (!Number.isNaN(n)) setBpm(n);
          }}
        />
      </View>

      <View style={styles.modeWrap}>
        {(['pattern', 'song'] as const).map((m) => (
          <Pressable
            key={m}
            onPress={() => setMode(m)}
            style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
          >
            <Text style={[styles.modeTxt, mode === m && styles.modeTxtActive]}>
              {m === 'pattern' ? 'Pattern' : 'Şarkı'}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgElevated,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnActive: { backgroundColor: colors.accent },
  playTxt: { color: colors.bg, fontSize: 18, fontWeight: '700' },
  bpmWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    gap: 6,
  },
  bpmLabel: { color: colors.textDim, fontSize: fontSize.xs, fontWeight: '600' },
  bpmInput: { color: colors.accent, fontSize: fontSize.lg, fontWeight: '700', width: 44, textAlign: 'center' },
  modeWrap: {
    flexDirection: 'row',
    backgroundColor: colors.bgCard,
    borderRadius: 8,
    padding: 2,
    marginLeft: 'auto',
  },
  modeBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  modeBtnActive: { backgroundColor: colors.purpleDim },
  modeTxt: { color: colors.textDim, fontSize: fontSize.sm, fontWeight: '600' },
  modeTxtActive: { color: colors.text },
});
