import React, { useState, useMemo } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, TextInput, SafeAreaView, ActivityIndicator, Modal, Linking, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '@/constants/Theme';
import { useAppData } from '@/context/AppDataContext';
import { useRouter } from 'expo-router';
import TopAppBar from '@/components/TopAppBar';
import { FilterDropdown, StoreSelectorModal } from '@/components/StoreFilter';
import StatusFlow, { STATUS_MAP } from '@/components/StatusFlow';

const getStatusColor = (status: string) => STATUS_MAP[status]?.dot || Theme.colors.outline;
const getStatusLabel = (status: string) => STATUS_MAP[status]?.label || status;

const formatCurrency = (amount: number | string = 0, currency: string = 'PEN') => {
  const val = typeof amount === 'number' ? amount : parseFloat(amount || '0');
  return `${currency === 'PEN' ? 'S/.' : '$'} ${val.toFixed(2)} ${currency}`;
}

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { stores: allStores, selectedStore: contextStore, api, user } = useAppData();
  
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersCache, setOrdersCache] = useState<Record<number, any[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState(''); 
  const [selectedStoreId, setSelectedStoreId] = useState<string | number>(contextStore?.id || '');
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [dateRange, setDateRange] = useState<{start: string | null, end: string | null}>({
    start: null,
    end: null,
  });
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any | null>(null);

  const fetchOrders = async (forceRefresh = false) => {
    // Check cache first
    if (!forceRefresh && ordersCache[page]) {
      setOrders(ordersCache[page]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      let query = `limit=10&page=${page}&sort=-createdAt&depth=1`;
      
      const where: any = {};
      if (activeStatus) where.status = { equals: activeStatus };
      if (selectedStoreId) where.store = { equals: selectedStoreId };
      if (user?.id) where['store.owner'] = { equals: user.id };
      
      if (dateRange.start && dateRange.end) {
        where.createdAt = {
          greater_than_equal: new Date(new Date(dateRange.start).setUTCHours(0, 0, 0, 0)).toISOString(),
          less_than_equal: new Date(new Date(dateRange.end).setUTCHours(23, 59, 59, 999)).toISOString(),
        };
      }

      const buildQuery = (obj: any, prefix = 'where') => {
        let str = '';
        for (const key in obj) {
          if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key]) && !(obj[key] instanceof Date)) {
            str += buildQuery(obj[key], `${prefix}[${key}]`);
          } else {
            str += `&${prefix}[${key}]=${encodeURIComponent(obj[key])}`;
          }
        }
        return str;
      };

      query += buildQuery(where);

      const response = await api.get(`/orders?${query}`);
      const newOrders = response.data.docs;
      
      setOrders(newOrders);
      setOrdersCache(prev => ({ ...prev, [page]: newOrders }));
      setTotalPages(response.data.totalPages);
      setTotalDocs(response.data.totalDocs);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear cache when filters change
  React.useEffect(() => {
    setOrdersCache({});
    if (page !== 1) {
      setPage(1);
    } else {
      fetchOrders(true);
    }
  }, [activeStatus, selectedStoreId, dateRange]);

  // Fetch when page changes (will use cache if available)
  React.useEffect(() => {
    fetchOrders();
  }, [page]);

  // Sync store from context if it changes and we don't have one selected
  React.useEffect(() => {
    if (contextStore?.id && !selectedStoreId) {
      setSelectedStoreId(contextStore.id);
    }
  }, [contextStore]);

  return (
    <View style={styles.flex}>
      <TopAppBar />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Page Header */}
        <View style={styles.headerSection}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headline}>Pedidos</Text>
          </View>
        </View>

        {/* Filters Section */}
        <View style={styles.filtersSection}>
          <StatusFlow 
            activeStatus={activeStatus} 
            onStatusChange={(status) => {
              setActiveStatus(status);
              setPage(1);
            }} 
          />

          {/* Advanced Filters */}
          <View style={styles.advancedFilters}>
            <FilterDropdown 
              icon="store" 
              label="Tienda" 
              value={selectedStoreId ? allStores.find(s => s.id === selectedStoreId)?.name || 'Tienda' : "Todas las Tiendas"} 
              onPress={() => setShowStoreModal(true)}
            />
            <FilterDropdown 
              icon="calendar-today" 
              label="Rango de fechas" 
              value={dateRange.start ? `${dateRange.start} - ${dateRange.end}` : "Seleccionar fechas"} 
              onPress={() => setShowDateModal(true)}
            />
          </View>

          {/* Total Counter */}
          <View style={styles.totalBar}>
             <Text style={styles.totalText}>Total: <Text style={styles.totalBold}>{totalDocs} pedidos</Text></Text>
          </View>
        </View>

        {/* Orders List */}
        <View style={styles.orderList}>
          {isLoading ? (
            <ActivityIndicator size="large" color={Theme.colors.primary} style={{ marginTop: 40 }} />
          ) : orders.length > 0 ? (
            orders.map((order) => (
              <OrderCard 
                key={order.id} 
                order={order} 
                onViewDetails={() => router.push({ pathname: '/order-details', params: { orderId: order.id } })}
              />
            ))
          ) : (
            <View style={{ alignItems: 'center', padding: 40 }}>
              <MaterialIcons name="inventory" size={48} color={Theme.colors.outline} />
              <Text style={{ ...Theme.typography.bodyMd, color: Theme.colors.onSurfaceVariant, marginTop: 12 }}>No se encontraron pedidos</Text>
            </View>
          )}
        </View>

        {/* Pagination */}
        {totalPages > 1 && (
          <View style={styles.pagination}>
            <Text style={styles.paginationText}>
              Página <Text style={styles.totalBold}>{page}</Text> de {totalPages}
            </Text>
            <View style={styles.paginationButtons}>
              <TouchableOpacity 
                style={[styles.pageButton, page === 1 && styles.pageButtonDisabled]} 
                disabled={page === 1}
                onPress={() => setPage(p => Math.max(1, p - 1))}
              >
                <Text style={page === 1 ? styles.pageButtonTextDisabled : styles.pageButtonText}>Anterior</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.pageButton, page === totalPages && styles.pageButtonDisabled]} 
                disabled={page === totalPages}
                onPress={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                <Text style={page === totalPages ? styles.pageButtonTextDisabled : styles.pageButtonText}>Siguiente</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Store Selector Modal */}
      <StoreSelectorModal 
        visible={showStoreModal}
        onClose={() => setShowStoreModal(false)}
        stores={allStores}
        selectedStoreId={selectedStoreId}
        onSelect={(id) => {
          setSelectedStoreId(id);
          setPage(1);
          setShowStoreModal(false);
        }}
      />
      <DateRangeModal 
        visible={showDateModal}
        onClose={() => setShowDateModal(false)}
        onSelect={(start, end) => {
          setDateRange({ start, end });
          setShowDateModal(false);
        }}
      />

    </View>
  );
}

