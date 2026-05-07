import React from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, TextInput, Image, FlatList, ActivityIndicator, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '@/constants/Theme';
import { useAppData } from '@/context/AppDataContext';
import { SvgUri } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';
import dayjs from 'dayjs';

const PRODUCTS = [
  {
    id: '1',
    name: 'SMARTWATCH PRO X SERIES',
    category: 'Electrónica',
    stock: 45,
    priceProvider: '$129.99',
    priceSuggested: '-',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAx1tjqqOfTRo3PfMuRGF5NKknjMDRmMowoJ7DslJW3JoMs3AkBB2Yxy75Q60kuqiL32kNx6YNBUS8Yamw5ZXla68LtDfQNKqrd02c-zZaY3M0Xr74lfPwbB3qlpwDf-OFJlurxSUb6vkUMOvIrOfOpG66Azz_4zJf3Fdjr36_6hwv5Q2ljHilP8_8e-5xYluE_jFRPcjalK7ev0K0QcIaGiizgvD3GvaZBZRN1ldXpJgC20B3JO7cqyUMpxQUMUAcSkp2u2iqVJHo',
    status: 'available',
  },
  {
    id: '2',
    name: 'AURICULARES INALÁMBRICOS STUDIO',
    category: 'Electrónica',
    stock: 12,
    priceProvider: '$89.50',
    priceSuggested: '-',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDTxy4gggye238WX_rUE0BscVrLC6pNN_ConmEptwgdMmW_jqYZU327djf8Ql-IEiT99RC8egGcLApHWN-Gj1La7Tdn8ALAyh_27K8MqV0Vl_6aZ9tfsT1odzF4OQA10qRoF26X6ctKCT386feixKmkjTmH8N-DLMyGPscbGRCIem97M-B1lS2zGp58Lvq1VyXAY7B-u0Do7ZqJysPzR6jZSS1gR65tZXtreS9LnmaATZw4KxaRVJio0ZmQeFA5N11atWQ5glLVxqo',
    status: 'available',
  },
  {
    id: '3',
    name: 'ZAPATILLAS RUNNING MAX',
    category: 'Ropa',
    stock: 0,
    priceProvider: '$110.00',
    priceSuggested: '-',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAcvpqzFqt3uw-6YG4QsIhXLl4HaCVgtD9O2jgoVluKdCEqjl2MqN016mGuo_cGZ-p93oZEiUIse9SSFLfpurf2H_VchTfGhCF_xvVdAq6R0-cVr0oQLpL_wClmmiPaTLAZSiKhcZw-PJJw7t7jHPtTD6nTziMiAudVwU2KwRSTKCnAr1t41xLXzfikn82EHl-CYN81h5OF_y72Bda6ojvllCAOTJuS_jLmSozLzAf1Tz-yqJMaKoNuS90IlFiJhAcwtqjNt6ujsrY',
    status: 'out_of_stock',
  },
];

