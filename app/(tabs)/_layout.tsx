import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useResponsive } from '../../lib/responsive';
import { useTheme } from '../../lib/theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({ icon, focused, color }: { icon: IoniconsName; focused: boolean; color: string }) {
  const { sp } = useResponsive();
  return <Ionicons name={focused ? icon : `${icon}-outline` as IoniconsName} size={sp(22, 28)} color={color} />;
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
          tabBarIcon: ({ focused, color }) => <TabIcon icon="layers" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Paints',
          tabBarIcon: ({ focused, color }) => <TabIcon icon="flask" focused={focused} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused, color }) => <TabIcon icon="settings" focused={focused} color={color} />,
        }}
      />
    </Tabs>
  );
}
