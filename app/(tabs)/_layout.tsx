import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { useResponsive } from '../../lib/responsive';
import { useTheme } from '../../lib/theme';

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const { fs } = useResponsive();
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: fs(20, 26), opacity: focused ? 1 : 0.6 }}>{name}</Text>
    </View>
  );
}

export default function TabLayout() {
  const { sp } = useResponsive();
  const { theme } = useTheme();
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: theme.header,
          borderTopColor: theme.border,
          borderTopWidth: 1,
          height: sp(49, 72),
          paddingBottom: sp(4, 14),
          paddingTop: sp(4, 8),
        },
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.muted,
        tabBarLabelStyle: { fontSize: sp(10, 13) },
        headerStyle: { backgroundColor: theme.header },
        headerTintColor: theme.text,
        headerTitleStyle: { color: theme.text, fontWeight: '700', fontSize: sp(17, 20) },
      }}
    >
      <Tabs.Screen
        name="projects"
        options={{
          title: 'Projects',
          tabBarIcon: ({ focused }) => <TabIcon name="🎨" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'My Paints',
          tabBarIcon: ({ focused }) => <TabIcon name="🖌️" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon name="⚙️" focused={focused} />,
        }}
      />
    </Tabs>
  );
}
