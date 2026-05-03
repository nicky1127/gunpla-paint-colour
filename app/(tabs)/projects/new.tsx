import React, { useMemo, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { lookupKitColours, type KitColour } from '../../../lib/api';
import { useResponsive } from '../../../lib/responsive';
import { useTheme, type Theme } from '../../../lib/theme';

export default function NewProjectScreen() {
  const router = useRouter();
  const { sp, fs, contentMaxWidth } = useResponsive();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [projectName, setProjectName] = useState('');
  const [kitName, setKitName] = useState('');
  const [kitCode, setKitCode] = useState('');
  const [aiColours, setAiColours] = useState<KitColour[] | null>(null);
  const [sourceNotes, setSourceNotes] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleLookup = async () => {
    if (!kitName.trim() && !kitCode.trim()) {
      Alert.alert('Enter kit details', 'Please enter a kit name or code to look up.');
      return;
    }
    setLookingUp(true);
    try {
      const result = await lookupKitColours(kitName.trim(), kitCode.trim());
      setAiColours(result.colours);
      setSourceNotes(result.source_notes);
    } catch (err: any) {
      Alert.alert('Lookup failed', err.message ?? 'Could not retrieve colours. Check your Supabase Edge Functions are deployed.');
    } finally {
      setLookingUp(false);
    }
  };

  const handleSave = async () => {
    if (!projectName.trim()) {
      Alert.alert('Project name required', 'Please enter a name for this project.');
      return;
    }
    setSaving(true);
    try {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          name: projectName.trim(),
          kit_name: kitName.trim() || null,
          kit_code: kitCode.trim() || null,
        })
        .select()
        .single();

      if (projectError) throw projectError;

      if (aiColours && aiColours.length > 0) {
        const rows = aiColours.map((c) => ({
          project_id: project.id,
          colour_name: c.colour_name,
          hex: c.hex,
          source: 'ai' as const,
          notes: c.notes,
        }));
        const { error: colourError } = await supabase
          .from('project_colours')
          .insert(rows);
        if (colourError) throw colourError;
      }

      router.replace(`/(tabs)/projects/${project.id}`);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const pad = sp(20);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container}>
        <View style={[styles.content, { padding: pad, gap: pad, maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }]}>
          <Text style={[styles.heading, { fontSize: fs(24) }]}>New Project</Text>

          <View style={[styles.field, { gap: sp(6) }]}>
            <Text style={[styles.label, { fontSize: fs(13) }]}>Project Name *</Text>
            <TextInput
              style={[styles.input, { padding: sp(14), fontSize: fs(15) }]}
              value={projectName}
              onChangeText={setProjectName}
              placeholder="e.g. RX-78-2 Build #1"
              placeholderTextColor={theme.placeholder}
            />
          </View>

          <View style={[styles.section, { padding: sp(16), gap: sp(12) }]}>
            <Text style={[styles.sectionTitle, { fontSize: fs(13) }]}>Kit Details (for AI colour lookup)</Text>
            <View style={[styles.field, { gap: sp(6) }]}>
              <Text style={[styles.label, { fontSize: fs(13) }]}>Kit Name</Text>
              <TextInput
                style={[styles.input, { padding: sp(14), fontSize: fs(15) }]}
                value={kitName}
                onChangeText={setKitName}
                placeholder="e.g. RX-78-2 Gundam MG 1/100"
                placeholderTextColor={theme.placeholder}
              />
            </View>
            <View style={[styles.field, { gap: sp(6) }]}>
              <Text style={[styles.label, { fontSize: fs(13) }]}>Kit Code</Text>
              <TextInput
                style={[styles.input, { padding: sp(14), fontSize: fs(15) }]}
                value={kitCode}
                onChangeText={setKitCode}
                placeholder="e.g. MG-001 or Bandai item #"
                placeholderTextColor={theme.placeholder}
              />
            </View>
            <TouchableOpacity
              style={[styles.lookupBtn, { padding: sp(14) }, lookingUp && styles.btnDisabled]}
              onPress={handleLookup}
              disabled={lookingUp}
            >
              {lookingUp
                ? <ActivityIndicator color="#fff" />
                : <Text style={[styles.lookupBtnText, { fontSize: fs(15) }]}>Look up colours with AI</Text>
              }
            </TouchableOpacity>
          </View>

          {aiColours !== null && (
            <View style={[styles.section, { padding: sp(16), gap: sp(12) }]}>
              <Text style={[styles.sectionTitle, { fontSize: fs(13) }]}>
                AI-suggested colours ({aiColours.length} found)
              </Text>
              {sourceNotes ? <Text style={[styles.sourceNotes, { fontSize: fs(12) }]}>{sourceNotes}</Text> : null}
              {aiColours.length === 0
                ? <Text style={[styles.noResults, { fontSize: fs(13) }]}>No colours found. You can add them manually after creating the project.</Text>
                : aiColours.map((c, i) => (
                  <View key={i} style={[styles.colourRow, { gap: sp(10) }]}>
                    <View style={[styles.colourDot, { width: sp(32, 40), height: sp(32, 40), backgroundColor: c.hex ?? '#888' }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.colourName, { fontSize: fs(14) }]}>{c.colour_name}</Text>
                      {c.hex && <Text style={[styles.colourHex, { fontSize: fs(12) }]}>{c.hex}</Text>}
                      {c.notes && <Text style={[styles.colourNotes, { fontSize: fs(12) }]}>{c.notes}</Text>}
                    </View>
                  </View>
                ))
              }
            </View>
          )}

          <TouchableOpacity
            style={[styles.saveBtn, { padding: sp(16) }, saving && styles.btnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#12121f" />
              : <Text style={[styles.saveBtnText, { fontSize: fs(16) }]}>Create Project</Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(t: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    content: {},
    heading: { color: t.text, fontWeight: '800' },
    section: { backgroundColor: t.card, borderRadius: 14 },
    sectionTitle: { color: t.accent, fontWeight: '700', textTransform: 'uppercase' },
    field: {},
    label: { color: t.subtext, fontWeight: '600' },
    input: {
      backgroundColor: t.input, color: t.text, borderRadius: 10,
      borderWidth: 1, borderColor: t.border,
    },
    lookupBtn: { backgroundColor: '#2563eb', borderRadius: 10, alignItems: 'center' },
    lookupBtnText: { color: '#fff', fontWeight: '700' },
    btnDisabled: { opacity: 0.5 },
    sourceNotes: { color: t.muted, fontStyle: 'italic' },
    noResults: { color: t.muted },
    colourRow: { flexDirection: 'row', alignItems: 'center' },
    colourDot: { borderRadius: 6, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)', flexShrink: 0 },
    colourName: { color: t.text, fontWeight: '600' },
    colourHex: { color: t.muted, fontFamily: 'monospace' },
    colourNotes: { color: t.muted },
    saveBtn: { backgroundColor: t.accent, borderRadius: 12, alignItems: 'center' },
    saveBtnText: { color: '#12121f', fontWeight: '800' },
  });
}
