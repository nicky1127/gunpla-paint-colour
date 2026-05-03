import React, { useMemo, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { CATALOGUES, type CataloguePaint } from '../../../assets/paint-catalogues/index';
import { useResponsive } from '../../../lib/responsive';
import { useTheme, type Theme } from '../../../lib/theme';

export default function CatalogueScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sp, fs, numColumns } = useResponsive();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [selectedBrand, setSelectedBrand] = useState(CATALOGUES[0].brand);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const catalogue = useMemo(
    () => CATALOGUES.find((c) => c.brand === selectedBrand)?.paints ?? [],
    [selectedBrand]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return catalogue;
    return catalogue.filter(
      (p) => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)
    );
  }, [catalogue, search]);

  const toggle = (code: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const handleAddSelected = async () => {
    if (selected.size === 0) { Alert.alert('No paints selected', 'Tap paints to select them first.'); return; }
    setSaving(true);
    try {
      const rows = catalogue
        .filter((p) => selected.has(p.code))
        .map((p) => ({ brand: selectedBrand, code: p.code, name: p.name, hex: p.hex ?? null }));
      const { error } = await supabase.from('paint_inventory').insert(rows);
      if (error) throw error;
      Alert.alert('Added!', `${rows.length} paint${rows.length !== 1 ? 's' : ''} added to your inventory.`);
      setSelected(new Set());
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const swatchSize = sp(36, 48);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { padding: sp(16), paddingTop: insets.top + sp(12) }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backText, { fontSize: fs(16) }]}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.heading, { fontSize: fs(20) }]}>Browse Catalogue</Text>
      </View>

      <FlatList
        data={CATALOGUES.map((c) => c.brand)}
        keyExtractor={(b) => b}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: sp(12), gap: sp(8), paddingVertical: sp(8) }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.brandChip, { paddingHorizontal: sp(14), paddingVertical: sp(8) }, selectedBrand === item && styles.brandChipActive]}
            onPress={() => { setSelectedBrand(item); setSearch(''); setSelected(new Set()); }}
          >
            <Text style={[styles.brandChipText, { fontSize: fs(13) }, selectedBrand === item && styles.brandChipTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      <View style={{ paddingHorizontal: sp(12), paddingVertical: sp(8) }}>
        <TextInput
          style={[styles.searchInput, { paddingHorizontal: sp(14), paddingVertical: sp(10), fontSize: fs(14) }]}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name or code..."
          placeholderTextColor={theme.placeholder}
          clearButtonMode="while-editing"
        />
      </View>

      <FlatList
        key={`catalogue-${numColumns}`}
        data={filtered}
        keyExtractor={(p) => p.code}
        numColumns={numColumns}
        contentContainerStyle={{ paddingHorizontal: sp(12), paddingBottom: 120, gap: sp(2) }}
        columnWrapperStyle={numColumns > 1 ? { gap: sp(8) } : undefined}
        renderItem={({ item }) => {
          const isSelected = selected.has(item.code);
          const bg = item.hex ?? '#888';
          return (
            <TouchableOpacity
              style={[styles.paintRow, { gap: sp(10), paddingVertical: sp(8), paddingHorizontal: sp(4) }, isSelected && styles.paintRowSelected, numColumns > 1 && { flex: 1 }]}
              onPress={() => toggle(item.code)}
              activeOpacity={0.7}
            >
              <View style={[styles.swatch, { width: swatchSize, height: swatchSize, borderRadius: sp(6, 8) }, { backgroundColor: bg }]}>
                {!item.hex && <Text style={{ color: '#fff', fontSize: fs(14) }}>?</Text>}
              </View>
              <View style={styles.paintInfo}>
                <Text style={[styles.paintCode, { fontSize: fs(11) }]}>{item.code}</Text>
                <Text style={[styles.paintName, { fontSize: fs(14) }]}>{item.name}</Text>
              </View>
              <View style={[styles.checkbox, { width: sp(24, 28), height: sp(24, 28) }, isSelected && styles.checkboxSelected]}>
                {isSelected && <Text style={[styles.checkmark, { fontSize: fs(14) }]}>✓</Text>}
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <Text style={[styles.empty, { fontSize: fs(14) }]}>No paints match your search.</Text>
        }
      />

      {selected.size > 0 && (
        <View style={[styles.bottomBar, { padding: sp(16), gap: sp(12), paddingBottom: Math.max(insets.bottom, sp(16)) }]}>
          <Text style={[styles.selectedCount, { fontSize: fs(15) }]}>{selected.size} selected</Text>
          <TouchableOpacity
            style={[styles.addBtn, { padding: sp(12) }, saving && styles.btnDisabled]}
            onPress={handleAddSelected}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#12121f" />
              : <Text style={[styles.addBtnText, { fontSize: fs(15) }]}>Add to Inventory</Text>
            }
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function createStyles(t: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    header: {
      flexDirection: 'row', alignItems: 'center', gap: 16,
      backgroundColor: t.header, borderBottomWidth: 1, borderBottomColor: t.border,
    },
    backText: { color: t.accent },
    heading: { color: t.text, fontWeight: '800' },
    brandChip: {
      borderRadius: 20,
      backgroundColor: t.card, borderWidth: 1, borderColor: t.border,
    },
    brandChipActive: { borderColor: t.accent, backgroundColor: `${t.accent}20` },
    brandChipText: { color: t.muted, fontWeight: '600' },
    brandChipTextActive: { color: t.accent },
    searchInput: {
      backgroundColor: t.input, color: t.text, borderRadius: 10,
      borderWidth: 1, borderColor: t.border,
    },
    paintRow: {
      flexDirection: 'row', alignItems: 'center',
      borderBottomWidth: 1, borderBottomColor: t.card,
    },
    paintRowSelected: { backgroundColor: `${t.accent}10`, borderRadius: 8 },
    swatch: {
      flexShrink: 0,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)',
    },
    paintInfo: { flex: 1 },
    paintCode: { color: t.accent, fontWeight: '700', fontFamily: 'monospace' },
    paintName: { color: t.text },
    checkbox: {
      borderRadius: 6, borderWidth: 2, borderColor: t.border,
      alignItems: 'center', justifyContent: 'center',
    },
    checkboxSelected: { borderColor: t.accent, backgroundColor: t.accent },
    checkmark: { color: '#12121f', fontWeight: '800' },
    empty: { color: t.muted, textAlign: 'center', marginTop: 40 },
    bottomBar: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      backgroundColor: t.header, borderTopWidth: 1, borderTopColor: t.border,
      flexDirection: 'row', alignItems: 'center',
    },
    selectedCount: { color: t.accent, fontWeight: '700' },
    addBtn: { flex: 1, backgroundColor: t.accent, borderRadius: 10, alignItems: 'center' },
    addBtnText: { color: '#12121f', fontWeight: '800' },
    btnDisabled: { opacity: 0.5 },
  });
}
