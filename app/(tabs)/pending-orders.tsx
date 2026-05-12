import React, { useState, useMemo, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, TextInput, SafeAreaView, ActivityIndicator, Modal, Linking, Image, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
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

export default function PendingOrdersScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { stores: allStores, selectedStore: contextStore, api, user } = useAppData();
  
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState('pending'); 
  const [selectedStoreId, setSelectedStoreId] = useState<string | number>(contextStore?.id || '');
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<any | null>(null);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);

  const cache = React.useRef<Record<string, any>>({});

  const fetchOrders = async (forceRefresh = false) => {
    const cacheKey = `${activeStatus}-${selectedStoreId}-${page}`;
    
    if (!forceRefresh && cache.current[cacheKey]) {
      const data = cache.current[cacheKey];
      setOrders(data.docs);
      setTotalPages(data.totalPages);
      setTotalDocs(data.totalDocs);
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
      setOrders(response.data.docs);
      setTotalPages(response.data.totalPages);
      setTotalDocs(response.data.totalDocs);
      cache.current[cacheKey] = response.data;
    } catch (error) {
      console.error('Error fetching pending orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [activeStatus, selectedStoreId, page]);

  const handleRefresh = () => {
    cache.current = {};
    fetchOrders(true);
  };

  // Sync store from context if it changes and we don't have one selected
  useEffect(() => {
    if (contextStore?.id && !selectedStoreId) {
      setSelectedStoreId(contextStore.id);
    }
  }, [contextStore]);

  return (
    <View style={styles.flex}>
      <TopAppBar title="Pedidos Pendientes" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Page Header */}
        <View style={styles.headerSection}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headline}>Pedidos Pendientes</Text>
          </View>
        </View>

        {/* Filters Section */}
        <View style={styles.filtersSection}>
          {/* Store Filter */}
          <View style={styles.advancedFilters}>
            <FilterDropdown 
              icon="store" 
              label="Tienda" 
              value={selectedStoreId ? allStores.find(s => s.id === selectedStoreId)?.name || 'Tienda' : "Todas las Tiendas"} 
              onPress={() => setShowStoreModal(true)}
            />
          </View>

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
              <PendingOrderCard 
                key={order.id} 
                order={order} 
                onViewDetails={() => router.push({ pathname: '/order-details', params: { orderId: order.id } })}
                onRefresh={() => fetchOrders(true)}
              />
            ))
          ) : (
            <View style={{ alignItems: 'center', padding: 40 }}>
              <MaterialIcons name="inventory" size={48} color={Theme.colors.outline} />
              <Text style={{ ...Theme.typography.bodyMd, color: Theme.colors.onSurfaceVariant, marginTop: 12 }}>No hay pedidos pendientes</Text>
            </View>
          )}
        </View>

        {/* Pagination */}
        {totalPages > 1 && (
          <View style={styles.pagination}>
            <TouchableOpacity 
              style={[styles.pageButton, page === 1 && styles.pageButtonDisabled]} 
              disabled={page === 1}
              onPress={() => setPage(p => Math.max(1, p - 1))}
            >
              <Text style={page === 1 ? styles.pageButtonTextDisabled : styles.pageButtonText}>Anterior</Text>
            </TouchableOpacity>
            <Text style={styles.paginationText}>{page} / {totalPages}</Text>
            <TouchableOpacity 
              style={[styles.pageButton, page === totalPages && styles.pageButtonDisabled]} 
              disabled={page === totalPages}
              onPress={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              <Text style={page === totalPages ? styles.pageButtonTextDisabled : styles.pageButtonText}>Siguiente</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <StoreSelectorModal 
        visible={showStoreModal}
        onClose={() => setShowStoreModal(false)}
        stores={allStores}
        selectedStoreId={selectedStoreId}
        onSelect={(id) => { setSelectedStoreId(id); setShowStoreModal(false); setPage(1); }}
      />

    </View>
  );
}

function PendingOrderCard({ order, onViewDetails, onRefresh }: { order: any, onViewDetails: () => void, onRefresh: () => void }) {
  const router = useRouter();
  const { api, refreshPendingCount } = useAppData();
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadVoucher = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Se requiere permiso para acceder a la galería');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        
        // Check size if available (some expo versions/platforms provide it)
        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
          alert('El archivo supera el límite de 5MB');
          return;
        }

        setIsUploading(true);
        
        const formData = new FormData();
        const uriParts = asset.uri.split('.');
        const fileType = uriParts[uriParts.length - 1];

        // @ts-ignore
        formData.append('file', {
          uri: asset.uri,
          name: `voucher_${order.id}.${fileType}`,
          type: `image/${fileType}`,
        });

        const uploadResponse = await api.post('/media', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const mediaId = uploadResponse.data.doc.id;

        await api.patch(`/orders/update-status/${order.id}`, { status: 'paid', voucher: mediaId });
        Alert.alert("Éxito", "Comprobante subido correctamente. El pedido ahora está marcado como pagado.");
        refreshPendingCount();
        onRefresh();
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      alert('Error al subir el comprobante: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsUploading(false);
    }
  };

  const dateStr = new Date(order.createdAt).toLocaleString('es-PE', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const clientName = order.anonymousUser?.name || order.client?.name || 'Cliente Anónimo';

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.orderLabel}>ID PEDIDO</Text>
          <Text style={styles.orderId}>#{order.reference}</Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>{getStatusLabel(order.status)}</Text>
        </View>
      </View>

      <Text style={styles.customerName}>{clientName}</Text>
      
      <View style={styles.dateRow}>
        <MaterialIcons name="calendar-today" size={16} color={Theme.colors.onSurfaceVariant} />
        <Text style={styles.dateText}>{dateStr}</Text>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>TOTAL</Text>
          <Text style={styles.totalValue}>{formatCurrency(order.pricing?.total, order.currency)}</Text>
        </View>
        
        <View style={styles.actionSection}>
          {order.status === 'pending' && !order.voucher && (
            <TouchableOpacity 
              style={[styles.uploadBtn, isUploading && { opacity: 0.7 }]}
              onPress={handleUploadVoucher}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="upload-file" size={16} color="#ffffff" />
                  <Text style={styles.uploadBtnText}>Subir Comprobante</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.viewBtn} onPress={onViewDetails}>
            <MaterialIcons name="visibility" size={20} color={Theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Theme.colors.background },
  scrollContent: { paddingBottom: 100 },
  headerSection: { padding: 16 },
  headerTitleRow: { marginBottom: 8 },
  headline: { ...Theme.typography.headlineLg, color: Theme.colors.onSurface },
  filtersSection: { paddingHorizontal: 16, marginBottom: 16 },
  advancedFilters: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  totalBar: { backgroundColor: '#f0eded', padding: 8, borderRadius: 8, alignItems: 'center' },
  totalText: { ...Theme.typography.bodyMd },
  totalBold: { fontWeight: '700' },
  orderList: { padding: 16, gap: 16 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#e4e2e1', position: 'relative', overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  orderLabel: { ...Theme.typography.labelSm, color: Theme.colors.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1 },
  orderId: { ...Theme.typography.labelLg, color: Theme.colors.onSurface, fontWeight: '800' },
  statusBadge: { backgroundColor: Theme.colors.pendingTint, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: Theme.colors.pendingTintText + '33', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusBadgeText: { ...Theme.typography.labelSm, color: Theme.colors.pendingTintText, fontWeight: '900', textTransform: 'uppercase', textAlign: 'center' },
  customerName: { ...Theme.typography.headlineSm, color: Theme.colors.onSurface, marginBottom: 4, fontWeight: '700' },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  dateText: { ...Theme.typography.bodySm, color: Theme.colors.onSurfaceVariant },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f2f2f2', gap: 8 },
  totalSection: { flexShrink: 1 },
  actionSection: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 0 },
  totalLabel: { ...Theme.typography.labelSm, color: Theme.colors.onSurfaceVariant, textTransform: 'uppercase' },
  totalValue: { ...Theme.typography.headlineSm, color: Theme.colors.primary, fontWeight: '800' },
  uploadBtn: { backgroundColor: Theme.colors.primaryContainer, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, justifyContent: 'center' },
  uploadBtnText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  viewBtn: { padding: 6, backgroundColor: '#f8f9fa', borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
  pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, padding: 16 },
  pageButton: { padding: 8 },
  pageButtonDisabled: { opacity: 0.3 },
  pageButtonText: { color: Theme.colors.primary, fontWeight: '700' },
  pageButtonTextDisabled: { color: '#999' },
  paginationText: { fontWeight: '700' },
});
