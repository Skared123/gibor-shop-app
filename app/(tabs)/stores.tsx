import React from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '@/constants/Theme';

const STORES = [
  {
    id: '1',
    name: 'test',
    status: 'Activa',
    icon: 'storefront',
    avatarBg: '#abc7ff',
    avatarColor: '#00458e',
  },
  {
    id: '2',
    name: 'Danny Shop!',
    status: 'Activa',
    icon: 'local-mall',
    avatarBg: '#ffdcc3',
    avatarColor: '#6e3900',
  },
];

export default function StoresScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.flex}>
      {/* TopAppBar */}
      <View style={[styles.topAppBar, { paddingTop: insets.top, height: 64 + insets.top }]}>
        <View style={styles.avatarPlaceholder}>
          <MaterialIcons name="account-circle" size={24} color={Theme.colors.onSurfaceVariant} />
        </View>
        <Text style={styles.appTitle}>GIBOR SHOP</Text>
        <TouchableOpacity style={styles.iconButton}>
          <MaterialIcons name="notifications" size={24} color={Theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.headline}>Mis Tiendas</Text>
          <Text style={styles.subheadline}>Gestiona tus puntos de venta activos.</Text>
        </View>

        {/* Create Button */}
        <TouchableOpacity style={styles.createButton} activeOpacity={0.8}>
          <MaterialIcons name="add-circle" size={20} color={Theme.colors.onPrimaryContainer} />
          <Text style={styles.createButtonText}>Crear Nueva Tienda</Text>
        </TouchableOpacity>

        {/* Store List */}
        <View style={styles.storeList}>
          {STORES.map((store) => (
            <StoreCard key={store.id} store={store} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function StoreCard({ store }: { store: any }) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7}>
      <View style={[styles.storeAvatar, { backgroundColor: store.avatarBg }]}>
        <MaterialIcons name={store.icon} size={24} color={store.avatarColor} />
      </View>
      
      <View style={styles.storeDetails}>
        <Text style={styles.storeName} numberOfLines={1}>{store.name}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{store.status}</Text>
        </View>
      </View>

      <View style={styles.forwardButton}>
        <MaterialIcons name="arrow-forward" size={20} color={Theme.colors.onSurfaceVariant} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  } as const,
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
  } as const,
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f6f3f2',
    justifyContent: 'center',
    alignItems: 'center',
  } as const,
  iconButton: {
    padding: 8,
    borderRadius: 20,
  } as const,
  appTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Theme.colors.primary,
    letterSpacing: -0.5,
  } as const,
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 24,
  } as const,
  headerSection: {
    gap: 4,
  } as const,
  headline: {
    ...Theme.typography.headlineMd,
    color: Theme.colors.onSurface,
  } as const,
  subheadline: {
    ...Theme.typography.bodyMd,
    color: Theme.colors.onSurfaceVariant,
  } as const,
  createButton: {
    backgroundColor: Theme.colors.primaryContainer,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 12,
    gap: 8,
    shadowColor: Theme.colors.primaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  } as const,
  createButtonText: {
    ...Theme.typography.labelLg,
    color: Theme.colors.onPrimaryContainer,
  } as const,
  storeList: {
    gap: 12,
  } as const,
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e4e2e1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
    gap: 16,
  } as const,
  storeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  } as const,
  storeDetails: {
    flex: 1,
    gap: 4,
  } as const,
  storeName: {
    ...Theme.typography.headlineSm,
    color: Theme.colors.onSurface,
  } as const,
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Theme.colors.tertiaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  } as const,
  statusText: {
    ...Theme.typography.labelSm,
    color: Theme.colors.onTertiaryContainer,
  } as const,
  forwardButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e4e2e1',
    justifyContent: 'center',
    alignItems: 'center',
  } as const,
});
