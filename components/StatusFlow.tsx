import React from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Theme } from '@/constants/Theme';

export const STATUS_MAP: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  pending: { label: 'Pendiente', bg: '#f3f4f6', text: '#4b5563', dot: '#9ca3af' },
  paid: { label: 'Pagado', bg: '#dbeafe', text: '#1e40af', dot: '#2563eb' },
  received: { label: 'Recibido', bg: '#fef9c3', text: '#854d0e', dot: '#eab308' },
  shipped: { label: 'Enviado', bg: '#ffedd5', text: '#9a3412', dot: '#f97316' },
  at_door: { label: 'Por entregar', bg: '#f3e8ff', text: '#6b21a8', dot: '#9333ea' },
  delivered: { label: 'Entregado', bg: '#dcfce7', text: '#166534', dot: '#16a34a' },
  cancelled: { label: 'Cancelado', bg: '#fee2e2', text: '#991b1b', dot: '#dc2626' },
};

const SEQUENCE = ['pending', 'paid', 'received', 'shipped', 'at_door', 'delivered'];

interface StatusFlowProps {
  activeStatus: string;
  onStatusChange: (status: string) => void;
  showAll?: boolean;
}

export default function StatusFlow({ activeStatus, onStatusChange, showAll = true }: StatusFlowProps) {
  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.flowSection}>
          <View style={styles.labelContainer}>
            <View style={styles.labelIndicator} />
            <Text style={styles.labelText}>FLUJO</Text>
          </View>

          {showAll && (
            <TouchableOpacity 
              style={[styles.chip, activeStatus === '' && styles.chipActive]} 
              onPress={() => onStatusChange('')}
            >
              <Text style={[styles.chipText, activeStatus === '' && styles.chipTextActive]}>Todos</Text>
            </TouchableOpacity>
          )}

          {SEQUENCE.map((s, idx) => {
            const config = STATUS_MAP[s];
            const isActive = activeStatus === s;
            return (
              <View key={s} style={styles.chipWrapper}>
                <TouchableOpacity 
                  style={[
                    styles.chip, 
                    { backgroundColor: config.bg },
                    isActive && styles.chipSelected
                  ]}
                  onPress={() => onStatusChange(s)}
                >
                  <View style={[styles.dot, { backgroundColor: config.dot }]} />
                  <Text style={[styles.chipText, { color: config.text }]}>{config.label}</Text>
                </TouchableOpacity>
                {idx < SEQUENCE.length - 1 && (
                  <MaterialIcons name="chevron-right" size={16} color="#d1d5db" style={styles.arrow} />
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.cancelledSection}>
          <TouchableOpacity 
            style={[
              styles.chip, 
              { backgroundColor: STATUS_MAP.cancelled.bg },
              activeStatus === 'cancelled' && styles.chipSelected
            ]}
            onPress={() => onStatusChange('cancelled')}
          >
            <View style={[styles.dot, { backgroundColor: STATUS_MAP.cancelled.dot }]} />
            <Text style={[styles.chipText, { color: STATUS_MAP.cancelled.text }]}>Cancelado</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    ...Theme.elevation.level1,
  },
  scrollContent: {
    alignItems: 'center',
    paddingRight: 12,
  },
  flowSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginRight: 8,
    paddingRight: 10,
    borderRightWidth: 1,
    borderRightColor: '#f3f4f6',
  },
  labelIndicator: {
    width: 3,
    height: 14,
    borderRadius: 2,
    backgroundColor: '#000',
  },
  labelText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#374151',
    letterSpacing: 0.5,
  },
  chipWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    gap: 6,
  },
  chipActive: {
    borderColor: Theme.colors.primary,
    borderWidth: 1.5,
  },
  chipSelected: {
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
    ...Theme.elevation.level2,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#4b5563',
  },
  chipTextActive: {
    color: Theme.colors.primary,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  arrow: {
    marginHorizontal: 2,
  },
  cancelledSection: {
    paddingLeft: 12,
    marginLeft: 8,
    borderLeftWidth: 1,
    borderLeftColor: '#f3f4f6',
    borderStyle: 'dashed',
  },
});
