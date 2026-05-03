import React, { useMemo, useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../../lib/supabase';
import { isValidHex, normaliseHex } from '../../../lib/colourUtils';
import { useResponsive } from '../../../lib/responsive';
import { useTheme, type Theme } from '../../../lib/theme';

const BRANDS = ['Mr. Hobby', 'Tamiya', 'Vallejo', 'AK Interactive', 'GSI Creos', 'Citadel', 'Other'];

export default function AddManualPaintScreen() {
  const router = useRouter();
  const { sp, fs, contentMaxWidth } = useResponsive();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
              placeholderTextColor={theme.placeholder}
            />
          </View>

          <View style={[styles.field, { gap: sp(8) }]}>
            <Text style={[styles.label, { fontSize: fs(13) }]}>Paint Code</Text>
            <TextInput
              style={[styles.input, { padding: sp(14), fontSize: fs(15) }]}
              value={code}
              onChangeText={setCode}
              placeholder="e.g. C-8 or XF-19"
              placeholderTextColor={theme.placeholder}
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
              placeholderTextColor={theme.placeholder}
            />
          </View>

          <View style={[styles.field, { gap: sp(8) }]}>
            <Text style={[styles.label, { fontSize: fs(13) }]}>Hex Colour (optional)</Text>
            <TextInput
              style={[styles.input, { padding: sp(14), fontSize: fs(15) }, !hexValid && { borderColor: '#ef4444' }]}
              value={hex}
              onChangeText={setHex}
              placeholder="#RRGGBB"
              placeholderTextColor={theme.placeholder}
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

function createStyles(t: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    content: {},
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    backText: { color: t.accent },
    heading: { color: t.text, fontWeight: '800' },
    field: {},
    label: { color: t.subtext, fontWeight: '600' },
    input: {
      backgroundColor: t.input, color: t.text, borderRadius: 10,
      borderWidth: 1, borderColor: t.border,
    },
    chip: {
      borderRadius: 20,
      backgroundColor: t.card, borderWidth: 1, borderColor: t.border,
    },
    chipActive: { borderColor: t.accent, backgroundColor: `${t.accent}20` },
    chipText: { color: t.muted, fontWeight: '600' },
    chipTextActive: { color: t.accent },
    hexPreview: { width: '100%', borderRadius: 8 },
    saveBtn: { backgroundColor: t.accent, borderRadius: 12, alignItems: 'center' },
    saveBtnText: { color: '#12121f', fontWeight: '800' },
    btnDisabled: { opacity: 0.5 },
  });
}