function DateRangeModal({ visible, onClose, onSelect }: { 
  visible: boolean, 
  onClose: () => void, 
  onSelect: (start: string | null, end: string | null) => void 
}) {
  const PRESETS = [
    { label: 'Todos los tiempos', start: null, end: null },
    { label: 'Hoy', getRange: () => {
      const d = new Date().toISOString().split('T')[0];
      return { start: d, end: d };
    }},
    { label: 'Ayer', getRange: () => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      const s = d.toISOString().split('T')[0];
      return { start: s, end: s };
    }},
    { label: 'Últimos 7 días', getRange: () => {
      const end = new Date().toISOString().split('T')[0];
      const start = new Date();
      start.setDate(start.getDate() - 7);
      return { start: start.toISOString().split('T')[0], end };
    }},
    { label: 'Este mes', getRange: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const end = new Date().toISOString().split('T')[0];
      return { start, end };
    }},
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtrar por Fecha</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color={Theme.colors.onSurface} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalList}>
            {PRESETS.map((preset) => (
              <TouchableOpacity 
                key={preset.label}
                style={styles.modalItem}
                onPress={() => {
                  if (preset.getRange) {
                    const range = preset.getRange();
                    onSelect(range.start, range.end);
                  } else {
                    onSelect(null, null);
                  }
                }}
              >
                <Text style={styles.modalItemText}>{preset.label}</Text>
                <MaterialIcons name="chevron-right" size={20} color={Theme.colors.outline} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function OrderCard({ order, onViewDetails }: { order: any, onViewDetails: () => void }) {
  const isPaid = order.status === 'paid';
  const storeName = typeof order.store === 'object' ? order.store?.name : `Tienda #${order.store}`;
  const clientObj = typeof order.client === 'object' ? order.client : null;
  let clientName = order.anonymousUser?.name || '';
  let clientEmail = order.anonymousUser?.email || '';

  if (!clientName && clientObj) {
    clientName = clientObj.name || '';
    clientEmail = clientObj.email || '';
  }

  const dateStr = new Date(order.createdAt).toLocaleString('es-PE', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const handleOpenUrl = (urlData: any) => {
    if (!urlData) return;
    const url = typeof urlData === 'object' ? urlData.url : urlData;
    if (url) {
      const fullUrl = url.startsWith('http') ? url : `https://shop.giborcommunity.com${url}`;
      Linking.openURL(fullUrl).catch(err => console.error("Error opening URL:", err));
    }
  };

  const address = order.address || {};
  const items = order.items || [];
  
  return (
    <View style={styles.card}>
      {/* Top Header Row */}
      <View style={styles.cardHeader}>
        <View>
          <View style={styles.orderLabelRow}>
            <Text style={styles.orderLabel}>PEDIDO</Text>
            <Text style={styles.orderRefLabel}>REFERENCIA</Text>
          </View>
          <Text style={styles.orderId}>{order.reference}</Text>
        </View>
        <View style={[styles.statusBadge, isPaid && styles.statusBadgePaid]}>
          <View style={[styles.dot, { backgroundColor: getStatusColor(order.status) }]} />
          <Text style={[styles.statusBadgeText, isPaid && styles.statusBadgeTextPaid]}>
            {getStatusLabel(order.status)}
          </Text>
        </View>
      </View>

      <Text style={styles.orderDate}>{dateStr}</Text>

      {/* Store Info */}
      <View style={styles.infoRow}>
        <MaterialIcons name="storefront" size={18} color={Theme.colors.onSurfaceVariant} />
        <Text style={styles.infoText}>Tienda: <Text style={styles.infoBold}>{storeName}</Text></Text>
      </View>

      {/* Customer Section */}
      <View style={styles.customerCard}>
        <View style={styles.customerHeader}>
          <MaterialIcons name="person" size={16} color={Theme.colors.primary} />
          <Text style={styles.customerLabel}>CLIENTE</Text>
        </View>
        <Text style={styles.customerName}>{clientName || 'Sin Nombre'}</Text>
        <Text style={styles.customerEmail}>{clientEmail || 'Sin Email'}</Text>
      </View>

      {/* Logistics Section */}
      <View style={styles.logisticsCard}>
        <View style={styles.sectionHeader}>
          <MaterialIcons name="local-shipping" size={16} color={Theme.colors.secondary} />
          <Text style={styles.sectionLabel}>LOGÍSTICA</Text>
        </View>

        <View style={styles.logisticsBadgesRow}>
          {order.voucherLogistics && (
            <TouchableOpacity 
              style={styles.logisticsVoucherBadge}
              onPress={() => handleOpenUrl(order.voucherLogistics)}
            >
              <MaterialIcons name="check" size={14} color="#854d0e" />
              <MaterialIcons name="attach-file" size={14} color="#854d0e" />
              <Text style={styles.logisticsBadgeText}>Ver Factura</Text>
            </TouchableOpacity>
          )}
          {order.trackingNumber && (
            <View style={styles.trackingBadgeBlue}>
              <MaterialIcons name="assignment" size={14} color={Theme.colors.secondary} />
              <Text style={styles.trackingBadgeText}>{order.trackingNumber}</Text>
            </View>
          )}
        </View>

        <Text style={styles.logisticsText}>
          <Text style={styles.infoBold}>Dirección: </Text>
          {address.street || 'No especificada'}, {address.city || ''} {address.state || ''}
        </Text>
      </View>

      {/* Items Section */}
      {items.length > 0 && (
        <View style={styles.itemsCard}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="inventory-2" size={16} color={Theme.colors.tertiary} />
            <Text style={styles.sectionLabel}>ARTÍCULOS</Text>
          </View>
          {items.map((item: any, idx: number) => (
            <View key={idx} style={styles.itemRow}>
              <Text style={styles.itemText} numberOfLines={1}>
                • {item.product?.name || 'Producto'} 
              </Text>
              <Text style={styles.itemQty}>x{item.quantity}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Pricing Row */}
      <View style={styles.pricingGrid}>
        <View style={styles.priceItem}>
          <Text style={styles.priceLabel}>TOTAL A PAGAR</Text>
          <Text style={styles.totalValue}>{formatCurrency(order.pricing?.total, order.currency)}</Text>
        </View>
        <View style={styles.priceItem}>
          <Text style={styles.priceLabel}>COSTO ENVÍO</Text>
          <Text style={styles.shippingValue}>{formatCurrency(order.pricing?.shipping, order.currency)}</Text>
        </View>
      </View>

      {/* Voucher Section - Prominent */}
      {order.voucher && (
        <TouchableOpacity 
          style={styles.voucherBadge}
          onPress={() => handleOpenUrl(order.voucher)}
        >
          <MaterialIcons name="receipt-long" size={18} color={Theme.colors.secondary} />
          <Text style={styles.voucherText}>Ver Comprobante de Pago</Text>
          <MaterialIcons name="open-in-new" size={14} color={Theme.colors.secondary} />
        </TouchableOpacity>
      )}

      {/* Action Bar */}
      <View style={styles.cardActions}>
        <View style={styles.actionLeft}>
        </View>

        <View style={styles.actionRight}>
          <TouchableOpacity style={styles.circleActionBtn} onPress={onViewDetails}>
            <MaterialIcons name="visibility" size={20} color={Theme.colors.tertiary} />
          </TouchableOpacity>
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
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 100,
  } as const,
  headerSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 16,
  } as const,
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as const,
  headline: {
    ...Theme.typography.headlineLg,
    color: Theme.colors.onSurface,
  } as const,
  filtersSection: {
    padding: 16,
    gap: 12,
    backgroundColor: '#ffffff',
  } as const,
  flowLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 12,
    borderRightWidth: 1,
    borderRightColor: '#e4e2e1',
    height: 24,
  } as const,
  flowLabel: {
    ...Theme.typography.labelMd,
    color: Theme.colors.onSurfaceVariant,
    fontWeight: '500',
  } as const,
  advancedFilters: {
    flexDirection: 'row',
    gap: 12,
  } as const,
  totalBar: {
    backgroundColor: '#f0eded',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  } as const,
  totalText: {
    ...Theme.typography.bodyMd,
    color: Theme.colors.onSurface,
  } as const,
  totalBold: {
    fontWeight: '700',
  } as const,
  orderList: {
    padding: 16,
    gap: 12,
  } as const,
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e4e2e1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  } as const,
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  } as const,
  orderLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  } as const,
  orderLabel: {
    ...Theme.typography.labelSm,
    color: Theme.colors.primary,
    fontWeight: '800',
    letterSpacing: 1,
    backgroundColor: Theme.colors.primaryContainer,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  } as const,
  orderRefLabel: {
    ...Theme.typography.labelSm,
    color: Theme.colors.onSurfaceVariant,
    letterSpacing: 1,
  } as const,
  orderId: {
    ...Theme.typography.headlineSm,
    color: Theme.colors.onSurface,
    fontWeight: '800',
  } as const,
  orderDate: {
    ...Theme.typography.bodySm,
    color: Theme.colors.onSurfaceVariant,
    marginBottom: 8,
  } as const,
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  } as const,
  infoText: {
    ...Theme.typography.bodyMd,
    color: Theme.colors.onSurfaceVariant,
  } as const,
  infoBold: {
    fontWeight: '700',
    color: Theme.colors.onSurface,
  } as const,
  customerCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
  } as const,
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  } as const,
  customerLabel: {
    ...Theme.typography.labelSm,
    color: Theme.colors.primary,
    fontWeight: '700',
    letterSpacing: 0.5,
  } as const,
  customerName: {
    ...Theme.typography.bodyLg,
    color: Theme.colors.onSurface,
    fontWeight: '700',
  } as const,
  customerEmail: {
    ...Theme.typography.bodySm,
    color: Theme.colors.onSurfaceVariant,
  } as const,
  logisticsCard: {
    backgroundColor: 'rgba(68, 143, 253, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(68, 143, 253, 0.1)',
  } as const,
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  } as const,
  sectionLabel: {
    ...Theme.typography.labelSm,
    color: Theme.colors.onSurfaceVariant,
    fontWeight: '700',
    letterSpacing: 1,
  } as const,
  logisticsText: {
    ...Theme.typography.bodyMd,
    color: Theme.colors.onSurface,
  } as const,
  itemsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  } as const,
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  } as const,
  itemText: {
    ...Theme.typography.bodyMd,
    color: Theme.colors.onSurface,
    flex: 1,
  } as const,
  itemQty: {
    ...Theme.typography.labelLg,
    color: Theme.colors.onSurfaceVariant,
    fontWeight: '700',
    marginLeft: 8,
  } as const,
  pricingGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  } as const,
  priceItem: {
    gap: 4,
  } as const,
  priceLabel: {
    ...Theme.typography.labelSm,
    color: Theme.colors.onSurfaceVariant,
    fontWeight: '600',
  } as const,
  totalValue: {
    ...Theme.typography.headlineSm,
    color: Theme.colors.onSurface,
    fontWeight: '800',
  } as const,
  shippingValue: {
    ...Theme.typography.bodyMd,
    color: Theme.colors.onSurfaceVariant,
    fontWeight: '600',
  } as const,
  voucherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(68, 143, 253, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(68, 143, 253, 0.2)',
    marginBottom: 12,
    gap: 8,
    justifyContent: 'center',
  } as const,
  voucherText: {
    ...Theme.typography.labelLg,
    color: Theme.colors.secondary,
    fontWeight: '700',
  } as const,
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  } as const,
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e4e2e1',
    backgroundColor: '#f6f3f2',
    gap: 6,
    alignSelf: 'flex-start',
  } as const,
  statusBadgePaid: {
    backgroundColor: 'rgba(68, 143, 253, 0.1)',
    borderColor: 'rgba(68, 143, 253, 0.3)',
  } as const,
  statusBadgeText: {
    ...Theme.typography.labelMd,
    color: Theme.colors.onSurface,
    fontWeight: '700',
  } as const,
  statusBadgeTextPaid: {
    color: Theme.colors.secondary,
  } as const,
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f2f2f2',
  } as const,
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  } as const,
  actionRight: {
    flexDirection: 'row',
    gap: 8,
  } as const,
  circleActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(68, 196, 115, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  } as const,
  pagination: {
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e4e2e1',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as const,
  paginationText: {
    ...Theme.typography.bodySm,
    color: Theme.colors.onSurfaceVariant,
  } as const,
  paginationButtons: {
    flexDirection: 'row',
    gap: 8,
  } as const,
  pageButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e4e2e1',
  } as const,
  pageButtonDisabled: {
    opacity: 0.5,
  } as const,
  pageButtonText: {
    ...Theme.typography.labelMd,
    color: Theme.colors.onSurface,
  } as const,
  pageButtonTextDisabled: {
    ...Theme.typography.labelMd,
    color: Theme.colors.onSurfaceVariant,
  } as const,
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  } as const,
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  } as const,
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  } as const,
  modalTitle: {
    ...Theme.typography.headlineSm,
    color: Theme.colors.onSurface,
    fontWeight: '700',
  } as const,
  modalList: {
    padding: 12,
  } as const,
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 4,
  } as const,
  modalItemText: {
    ...Theme.typography.bodyLg,
    color: Theme.colors.onSurface,
  } as const,
  logisticsBadgesRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    alignItems: 'center',
  } as const,
  logisticsVoucherBadge: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fde68a',
    gap: 6,
    alignItems: 'center',
  } as const,
  logisticsBadgeText: {
    ...Theme.typography.labelMd,
    color: '#854d0e',
    fontWeight: '700',
  } as const,
  trackingBadgeBlue: {
    flexDirection: 'row',
    backgroundColor: 'rgba(68, 143, 253, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(68, 143, 253, 0.2)',
    gap: 6,
    alignItems: 'center',
  } as const,
  trackingBadgeText: {
    ...Theme.typography.labelMd,
    color: Theme.colors.secondary,
    fontWeight: '700',
  },
});
