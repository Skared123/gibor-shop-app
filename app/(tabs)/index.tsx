import React from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '@/constants/Theme';

export default function DashboardScreen() {
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

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.headline}>Resumen de Ventas</Text>
          <View style={styles.filterRow}>
            <TouchableOpacity style={styles.filterPill}>
              <MaterialIcons name="calendar-today" size={16} color={Theme.colors.onSurfaceVariant} />
              <Text style={styles.filterText}>Últimos 7 días</Text>
              <MaterialIcons name="expand-more" size={16} color={Theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterPill}>
              <MaterialIcons name="storefront" size={16} color={Theme.colors.primary} />
              <Text style={styles.filterText}>Tienda: test</Text>
              <MaterialIcons name="expand-more" size={16} color={Theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Metrics Section */}
        <View style={styles.metricsContainer}>
          <Text style={styles.sectionLabel}>Métricas Generales</Text>
          
          <View style={styles.kpiGrid}>
            <View style={[styles.kpiCard, { backgroundColor: '#d7e3ff4d', borderColor: '#d7e3ff' }]}>
              <View style={styles.kpiHeader}>
                <MaterialIcons name="shopping-bag" size={14} color={Theme.colors.onSurfaceVariant} />
                <Text style={styles.kpiLabel}>PEDIDOS</Text>
              </View>
              <Text style={[styles.kpiValue, { color: '#001b3f' }]}>142</Text>
            </View>

            <View style={[styles.kpiCard, { backgroundColor: '#7efba44d', borderColor: '#7efba4' }]}>
              <View style={styles.kpiHeader}>
                <MaterialIcons name="payments" size={14} color={Theme.colors.onSurfaceVariant} />
                <Text style={styles.kpiLabel}>VENDIDO</Text>
              </View>
              <Text style={[styles.kpiValue, { color: '#00210c' }]}>$12,450.00</Text>
            </View>

            <View style={[styles.kpiCard, { backgroundColor: '#ffdcc34d', borderColor: '#ffdcc3' }]}>
              <View style={styles.kpiHeader}>
                <MaterialIcons name="receipt-long" size={14} color={Theme.colors.onSurfaceVariant} />
                <Text style={styles.kpiLabel}>TICKET</Text>
              </View>
              <Text style={[styles.kpiValue, { color: '#2f1500' }]}>$87.67</Text>
            </View>
          </View>

          {/* Fake Chart */}
          <View style={styles.chartContainer}>
            <View style={styles.chartBars}>
              <View style={[styles.bar, { height: '25%' }]} />
              <View style={[styles.bar, { height: '50%' }]} />
              <View style={[styles.bar, { height: '33%' }]} />
              <View style={[styles.bar, { height: '75%' }]} />
              <View style={[styles.bar, { height: '66%' }]} />
              <View style={[styles.bar, { height: '100%' }]} />
            </View>
            <View style={styles.chartBadge}>
              <MaterialIcons name="touch-app" size={16} color={Theme.colors.onSurfaceVariant} />
              <Text style={styles.chartBadgeText}>Gráfico interactivo aquí</Text>
            </View>
          </View>
        </View>

        {/* Top Products */}
        <View style={styles.listSection}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Top 5 Productos</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>VER TODOS</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.listContainer}>
            <ProductItem 
              name="Smartwatch Pro X" 
              sold="24 vendidos" 
              price="$4,776.00" 
              image="https://lh3.googleusercontent.com/aida-public/AB6AXuATwRnY_jSSz2BH-r-WlwRi1Q7k8BW0ohRrXuMv8pwEC2uvjxAgXJlJJxyBHB4GZHTArsRHEyKMxy_Dk7L9oKYkqUdSPpHf1F3JpRTObK9KgaiLkKMeENUCqf4j8_KhhYu0494O4f2rarpniTSAnTZw3MBEo1QKtv_jF_j-gR614U7iBGJR2DK8Z_uiXCk-G0cIi6-Au5e2WYoO3tmiBHlH3W6RXS0Ola-NjSdippgZ98R6RNtNk2LcSPHiZIPrPqbBe0ns6Un7nkg"
            />
            <ProductItem 
              name="Auriculares Inalámbricos" 
              sold="18 vendidos" 
              price="$2,682.00" 
              image="https://lh3.googleusercontent.com/aida-public/AB6AXuDlkbsT0PUyPKI38msI5EFSE3onOPsXYJvVNwY7mLOqyZSoO-wi6QozxqTFO2JwN9ZaO_PNID6MCljsyrZr0ys3YUgaBBU6E5RV6MEM4nidA_iZ5B0HBBb2_U4C2B3O2QDF5zU7dbxY4MXBcp7jpRXJmmpkD78GF_IUA2AHgbXeD5uZgZvYiLVWqBMbaLk7KpMvwJe8ENGkfoaG3VxZqYs3oG5qo0clE-d1CoJEzTjaWMH86To2HeLNSlBxykR9g8cbAvvFpJ0yV_A"
            />
            <ProductItem 
              name="Funda Silicona Ultra" 
              sold="15 vendidos" 
              price="$450.00" 
              icon="smartphone"
            />
          </View>
        </View>

        {/* Top Clients */}
        <View style={styles.listSection}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Top 5 Clientes</Text>
          </View>
          <View style={styles.listContainer}>
            <ClientItem initials="MJ" name="María Jiménez" orders="3 pedidos" spent="$1,250.00" color="#d7e3ff" />
            <ClientItem initials="CR" name="Carlos Ruiz" orders="2 pedidos" spent="$890.00" color="#7efba4" />
            <ClientItem initials="AL" name="Ana López" orders="1 pedido" spent="$540.00" color="#ffdcc3" />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function ProductItem({ name, sold, price, image, icon }: any) {
  return (
    <View style={styles.itemRow}>
      <View style={styles.itemInfo}>
        <View style={styles.productImageContainer}>
          {image ? (
            <Image source={{ uri: image }} style={styles.productImage} />
          ) : (
            <MaterialIcons name={icon} size={20} color={Theme.colors.outline} />
          )}
        </View>
        <View>
          <Text style={styles.itemName}>{name}</Text>
          <Text style={styles.itemSubtitle}>{sold}</Text>
        </View>
      </View>
      <Text style={styles.itemPrice}>{price}</Text>
    </View>
  );
}

