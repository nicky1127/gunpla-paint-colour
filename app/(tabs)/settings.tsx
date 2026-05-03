import React, { useMemo } from 'react';
import { View, Text, Switch, StyleSheet } from 'react-native';
import { useTheme, type Theme } from '../../lib/theme';
import { useResponsive } from '../../lib/responsive';

export default function SettingsScreen() {
  const { theme, toggleTheme } = useTheme();
  const { sp, fs } = useResponsive();
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View style={styles.container}>
      <View style={[styles.section, { margin: sp(16), padding: 0 }]}>
        <View style={[styles.row, { padding: sp(16) }]}>
          <View style={styles.rowLeft}>
            <Text style={[styles.rowTitle, { fontSize: fs(16) }]}>Dark Mode</Text>
            <Text style={[styles.rowSub, { fontSize: fs(13) }]}>
              {theme.mode === 'dark' ? 'Currently using dark theme' : 'Currently using light theme'}
            </Text>
          </View>
          <Switch
            value={theme.mode === 'dark'}
            onValueChange={toggleTheme}
            trackColor={{ false: theme.border, true: `${theme.accent}99` }}
            thumbColor={theme.mode === 'dark' ? theme.accent : '#f0f0f0'}
            ios_backgroundColor={theme.border}
          />
        </View>
      </View>

      <Text style={[styles.footer, { fontSize: fs(12), marginHorizontal: sp(16) }]}>
        Gunpla Paint Colour Assistant
      </Text>
    </View>
  );
}

function createStyles(t: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: t.bg },
    section: {
      backgroundColor: t.card,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: t.border,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    rowLeft: { flex: 1, marginRight: 12, gap: 3 },
    rowTitle: { color: t.text, fontWeight: '600' },
    rowSub: { color: t.subtext },
    footer: { color: t.muted, textAlign: 'center', marginTop: 8 },
  });
}
