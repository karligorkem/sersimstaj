// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { ListCollapse, User } from 'lucide-react-native';
import { useTheme } from "~/hooks/useTheme";
import { Platform } from "react-native";

export default function TabLayout() {
  const { colors, isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarLabelPosition: 'below-icon',
        tabBarShowLabel: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { 
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 70,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          paddingTop: 10,
          elevation: Platform.OS === 'android' ? 8 : 0,
         
          ...(Platform.OS === 'web' ? {
            boxShadow: `0 -4px 12px rgba(0, 0, 0, 0.1)`,
          } : {
            shadowColor: colors.text,
            shadowOffset: {
              width: 0,
              height: -4,
            },
            shadowOpacity: 0.1,
            shadowRadius: 12,
          }),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        headerStyle: { 
          backgroundColor: colors.background,
          borderBottomColor: colors.border,
        },
        headerTitleStyle: { 
          color: colors.text,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Ana Sayfa',
          tabBarLabel: 'Raporlar',
          tabBarIcon: ({ color, focused }) => (
            <ListCollapse 
              color={color} 
              size={focused ? 26 : 24} 
              strokeWidth={focused ? 2.5 : 2}
            />
          ),  
        }}
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarLabel: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <User 
              color={color} 
              size={focused ? 26 : 24}
              strokeWidth={focused ? 2.5 : 2}
            />
          ),
        }}
      />
    </Tabs>
  );
}