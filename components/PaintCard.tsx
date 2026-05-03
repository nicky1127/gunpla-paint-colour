import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { PaintInventory } from '../lib/supabase';
import { useResponsive } from '../lib/responsive';

type Props = {
  paint: PaintInventory;
  onPress?: () => void;
  onLongPress?: () => void;
};

export default function PaintCard({ paint, onPress, onLongPress }: Props) {
  const { sp, fs } = useResponsive();
  const bg = paint.hex ?? '#888888';
  const swatchSize = sp(44, 58);

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      style={[styles.container, { padding: sp(10), gap: sp(10) }]}
    >
      <View style={[styles.swatch, { width: swatchSize, height: swatchSize, borderRadius: sp(8, 10) }, { backgroundColor: bg }]}>
        {!paint.hex && <Text style={{ color: '#fff', fontSize: fs(18) }}>?</Text>}
      </View>
      <View style={styles.info}>
        <Text style={[styles.brand, { fontSize: fs(11) }]}>{paint.brand}</Text>
        <Text style={[styles.name, { fontSize: fs(14) }]} numberOfLines={1}>{paint.name}</Text>
        {paint.code && <Text style={[styles.code, { fontSize: fs(12) }]}>{paint.code}</Text>}
      </View>
      {paint.hex && (
        <Text style={[styles.hex, { fontSize: fs(11) }]}>{paint.hex.toUpperCase()}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e32',
    borderRadius: 10,
    marginVertical: 3,
  },
  swatch: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    flexShrink: 0,
  },
  info: { flex: 1, gap: 2 },
  brand: { color: '#e8a838', fontWeight: '700', textTransform: 'uppercase' },
  name: { color: '#fff', fontWeight: '600' },
  code: { color: '#888', fontFamily: 'monospace' },
  hex: { color: '#666', fontFamily: 'monospace' },
});
