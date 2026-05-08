import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, TextInput, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '@/constants/Theme';
import { useAppData } from '@/context/AppDataContext';
import TopAppBar from '@/components/TopAppBar';

const COUPONS = [
  {
    id: '1',
    code: 'GIBOR10',
    discount: '10%',
    label: 'OFF',
    description: 'Válido en toda la tienda',
    expiry: '30 Dic 2023',
    status: 'Activo',
    icon: 'local_offer',
  },
  {
    id: '2',
    code: 'WELCOME50',
    discount: '$50',
    label: 'OFF',
    description: 'Primera compra',
    expiry: '15 Ene 2024',
    status: 'Activo',
    icon: 'local_offer',
  },
  {
    id: '3',
    code: 'FREESHIP',
    discount: '', // Se maneja con icono en el mockup
    label: 'ENVÍO',
    description: 'Compras mayores a $200',
    expiry: '01 Feb 2024',
    status: 'Activo',
    icon: 'local_shipping',
  },
];

export default function CouponsScreen() {
  const insets = useSafeAreaInsets();
  const { openDrawer } = useAppData();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <View style={styles.flex}>
      <TopAppBar />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Page Header */}
        <View style={styles.headerSection}>
          <Text style={styles.headline}>Mis Cupones</Text>
          <View style={styles.searchContainer}>
            <MaterialIcons name="search" size={20} color={Theme.colors.outline} style={styles.searchIcon} />
            <TextInput 
              style={styles.searchInput} 
              placeholder="Buscar por código..." 
              placeholderTextColor={Theme.colors.outline}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Coupons List */}
        <View style={styles.couponList}>
          {COUPONS.map((coupon) => (
            <CouponCard key={coupon.id} coupon={coupon} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function CouponCard({ coupon }: { coupon: any }) {
  return (
    <View style={styles.couponCard}>
      <View style={styles.accentBar} />
      
      {/* Discount Area */}
      <View style={styles.discountArea}>
        {coupon.icon === 'local_shipping' ? (
          <>
            <MaterialIcons name="local-shipping" size={32} color={Theme.colors.onPrimaryContainer} style={{ marginBottom: 2 }} />
            <Text style={styles.discountLabel}>{coupon.label}</Text>
          </>
        ) : (
          <>
            <Text style={styles.discountValue}>{coupon.discount}</Text>
            <Text style={styles.discountLabel}>{coupon.label}</Text>
          </>
        )}
      </View>

      {/* Details Area */}
      <View style={styles.detailsArea}>
        <View>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.couponCode}>{coupon.code}</Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>{coupon.status}</Text>
            </View>
          </View>
          <Text style={styles.description} numberOfLines={1}>{coupon.description}</Text>
        </View>
        
        <View style={styles.expiryRow}>
          <MaterialIcons name="schedule" size={14} color={Theme.colors.outline} />
          <Text style={styles.expiryText}>Vence: {coupon.expiry}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Theme.colors.background,
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
    textTransform: 'uppercase',
  } as const,
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 100,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  } as const,
  searchIcon: {
    marginRight: 8,
  } as const,
  searchInput: {
    flex: 1,
    ...Theme.typography.bodyMd,
    color: Theme.colors.onSurface,
  } as const,
  couponList: {
    gap: 12,
  } as const,
  couponCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 8,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e4e2e1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
    minHeight: 100,
  } as const,
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: Theme.colors.primary,
  } as const,
  discountArea: {
    width: 88,
    backgroundColor: Theme.colors.primaryFixed,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(144, 77, 0, 0.1)',
    borderStyle: 'dashed',
    marginRight: 12,
  } as const,
  discountValue: {
    ...Theme.typography.headlineLg,
    color: Theme.colors.onPrimaryContainer,
    lineHeight: 28,
  } as const,
  discountLabel: {
    ...Theme.typography.labelSm,
    color: Theme.colors.onPrimaryContainer,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  } as const,
  detailsArea: {
    flex: 1,
    paddingVertical: 4,
    justifyContent: 'space-between',
  } as const,
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  } as const,
  couponCode: {
    ...Theme.typography.headlineSm,
    color: Theme.colors.onSurface,
    fontWeight: '700',
  } as const,
  statusBadge: {
    backgroundColor: Theme.colors.tertiaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  } as const,
  statusText: {
    ...Theme.typography.labelSm,
    color: Theme.colors.onTertiaryContainer,
    textTransform: 'uppercase',
  } as const,
  description: {
    ...Theme.typography.bodySm,
    color: Theme.colors.onSurfaceVariant,
  } as const,
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  } as const,
  expiryText: {
    ...Theme.typography.labelMd,
    color: Theme.colors.outline,
  } as const,
});
