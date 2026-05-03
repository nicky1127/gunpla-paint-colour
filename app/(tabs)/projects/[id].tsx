import React, { useCallback, useMemo, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, Modal, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { supabase, type Project, type ProjectColour, type MixSuggestionData } from '../../../lib/supabase';
import ColourSwatch from '../../../components/ColourSwatch';
import MixSuggestion from '../../../components/MixSuggestion';
import { getMixSuggestion } from '../../../lib/api';
import { useResponsive } from '../../../lib/responsive';
import { useTheme, type Theme } from '../../../lib/theme';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { sp, fs, isTablet, numColumns } = useResponsive();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [project, setProject] = useState<Project | null>(null);
  const [colours, setColours] = useState<ProjectColour[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedColour, setSelectedColour] = useState<ProjectColour | null>(null);
  const [mixLoading, setMixLoading] = useState(false);
  const [mixData, setMixData] = useState<MixSuggestionData | null>(null);
  const [showMixModal, setShowMixModal] = useState(false);

  const fetchData = async () => {
    const [{ data: proj }, { data: cols }] = await Promise.all([
      supabase.from('projects').select('*').eq('id', id).single(),
      supabase.from('project_colours').select('*').eq('project_id', id).order('created_at'),
    ]);
    setProject(proj);
    setColours(cols ?? []);
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { fetchData(); }, [id]));

  const handleColourPress = async (colour: ProjectColour) => {
    setSelectedColour(colour);
    setMixData(null);
    setShowMixModal(true);
    setMixLoading(true);
    try {
      const { data: inventory } = await supabase.from('paint_inventory').select('*');
      const suggestion = await getMixSuggestion(colour.colour_name, colour.hex, inventory ?? []);
      setMixData(suggestion);
    } catch (err: any) {
      Alert.alert('AI Error', err.message ?? 'Could not generate mix suggestion.');
      setShowMixModal(false);
    } finally {
      setMixLoading(false);
    }
  };

  const deleteColour = async (colourId: string) => {
    Alert.alert('Remove colour', 'Remove this colour from the project?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive', onPress: async () => {
          await supabase.from('project_colours').delete().eq('id', colourId);
          setColours((prev) => prev.filter((c) => c.id !== colourId));
        },
      },
    ]);
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator color={theme.accent} size="large" /></View>;
  }
  if (!project) {
    return <View style={styles.centered}><Text style={{ color: theme.text }}>Project not found</Text></View>;
  }

  const fabSize = sp(58, 68);
  const modalOverlayStyle = isTablet
    ? { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center' as const, alignItems: 'center' as const, padding: 40 }
    : { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' as const };
  const modalSheetStyle = isTablet
    ? { backgroundColor: theme.header, borderRadius: 24, padding: sp(28), paddingBottom: sp(28), maxHeight: '85%' as const, width: '100%' as const, maxWidth: 620 }
    : { backgroundColor: theme.header, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: sp(20), paddingBottom: sp(40), maxHeight: '80%' as const };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { padding: sp(16), paddingTop: insets.top + sp(12) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.backText, { fontSize: fs(16) }]}>‹ Back</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.title, { fontSize: fs(22) }]}>{project.name}</Text>
          {project.kit_name && <Text style={[styles.subtitle, { fontSize: fs(14) }]}>{project.kit_name}</Text>}
        </View>
      </View>

      <FlatList
        key={`colours-${numColumns}`}
        data={colours}
        keyExtractor={(c) => c.id}
        numColumns={numColumns}
        contentContainerStyle={{ padding: sp(16), gap: sp(8), paddingBottom: 100 }}
        columnWrapperStyle={numColumns > 1 ? { gap: sp(8) } : undefined}
        ListEmptyComponent={
          <View style={[styles.empty, { paddingTop: sp(60) }]}>
            <Text style={[styles.emptyTitle, { fontSize: fs(16) }]}>No colours yet</Text>
            <Text style={[styles.emptySubtitle, { fontSize: fs(13) }]}>Add colours manually or re-run AI lookup</Text>
          </View>
        }
        ListHeaderComponent={
          colours.length > 0
            ? <Text style={[styles.colourCount, { fontSize: fs(12) }]}>{colours.length} colour{colours.length !== 1 ? 's' : ''}</Text>
            : null
        }
        renderItem={({ item }) => (
          <View style={numColumns > 1 ? { flex: 1 } : undefined}>
            <ColourSwatch
              name={item.colour_name}
              hex={item.hex}
              source={item.source}
              onPress={() => handleColourPress(item)}
            />
          </View>
        )}
      />

      <TouchableOpacity
        style={[styles.fab, {
          width: fabSize, height: fabSize, borderRadius: fabSize / 2,
          bottom: sp(28), right: sp(24),
        }]}
        onPress={() => router.push({ pathname: '/(tabs)/projects/add-colour', params: { projectId: id } })}
        activeOpacity={0.8}
      >
        <Text style={[styles.fabText, { fontSize: sp(30, 36) }]}>+</Text>
      </TouchableOpacity>

      <Modal visible={showMixModal} animationType="slide" transparent>
        <View style={modalOverlayStyle}>
          <View style={modalSheetStyle}>
            {!isTablet && <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />}
            <View style={[styles.modalHeader, { gap: sp(12), marginBottom: sp(16) }]}>
              {selectedColour && (
                <>
                  <View style={[styles.modalSwatch, { width: sp(40, 52), height: sp(40, 52), backgroundColor: selectedColour.hex ?? '#888' }]} />
                  <Text style={[styles.modalTitle, { fontSize: fs(18) }]}>{selectedColour.colour_name}</Text>
                </>
              )}
              <TouchableOpacity onPress={() => setShowMixModal(false)} style={styles.closeBtn}>
                <Text style={[styles.closeBtnText, { fontSize: fs(18) }]}>✕</Text>
              </TouchableOpacity>
            </View>
            {mixLoading
              ? <ActivityIndicator color={theme.accent} size="large" style={{ marginTop: 40 }} />
              : mixData
                ? <MixSuggestion suggestion={mixData} />
                : null
            }
          </View>
        </View>
      </Modal>
    </View>
  );
}

function createStyles(t: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    centered: { flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center' },
    header: {
      backgroundColor: t.header,
      borderBottomWidth: 1,
      borderBottomColor: t.border,
    },
    backBtn: { marginBottom: 8 },
    backText: { color: t.accent },
    headerInfo: { gap: 4 },
    title: { color: t.text, fontWeight: '800' },
    subtitle: { color: t.subtext },
    colourCount: { color: t.muted, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
    empty: { alignItems: 'center', gap: 8 },
    emptyTitle: { color: t.text, fontWeight: '700' },
    emptySubtitle: { color: t.muted },
    fab: {
      position: 'absolute',
      backgroundColor: t.accent,
      alignItems: 'center', justifyContent: 'center',
      shadowColor: t.accent, shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
      elevation: 8,
    },
    fabText: { color: '#12121f', fontWeight: '700', marginTop: -2 },
    modalHandle: {
      width: 40, height: 4, borderRadius: 2,
      alignSelf: 'center', marginBottom: 16,
    },
    modalHeader: { flexDirection: 'row', alignItems: 'center' },
    modalSwatch: {
      borderRadius: 8,
      borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)',
      flexShrink: 0,
    },
    modalTitle: { color: t.text, fontWeight: '700', flex: 1 },
    closeBtn: { padding: 4 },
    closeBtnText: { color: t.muted },
  });
}
