import React from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, TextInput, Image, FlatList, ActivityIndicator, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '@/constants/Theme';
import { useAppData } from '@/context/AppDataContext';
import TopAppBar from '@/components/TopAppBar';

import { useFocusEffect } from '@react-navigation/native';

export default function MyProductsScreen() {
  const router = useRouter();
  const { api, user, countries, preferredCountry } = useAppData();
  const [products, setProducts] = React.useState<any[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCountry, setSelectedCountry] = React.useState<any>(null);
  const [showCountryModal, setShowCountryModal] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const fetchMyProducts = React.useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Traemos todos los productos del dueño, el filtrado de país lo hacemos en memoria por ahora
      // para mayor velocidad de respuesta al cambiar de país, similar a la web.
      const url = `/products?limit=100&sort=-createdAt&depth=1&where[owner][equals]=${user.id}`;
      const res = await api.get(url);
      setProducts(res.data.docs || []);
    } catch (err) {
      console.error('Error fetching my products:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, api]);

  useFocusEffect(
    React.useCallback(() => {
      fetchMyProducts();
    }, [fetchMyProducts])
  );

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchMyProducts();
  };

  const filteredProducts = React.useMemo(() => {
    let result = products;

    // Filtro por país
    if (selectedCountry) {
      result = result.filter(p => {
        const productCountryId = typeof p.country === 'object' ? p.country.id : p.country;
        return productCountryId === selectedCountry.id;
      });
    }

    // Filtro por búsqueda
    if (searchQuery) {
      const s = searchQuery.toLowerCase();
      result = result.filter(p =>
        (p.name || '').toLowerCase().includes(s) ||
        (typeof p.category === 'object' && (p.category?.title || '').toLowerCase().includes(s))
      );
    }

    return result;
  }, [products, searchQuery, selectedCountry]);

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.titleRow}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="category" size={24} color={Theme.colors.secondary} />
        </View>
        <View>
          <Text style={styles.title}>Mis Productos</Text>
          <Text style={styles.subtitle}>Gestiona tus propias versiones de productos</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.createButton}
        onPress={() => {
          console.log('Crear producto presionado');
        }}
      >
        <MaterialIcons name="add" size={20} color="#fff" />
        <Text style={styles.createButtonText}>Crear Producto</Text>
      </TouchableOpacity>

      <View style={styles.searchBar}>
        <MaterialIcons name="search" size={20} color={Theme.colors.onSurfaceVariant} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar en mis productos..."
          placeholderTextColor={Theme.colors.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.filtersScroll} 
        contentContainerStyle={styles.filtersContent}
      >
        <FilterPill 
          icon="public" 
          label={selectedCountry?.name || 'Todos los Países'} 
          onPress={() => setShowCountryModal(true)}
          active={!!selectedCountry}
        />
        <FilterPill icon="swap-vert" label="Más recientes" />
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.container}>
      <TopAppBar />
      
      {isLoading && products.length === 0 ? (
        <View style={styles.centerLoader}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
          <Text style={styles.loadingText}>Cargando tus productos...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={renderHeader}
          renderItem={({ item }) => <ProductItem product={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="inventory" size={48} color={Theme.colors.outline} />
                <Text style={styles.emptyStateText}>
                  {searchQuery || selectedCountry ? 'No se encontraron productos con estos filtros' : 'Aún no tienes productos propios'}
                </Text>
                {(searchQuery || selectedCountry) && (
                  <TouchableOpacity 
                    onPress={() => {
                      setSearchQuery('');
                      setSelectedCountry(null);
                    }}
                  >
                    <Text style={{ color: Theme.colors.primary, marginTop: 8, fontWeight: 'bold' }}>Limpiar filtros</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null
          }
        />
      )}

      {/* Country Selection Modal */}
      <Modal
        visible={showCountryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCountryModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowCountryModal(false)}
        >
          <View style={styles.bottomSheet}>
            <View style={styles.bottomSheetHeader}>
              <View style={styles.bottomSheetHandle} />
              <Text style={styles.bottomSheetTitle}>Filtrar por País</Text>
            </View>
            <View style={styles.bottomSheetContent}>
              <TouchableOpacity 
                style={[styles.bottomSheetOption, !selectedCountry && styles.bottomSheetOptionActive]}
                onPress={() => {
                  setSelectedCountry(null);
                  setShowCountryModal(false);
                }}
              >
                <Text style={[styles.bottomSheetOptionText, !selectedCountry && styles.bottomSheetOptionTextActive]}>
                  Todos los Países
                </Text>
                {!selectedCountry && <MaterialIcons name="check" size={20} color={Theme.colors.primary} />}
              </TouchableOpacity>
              {countries.map((c: any) => (
                <TouchableOpacity 
                  key={c.id} 
                  style={[styles.bottomSheetOption, selectedCountry?.id === c.id && styles.bottomSheetOptionActive]}
                  onPress={() => {
                    setSelectedCountry(c);
                    setShowCountryModal(false);
                  }}
                >
                  <Text style={[styles.bottomSheetOptionText, selectedCountry?.id === c.id && styles.bottomSheetOptionTextActive]}>
                    {c.name}
                  </Text>
                  {selectedCountry?.id === c.id && <MaterialIcons name="check" size={20} color={Theme.colors.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function FilterPill({ icon, label, onPress, active }: { icon: any, label: string, onPress?: () => void, active?: boolean }) {
  return (
    <TouchableOpacity 
      style={[styles.filterPill, active && styles.filterPillActive]} 
      onPress={onPress} 
      activeOpacity={0.7}
    >
      <View style={styles.filterPillContent}>
        <MaterialIcons 
          name={icon as any} 
          size={16} 
          color={active ? Theme.colors.primary : Theme.colors.onSurfaceVariant} 
        />
        <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>{label}</Text>
      </View>
      <MaterialIcons 
        name="expand-more" 
        size={16} 
        color={active ? Theme.colors.primary : Theme.colors.onSurfaceVariant} 
      />
    </TouchableOpacity>
  );
}

function ProductItem({ product }: { product: any }) {
  const imageId = typeof product.images?.[0] === 'object' ? product.images[0].id : product.images?.[0];
  const imageUrl = imageId ? `https://shop.giborcommunity.com/api/media-url/${imageId}` : null;
  const categoryName = typeof product.category === 'object' ? product.category.title : (product.category || 'Sin categoría');
  const currency = typeof product.country === 'object' ? product.country.currency : 'USD';
  const typeLabel = product.parentProduct ? `Heredado de: ${typeof product.parentProduct === 'object' ? product.parentProduct.name : 'Producto Base'}` : 'Producto propio';

  return (
    <View style={styles.itemCard}>
      <View style={styles.itemMain}>
        <View style={styles.imageWrapper}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.itemImage} />
          ) : (
            <MaterialIcons name="image" size={24} color={Theme.colors.onSurfaceVariant} />
          )}
        </View>
        
        <View style={styles.itemDetails}>
          <View style={styles.nameRow}>
            <Text style={styles.itemName} numberOfLines={2}>{product.name}</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{categoryName}</Text>
            </View>
          </View>
          <Text style={styles.itemId}>ID: {product.id}</Text>
          
          <View style={styles.dataRow}>
            <View style={styles.dataPill}>
              <View style={[styles.dot, { backgroundColor: Theme.colors.secondary }]} />
              <Text style={styles.pillText}>{product.price} {currency}</Text>
            </View>
            <View style={styles.dataPill}>
              <View style={[styles.dot, { backgroundColor: product.stock < 10 ? Theme.colors.error : Theme.colors.tertiary }]} />
              <Text style={styles.pillText}>Stock: {product.stock}</Text>
            </View>
          </View>
          <Text style={styles.typeLabel}>{typeLabel}</Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionButton} onPress={() => console.log('Editar', product.id)}>
          <MaterialIcons name="edit-square" size={20} color={Theme.colors.secondary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => console.log('Eliminar', product.id)}>
          <MaterialIcons name="delete" size={20} color={Theme.colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  headerContainer: {
    paddingVertical: 24,
    gap: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Theme.colors.secondary + '20', // Opacity
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...Theme.typography.headlineLg,
    color: Theme.colors.onSurface,
  },
  subtitle: {
    ...Theme.typography.bodySm,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  createButton: {
    backgroundColor: Theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  createButtonText: {
    ...Theme.typography.labelLg,
    color: '#fff',
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e4e2e1',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    marginTop: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    ...Theme.typography.bodyMd,
    color: Theme.colors.onSurface,
  },
  filtersScroll: {
    marginHorizontal: -16,
    marginTop: 8,
  },
  filtersContent: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 4,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0eded',
    borderWidth: 1,
    borderColor: '#d9c2b3',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 120,
    gap: 8,
  },
  filterPillActive: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primary + '10',
  },
  filterPillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterLabel: {
    ...Theme.typography.bodySm,
    color: Theme.colors.onSurfaceVariant,
  },
  filterLabelActive: {
    color: Theme.colors.primary,
    fontWeight: 'bold',
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e4e2e1',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  itemMain: {
    flexDirection: 'row',
    gap: 16,
  },
  imageWrapper: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f6f3f2',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e4e2e1',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  itemDetails: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemName: {
    ...Theme.typography.labelLg,
    color: Theme.colors.onSurface,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  categoryBadge: {
    backgroundColor: '#e4e2e1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  categoryText: {
    ...Theme.typography.labelSm,
    color: Theme.colors.onSurfaceVariant,
    fontSize: 10,
  },
  itemId: {
    ...Theme.typography.bodySm,
    color: Theme.colors.onSurfaceVariant,
  },
  dataRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  dataPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbf9f8',
    borderWidth: 1,
    borderColor: '#e4e2e1',
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pillText: {
    ...Theme.typography.labelSm,
    color: Theme.colors.onSurface,
    fontSize: 11,
  },
  typeLabel: {
    ...Theme.typography.bodySm,
    color: Theme.colors.onSurfaceVariant,
    fontSize: 10,
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f2f2f2',
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Theme.colors.secondary + '10',
  },
  deleteButton: {
    backgroundColor: Theme.colors.error + '10',
    borderWidth: 1,
    borderColor: Theme.colors.error + '20',
  },
  centerLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    ...Theme.typography.bodyMd,
    color: Theme.colors.onSurfaceVariant,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyStateText: {
    ...Theme.typography.bodyMd,
    color: Theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  bottomSheetHeader: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginBottom: 8,
  },
  bottomSheetTitle: {
    ...Theme.typography.headlineSm,
    color: Theme.colors.onSurface,
  },
  bottomSheetContent: {
    paddingHorizontal: 16,
  },
  bottomSheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  bottomSheetOptionActive: {
    backgroundColor: '#f6f3f2',
    borderRadius: 8,
  },
  bottomSheetOptionText: {
    ...Theme.typography.bodyLg,
    color: Theme.colors.onSurface,
  },
  bottomSheetOptionTextActive: {
    color: Theme.colors.primary,
    fontWeight: '700',
  },
});
