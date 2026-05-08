import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Image, ActivityIndicator, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Theme } from '@/constants/Theme';
import { useAppData } from '@/context/AppDataContext';

const formatCurrency = (amount: number | string = 0, currency: string = 'PEN') => {
  const val = typeof amount === 'number' ? amount : parseFloat(amount || '0');
  return `${currency === 'PEN' ? 'S/.' : '$'} ${val.toFixed(2)} ${currency}`;
}

export default function OrderDetailsScreen() {
  const { orderId } = useLocalSearchParams();
  const router = useRouter();
  const { api } = useAppData();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await api.get(`/orders/${orderId}?depth=1`);
        setOrder(response.data);
      } catch (error) {
        console.error('Error fetching order details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  if (isLoading) {
    return (
      <View style={[styles.flex, styles.center]}>
        <ActivityIndicator size="large" color={Theme.colors.primary} />
      </View>
    );
  }

  if (!order) {
    return (
      <View style={[styles.flex, styles.center]}>
        <Text>No se encontró el pedido</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtnText}>
          <Text style={{ color: Theme.colors.primary }}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const items = order.items || [];
  const pricing = order.pricing || {};

  return (
    <SafeAreaView style={styles.flex}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={Theme.colors.onSurface} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Detalles del Pedido</Text>
          <Text style={styles.headerSubtitle}>#{order.reference}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Order Status Banner */}
        <View style={styles.statusBanner}>
          <MaterialIcons name="info" size={20} color={Theme.colors.primary} />
          <Text style={styles.statusText}>Estado: <Text style={styles.statusBold}>{order.status.toUpperCase()}</Text></Text>
        </View>

        {/* Customer & Shipping Info - NOW AT TOP */}
        <View style={styles.infoSection}>
          <View style={styles.infoBlock}>
            <View style={styles.infoHeader}>
              <MaterialIcons name="person" size={18} color={Theme.colors.primary} />
              <Text style={styles.infoTitle}>Cliente</Text>
            </View>
            <Text style={styles.infoText}>{order.anonymousUser?.name || order.client?.name || 'Cliente Anónimo'}</Text>
            <Text style={styles.infoSubtext}>{order.anonymousUser?.email || order.client?.email || ''}</Text>
          </View>

          <View style={styles.infoBlock}>
            <View style={styles.infoHeader}>
              <MaterialIcons name="location-on" size={18} color={Theme.colors.primary} />
              <Text style={styles.infoTitle}>Dirección de Envío</Text>
            </View>
            <Text style={styles.infoText}>{order.address?.street || 'Sin dirección'}</Text>
            <Text style={styles.infoSubtext}>{order.address?.city}, {order.address?.state}</Text>
          </View>
        </View>

        {/* Product Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Artículos</Text>
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <View style={{ width: 55 }}><Text style={styles.tableHeadText}>REF.</Text></View>
              <Text style={[styles.tableHeadText, { flex: 2, paddingLeft: 10 }]}>PRODUCTO</Text>
              <Text style={[styles.tableHeadText, { width: 45, textAlign: 'center' }]}>CANT.</Text>
              <Text style={[styles.tableHeadText, { flex: 1, textAlign: 'right' }]}>P. UNIT</Text>
              <Text style={[styles.tableHeadText, { flex: 1, textAlign: 'right' }]}>TOTAL</Text>
            </View>

            {items.map((item: any, idx: number) => {
              const product = item.product || {};
              const images = product.images || [];
              const firstImage = images[0];
              const imageId = typeof firstImage === 'object' ? firstImage.id : firstImage;
              const fullImageUrl = imageId ? `https://shop.giborcommunity.com/api/media-url/${imageId}` : null;
              const itemTotal = parseFloat(item.price || '0') * item.quantity;

              return (
                <View key={idx} style={styles.tableRow}>
                  <View style={{ width: 55 }}>
                    {fullImageUrl ? (
                      <Image source={{ uri: fullImageUrl }} style={styles.tableProductImg} resizeMode="cover" />
                    ) : (
                      <View style={[styles.tableProductImg, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
                        <MaterialIcons name="image" size={20} color="#ccc" />
                      </View>
                    )}
                  </View>
                  <Text style={[styles.tableBodyText, { flex: 2, paddingLeft: 10, fontWeight: '600' }]}>{product.name || 'Producto'}</Text>
                  <View style={{ width: 45, alignItems: 'center' }}>
                    <Text style={styles.tableBodyText}>x{item.quantity}</Text>
                  </View>
                  <Text style={[styles.tableBodyText, { flex: 1, textAlign: 'right' }]}>{item.price}</Text>
                  <Text style={[styles.tableBodyText, { flex: 1, textAlign: 'right', fontWeight: '700' }]}>{itemTotal.toFixed(2)}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Totals Section */}
        <View style={styles.totalsCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{formatCurrency(pricing.subtotal, order.currency)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Envío</Text>
            <Text style={styles.totalValue}>{formatCurrency(pricing.shipping, order.currency)}</Text>
          </View>
          
          {/* Platform Fee / Commission */}
          {(pricing.commission > 0 || pricing.platformFee > 0) && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Comisión Plataforma</Text>
              <Text style={styles.totalValue}>{formatCurrency(pricing.commission || pricing.platformFee, order.currency)}</Text>
            </View>
          )}

          <View style={[styles.totalRow, styles.finalTotalRow]}>
            <Text style={styles.finalTotalLabel}>TOTAL A PAGAR</Text>
            <Text style={styles.finalTotalValue}>{formatCurrency(pricing.total, order.currency)}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    ...Theme.typography.headlineSm,
    color: Theme.colors.onSurface,
    fontWeight: '800',
  },
  headerSubtitle: {
    ...Theme.typography.bodySm,
    color: Theme.colors.onSurfaceVariant,
  },
  content: {
    flex: 1,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(242, 153, 74, 0.1)',
    margin: 16,
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  statusText: {
    ...Theme.typography.bodyMd,
    color: Theme.colors.onSurface,
  },
  statusBold: {
    fontWeight: '800',
    color: Theme.colors.primary,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    ...Theme.typography.labelLg,
    color: Theme.colors.onSurface,
    fontWeight: '800',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  tableHeadText: {
    ...Theme.typography.labelSm,
    color: '#64748b',
    fontWeight: '800',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tableProductImg: {
    width: 45,
    height: 45,
    borderRadius: 8,
  },
  tableBodyText: {
    ...Theme.typography.bodySm,
    color: Theme.colors.onSurface,
  },
  totalsCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#eee',
    ...Theme.elevation.level1,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    ...Theme.typography.bodyMd,
    color: Theme.colors.onSurfaceVariant,
  },
  totalValue: {
    ...Theme.typography.bodyMd,
    color: Theme.colors.onSurface,
    fontWeight: '600',
  },
  finalTotalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  finalTotalLabel: {
    ...Theme.typography.labelLg,
    color: Theme.colors.onSurface,
    fontWeight: '800',
  },
  finalTotalValue: {
    ...Theme.typography.headlineSm,
    color: Theme.colors.primary,
    fontWeight: '900',
  },
  infoSection: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  infoBlock: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoTitle: {
    ...Theme.typography.labelLg,
    color: Theme.colors.onSurface,
    fontWeight: '800',
  },
  infoText: {
    ...Theme.typography.bodyMd,
    color: Theme.colors.onSurface,
    fontWeight: '600',
  },
  infoSubtext: {
    ...Theme.typography.bodySm,
    color: Theme.colors.onSurfaceVariant,
  },
  backBtnText: {
    marginTop: 20,
    padding: 10,
  }
});