export default function ProductsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { preferredCountry, setPreferredCountry, api, isLoading: isContextLoading, favorites, toggleFavorite, setSelectedProduct, setCatalogProducts } = useAppData();

  const [products, setProductsState] = React.useState<any[]>([]);
  const setProducts = (newProducts: any[]) => {
    setProductsState(newProducts);
    setCatalogProducts(newProducts);
  };
  const [countries, setCountries] = React.useState<any[]>([]);
  const [categories, setCategories] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isInitialLoading, setIsInitialLoading] = React.useState(true);
  const [showWelcomeModal, setShowWelcomeModal] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCountry, setSelectedCountry] = React.useState<any>(null);
  const [limit, setLimit] = React.useState(24);
  const [showLimitModal, setShowLimitModal] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [hasNextPage, setHasNextPage] = React.useState(false);
  const [isFetchingNextPage, setIsFetchingNextPage] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const fetchFilters = async () => {
    try {
      const res = await api.get('/products/catalog-filters');
      setCountries(res.data.filters.countries);
      setCategories(res.data.filters.categories);
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  };

  const fetchProducts = async (pageToFetch: number = 1, countryIdOverride?: number) => {
    const countryId = countryIdOverride || selectedCountry?.id || preferredCountry?.id;
    if (!countryId) return;
    
    if (pageToFetch === 1) {
      setIsLoading(true);
    } else {
      setIsFetchingNextPage(true);
    }

    try {
      const res = await api.get(`/products/catalog-filters?country=${countryId}&search=${searchQuery}&limit=${limit}&page=${pageToFetch}`);
      const productsData = res.data.products;
      
      if (!productsData) {
        console.warn('No products data received');
        return;
      }

      const newDocs = productsData.docs || [];
      
      if (pageToFetch === 1) {
        setProducts(newDocs);
      } else {
        setProductsState(prev => {
          const updated = [...prev, ...newDocs];
          // Sincronizar con el contexto global
          setCatalogProducts(updated);
          return updated;
        });
      }
      
      setHasNextPage(!!productsData.hasNextPage);
      setPage(productsData.page || pageToFetch);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setIsLoading(false);
      setIsInitialLoading(false);
      setIsFetchingNextPage(false);
      setIsRefreshing(false);
    }
  };

  const handleLoadMore = () => {
    if (!isLoading && !isFetchingNextPage && hasNextPage) {
      fetchProducts(page + 1);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchProducts(1);
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchFilters();
      setShowWelcomeModal(true);
    }, [])
  );

  React.useEffect(() => {
    if (selectedCountry || preferredCountry) {
      fetchProducts(1);
    }
  }, [selectedCountry, searchQuery, limit]);

  const handleSelectInitialCountry = (country: any) => {
    setPreferredCountry(country);
    setSelectedCountry(country);
    setShowWelcomeModal(false);
    fetchProducts(country.id);
  };

  const renderHeader = () => (
    <View style={styles.headerSection}>
      <Text style={styles.headline}>Catálogo de productos</Text>
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color={Theme.colors.placeholder} style={styles.searchIcon} />
        <TextInput 
          style={styles.searchInput} 
          placeholder="Buscar productos..." 
          placeholderTextColor={Theme.colors.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll} contentContainerStyle={styles.filtersContent}>
        <FilterPill 
          icon={selectedCountry?.iso2 ? (
            <SvgUri
              uri={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${selectedCountry.iso2.toUpperCase()}.svg`}
              width={20}
              height={14}
            />
          ) : "public"} 
          label={selectedCountry?.name || 'País'} 
          onPress={() => setShowWelcomeModal(true)}
        />
        <FilterPill 
          icon="filter-list" 
          label={`${limit} / pág`} 
          onPress={() => setShowLimitModal(true)}
        />
        <FilterPill icon="swap-vert" label="Título (A-Z)" />
      </ScrollView>
    </View>
  );

  const renderFooter = () => {
    if (!isFetchingNextPage) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={Theme.colors.primary} />
      </View>
    );
  };

  return (
    <View style={styles.flex}>
      {/* TopAppBar */}
      <View style={[styles.topAppBar, { paddingTop: insets.top, height: 64 + insets.top }]}>
        <TouchableOpacity style={styles.iconButton}>
          <MaterialIcons name="menu" size={24} color={Theme.colors.primary} />
        </TouchableOpacity>
        <Text style={styles.appTitle}>GIBOR SHOP</Text>
        <TouchableOpacity style={styles.iconButton}>
          <MaterialIcons name="notifications" size={24} color={Theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={products}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item: product }) => (
          <ProductCard 
            key={product.id} 
            product={{
              ...product,
              priceProvider: `$${(product.price || 0).toLocaleString()}`,
              priceSuggested: product.suggested_price ? `$${product.suggested_price.toLocaleString()}` : '-',
              image: product.images?.[0] 
                ? `https://shop.giborcommunity.com/api/media-url/${typeof product.images[0] === 'object' ? product.images[0].id : product.images[0]}` 
                : null,
            }} 
            isFavorite={favorites.includes(product.id.toString())}
            onToggleFavorite={() => toggleFavorite(product.id.toString())}
            onAction={() => {
              setSelectedProduct(product);
              router.push('/order-creation');
            }} 
          />
        )}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={!isLoading ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="search-off" size={48} color={Theme.colors.outline} />
            <Text style={styles.emptyStateText}>No se encontraron productos para este país</Text>
          </View>
        ) : null}
        contentContainerStyle={styles.scrollContent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        refreshing={isRefreshing}
        onRefresh={onRefresh}
        showsVerticalScrollIndicator={false}
      />

      {isLoading && page === 1 && (
        <View style={styles.initialLoaderOverlay}>
          <ActivityIndicator size="large" color={Theme.colors.primary} />
        </View>
      )}

      {/* Welcome & Country Selection Modal */}
      <Modal
        visible={showWelcomeModal}
        animationType="fade"
        transparent={true}
      >
        <View style={styles.modalOverlayCentered}>
          <View style={styles.welcomeContainer}>
            <View style={styles.welcomeHeader}>
              <MaterialIcons name="explore" size={48} color={Theme.colors.primary} />
              <Text style={styles.welcomeTitle}>¡Bienvenido al Catálogo!</Text>
              <Text style={styles.welcomeSubtitle}>Para comenzar, por favor selecciona tu país de preferencia para filtrar los productos.</Text>
            </View>
            
            <View style={styles.countryList}>
              <FlatList
                data={countries}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.countryOption}
                    onPress={() => handleSelectInitialCountry(item)}
                  >
                    <SvgUri
                      uri={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${item.iso2.toUpperCase()}.svg`}
                      width={28}
                      height={20}
                    />
                    <Text style={styles.countryOptionText}>{item.name}</Text>
                    <MaterialIcons name="chevron-right" size={20} color={Theme.colors.outline} />
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<ActivityIndicator size="small" color={Theme.colors.primary} />}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Pagination Limit Modal */}
      <Modal
        visible={showLimitModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLimitModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowLimitModal(false)}
        >
          <View style={styles.bottomSheet}>
            <View style={styles.bottomSheetHeader}>
              <View style={styles.bottomSheetHandle} />
              <Text style={styles.bottomSheetTitle}>Productos por página</Text>
            </View>
            <View style={styles.bottomSheetContent}>
              {[8, 12, 24, 48].map((val) => (
                <TouchableOpacity 
                  key={val} 
                  style={[styles.bottomSheetOption, limit === val && styles.bottomSheetOptionActive]}
                  onPress={() => {
                    setLimit(val);
                    setShowLimitModal(false);
                  }}
                >
                  <Text style={[styles.bottomSheetOptionText, limit === val && styles.bottomSheetOptionTextActive]}>
                    {val} productos por página
                  </Text>
                  {limit === val && <MaterialIcons name="check" size={20} color={Theme.colors.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function FilterPill({ icon, label, onPress }: { icon: any, label: string, onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.filterPill} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.filterPillContent}>
        {typeof icon === 'string' ? (
          <MaterialIcons name={icon as any} size={16} color={Theme.colors.onSurfaceVariant} />
        ) : (
          icon
        )}
        <Text style={styles.filterLabel}>{label}</Text>
      </View>
      <MaterialIcons name="expand-more" size={16} color={Theme.colors.onSurfaceVariant} />
    </TouchableOpacity>
  );
}

function ProductCard({ product, isFavorite, onToggleFavorite, onAction }: { product: any, isFavorite: boolean, onToggleFavorite: () => void, onAction: () => void }) {
  const isOutOfStock = product.status === 'out_of_stock';

  return (
    <View style={[styles.card, isOutOfStock && styles.cardOutOfStock]}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: product.image }} style={[styles.productImage, isOutOfStock && styles.imageGrayscale]} />
        <TouchableOpacity 
          style={styles.favoriteButton} 
          onPress={onToggleFavorite}
          activeOpacity={0.7}
        >
          <MaterialIcons 
            name={isFavorite ? "favorite" : "favorite-border"} 
            size={20} 
            color={isFavorite ? "#e91e63" : Theme.colors.onSurface} 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.categoryText}>{product.category?.title || 'Sin categoría'}</Text>
          <Text style={[styles.stockText, isOutOfStock ? styles.stockError : styles.stockSuccess]}>
            Stock: {product.stock}
          </Text>
        </View>
        
        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>

        <View style={styles.priceRow}>
          <View>
            <Text style={styles.priceLabel}>P. proveedor:</Text>
            <Text style={styles.priceProvider}>{product.priceProvider}</Text>
          </View>
          <View style={styles.alignEnd}>
            <Text style={styles.priceLabel}>P. sugerido</Text>
            <Text style={styles.priceSuggested}>{product.priceSuggested}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.actionButton, isOutOfStock && styles.buttonDisabled]} 
          disabled={isOutOfStock}
          activeOpacity={0.8}
          onPress={onAction}
        >
          <MaterialIcons name="shopping-cart" size={18} color={isOutOfStock ? Theme.colors.outline : '#fff'} />
          <Text style={[styles.actionButtonText, isOutOfStock && styles.buttonDisabledText]}>
            {isOutOfStock ? 'No disponible' : 'Enviar a cliente'}
          </Text>
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
    paddingTop: 16,
    paddingBottom: 40,
  } as const,
  headerSection: {
    marginBottom: 24,
    gap: 16,
  } as const,
  headline: {
    ...Theme.typography.headlineLg,
    color: Theme.colors.onSurface,
  } as const,
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e2e1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  } as const,
  searchIcon: {
    marginRight: 8,
  } as const,
  searchInput: {
    flex: 1,
    ...Theme.typography.bodyMd,
    color: Theme.colors.onSurface,
  } as const,
  filtersScroll: {
    marginHorizontal: -16,
  } as const,
  filtersContent: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 4,
  } as const,
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
  } as const,
  filterPillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  } as const,
  filterLabel: {
    ...Theme.typography.bodySm,
    color: Theme.colors.onSurfaceVariant,
  } as const,
  productGrid: {
    gap: 16,
  } as const,
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e4e2e1',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  } as const,
  cardOutOfStock: {
    opacity: 0.75,
  } as const,
  imageContainer: {
    height: 192,
    backgroundColor: '#f0eded',
    width: '100%',
    position: 'relative',
  } as const,
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  } as const,
  imageGrayscale: {
    opacity: 0.8,
  } as const,
  favoriteButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#ffffff',
    padding: 6,
    borderRadius: 20,
    ...Theme.elevation.level1,
  } as const,
  cardContent: {
    padding: 16,
    gap: 8,
  } as const,
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as const,
  categoryText: {
    ...Theme.typography.bodySm,
    color: Theme.colors.onSurfaceVariant,
  } as const,
  stockText: {
    ...Theme.typography.labelSm,
    fontWeight: '700',
  } as const,
  stockSuccess: {
    color: Theme.colors.tertiary,
  } as const,
  stockError: {
    color: Theme.colors.error,
  } as const,
  productName: {
    ...Theme.typography.headlineSm,
    color: Theme.colors.onSurface,
    fontWeight: '700',
    textTransform: 'uppercase',
  } as const,
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  } as const,
  priceLabel: {
    ...Theme.typography.labelSm,
    color: Theme.colors.onSurfaceVariant,
  } as const,
  priceProvider: {
    ...Theme.typography.headlineMd,
    color: Theme.colors.onSurfaceVariant,
  } as const,
  priceSuggested: {
    ...Theme.typography.headlineMd,
    color: Theme.colors.onSurface,
  } as const,
  alignEnd: {
    alignItems: 'flex-end',
  } as const,
  actionButton: {
    backgroundColor: Theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    marginTop: 8,
  } as const,
  actionButtonText: {
    ...Theme.typography.labelLg,
    color: '#ffffff',
  } as const,
  buttonDisabled: {
    backgroundColor: '#f0eded',
  } as const,
  buttonDisabledText: {
    color: Theme.colors.outline,
  },
  modalOverlayCentered: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  welcomeContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    width: '100%',
    maxHeight: '80%',
    padding: 24,
    ...Theme.elevation.level2,
  },
  welcomeHeader: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 8,
  },
  welcomeTitle: {
    ...Theme.typography.headlineMd,
    color: Theme.colors.onSurface,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    ...Theme.typography.bodyMd,
    color: Theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  countryList: {
    borderTopWidth: 1,
    borderTopColor: '#f2f2f2',
    paddingTop: 8,
  },
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
    gap: 12,
  },
  countryOptionText: {
    flex: 1,
    ...Theme.typography.bodyLg,
    color: Theme.colors.onSurface,
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
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  initialLoaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
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
