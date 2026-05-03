import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  Alert, ActivityIndicator, ScrollView, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../../lib/supabase';
import { scanPaintPot } from '../../../lib/api';
import type { ScannedPaint } from '../../../lib/api';
import { useResponsive } from '../../../lib/responsive';

export default function AddScanScreen() {
  const router = useRouter();
  const { sp, fs, contentMaxWidth } = useResponsive();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScannedPaint | null>(null);
  const [saving, setSaving] = useState(false);

  const [brand, setBrand] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [hex, setHex] = useState('');

  const pickImage = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.8 });
    if (!r.canceled && r.assets[0]) {
      setImageUri(r.assets[0].uri);
      setImageBase64(r.assets[0].base64 ?? null);
      setResult(null);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Camera permission required'); return; }
    const r = await ImagePicker.launchCameraAsync({ base64: true, quality: 0.8 });
    if (!r.canceled && r.assets[0]) {
      setImageUri(r.assets[0].uri);
      setImageBase64(r.assets[0].base64 ?? null);
      setResult(null);
    }
  };

  const handleScan = async () => {
    if (!imageBase64) return;
    setScanning(true);
    try {
      const scanned = await scanPaintPot(imageBase64);
      setResult(scanned);
      setBrand(scanned.brand);
      setCode(scanned.code ?? '');
      setName(scanned.name);
      setHex(scanned.hex ?? '');
    } catch (err: any) {
      Alert.alert('Scan failed', err.message);
    } finally {
      setScanning(false);
    }
  };

  const handleSave = async () => {
    if (!brand.trim() || !name.trim()) { Alert.alert('Brand and name required'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('paint_inventory').insert({
        brand: brand.trim(),
        code: code.trim() || null,
        name: name.trim(),
        hex: hex.trim() || null,
      });
      if (error) throw error;
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const confidenceColour = { high: '#16a34a', medium: '#ca8a04', low: '#ef4444' };
  const pad = sp(20);
  const previewHeight = sp(220, 320);

  return (
    <ScrollView style={styles.container}>
      <View style={[styles.content, { padding: pad, gap: pad, maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.backText, { fontSize: fs(16) }]}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={[styles.heading, { fontSize: fs(20) }]}>Scan Paint Pot</Text>
        </View>

        <Text style={[styles.description, { fontSize: fs(14) }]}>
          Take or upload a photo of a paint pot — AI will identify the brand, code and colour.
        </Text>

        <View style={[styles.buttonRow, { gap: sp(10) }]}>
          <TouchableOpacity style={[styles.imgBtn, { padding: sp(14) }]} onPress={pickImage}>
            <Text style={[styles.imgBtnText, { fontSize: fs(14) }]}>Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.imgBtn, { padding: sp(14) }]} onPress={takePhoto}>
            <Text style={[styles.imgBtnText, { fontSize: fs(14) }]}>Camera</Text>
          </TouchableOpacity>
        </View>

        {imageUri && (
          <Image source={{ uri: imageUri }} style={[styles.preview, { height: previewHeight }]} resizeMode="contain" />
        )}

        {imageUri && !result && (
          <TouchableOpacity
            style={[styles.scanBtn, { padding: sp(14) }, scanning && styles.btnDisabled]}
            onPress={handleScan}
            disabled={scanning}
          >
            {scanning
              ? <><ActivityIndicator color="#fff" /><Text style={[styles.scanBtnText, { fontSize: fs(15) }]}>  Scanning with AI...</Text></>
              : <Text style={[styles.scanBtnText, { fontSize: fs(15) }]}>Identify Paint with AI</Text>
            }
          </TouchableOpacity>
        )}

        {result && (
          <View style={[styles.resultSection, { padding: sp(16), gap: sp(12) }]}>
            <View style={styles.resultHeader}>
              <Text style={[styles.sectionTitle, { fontSize: fs(13) }]}>Scan Result</Text>
              <View style={[styles.confidenceBadge, { backgroundColor: confidenceColour[result.confidence] + '33', borderColor: confidenceColour[result.confidence] }]}>
                <Text style={[styles.confidenceText, { color: confidenceColour[result.confidence], fontSize: fs(11) }]}>
                  {result.confidence} confidence
                </Text>
              </View>
            </View>
            <Text style={[styles.editHint, { fontSize: fs(12) }]}>Review and edit before saving:</Text>

            {[
              { label: 'Brand *', value: brand, set: setBrand, placeholder: 'e.g. Mr. Hobby' },
              { label: 'Code', value: code, set: setCode, placeholder: 'e.g. C-8' },
              { label: 'Name *', value: name, set: setName, placeholder: 'e.g. Silver' },
              { label: 'Hex', value: hex, set: setHex, placeholder: '#RRGGBB' },
            ].map(({ label, value, set, placeholder }) => (
              <View key={label} style={[styles.field, { gap: sp(4) }]}>
                <Text style={[styles.label, { fontSize: fs(12) }]}>{label}</Text>
                <TextInput
                  style={[styles.input, { padding: sp(12), fontSize: fs(14) }]}
                  value={value}
                  onChangeText={set}
                  placeholder={placeholder}
                  placeholderTextColor="#555"
                />
              </View>
            ))}

            {hex && (
              <View style={[styles.hexPreview, { height: sp(36, 50) }, { backgroundColor: hex }]} />
            )}

            <TouchableOpacity
              style={[styles.saveBtn, { padding: sp(14), marginTop: sp(4) }, saving && styles.btnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator color="#12121f" />
                : <Text style={[styles.saveBtnText, { fontSize: fs(15) }]}>Add to Inventory</Text>
              }
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#12121f' },
  content: {},
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  backText: { color: '#e8a838' },
  heading: { color: '#fff', fontWeight: '800' },
  description: { color: '#aaa', lineHeight: 20 },
  buttonRow: { flexDirection: 'row' },
  imgBtn: {
    flex: 1, backgroundColor: '#1e1e32', borderRadius: 10,
    alignItems: 'center', borderWidth: 1, borderColor: '#2d2d44',
  },
  imgBtnText: { color: '#fff', fontWeight: '600' },
  preview: { width: '100%', borderRadius: 12, backgroundColor: '#1e1e32' },
  scanBtn: {
    backgroundColor: '#2563eb', borderRadius: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
  },
  scanBtnText: { color: '#fff', fontWeight: '700' },
  btnDisabled: { opacity: 0.5 },
  resultSection: { backgroundColor: '#1e1e32', borderRadius: 14 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { color: '#e8a838', fontWeight: '700', textTransform: 'uppercase' },
  confidenceBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  confidenceText: { fontWeight: '700' },
  editHint: { color: '#888' },
  field: {},
  label: { color: '#aaa', fontWeight: '600' },
  input: {
    backgroundColor: '#12121f', color: '#fff', borderRadius: 8,
    borderWidth: 1, borderColor: '#2d2d44',
  },
  hexPreview: { borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  saveBtn: { backgroundColor: '#e8a838', borderRadius: 10, alignItems: 'center' },
  saveBtnText: { color: '#12121f', fontWeight: '800' },
});
