import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import TransportBar from '../components/TransportBar';
import { useStudio } from '../store/useStudio';
import { colors, fontSize, spacing } from '../theme';

const STEP_W = 34;
const STEP_H = 34;
const LABEL_W = 64;

/** Stüdyo ekranı: kanal rafı + step sequencer grid'i. */
export default function StudioScreen() {
  const project = useStudio((s) => s.project);
  const currentPatternId = useStudio((s) => s.currentPatternId);
  const currentStep = useStudio((s) => s.currentStep);
  const toggleStep = useStudio((s) => s.toggleStep);
  const selectPattern = useStudio((s) => s.selectPattern);

  const pattern = useMemo(
    () => project.patterns.find((p) => p.id === currentPatternId) ?? project.patterns[0],
    [project.patterns, currentPatternId],
  );

  return (
    <View style={styles.root}>
      <TransportBar />

      {/* Pattern seçici */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.patBar}
        contentContainerStyle={styles.patBarInner}
      >
        {project.patterns.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => selectPattern(p.id)}
            style={[styles.patChip, p.id === pattern.id && styles.patChipActive]}
          >
            <Text style={[styles.patChipTxt, p.id === pattern.id && styles.patChipTxtActive]}>
              {p.name}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Grid */}
      <ScrollView style={styles.gridScroll}>
        {project.channels.map((ch) => {
          const rows = ch.kind === 'drum' ? 1 : ch.samples.length;
          const anySolo = project.channels.some((c) => c.solo);
          const dim = ch.muted || (anySolo && !ch.solo);
          return (
            <View key={ch.id} style={styles.channelBlock}>
              <Text style={[styles.channelName, dim && styles.channelNameDim]}>{ch.name}</Text>
              {Array.from({ length: rows }, (_, pitch) => (
                <View key={pitch} style={styles.stepRow}>
                  {rows > 1 ? (
                    <View style={[styles.label, { width: LABEL_W }]}>
                      <Text style={styles.labelTxt}>{ch.labels[pitch]}</Text>
                    </View>
                  ) : (
                    <View style={[styles.label, { width: LABEL_W }]}>
                      <Text style={styles.labelTxtDim}>◆</Text>
                    </View>
                  )}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.stepRowInner}>
                      {Array.from({ length: pattern.length }, (_, step) => {
                        const on = pattern.grid[ch.id]?.[step] === pitch;
                        const isPlayhead = step === currentStep;
                        const isBeat = step % 4 === 0;
                        return (
                          <Pressable
                            key={step}
                            onPress={() => toggleStep(ch.id, step, pitch)}
                            style={[
                              styles.step,
                              isBeat && styles.stepBeat,
                              on && styles.stepOn,
                              isPlayhead && styles.stepPlayhead,
                              on && isPlayhead && styles.stepOnPlayhead,
                            ]}
                            accessibilityLabel={`${ch.name} ${pitch} ${step}`}
                          />
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>
              ))}
            </View>
          );
        })}
        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  patBar: { maxHeight: 48, flexGrow: 0 },
  patBarInner: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.sm },
  patChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  patChipActive: { backgroundColor: colors.purpleDim, borderColor: colors.purple },
  patChipTxt: { color: colors.textDim, fontSize: fontSize.sm, fontWeight: '600' },
  patChipTxtActive: { color: colors.text },
  gridScroll: { flex: 1 },
  channelBlock: {
    backgroundColor: colors.bgCard,
    borderRadius: 10,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.purple,
  },
  channelName: {
    color: colors.text,
    fontSize: fontSize.sm,
    fontWeight: '700',
    marginLeft: spacing.md,
    marginBottom: 6,
  },
  channelNameDim: { color: colors.textDim },
  stepRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm },
  stepRowInner: { flexDirection: 'row', gap: 3 },
  label: { justifyContent: 'center' },
  labelTxt: { color: colors.textDim, fontSize: fontSize.xs, fontWeight: '700' },
  labelTxtDim: { color: colors.purple, fontSize: fontSize.xs },
  step: {
    width: STEP_W,
    height: STEP_H,
    borderRadius: 6,
    backgroundColor: colors.stepOff,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  stepBeat: { backgroundColor: colors.stepBeat },
  stepOn: { backgroundColor: colors.stepOn },
  stepPlayhead: { borderColor: colors.stepPlayhead },
  stepOnPlayhead: { backgroundColor: colors.gold },
});
