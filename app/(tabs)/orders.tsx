import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '@/constants/Theme';

const ORDERS = [
  {
    id: 'ORD-2023-089',
    customer: 'Maria Gonzalez',
    status: 'Pendiente',
    date: '12 Oct 2023, 14:30',
    total: '$1,250.00',
  },
  {
    id: 'ORD-2023-090',
    customer: 'Carlos Mendoza',
    status: 'Pendiente',
    date: '12 Oct 2023, 15:45',
    total: '$850.50',
  },
  {
    id: 'ORD-2023-091',
    customer: 'Ana Silva',
    status: 'Pendiente',
    date: '13 Oct 2023, 09:15',
    total: '$3,400.00',
  },
];

const FILTERS = ['Pendiente', 'Pagado', 'Recibido', 'Cancelado', 'Todos'];

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState('Pendiente');

  return (
    <View style={styles.flex}>
      {/* Mobile Focused Header */}
      <View style={[styles.header, { paddingTop: insets.top, height: 72 + insets.top }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={Theme.colors.onSurface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pedidos Pendientes</Text>
        </View>
        <TouchableOpacity style={styles.iconButton}>
          <MaterialIcons name="search" size={24} color={Theme.colors.onSurface} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Filter Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.filtersScroll} 
          contentContainerStyle={styles.filtersContent}
        >
          {FILTERS.map((filter) => (
            <TouchableOpacity 
              key={filter} 
              onPress={() => setActiveFilter(filter)}
              style={[
                styles.filterTab, 
                activeFilter === filter && styles.filterTabActive
              ]}
            >
              <Text style={[
                styles.filterTabText, 
                activeFilter === filter && styles.filterTabTextActive
              ]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Orders List */}
        <View style={styles.orderGrid}>
          {ORDERS.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function OrderCard({ order }: { order: any }) {
  return (
    <View style={styles.card}>
      <View style={styles.accentBar} />
      <View style={styles.cardHeader}>
        <View>
          <View style={styles.orderIdRow}>
            <Text style={styles.orderIdLabel}>Order ID</Text>
            <Text style={styles.orderIdValue}>#{order.id}</Text>
          </View>
          <Text style={styles.customerName}>{order.customer}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{order.status}</Text>
        </View>
      </View>

      <View style={styles.dateRow}>
        <MaterialIcons name="calendar-today" size={16} color={Theme.colors.onSurfaceVariant} />
        <Text style={styles.dateText}>{order.date}</Text>
      </View>

      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalValue}>{order.total}</Text>
        </View>
        <TouchableOpacity style={styles.actionButton}>
          <MaterialIcons name="upload-file" size={18} color={Theme.colors.onPrimaryContainer} />
          <Text style={styles.actionButtonText}>Subir Comprobante</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
    zIndex: 100,
  } as const,
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  } as const,
  headerTitle: {
    ...Theme.typography.headlineMd,
    color: Theme.colors.onSurface,
    fontWeight: '600',
  } as const,
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0eded',
    justifyContent: 'center',
    alignItems: 'center',
  } as const,
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0eded',
    justifyContent: 'center',
    alignItems: 'center',
  } as const,
  scrollContent: {
    paddingBottom: 40,
  } as const,
  filtersScroll: {
    paddingVertical: 16,
  } as const,
  filtersContent: {
    paddingHorizontal: 16,
    gap: 8,
  } as const,
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9999,
    backgroundColor: '#f0eded',
    borderWidth: 1,
    borderColor: '#d9c2b3',
  } as const,
  filterTabActive: {
    backgroundColor: Theme.colors.primaryContainer,
    borderColor: Theme.colors.primaryContainer,
  } as const,
  filterTabText: {
    ...Theme.typography.labelLg,
    color: Theme.colors.onSurfaceVariant,
  } as const,
  filterTabTextActive: {
    color: Theme.colors.onPrimaryContainer,
  } as const,
  orderGrid: {
    paddingHorizontal: 16,
    gap: 16,
  } as const,
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e4e2e1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
    position: 'relative',
    gap: 12,
  } as const,
  accentBar: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 4,
    backgroundColor: Theme.colors.primaryContainer,
  } as const,
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  } as const,
  orderIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  } as const,
  orderIdLabel: {
    ...Theme.typography.labelSm,
    color: Theme.colors.onSurfaceVariant,
    textTransform: 'uppercase',
  } as const,
  orderIdValue: {
    ...Theme.typography.labelLg,
    color: Theme.colors.onSurface,
  } as const,
  customerName: {
    ...Theme.typography.headlineSm,
    color: Theme.colors.onSurface,
    fontWeight: '600',
  } as const,
  statusBadge: {
    backgroundColor: '#ffdcc3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  } as const,
  statusText: {
    ...Theme.typography.labelSm,
    color: '#6e3900',
  } as const,
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  } as const,
  dateText: {
    ...Theme.typography.bodySm,
    color: Theme.colors.onSurfaceVariant,
  } as const,
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#f2f2f2',
    paddingTop: 12,
    marginTop: 4,
  } as const,
  totalLabel: {
    ...Theme.typography.labelSm,
    color: Theme.colors.onSurfaceVariant,
    textTransform: 'uppercase',
    marginBottom: 4,
  } as const,
  totalValue: {
    ...Theme.typography.headlineMd,
    color: Theme.colors.primary,
    fontWeight: '700',
  } as const,
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.primaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  } as const,
  actionButtonText: {
    ...Theme.typography.labelLg,
    color: Theme.colors.onPrimaryContainer,
  } as const,
});