function ClientItem({ initials, name, orders, spent, color }: any) {
  return (
    <View style={styles.itemRow}>
      <View style={styles.itemInfo}>
        <View style={[styles.avatar, { backgroundColor: color }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View>
          <Text style={styles.itemName}>{name}</Text>
          <Text style={styles.itemSubtitle}>{orders}</Text>
        </View>
      </View>
      <Text style={styles.itemValue}>{spent}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
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
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Theme.colors.primary,
    letterSpacing: -0.5,
  },
  scrollContent: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  headline: {
    ...Theme.typography.headlineLg,
    color: Theme.colors.onSurface,
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e2e1',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filterText: {
    ...Theme.typography.labelMd,
    color: Theme.colors.onSurface,
  },
  metricsContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e4e2e1',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionLabel: {
    ...Theme.typography.labelLg,
    color: Theme.colors.onSurface,
    marginBottom: 16,
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  kpiCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    justifyContent: 'center',
  },
  kpiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  kpiLabel: {
    ...Theme.typography.labelSm,
    color: Theme.colors.onSurfaceVariant,
    letterSpacing: 1,
  },
  kpiValue: {
    ...Theme.typography.headlineSm,
    fontWeight: '700',
  },
  chartContainer: {
    height: 192,
    backgroundColor: '#f6f3f2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e4e2e1',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  chartBars: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '100%',
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    opacity: 0.4,
  },
  bar: {
    width: '12%',
    backgroundColor: Theme.colors.primary,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  chartBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
    ...Theme.elevation.level1,
  },
  chartBadgeText: {
    ...Theme.typography.bodySm,
    color: Theme.colors.onSurfaceVariant,
  },
  listSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e4e2e1',
    marginBottom: 24,
    overflow: 'hidden',
  },
  listHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e2e1',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listTitle: {
    ...Theme.typography.labelLg,
    color: Theme.colors.onSurface,
  },
  seeAllText: {
    ...Theme.typography.labelSm,
    color: Theme.colors.primary,
  },
  listContainer: {
    padding: 0,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e2e1',
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  productImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f6f3f2',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  itemName: {
    ...Theme.typography.labelMd,
    color: Theme.colors.onSurface,
  },
  itemSubtitle: {
    ...Theme.typography.bodySm,
    color: Theme.colors.onSurfaceVariant,
  },
  itemPrice: {
    ...Theme.typography.labelMd,
    color: Theme.colors.primary,
  },
  itemValue: {
    ...Theme.typography.labelMd,
    color: Theme.colors.onSurface,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...Theme.typography.labelMd,
    color: '#000',
  },
});
