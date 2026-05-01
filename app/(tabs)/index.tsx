import React from 'react';
import { StyleSheet, ScrollView, View, Text, SafeAreaView } from 'react-native';

import { Theme } from '@/constants/Theme';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { StatusPill } from '@/components/ui/StatusPill';
import { Input } from '@/components/ui/Input';
import { Ionicons } from '@expo/vector-icons';

export default function TabOneScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola, Gibor</Text>
            <Text style={styles.subtitle}>Aquí está tu resumen de hoy</Text>
          </View>
          <Button variant="icon" iconName="notifications-outline" onPress={() => {}} />
        </View>

        {/* Quick Actions */}
        <View style={styles.actionRow}>
          <Button 
            title="Nueva Orden" 
            iconName="add" 
            onPress={() => {}} 
            style={styles.flexButton}
          />
          <View style={{ width: Theme.spacing.sm }} />
          <Button 
            title="Inventario" 
            variant="secondary" 
            iconName="cube-outline" 
            onPress={() => {}} 
            style={styles.flexButton}
          />
        </View>

        {/* Search */}
        <Input 
          placeholder="Buscar pedidos, productos o clientes..." 
          iconName="search"
        />

        {/* Summary Cards */}
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <View style={styles.statHeader}>
              <Ionicons name="cart-outline" size={24} color={Theme.colors.primary} />
              <StatusPill label="+12%" variant="success" />
            </View>
            <Text style={styles.statValue}>142</Text>
            <Text style={styles.statLabel}>Ventas del Día</Text>
          </Card>

          <Card style={styles.statCard}>
            <View style={styles.statHeader}>
              <Ionicons name="cash-outline" size={24} color={Theme.colors.secondary} />
            </View>
            <Text style={styles.statValue}>$4,250</Text>
            <Text style={styles.statLabel}>Ingresos Estimados</Text>
          </Card>
        </View>

        {/* Recent Orders List */}
        <Text style={styles.sectionTitle}>Órdenes Recientes</Text>
        
        <Card>
          {/* List Item 1 */}
          <View style={styles.listItem}>
            <View style={styles.listLeft}>
              <Text style={styles.itemTitle}>Orden #1024</Text>
              <Text style={styles.itemSubtitle}>Carlos Martínez</Text>
            </View>
            <View style={styles.listRight}>
              <Text style={styles.itemPrice}>$120.00</Text>
              <StatusPill label="Pendiente" variant="pending" />
            </View>
          </View>

          {/* List Item 2 */}
          <View style={styles.listItem}>
            <View style={styles.listLeft}>
              <Text style={styles.itemTitle}>Orden #1023</Text>
              <Text style={styles.itemSubtitle}>Lucía Fernández</Text>
            </View>
            <View style={styles.listRight}>
              <Text style={styles.itemPrice}>$340.50</Text>
              <StatusPill label="Activa" variant="success" />
            </View>
          </View>

          {/* List Item 3 */}
          <View style={[styles.listItem, styles.lastListItem]}>
            <View style={styles.listLeft}>
              <Text style={styles.itemTitle}>Orden #1022</Text>
              <Text style={styles.itemSubtitle}>Empresa XYZ</Text>
            </View>
            <View style={styles.listRight}>
              <Text style={styles.itemPrice}>$1,200.00</Text>
              <StatusPill label="Completado" variant="neutral" />
            </View>
          </View>
        </Card>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  container: {
    padding: Theme.spacing.marginMobile,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  greeting: {
    ...Theme.typography.headlineMd,
    color: Theme.colors.onSurface,
  },
  subtitle: {
    ...Theme.typography.bodyMd,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    marginBottom: Theme.spacing.lg,
  },
  flexButton: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.lg,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  statValue: {
    ...Theme.typography.headlineLg,
    color: Theme.colors.onSurface,
    marginBottom: Theme.spacing.xs,
  },
  statLabel: {
    ...Theme.typography.labelMd,
    color: Theme.colors.onSurfaceVariant,
  },
  sectionTitle: {
    ...Theme.typography.headlineSm,
    color: Theme.colors.onSurface,
    marginBottom: Theme.spacing.sm,
    marginTop: Theme.spacing.sm,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.divider,
  },
  lastListItem: {
    borderBottomWidth: 0,
  },
  listLeft: {
    flex: 1,
  },
  listRight: {
    alignItems: 'flex-end',
  },
  itemTitle: {
    ...Theme.typography.labelLg,
    color: Theme.colors.onSurface,
  },
  itemSubtitle: {
    ...Theme.typography.bodySm,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  itemPrice: {
    ...Theme.typography.labelLg,
    color: Theme.colors.onSurface,
    marginBottom: 4,
  },
});
