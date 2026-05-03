import React, { useMemo, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../../lib/supabase';
import { extractColourFromImage, type ColourExtractionMode, type ExtractedColour } from '../../../lib/api';
import { isValidHex, normaliseHex } from '../../../lib/colourUtils';
import { useResponsive } from '../../../lib/responsive';
import { useTheme, type Theme } from '../../../lib/theme';

type InputMode = 'text' | 'hex' | 'image';

export default function AddColourScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const router = useRouter();
  const { sp, fs, contentMaxWidth } = useResponsive();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [mode, setMode] = useState<InputMode>('text');
  const [colourName, setColourName] = useState('');
  const [hexInput, setHexInput] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [extractionMode, setExtractionMode] = useState<ColourExtractionMode>('dominant');
  const [extractedColours, setExtractedColours] = useState<ExtractedColour[]>([]);
  const [selectedExtracted, setSelectedExtracted] = useState<ExtractedColour | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 ?? null);
      setExtractedColours([]);
      setSelectedExtracted(null);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Camera permission required'); return; }
    const result = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.7 });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 ?? null);
      setExtractedColours([]);
      setSelectedExtracted(null);
    }
  };

  const handleExtract = async () => {
    if (!imageBase64) return;
    setExtracting(true);
    try {
      const colours = await extractColourFromImage(imageBase64, extractionMode);
      setExtractedColours(colours);
      if (colours.length > 0) {
        setSelectedExtracted(colours[0]);
        setColourName(colours[0].name);
        setHexInput(colours[0].hex);
      }
    } catch (err: any) {
      Alert.alert('Extraction failed', err.message);
    } finally {
      setExtracting(false);
    }
  };

  const handleSave = async () => {
    const name = colourName.trim();
    if (!name) { Alert.alert('Colour name required'); return; }
    let hex: string | null = null;
    if (mode === 'hex' || (mode === 'image' && selectedExtracted)) {
      const rawHex = mode === 'image' ? selectedExtracted!.hex : hexInput.trim();
      const norm = normaliseHex(rawHex);
      if (rawHex && !isValidHex(norm)) {
        Alert.alert('Invalid hex', 'Please enter a valid hex colour (e.g. #FF5500).');
        return;
      }
      hex = rawHex ? norm : null;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('project_colours').insert({
        project_id: projectId,
        colour_name: name,
        hex,
        source: mode === 'text' && !hex ? 'manual' : mode === 'image' ? 'image' : 'manual',
        notes: null,
      });
      if (error) throw error;
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const pad = sp(20);
  const previewHeight = sp(200, 300);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container}>
        <View style={[styles.content, { padding: pad, gap: pad, maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={[styles.backText, { fontSize: fs(16) }]}>‹ Back</Text>
            </TouchableOpacity>
            <Text style={[styles.heading, { fontSize: fs(22) }]}>Add Colour</Text>
          </View>

          <View style={[styles.modeRow, { gap: sp(8) }]}>
            {(['text', 'hex', 'image'] as InputMode[]).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.modeBtn, { paddingVertical: sp(10) }, mode === m && styles.modeBtnActive]}
                onPress={() => setMode(m)}
              >
                <Text style={[styles.modeBtnText, { fontSize: fs(13) }, mode === m && styles.modeBtnTextActive]}>
                  {m === 'text' ? 'Description' : m === 'hex' ? 'Hex / RGB' : 'Photo'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.field, { gap: sp(6) }]}>
            <Text style={[styles.label, { fontSize: fs(13) }]}>Colour Name *</Text>
            <TextInput
              style={[styles.input, { padding: sp(14), fontSize: fs(15) }]}
              value={colourName}
              onChangeText={setColourName}
              placeholder={
                mode === 'text' ? 'e.g. Dark metallic grey'
                  : mode === 'hex' ? 'e.g. RX-78 White'
                  : 'e.g. Cockpit Panel Dark'
              }
              placeholderTextColor={theme.placeholder}
            />
          </View>

          {mode === 'hex' && (
            <View style={[styles.field, { gap: sp(6) }]}>
              <Text style={[styles.label, { fontSize: fs(13) }]}>Hex or RGB</Text>
              <TextInput
                style={[styles.input, { padding: sp(14), fontSize: fs(15) }]}
                value={hexInput}
                onChangeText={setHexInput}
                placeholder="#FF5500 or leave blank"
                placeholderTextColor={theme.placeholder}
                autoCapitalize="characters"
                maxLength={9}
              />
              {hexInput.trim() && isValidHex(normaliseHex(hexInput.trim())) && (
                <View style={[styles.hexPreview, { height: sp(40, 56) }, { backgroundColor: normaliseHex(hexInput.trim()) }]} />
              )}
            </View>
          )}

          {mode === 'image' && (
            <View style={[styles.section, { padding: sp(16), gap: sp(12) }]}>
              <Text style={[styles.sectionTitle, { fontSize: fs(12) }]}>Select Image</Text>
              <View style={[styles.imageButtonRow, { gap: sp(10) }]}>
                <TouchableOpacity style={styles.imageBtn} onPress={pickImage}>
                  <Text style={[styles.imageBtnText, { fontSize: fs(14) }]}>Pick from Gallery</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.imageBtn} onPress={takePhoto}>
                  <Text style={[styles.imageBtnText, { fontSize: fs(14) }]}>Take Photo</Text>
                </TouchableOpacity>
              </View>

              {imageUri && (
                <Image source={{ uri: imageUri }} style={[styles.preview, { height: previewHeight }]} resizeMode="contain" />
              )}

              {imageUri && (
                <>
                  <Text style={[styles.sectionTitle, { fontSize: fs(12) }]}>Extraction Mode</Text>
                  <View style={[styles.modeRow, { gap: sp(8) }]}>
                    {(['dominant', 'palette'] as ColourExtractionMode[]).map((em) => (
                      <TouchableOpacity
                        key={em}
                        style={[styles.modeBtn, { paddingVertical: sp(10) }, extractionMode === em && styles.modeBtnActive]}
                        onPress={() => setExtractionMode(em)}
                      >
                        <Text style={[styles.modeBtnText, { fontSize: fs(13) }, extractionMode === em && styles.modeBtnTextActive]}>
                          {em === 'dominant' ? 'Dominant colour' : 'Colour palette'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity
                    style={[styles.extractBtn, { padding: sp(12) }, extracting && styles.btnDisabled]}
                    onPress={handleExtract}
                    disabled={extracting}
                  >
                    {extracting
                      ? <ActivityIndicator color="#fff" />
                      : <Text style={[styles.extractBtnText, { fontSize: fs(14) }]}>Extract Colour with AI</Text>
                    }
                  </TouchableOpacity>
                </>
              )}

              {extractedColours.length > 0 && (
                <View style={[styles.extractedList, { gap: sp(8) }]}>
                  <Text style={[styles.sectionTitle, { fontSize: fs(12) }]}>Extracted Colours — tap to select</Text>
                  {extractedColours.map((ec, i) => (
                    <TouchableOpacity
                      key={i}
                      style={[styles.extractedRow, { gap: sp(10), padding: sp(10) }, selectedExtracted?.hex === ec.hex && styles.extractedRowSelected]}
                      onPress={() => { setSelectedExtracted(ec); setColourName(ec.name); }}
                    >
                      <View style={[styles.extractedDot, { width: sp(30, 42), height: sp(30, 42) }, { backgroundColor: ec.hex }]} />
                      <Text style={[styles.extractedName, { fontSize: fs(13) }]}>{ec.name}</Text>
                      <Text style={[styles.extractedHex, { fontSize: fs(12) }]}>{ec.hex}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          <TouchableOpacity
            style={[styles.saveBtn, { padding: sp(16) }, saving && styles.btnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#12121f" />
              : <Text style={[styles.saveBtnText, { fontSize: fs(16) }]}>Add Colour</Text>
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
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    backText: { color: t.accent },
    heading: { color: t.text, fontWeight: '800' },
    modeRow: { flexDirection: 'row' },
    modeBtn: {
      flex: 1, borderRadius: 10,
      borderWidth: 1, borderColor: t.border,
      alignItems: 'center',
    },
    modeBtnActive: { borderColor: t.accent, backgroundColor: `${t.accent}20` },
    modeBtnText: { color: t.muted, fontWeight: '600' },
    modeBtnTextActive: { color: t.accent },
    field: {},
    label: { color: t.subtext, fontWeight: '600' },
    input: {
      backgroundColor: t.input, color: t.text, borderRadius: 10,
      borderWidth: 1, borderColor: t.border,
    },
    hexPreview: { width: '100%', borderRadius: 8, marginTop: 6 },
    section: { backgroundColor: t.card, borderRadius: 14 },
    sectionTitle: { color: t.accent, fontWeight: '700', textTransform: 'uppercase' },
    imageButtonRow: { flexDirection: 'row' },
    imageBtn: {
      flex: 1, backgroundColor: t.border, borderRadius: 10, padding: 12,
      alignItems: 'center',
    },
    imageBtnText: { color: t.text, fontWeight: '600' },
    preview: { width: '100%', borderRadius: 10, backgroundColor: t.border },
    extractBtn: { backgroundColor: '#2563eb', borderRadius: 10, alignItems: 'center' },
    extractBtnText: { color: '#fff', fontWeight: '700' },
    btnDisabled: { opacity: 0.5 },
    extractedList: {},
    extractedRow: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: t.bg, borderRadius: 8,
      borderWidth: 1, borderColor: 'transparent',
    },
    extractedRowSelected: { borderColor: t.accent },
    extractedDot: { borderRadius: 6, flexShrink: 0 },
    extractedName: { color: t.text, flex: 1 },
    extractedHex: { color: t.muted, fontFamily: 'monospace' },
    saveBtn: { backgroundColor: t.accent, borderRadius: 12, alignItems: 'center' },
    saveBtnText: { color: '#12121f', fontWeight: '800' },
  });
}
