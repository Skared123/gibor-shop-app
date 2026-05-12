import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, 
  ScrollView, 
  View, 
  Text, 
  TouchableOpacity, 
  RefreshControl, 
  TextInput, 
  ActivityIndicator, 
  Alert,
  Image
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Theme } from '@/constants/Theme';
import { useAppData } from '@/context/AppDataContext';
import TopAppBar from '@/components/TopAppBar';
import CreateStoreWizard from '@/components/CreateStoreWizard';
import CountrySelectorModal from '@/components/CountrySelectorModal';
import * as WebBrowser from 'expo-web-browser';
import { FilterDropdown } from '@/components/StoreFilter';

export default function StoresScreen() {
  const { api, user, refreshStores } = useAppData();
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false);
  const [countries, setCountries] = useState<any[]>([]);
  const [canCreateStore, setCanCreateStore] = useState(false);

  const fetchStoresData = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('limit', '100');

      if (user?.role !== 'admin') {
        params.append('where[owner][equals]', user?.id.toString() || '');
      }

      if (selectedCountry) {
        params.append('where[country][equals]', selectedCountry.id.toString());
      }

      if (searchQuery) {
        params.append('where[name][like]', searchQuery);
      }

      const res = await api.get(`/stores?${params.toString()}`);
      if (res.data) {
        setStores(res.data.docs || []);
      }

      // Check access for creation
      const accessRes = await api.get('/access');
      if (accessRes.data) {
        setCanCreateStore(accessRes.data?.collections?.stores?.create || false);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api, user, selectedCountry, searchQuery]);

  const fetchCountries = async () => {
    try {
      const res = await api.get('/countries?limit=100');
      if (res.data) {
        setCountries(res.data.docs || []);
      }
    } catch (err) {
      console.error('Error fetching countries:', err);
    }
  };

  useEffect(() => {
    fetchStoresData();
    if (user?.role === 'admin') {
      fetchCountries();
    }
  }, [fetchStoresData, user]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStoresData(false);
    refreshStores();
  };

  const handleDeleteStore = (store: any) => {
    Alert.alert(
      'Confirmar Eliminación',
      `¿Estás seguro de que deseas eliminar la tienda "${store.name}"? Esta acción es irreversible.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const res = await api.delete(`/stores/${store.id}`);
              if (res.status === 200 || res.status === 204) {
                fetchStoresData();
                refreshStores();
              }
            } catch (err) {
              console.error('Error deleting store:', err);
              Alert.alert('Error', 'No se pudo eliminar la tienda.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.flex}>
      <TopAppBar />

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Theme.colors.primary]} />
        }
      >
        {/* Header Section */}
        <View style={styles.headerSection}>
          <Text style={styles.headline}>Mis Tiendas</Text>
          <Text style={styles.subheadline}>Gestiona tus puntos de venta activos.</Text>
        </View>

        {/* Admin Filters */}
        {(user?.role === 'admin' || user?.role === 'countryManager') && (
          <View style={styles.filtersContainer}>
            <View style={styles.searchBox}>
              <MaterialIcons name="search" size={20} color={Theme.colors.onSurfaceVariant} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por nombre..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={Theme.colors.placeholder}
              />
            </View>
            
            {user?.role === 'admin' && (
              <View style={styles.dropdownRow}>
                <FilterDropdown 
                  label="País" 
                  value={selectedCountry?.name || 'Todos los países'} 
                  onPress={() => setIsCountryModalOpen(true)}
                  icon="public"
                />
              </View>
            )}
          </View>
        )}

        {/* Create Button */}
        {canCreateStore && (
          <TouchableOpacity 
            style={styles.createButton} 
            activeOpacity={0.8}
            onPress={() => setIsWizardOpen(true)}
          >
            <MaterialIcons name="add-circle" size={20} color={Theme.colors.onPrimary} />
            <Text style={styles.createButtonText}>Crear Nueva Tienda</Text>
          </TouchableOpacity>
        )}

        {/* Store List */}
        {loading ? (
          <ActivityIndicator size="large" color={Theme.colors.primary} style={{ marginTop: 40 }} />
        ) : stores.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialIcons name="storefront" size={64} color={Theme.colors.outline} />
            <Text style={styles.emptyTitle}>No se encontraron tiendas</Text>
            <Text style={styles.emptySubtitle}>Aún no tienes tiendas configuradas o no coinciden con la búsqueda.</Text>
          </View>
        ) : (
          <View style={styles.storeList}>
            {stores.map((store) => (
              <StoreCard 
                key={store.id} 
                store={store} 
                onDelete={() => handleDeleteStore(store)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <CreateStoreWizard 
        visible={isWizardOpen} 
        onClose={() => setIsWizardOpen(false)}
        onSuccess={() => {
          setIsWizardOpen(false);
          fetchStoresData();
          refreshStores();
        }}
      />

      <CountrySelectorModal 
        visible={isCountryModalOpen}
        onClose={() => setIsCountryModalOpen(false)}
        countries={[{ id: 'all', name: 'Todos los países' }, ...countries]}
        selectedCountryId={selectedCountry?.id || 'all'}
        onSelect={(country) => {
          setSelectedCountry(country.id === 'all' ? null : country);
          setIsCountryModalOpen(false);
        }}
      />
    </View>
  );
}

function StoreCard({ store, onDelete }: { store: any, onDelete: () => void }) {
  const storeCountry = store.country;
  const logoId = typeof store.logo === 'object' ? store.logo?.id : store.logo;
  const logoUrl = logoId ? `https://shop.giborcommunity.com/api/media-url/${logoId}` : null;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.storeAvatar, { backgroundColor: Theme.colors.primary + '15' }]}>
          {logoUrl ? (
            <Image 
              source={{ uri: logoUrl }} 
              style={styles.logoImage} 
              resizeMode="contain"
            />
          ) : (
            <MaterialIcons name="storefront" size={24} color={Theme.colors.primary} />
          )}
        </View>
        
        <View style={styles.storeDetails}>
          <View style={styles.nameRow}>
            <Text style={styles.storeName} numberOfLines={1}>{store.name}</Text>
            {storeCountry?.iso2 && (
              <View style={styles.flagBadge}>
                <Text style={styles.flagText}>{storeCountry.iso2}</Text>
              </View>
            )}
          </View>
          <View style={styles.idRow}>
            <Text style={styles.storeSlug}>/{store.slug}</Text>
            <Text style={styles.storeId}>ID: {store.id}</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
          <MaterialIcons name="delete-outline" size={20} color={Theme.colors.error} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.cardFooter}>
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Activa</Text>
        </View>

        <TouchableOpacity 
          style={styles.visitButton}
          onPress={() => WebBrowser.openBrowserAsync(`https://shop.giborcommunity.com/store/${store.slug}`)}
        >
          <Text style={styles.visitButtonText}>Visitar Tienda</Text>
          <MaterialIcons name="open-in-new" size={14} color={Theme.colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  } as const,
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 20,
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
  filtersContainer: {
    gap: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.outline,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    ...Theme.typography.bodyMd,
    color: Theme.colors.onSurface,
  },
  dropdownRow: {
    flexDirection: 'row',
  },
  createButton: {
    backgroundColor: Theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 12,
    gap: 8,
    ...Theme.elevation.level1,
  } as const,
  createButtonText: {
    ...Theme.typography.labelLg,
    color: Theme.colors.onPrimary,
  } as const,
  storeList: {
    gap: 12,
  } as const,
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    ...Theme.typography.headlineSm,
    color: Theme.colors.onSurface,
  },
  emptySubtitle: {
    ...Theme.typography.bodyMd,
    color: Theme.colors.onSurfaceVariant,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  card: {
    backgroundColor: Theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.outline,
    ...Theme.elevation.level1,
  } as const,
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  storeAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  } as const,
  storeDetails: {
    flex: 1,
  } as const,
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  storeName: {
    ...Theme.typography.headlineSm,
    color: Theme.colors.onSurface,
    maxWidth: '80%',
  } as const,
  storeSlug: {
    ...Theme.typography.bodySm,
    color: Theme.colors.onSurfaceVariant,
  },
  idRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  storeId: {
    ...Theme.typography.labelSm,
    color: Theme.colors.placeholder,
  },
  logoImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  flagBadge: {
    backgroundColor: Theme.colors.background,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Theme.colors.outline,
  },
  flagText: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.onSurfaceVariant,
  },
  deleteButton: {
    padding: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.divider,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.success + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    gap: 6,
  } as const,
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.success,
  },
  statusText: {
    ...Theme.typography.labelSm,
    color: Theme.colors.success,
  } as const,
  configButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  configButtonText: {
    ...Theme.typography.labelMd,
    color: Theme.colors.primary,
  },
  visitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  visitButtonText: {
    ...Theme.typography.labelMd,
    color: Theme.colors.primary,
    fontWeight: '600',
  },
});

