import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, Alert, RefreshControl, ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase, type PaintInventory } from '../../../lib/supabase';
import PaintCard from '../../../components/PaintCard';
import { useResponsive } from '../../../lib/responsive';
import { useTheme, type Theme } from '../../../lib/theme';

const BRANDS = ['All', 'Mr. Hobby', 'Tamiya', 'Vallejo', 'AK Interactive', 'GSI Creos', 'Citadel', 'Other'];

export default function InventoryScreen() {
  const router = useRouter();
  const { sp, fs, numColumns } = useResponsive();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [paints, setPaints] = useState<PaintInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('All');

  const fetchPaints = async () => {
    const { data, error } = await supabase
      .from('paint_inventory')
      .select('*')
      .order('brand')
      .order('name');
    if (error) Alert.alert('Error', error.message);
    else setPaints(data ?? []);
    setLoading(false);
    setRefreshing(false);
  };

  useFocusEffect(useCallback(() => { setLoading(true); fetchPaints(); }, []));

  const onRefresh = () => { setRefreshing(true); fetchPaints(); };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(`Remove "${name}"?`, 'This will remove it from your inventory.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          await supabase.from('paint_inventory').delete().eq('id', id);
          setPaints((prev) => prev.filter((p) => p.id !== id));
        },
      },
    ]);
  };

  const filtered = paints.filter((p) => {
    const matchBrand = selectedBrand === 'All' || p.brand === selectedBrand;
    const q = search.toLowerCase();
    const matchSearch = !q
      || p.name.toLowerCase().includes(q)
      || (p.code?.toLowerCase().includes(q) ?? false)
      || p.brand.toLowerCase().includes(q);
    return matchBrand && matchSearch;
  });

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator color={theme.accent} size="large" /></View>;
  }

  const fabSize = sp(58, 68);
  const fabSecSize = sp(52, 62);

  return (
    <View style={styles.container}>
      <View style={{ padding: sp(12), paddingBottom: 0 }}>
        <TextInput
          style={[styles.searchInput, { paddingHorizontal: sp(14), paddingVertical: sp(12), fontSize: fs(15) }]}
          value={search}
          onChangeText={setSearch}
          placeholder="Search paints..."
          placeholderTextColor={theme.placeholder}
          clearButtonMode="while-editing"
        />
      </View>

      <FlatList
        data={BRANDS}
        keyExtractor={(b) => b}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: sp(12), gap: sp(8), paddingVertical: sp(8) }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.brandChip, { paddingHorizontal: sp(14), paddingVertical: sp(7) }, selectedBrand === item && styles.brandChipActive]}
            onPress={() => setSelectedBrand(item)}
          >
            <Text style={[styles.brandChipText, { fontSize: fs(13) }, selectedBrand === item && styles.brandChipTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        key={`inventory-${numColumns}`}
        data={filtered}
        keyExtractor={(p) => p.id}
        numColumns={numColumns}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
        contentContainerStyle={{ padding: sp(12), gap: sp(4), paddingBottom: 100 }}
        columnWrapperStyle={numColumns > 1 ? { gap: sp(8) } : undefined}
        ListEmptyComponent={
          <View style={[styles.empty, { paddingTop: sp(60) }]}>
            <Text style={[styles.emptyTitle, { fontSize: fs(16) }]}>
              {paints.length === 0 ? 'No paints in inventory' : 'No matches'}
            </Text>
            <Text style={[styles.emptySubtitle, { fontSize: fs(13) }]}>
              {paints.length === 0 ? 'Add paints you own with the + button' : 'Try a different search'}
            </Text>
          </View>
        }
        ListHeaderComponent={
          filtered.length > 0
            ? <Text style={[styles.count, { fontSize: fs(12) }]}>{filtered.length} paint{filtered.length !== 1 ? 's' : ''}</Text>
            : null
        }
        renderItem={({ item }) => (
          <View style={numColumns > 1 ? { flex: 1 } : undefined}>
            <PaintCard paint={item} onLongPress={() => handleDelete(item.id, item.name)} />
          </View>
        )}
      />

      <View style={[styles.fabGroup, { bottom: sp(24), right: sp(16), gap: sp(10) }]}>
        <TouchableOpacity
          style={[styles.fabSecondary, { width: fabSecSize, height: fabSecSize, borderRadius: fabSecSize / 2 }]}
          onPress={() => router.push('/(tabs)/inventory/catalogue')}
          activeOpacity={0.8}
        >
          <Text style={[styles.fabTextSmall, { fontSize: fs(12) }]}>Browse</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.fabSecondary, { width: fabSecSize, height: fabSecSize, borderRadius: fabSecSize / 2 }]}
          onPress={() => router.push('/(tabs)/inventory/add-scan')}
          activeOpacity={0.8}
        >
          <Text style={[styles.fabTextSmall, { fontSize: fs(12) }]}>Scan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.fab, { width: fabSize, height: fabSize, borderRadius: fabSize / 2 }]}
          onPress={() => router.push('/(tabs)/inventory/add-manual')}
          activeOpacity={0.8}
        >
          <Text style={[styles.fabText, { fontSize: sp(30, 36) }]}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function createStyles(t: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    centered: { flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' },
    searchInput: {
      backgroundColor: t.input, color: t.text, borderRadius: 10,
      borderWidth: 1, borderColor: t.border,
    },
    brandChip: {
      borderRadius: 20,
      backgroundColor: t.card, borderWidth: 1, borderColor: t.border,
    },
    brandChipActive: { borderColor: t.accent, backgroundColor: `${t.accent}20` },
    brandChipText: { color: t.muted, fontWeight: '600' },
    brandChipTextActive: { color: t.accent },
    count: { color: t.muted, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
    empty: { alignItems: 'center', gap: 8 },
    emptyTitle: { color: t.text, fontWeight: '700' },
    emptySubtitle: { color: t.muted },
    fabGroup: {
      position: 'absolute',
      flexDirection: 'row', alignItems: 'center',
    },
    fab: {
      backgroundColor: t.accent,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: t.accent, shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
      elevation: 8,
    },
    fabSecondary: {
      backgroundColor: t.card,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
      elevation: 4,
    },
    fabText: { color: '#12121f', fontWeight: '700', marginTop: -2 },
    fabTextSmall: { color: t.text, fontWeight: '700' },
  });
}
