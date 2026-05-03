import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { isValidHex, normaliseHex } from '../../../lib/colourUtils';
import { useResponsive } from '../../../lib/responsive';

const BRANDS = ['Mr. Hobby', 'Tamiya', 'Vallejo', 'AK Interactive', 'GSI Creos', 'Citadel', 'Other'];

export default function AddManualPaintScreen() {
  const router = useRouter();
  const { sp, fs, contentMaxWidth } = useResponsive();
  const [brand, setBrand] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [hex, setHex] = useState('');
  const [saving, setSaving] = useState(false);

  const hexNorm = normaliseHex(hex);
  const hexValid = !hex.trim() || isValidHex(hexNorm);

  const handleSave = async () => {
    if (!brand.trim()) { Alert.alert('Brand required'); return; }
    if (!name.trim()) { Alert.alert('Paint name required'); return; }
    if (hex.trim() && !hexValid) { Alert.alert('Invalid hex', 'Enter a valid hex e.g. #C0C0C0'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('paint_inventory').insert({
        brand: brand.trim(),
        code: code.trim() || null,
        name: name.trim(),
        hex: hex.trim() ? hexNorm : null,
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

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container}>
        <View style={[styles.content, { padding: pad, gap: pad, maxWidth: contentMaxWidth, alignSelf: 'center', width: '100%' }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={[styles.backText, { fontSize: fs(16) }]}>‹ Back</Text>
            </TouchableOpacity>
            <Text style={[styles.heading, { fontSize: fs(20) }]}>Add Paint Manually</Text>
          </View>

          <View style={[styles.field, { gap: sp(8) }]}>
            <Text style={[styles.label, { fontSize: fs(13) }]}>Brand *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: sp(8) }}>
              {BRANDS.map((b) => (
                <TouchableOpacity
                  key={b}
                  style={[styles.chip, { paddingHorizontal: sp(14), paddingVertical: sp(8) }, brand === b && styles.chipActive]}
                  onPress={() => setBrand(b)}
                >
                  <Text style={[styles.chipText, { fontSize: fs(13) }, brand === b && styles.chipTextActive]}>{b}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TextInput
              style={[styles.input, { padding: sp(14), fontSize: fs(15) }]}
              value={brand}
              onChangeText={setBrand}
              placeholder="Or type brand name"
              placeholderTextColor="#555"
            />
          </View>

          <View style={[styles.field, { gap: sp(8) }]}>
            <Text style={[styles.label, { fontSize: fs(13) }]}>Paint Code</Text>
            <TextInput
              style={[styles.input, { padding: sp(14), fontSize: fs(15) }]}
              value={code}
              onChangeText={setCode}
              placeholder="e.g. C-8 or XF-19"
              placeholderTextColor="#555"
              autoCapitalize="characters"
            />
          </View>

          <View style={[styles.field, { gap: sp(8) }]}>
            <Text style={[styles.label, { fontSize: fs(13) }]}>Paint Name *</Text>
            <TextInput
              style={[styles.input, { padding: sp(14), fontSize: fs(15) }]}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Silver"
              placeholderTextColor="#555"
            />
          </View>

          <View style={[styles.field, { gap: sp(8) }]}>
            <Text style={[styles.label, { fontSize: fs(13) }]}>Hex Colour (optional)</Text>
            <TextInput
              style={[styles.input, { padding: sp(14), fontSize: fs(15) }, !hexValid && { borderColor: '#ef4444' }]}
              value={hex}
              onChangeText={setHex}
              placeholder="#RRGGBB"
              placeholderTextColor="#555"
              autoCapitalize="characters"
              maxLength={9}
            />
            {hex.trim() && isValidHex(hexNorm) && (
              <View style={[styles.hexPreview, { height: sp(40, 56) }, { backgroundColor: hexNorm }]} />
            )}
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, { padding: sp(16), marginTop: sp(8) }, saving && styles.btnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color="#12121f" />
              : <Text style={[styles.saveBtnText, { fontSize: fs(16) }]}>Add to Inventory</Text>
            }
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#12121f' },
  content: {},
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  backText: { color: '#e8a838' },
  heading: { color: '#fff', fontWeight: '800' },
  field: {},
  label: { color: '#aaa', fontWeight: '600' },
  input: {
    backgroundColor: '#1e1e32', color: '#fff', borderRadius: 10,
    borderWidth: 1, borderColor: '#2d2d44',
  },
  chip: {
    borderRadius: 20,
    backgroundColor: '#1e1e32', borderWidth: 1, borderColor: '#2d2d44',
  },
  chipActive: { borderColor: '#e8a838', backgroundColor: '#e8a83820' },
  chipText: { color: '#888', fontWeight: '600' },
  chipTextActive: { color: '#e8a838' },
  hexPreview: { width: '100%', borderRadius: 8 },
  saveBtn: { backgroundColor: '#e8a838', borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#12121f', fontWeight: '800' },
  btnDisabled: { opacity: 0.5 },
});
