import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import { Pressable } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
import { MaterialIcons } from '@expo/vector-icons';
import { Theme } from '@/constants/Theme';

function TabBarIcon(props: {
  name: keyof typeof MaterialIcons.glyphMap;
  color: string;
}) {
  return <MaterialIcons size={24} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Theme.colors.primary,
        tabBarInactiveTintColor: '#9e9e9e',
        headerShown: false,
        tabBarStyle: {
          height: 80,
          paddingBottom: 20,
          paddingTop: 10,
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color }) => <TabBarIcon name="dashboard" color={color} />,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: 'Products',
          tabBarIcon: ({ color }) => <TabBarIcon name="inventory" color={color} />,
        }}
      />
      <Tabs.Screen
        name="stores"
        options={{
          title: 'Shops',
          tabBarIcon: ({ color }) => <TabBarIcon name="storefront" color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color }) => <TabBarIcon name="pending-actions" color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color }) => <TabBarIcon name="more-horiz" color={color} />,
        }}
      />
    </Tabs>
  );
}
