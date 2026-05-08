import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '@/constants/Theme';
import { useAppData } from '@/context/AppDataContext';

interface TopAppBarProps {
  title?: string;
  showNotifications?: boolean;
}

export default function TopAppBar({ title = 'GIBOR SHOP', showNotifications = true }: TopAppBarProps) {
  const insets = useSafeAreaInsets();
  const { openDrawer } = useAppData();

  return (
    <View style={[styles.topAppBar, { paddingTop: insets.top, height: 64 + insets.top }]}>
      <TouchableOpacity style={styles.iconButton} onPress={openDrawer}>
        <MaterialIcons name="menu" size={24} color={Theme.colors.primary} />
      </TouchableOpacity>
      <Text style={styles.appTitle}>{title}</Text>
      {showNotifications ? (
        <TouchableOpacity style={styles.iconButton}>
          <MaterialIcons name="notifications" size={24} color={Theme.colors.primary} />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconButton} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  topAppBar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
    ...Theme.elevation.level1,
    zIndex: 100,
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Theme.colors.primary,
    letterSpacing: -0.5,
    textTransform: 'uppercase',
  },
});
