import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { useResponsive } from '../../lib/responsive';

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
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#1a1a2e',
          borderTopColor: '#2d2d44',
          borderTopWidth: 1,
          height: sp(49, 72),
          paddingBottom: sp(4, 14),
          paddingTop: sp(4, 8),
        },
        tabBarActiveTintColor: '#e8a838',
        tabBarInactiveTintColor: '#888',
        tabBarLabelStyle: { fontSize: sp(10, 13) },
        headerStyle: { backgroundColor: '#1a1a2e' },
        headerTintColor: '#fff',
        headerTitleStyle: { color: '#fff', fontWeight: '700', fontSize: sp(17, 20) },
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
    </Tabs>
  );
}
