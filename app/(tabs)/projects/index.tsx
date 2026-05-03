import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase, type Project } from '../../../lib/supabase';
import { useResponsive } from '../../../lib/responsive';
import { useTheme, type Theme } from '../../../lib/theme';

export default function ProjectsScreen() {
  const router = useRouter();
  const { sp, fs, numColumns } = useResponsive();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
        <ActivityIndicator color={theme.accent} size="large" />
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} />}
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
            <Ionicons name="chevron-forward" size={sp(20, 24)} color={theme.muted} style={{ paddingHorizontal: sp(12) }} />
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

function createStyles(t: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    centered: { flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' },
    empty: { alignItems: 'center', gap: 8 },
    emptyTitle: { color: t.text, fontWeight: '700' },
    emptySubtitle: { color: t.muted },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: t.card,
      borderRadius: 14,
      overflow: 'hidden',
    },
    cardAccent: { width: 5, alignSelf: 'stretch', backgroundColor: t.accent },
    cardContent: { flex: 1, gap: 3 },
    cardName: { color: t.text, fontWeight: '700' },
    cardKit: { color: t.subtext },
    cardCode: { color: t.accent, fontFamily: 'monospace' },
    cardDate: { color: t.muted, marginTop: 4 },
    fab: {
      position: 'absolute',
      backgroundColor: t.accent,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: t.accent, shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
      elevation: 8,
    },
    fabText: { color: '#12121f', fontWeight: '700', marginTop: -2 },
  });
}
