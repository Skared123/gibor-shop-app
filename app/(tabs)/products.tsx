import React from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, TextInput, Image, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '@/constants/Theme';

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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header & Search */}
        <View style={styles.headerSection}>
          <Text style={styles.headline}>Catálogo de productos</Text>
          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={20} color={Theme.colors.placeholder} style={styles.searchIcon} />
            <TextInput 
              style={styles.searchInput} 
              placeholder="Buscar productos..." 
              placeholderTextColor={Theme.colors.placeholder}
            />
          </View>

          {/* Horizontal Filters */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll} contentContainerStyle={styles.filtersContent}>
            <FilterPill icon="grid-view" label="Mexico" />
            <FilterPill icon="swap-vert" label="Título (A-Z)" />
            <FilterPill icon="filter-list" label="24 / pág" />
          </ScrollView>
        </View>

        {/* Product List */}
        <View style={styles.productGrid}>
          {PRODUCTS.map((product) => (
            <ProductCard key={product.id} product={product} onAction={() => router.push('/order-creation')} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function FilterPill({ icon, label }: { icon: any, label: string }) {
  return (
    <TouchableOpacity style={styles.filterPill}>
      <View style={styles.filterPillContent}>
        <MaterialIcons name={icon} size={16} color={Theme.colors.onSurfaceVariant} />
        <Text style={styles.filterLabel}>{label}</Text>
      </View>
      <MaterialIcons name="expand-more" size={16} color={Theme.colors.onSurfaceVariant} />
    </TouchableOpacity>
  );
}

function ProductCard({ product, onAction }: { product: any, onAction: () => void }) {
  const isOutOfStock = product.status === 'out_of_stock';

  return (
    <View style={[styles.card, isOutOfStock && styles.cardOutOfStock]}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: product.image }} style={[styles.productImage, isOutOfStock && styles.imageGrayscale]} />
        <TouchableOpacity style={styles.favoriteButton}>
          <MaterialIcons name="favorite-border" size={20} color={Theme.colors.onSurface} />
        </TouchableOpacity>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.categoryText}>{product.category}</Text>
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
  } as const,
});
