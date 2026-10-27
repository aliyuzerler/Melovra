import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';

import ConnectScreen from '../screens/ConnectScreen';
import MixerScreen from '../screens/MixerScreen';
import PlaylistScreen from '../screens/PlaylistScreen';
import StudioScreen from '../screens/StudioScreen';
import { colors } from '../theme';

export type RootTabs = {
  Stüdyo: undefined;
  Playlist: undefined;
  Mikser: undefined;
  Bağlantı: undefined;
};

const Tab = createBottomTabNavigator<RootTabs>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.bgElevated,
    text: colors.text,
    primary: colors.accent,
    border: colors.border,
  },
};

const ICONS: Record<keyof RootTabs, keyof typeof Ionicons.glyphMap> = {
  Stüdyo: 'grid',
  Playlist: 'musical-notes',
  Mikser: 'options',
  Bağlantı: 'cloud',
};

export default function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerStyle: { backgroundColor: colors.bgElevated, borderBottomColor: colors.border },
          headerTintColor: colors.text,
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textDim,
          tabBarStyle: { backgroundColor: colors.bgElevated, borderTopColor: colors.border },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={ICONS[route.name as keyof RootTabs]} size={size} color={color} />
          ),
        })}
      >
        <Tab.Screen name="Stüdyo" component={StudioScreen} options={{ title: 'Melovra — Stüdyo' }} />
        <Tab.Screen name="Playlist" component={PlaylistScreen} options={{ title: 'Playlist' }} />
        <Tab.Screen name="Mikser" component={MixerScreen} options={{ title: 'Mikser' }} />
        <Tab.Screen name="Bağlantı" component={ConnectScreen} options={{ title: 'Sunucu Bağlantısı' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
