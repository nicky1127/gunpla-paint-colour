import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase, type Project } from '../../../lib/supabase';
import { useResponsive } from '../../../lib/responsive';

export default function ProjectsScreen() {
  const router = useRouter();
  const { sp, fs, numColumns } = useResponsive();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setProjects(data ?? []);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchProjects();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchProjects();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color="#e8a838" size="large" />
      </View>
    );
  }

  const fabSize = sp(58, 68);

  return (
    <View style={styles.container}>
      <FlatList
        key={`projects-${numColumns}`}
        data={projects}
        keyExtractor={(p) => p.id}
        numColumns={numColumns}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#e8a838" />}
        contentContainerStyle={{ padding: sp(16), gap: sp(12) }}
        columnWrapperStyle={numColumns > 1 ? { gap: sp(12) } : undefined}
        ListEmptyComponent={
          <View style={[styles.empty, { paddingTop: sp(80) }]}>
            <Text style={[styles.emptyTitle, { fontSize: fs(18) }]}>No projects yet</Text>
            <Text style={[styles.emptySubtitle, { fontSize: fs(14) }]}>Tap + to start your first Gunpla build</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, numColumns > 1 && { flex: 1 }]}
            onPress={() => router.push(`/(tabs)/projects/${item.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.cardAccent} />
            <View style={[styles.cardContent, { padding: sp(16) }]}>
              <Text style={[styles.cardName, { fontSize: fs(17) }]}>{item.name}</Text>
              {item.kit_name && <Text style={[styles.cardKit, { fontSize: fs(13) }]}>{item.kit_name}</Text>}
              {item.kit_code && <Text style={[styles.cardCode, { fontSize: fs(12) }]}>{item.kit_code}</Text>}
              <Text style={[styles.cardDate, { fontSize: fs(11) }]}>
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
            <Text style={[styles.arrow, { fontSize: fs(22) }]}>›</Text>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity
        style={[styles.fab, {
          width: fabSize, height: fabSize, borderRadius: fabSize / 2,
          bottom: sp(28), right: sp(24),
        }]}
        onPress={() => router.push('/(tabs)/projects/new')}
        activeOpacity={0.8}
      >
        <Text style={[styles.fabText, { fontSize: sp(30, 36) }]}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#12121f' },
  centered: { flex: 1, backgroundColor: '#12121f', alignItems: 'center', justifyContent: 'center' },
  empty: { alignItems: 'center', gap: 8 },
  emptyTitle: { color: '#fff', fontWeight: '700' },
  emptySubtitle: { color: '#888' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e32',
    borderRadius: 14,
    overflow: 'hidden',
  },
  cardAccent: { width: 5, alignSelf: 'stretch', backgroundColor: '#e8a838' },
  cardContent: { flex: 1, gap: 3 },
  cardName: { color: '#fff', fontWeight: '700' },
  cardKit: { color: '#ccc' },
  cardCode: { color: '#e8a838', fontFamily: 'monospace' },
  cardDate: { color: '#666', marginTop: 4 },
  arrow: { color: '#666', paddingHorizontal: 16 },
  fab: {
    position: 'absolute',
    backgroundColor: '#e8a838',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#e8a838', shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  fabText: { color: '#12121f', fontWeight: '700', marginTop: -2 },
});
