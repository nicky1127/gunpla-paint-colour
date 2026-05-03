import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import type { MixSuggestionData } from '../lib/supabase';
import { useResponsive } from '../lib/responsive';
import { useTheme, type Theme } from '../lib/theme';

type Props = {
  suggestion: MixSuggestionData;
};

export default function MixSuggestion({ suggestion }: Props) {
  const { sp, fs } = useResponsive();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const swatchSize = sp(36, 48);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ gap: sp(16) }}>
      {suggestion.using_owned && suggestion.using_owned.length > 0 && (
        <View style={[styles.section, { padding: sp(14), gap: sp(8) }]}>
          <Text style={[styles.sectionTitle, { fontSize: fs(13) }]}>Mix from your paints</Text>
          {suggestion.using_owned.map((step, i) => (
            <View key={i} style={[styles.stepRow, { gap: sp(10) }]}>
              <View style={[styles.stepSwatch, { width: swatchSize, height: swatchSize, borderRadius: sp(6, 8) }, { backgroundColor: step.hex ?? '#888' }]} />
              <View style={styles.stepInfo}>
                <Text style={[styles.stepBrand, { fontSize: fs(10) }]}>{step.brand}</Text>
                <Text style={[styles.stepName, { fontSize: fs(13) }]}>{step.name}{step.code ? ` (${step.code})` : ''}</Text>
              </View>
              <Text style={[styles.stepRatio, { fontSize: fs(18) }]}>{step.ratio_percent}%</Text>
            </View>
          ))}
        </View>
      )}

      {suggestion.buy_suggestion && suggestion.buy_suggestion.length > 0 && (
        <View style={[styles.section, { padding: sp(14), gap: sp(8) }]}>
          <Text style={[styles.sectionTitle, { fontSize: fs(13) }]}>
            {suggestion.using_owned && suggestion.using_owned.length > 0
              ? 'Or buy instead'
              : 'Suggested paints to buy'}
          </Text>
          {suggestion.buy_suggestion.map((item, i) => (
            <View key={i} style={[styles.stepRow, { gap: sp(10) }]}>
              <View style={[styles.stepSwatch, { width: swatchSize, height: swatchSize, borderRadius: sp(6, 8) }, { backgroundColor: item.hex ?? '#888' }]} />
              <View style={styles.stepInfo}>
                <Text style={[styles.stepBrand, { fontSize: fs(10) }]}>{item.brand}</Text>
                <Text style={[styles.stepName, { fontSize: fs(13) }]}>{item.name} ({item.code})</Text>
              </View>
              {item.ratio_percent > 0 && (
                <Text style={[styles.stepRatio, { fontSize: fs(18) }]}>{item.ratio_percent}%</Text>
              )}
            </View>
          ))}
        </View>
      )}

      {suggestion.notes ? (
        <View style={[styles.notes, { padding: sp(14), gap: sp(6) }]}>
          <Text style={[styles.notesLabel, { fontSize: fs(11) }]}>Notes</Text>
          <Text style={[styles.notesText, { fontSize: fs(14) }]}>{suggestion.notes}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

function createStyles(t: Theme) {
  return StyleSheet.create({
    container: { flex: 1 },
    section: { backgroundColor: t.card, borderRadius: 12 },
    sectionTitle: {
      color: t.accent,
      fontWeight: '700',
      textTransform: 'uppercase',
      marginBottom: 4,
    },
    stepRow: { flexDirection: 'row', alignItems: 'center' },
    stepSwatch: {
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.1)',
      flexShrink: 0,
    },
    stepInfo: { flex: 1 },
    stepBrand: { color: t.accent, fontWeight: '700', textTransform: 'uppercase' },
    stepName: { color: t.text },
    stepRatio: { color: t.text, fontWeight: '700', minWidth: 48, textAlign: 'right' },
    notes: { backgroundColor: t.card, borderRadius: 12 },
    notesLabel: { color: t.subtext, fontWeight: '600', textTransform: 'uppercase' },
    notesText: { color: t.subtext, lineHeight: 20 },
  });
}
