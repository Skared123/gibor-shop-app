import React from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, SafeAreaView, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '@/constants/Theme';
import { useAppData } from '@/context/AppDataContext';
import axios from 'axios';
import dayjs from 'dayjs';
import { ActivityIndicator, Modal, FlatList } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';

// Configuración de idioma para el calendario
LocaleConfig.locales['es'] = {
  monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  monthNamesShort: ['Ene.', 'Feb.', 'Mar.', 'Abr.', 'May.', 'Jun.', 'Jul.', 'Ago.', 'Sep.', 'Oct.', 'Nov.', 'Dic.'],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  dayNamesShort: ['Dom.', 'Lun.', 'Mar.', 'Mié.', 'Jue.', 'Vie.', 'Sáb.'],
  today: 'Hoy'
};
LocaleConfig.defaultLocale = 'es';

const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { selectedStore, stores, setSelectedStore, api } = useAppData();
  
  const [salesData, setSalesData] = React.useState<any[]>([]);
  const [topProducts, setTopProducts] = React.useState<any[]>([]);
  const [topCustomers, setTopCustomers] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [showStoreModal, setShowStoreModal] = React.useState(false);
  const [showDateModal, setShowDateModal] = React.useState(false);
  const [showCalendarModal, setShowCalendarModal] = React.useState(false);
  
  const [dateRange, setDateRange] = React.useState({
    label: 'Últimos 7 días',
    start: dayjs().subtract(6, 'day').format('YYYY-MM-DD'),
    end: dayjs().format('YYYY-MM-DD'),
  });

  const [tempRange, setTempRange] = React.useState<{start: string | null, end: string | null}>({
    start: null,
    end: null,
  });

  const dateOptions = [
    { label: 'Hoy', getRange: () => ({ start: dayjs().format('YYYY-MM-DD'), end: dayjs().format('YYYY-MM-DD') }) },
    { label: 'Ayer', getRange: () => ({ start: dayjs().subtract(1, 'day').format('YYYY-MM-DD'), end: dayjs().subtract(1, 'day').format('YYYY-MM-DD') }) },
    { label: 'Últimos 7 días', getRange: () => ({ start: dayjs().subtract(6, 'day').format('YYYY-MM-DD'), end: dayjs().format('YYYY-MM-DD') }) },
    { label: 'Últimos 30 días', getRange: () => ({ start: dayjs().subtract(29, 'day').format('YYYY-MM-DD'), end: dayjs().format('YYYY-MM-DD') }) },
    { label: 'Últimos 90 días', getRange: () => ({ start: dayjs().subtract(89, 'day').format('YYYY-MM-DD'), end: dayjs().format('YYYY-MM-DD') }) },
    { label: 'Este mes', getRange: () => ({ start: dayjs().startOf('month').format('YYYY-MM-DD'), end: dayjs().endOf('month').format('YYYY-MM-DD') }) },
    { label: 'Mes pasado', getRange: () => ({ start: dayjs().subtract(1, 'month').startOf('month').format('YYYY-MM-DD'), end: dayjs().subtract(1, 'month').endOf('month').format('YYYY-MM-DD') }) },
    { label: 'Personalizado', isCustom: true },
  ];

  const fetchDashboardData = async () => {
    if (!selectedStore) return;
    
    setIsLoading(true);
    try {
      const timezone = (() => {
        const offset = -(new Date().getTimezoneOffset() / 60)
        return `UTC${offset >= 0 ? '+' : ''}${offset}`
      })()

      const [salesRes, productsRes, customersRes] = await Promise.all([
        api.get(`/stores/${selectedStore.id}/get-sales-data?start=${dateRange.start}&end=${dateRange.end}&timezone=${timezone}`),
        api.get(`/stores/${selectedStore.id}/get-top-products?limit=5`),
        api.get(`/stores/${selectedStore.id}/get-top-customers?limit=5`)
      ]);

      setSalesData(salesRes.data);
      setTopProducts(productsRes.data);
      setTopCustomers(customersRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchDashboardData();
  }, [selectedStore, dateRange]);

  const totals = React.useMemo(() => {
    const totalOrders = salesData.reduce((acc, curr) => acc + Number(curr.total_orders || 0), 0);
    const totalSales = salesData.reduce((acc, curr) => acc + Number(curr.total_sales || 0), 0);
    const avgTicket = totalOrders > 0 ? totalSales / totalOrders : 0;
    
    return {
      orders: totalOrders,
      sales: totalSales,
      ticket: avgTicket
    };
  }, [salesData]);

  const chartData = React.useMemo(() => {
    if (salesData.length === 0) return null;
    
    // Si es hoy o ayer (1 solo punto), mostramos algo razonable
    const labels = salesData.map((d, index) => {
      const label = (dateRange.label === 'Hoy' || dateRange.label === 'Ayer')
        ? (d.hour ? `${d.hour}:00` : `${d.day}/${d.month}`)
        : dayjs(`${d.year}-${d.month}-${d.day}`).format('DD/MM');

      // Si hay muchos puntos, solo mostramos algunos para evitar que se amontonen
      if (salesData.length > 7) {
        // Mostrar siempre el primero, el último y unos pocos en medio
        const step = Math.ceil(salesData.length / 6);
        if (index === 0 || index === salesData.length - 1 || index % step === 0) {
          return label;
        }
        return '';
      }
      return label;
    });

    return {
      labels: labels,
      datasets: [
        {
          data: salesData.map(d => Number(d.total_sales || 0)),
          color: (opacity = 1) => `rgba(12, 100, 235, ${opacity})`,
          strokeWidth: 2
        }
      ]
    };
  }, [salesData, dateRange]);

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
            <TouchableOpacity 
              style={styles.filterPill}
              onPress={() => setShowDateModal(true)}
            >
              <MaterialIcons name="calendar-today" size={16} color={Theme.colors.onSurfaceVariant} />
              <Text style={styles.filterText}>{dateRange.label}</Text>
              <MaterialIcons name="expand-more" size={16} color={Theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.filterPill}
              onPress={() => setShowStoreModal(true)}
            >
              <MaterialIcons name="storefront" size={16} color={Theme.colors.primary} />
              <Text style={styles.filterText}>Tienda: {selectedStore?.name || 'Seleccionar'}</Text>
              <MaterialIcons name="expand-more" size={16} color={Theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
        </View>

        {isLoading && <ActivityIndicator size="large" color={Theme.colors.primary} style={{ marginBottom: 20 }} />}

        {/* Metrics Section */}
        <View style={styles.metricsContainer}>
          <Text style={styles.sectionLabel}>Métricas Generales</Text>
          
          <View style={styles.kpiGrid}>
            <View style={[styles.kpiCard, { backgroundColor: '#d7e3ff4d', borderColor: '#d7e3ff' }]}>
              <View style={styles.kpiHeader}>
                <MaterialIcons name="shopping-bag" size={14} color={Theme.colors.onSurfaceVariant} />
                <Text style={styles.kpiLabel}>PEDIDOS</Text>
              </View>
              <Text style={[styles.kpiValue, { color: '#001b3f' }]}>{totals.orders}</Text>
            </View>

            <View style={[styles.kpiCard, { backgroundColor: '#7efba44d', borderColor: '#7efba4' }]}>
              <View style={styles.kpiHeader}>
                <MaterialIcons name="payments" size={14} color={Theme.colors.onSurfaceVariant} />
                <Text style={styles.kpiLabel}>VENDIDO</Text>
              </View>
              <Text style={[styles.kpiValue, { color: '#00210c' }]}>${totals.sales.toLocaleString()}</Text>
            </View>

            <View style={[styles.kpiCard, { backgroundColor: '#ffdcc34d', borderColor: '#ffdcc3' }]}>
              <View style={styles.kpiHeader}>
                <MaterialIcons name="receipt-long" size={14} color={Theme.colors.onSurfaceVariant} />
                <Text style={styles.kpiLabel}>TICKET PROMEDIO</Text>
              </View>
              <Text style={[styles.kpiValue, { color: '#2f1500' }]}>${totals.ticket.toFixed(2)}</Text>
            </View>
          </View>

          {/* Real Chart */}
          <View style={styles.chartContainer}>
            {chartData ? (
              <LineChart
                data={chartData}
                width={screenWidth - 64}
                height={180}
                chartConfig={{
                  backgroundColor: '#ffffff',
                  backgroundGradientFrom: '#f6f3f2',
                  backgroundGradientTo: '#f6f3f2',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(12, 100, 235, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: {
                    borderRadius: 16
                  },
                  propsForDots: {
                    r: "4",
                    strokeWidth: "2",
                    stroke: "#0c64eb"
                  }
                }}
                bezier
                style={{
                  marginVertical: 8,
                  borderRadius: 16
                }}
              />
            ) : (
              <View style={styles.chartBadge}>
                <MaterialIcons name="bar-chart" size={16} color={Theme.colors.onSurfaceVariant} />
                <Text style={styles.chartBadgeText}>No hay datos suficientes</Text>
              </View>
            )}
          </View>
        </View>

        {/* Top Products */}
        <View style={styles.listSection}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Top 5 Productos</Text>
          </View>
          <View style={styles.listContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerText, styles.rankCell]}>#</Text>
              <Text style={[styles.headerText, styles.productCell]}>Producto</Text>
              <Text style={[styles.headerText, styles.priceCell]}>$ Ventas</Text>
            </View>
            {topProducts.map((item, index) => (
              <ProductItem 
                key={index}
                rank={index + 1}
                name={item.product?.name || 'Producto'} 
                price={`$${item._sales.toLocaleString()}`} 
                image={item.product?.images?.[0] ? `https://shop.giborcommunity.com/api/media-url/${item.product.images[0]}` : null}
                icon="smartphone"
              />
            ))}
            {topProducts.length === 0 && !isLoading && (
              <Text style={{ padding: 20, textAlign: 'center', color: Theme.colors.onSurfaceVariant }}>No hay productos registrados</Text>
            )}
          </View>
        </View>

        {/* Top Clients */}
        <View style={styles.listSection}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>Top 5 Clientes</Text>
          </View>
          <View style={styles.listContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerText, styles.rankCell]}>#</Text>
              <Text style={[styles.headerText, styles.clientCell]}>Cliente</Text>
              <Text style={[styles.headerText, styles.ordersCell]}>Pedidos</Text>
            </View>
            {topCustomers.map((item, index) => (
              <ClientItem 
                key={index}
                rank={index + 1}
                initials={item.name ? item.name.substring(0, 2).toUpperCase() : '??'} 
                name={item.name || 'Cliente Anónimo'} 
                email={item.email}
                orders={item.total_orders} 
                color={['#d7e3ff', '#7efba4', '#ffdcc3', '#f3d7ff', '#fff4d7'][index % 5]} 
              />
            ))}
            {topCustomers.length === 0 && !isLoading && (
              <Text style={{ padding: 20, textAlign: 'center', color: Theme.colors.onSurfaceVariant }}>No hay clientes registrados</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Store Selection Modal */}
      <Modal
        visible={showStoreModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStoreModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Tienda</Text>
              <TouchableOpacity onPress={() => setShowStoreModal(false)}>
                <MaterialIcons name="close" size={24} color={Theme.colors.onSurface} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={stores}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[
                    styles.storeOption,
                    selectedStore?.id === item.id && styles.storeOptionSelected
                  ]}
                  onPress={() => {
                    setSelectedStore(item);
                    setShowStoreModal(false);
                  }}
                >
                  <MaterialIcons 
                    name="storefront" 
                    size={20} 
                    color={selectedStore?.id === item.id ? Theme.colors.primary : Theme.colors.onSurfaceVariant} 
                  />
                  <Text style={[
                    styles.storeOptionText,
                    selectedStore?.id === item.id && styles.storeOptionTextSelected
                  ]}>
                    {item.name}
                  </Text>
                  {selectedStore?.id === item.id && (
                    <MaterialIcons name="check" size={20} color={Theme.colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Date Range Selection Modal */}
      <Modal
        visible={showDateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rango de Fechas</Text>
              <TouchableOpacity onPress={() => setShowDateModal(false)}>
                <MaterialIcons name="close" size={24} color={Theme.colors.onSurface} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={dateOptions}
              keyExtractor={(item) => item.label}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[
                    styles.storeOption,
                    dateRange.label === item.label && styles.storeOptionSelected
                  ]}
                  onPress={() => {
                    if (item.isCustom) {
                      setShowDateModal(false);
                      setShowCalendarModal(true);
                    } else {
                      const range = item.getRange!();
                      setDateRange({
                        label: item.label,
                        ...range
                      });
                      setShowDateModal(false);
                    }
                  }}
                >
                  <MaterialIcons 
                    name={item.isCustom ? "date-range" : "calendar-today"} 
                    size={20} 
                    color={dateRange.label === item.label ? Theme.colors.primary : Theme.colors.onSurfaceVariant} 
                  />
                  <Text style={[
                    styles.storeOptionText,
                    dateRange.label === item.label && styles.storeOptionTextSelected
                  ]}>
                    {item.label}
                  </Text>
                  {dateRange.label === item.label && (
                    <MaterialIcons name="check" size={20} color={Theme.colors.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Calendar Modal for Custom Range */}
      <Modal
        visible={showCalendarModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowCalendarModal(false)}
      >
        <View style={styles.modalOverlayCentered}>
          <View style={styles.calendarContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Rango</Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity 
                  onPress={() => {
                    const todayStr = dayjs().format('YYYY-MM-DD');
                    setTempRange({ start: todayStr, end: todayStr });
                  }}
                  style={styles.todayButton}
                >
                  <Text style={styles.todayButtonText}>Hoy</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowCalendarModal(false)}>
                  <MaterialIcons name="close" size={24} color={Theme.colors.onSurface} />
                </TouchableOpacity>
              </View>
            </View>
            
            <Calendar
              markingType={'period'}
              maxDate={dayjs().format('YYYY-MM-DD')}
              onDayPress={(day) => {
                if (!tempRange.start || (tempRange.start && tempRange.end)) {
                  setTempRange({ start: day.dateString, end: null });
                } else {
                  if (dayjs(day.dateString).isBefore(dayjs(tempRange.start))) {
                    setTempRange({ start: day.dateString, end: tempRange.start });
                  } else {
                    setTempRange({ ...tempRange, end: day.dateString });
                  }
                }
              }}
              markedDates={{
                ...(tempRange.start ? {
                  [tempRange.start]: { startingDay: true, color: Theme.colors.primary, textColor: 'white' }
                } : {}),
                ...(tempRange.end ? {
                  [tempRange.end]: { endingDay: true, color: Theme.colors.primary, textColor: 'white' }
                } : {}),
                ...(tempRange.start && tempRange.end ? (() => {
                  const marked: any = {};
                  let current = dayjs(tempRange.start).add(1, 'day');
                  const end = dayjs(tempRange.end);
                  while (current.isBefore(end)) {
                    marked[current.format('YYYY-MM-DD')] = { color: Theme.colors.primary + '33', textColor: Theme.colors.primary };
                    current = current.add(1, 'day');
                  }
                  return marked;
                })() : {})
              }}
              theme={{
                todayTextColor: Theme.colors.primary,
                arrowColor: Theme.colors.primary,
              }}
            />

            <View style={styles.calendarFooter}>
              <Text style={styles.rangePreview}>
                {tempRange.start ? dayjs(tempRange.start).format('DD/MM/YY') : 'Inic.'} - {tempRange.end ? dayjs(tempRange.end).format('DD/MM/YY') : 'Fin'}
              </Text>
              <TouchableOpacity 
                style={[styles.applyButton, (!tempRange.start || !tempRange.end) && styles.applyButtonDisabled]}
                disabled={!tempRange.start || !tempRange.end}
                onPress={() => {
                  setDateRange({
                    label: 'Personalizado',
                    start: tempRange.start!,
                    end: tempRange.end!
                  });
                  setShowCalendarModal(false);
                }}
              >
                <Text style={styles.applyButtonText}>Aplicar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ProductItem({ rank, name, price, image, icon }: any) {
  return (
    <View style={styles.tableRow}>
      <Text style={[styles.tableCell, styles.rankCell]}>{rank}</Text>
      <View style={[styles.tableCell, styles.productCell]}>
        <View style={styles.itemInfo}>
          <View style={styles.productImageContainer}>
            {image ? (
              <Image source={{ uri: image }} style={styles.productImage} />
            ) : (
              <MaterialIcons name={icon} size={20} color={Theme.colors.outline} />
            )}
          </View>
          <Text style={styles.itemName} numberOfLines={1}>{name}</Text>
        </View>
      </View>
      <Text style={[styles.tableCell, styles.priceCell]}>{price}</Text>
    </View>
  );
}

function ClientItem({ rank, initials, name, email, orders, color }: any) {
  return (
    <View style={styles.tableRow}>
      <Text style={[styles.tableCell, styles.rankCell]}>{rank}</Text>
      <View style={[styles.tableCell, styles.clientCell]}>
        <View style={styles.itemInfo}>
          <View style={[styles.avatar, { backgroundColor: color }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemName} numberOfLines={1}>{name}</Text>
            {email && <Text style={styles.itemSubtitle} numberOfLines={1}>{email}</Text>}
          </View>
        </View>
      </View>
      <Text style={[styles.tableCell, styles.ordersCell]}>{orders}</Text>
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
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e2e1',
  },
  headerText: {
    ...Theme.typography.labelSm,
    color: Theme.colors.onSurfaceVariant,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  tableCell: {
    justifyContent: 'center',
  },
  rankCell: {
    width: 30,
    ...Theme.typography.labelSm,
    color: Theme.colors.onSurfaceVariant,
  },
  productCell: {
    flex: 1,
  },
  clientCell: {
    flex: 1,
  },
  priceCell: {
    width: 90,
    textAlign: 'right',
    ...Theme.typography.labelMd,
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  ordersCell: {
    width: 70,
    textAlign: 'right',
    ...Theme.typography.labelMd,
    color: Theme.colors.onSurface,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  modalTitle: {
    ...Theme.typography.headlineSm,
    color: Theme.colors.onSurface,
  },
  storeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  storeOptionSelected: {
    backgroundColor: '#f0f4ff',
  },
  storeOptionText: {
    ...Theme.typography.bodyLg,
    color: Theme.colors.onSurface,
    flex: 1,
  },
  storeOptionTextSelected: {
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  modalOverlayCentered: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    width: '100%',
    overflow: 'hidden',
    ...Theme.elevation.level2,
  },
  calendarFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f2f2f2',
  },
  rangePreview: {
    ...Theme.typography.bodyMd,
    color: Theme.colors.onSurfaceVariant,
  },
  applyButton: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  applyButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  applyButtonText: {
    ...Theme.typography.labelLg,
    color: '#ffffff',
  },
  todayButton: {
    backgroundColor: Theme.colors.surfaceVariant,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    justifyContent: 'center',
  },
  todayButtonText: {
    ...Theme.typography.labelMd,
    color: Theme.colors.primary,
    fontWeight: '700',
  },
});
