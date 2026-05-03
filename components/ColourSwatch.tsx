import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useResponsive } from '../lib/responsive';
import { useTheme, type Theme } from '../lib/theme';

type Props = {
  name: string;
  hex: string | null;
  source?: 'ai' | 'manual' | 'image';
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
};

export default function ColourSwatch({ name, hex, source, onPress, size = 'medium' }: Props) {
  const { sp, fs } = useResponsive();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const bg = hex ?? '#888888';
  const swatchBase = size === 'small' ? 48 : size === 'large' ? 96 : 72;
  const swatchSize = sp(swatchBase, Math.round(swatchBase * 1.3));

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={[styles.container, { padding: sp(12), gap: sp(12) }]}
      activeOpacity={0.7}
    >
      <View style={[styles.swatch, { backgroundColor: bg, width: swatchSize, height: swatchSize, borderRadius: sp(8, 10) }]}>
        {!hex && <Text style={[styles.noColour, { fontSize: fs(20) }]}>?</Text>}
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { fontSize: fs(15) }]} numberOfLines={2}>{name}</Text>
        {hex && <Text style={[styles.hex, { fontSize: fs(12) }]}>{hex.toUpperCase()}</Text>}
        {source && (
          <View style={[styles.badge, badgeColour[source]]}>
            <Text style={[styles.badgeText, { fontSize: fs(10) }]}>{source}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const badgeColour: Record<string, object> = {
  ai: { backgroundColor: '#2563eb22', borderColor: '#2563eb' },
  manual: { backgroundColor: '#16a34a22', borderColor: '#16a34a' },
  image: { backgroundColor: '#9333ea22', borderColor: '#9333ea' },
};

function createStyles(t: Theme) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.card,
      borderRadius: 12,
      marginVertical: 4,
    },
    swatch: {
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(0,0,0,0.1)',
    },
    noColour: { color: t.text, fontWeight: '700' },
    info: { flex: 1, gap: 4 },
    name: { color: t.text, fontWeight: '600' },
    hex: { color: t.muted, fontFamily: 'monospace' },
    badge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
      borderWidth: 1,
    },
    badgeText: { color: t.subtext, textTransform: 'uppercase', fontWeight: '600' },
  });
}
