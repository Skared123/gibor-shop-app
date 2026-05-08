import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Theme } from '@/constants/Theme';

interface StoreFilterProps {
  label: string;
  value: string;
  onPress: () => void;
  icon?: keyof typeof MaterialIcons.glyphMap;
}

export function FilterDropdown({ icon = 'store', label, value, onPress }: StoreFilterProps) {
  return (
    <TouchableOpacity style={styles.filterBox} onPress={onPress}>
      <View style={styles.filterLabelRow}>
        <MaterialIcons name={icon as any} size={14} color={Theme.colors.onSurfaceVariant} />
        <Text style={styles.filterLabel}>{label}</Text>
      </View>
      <View style={styles.filterValueRow}>
        <Text style={styles.filterValue} numberOfLines={1}>{value}</Text>
        <MaterialIcons name="expand-more" size={20} color={Theme.colors.onSurfaceVariant} />
      </View>
    </TouchableOpacity>
  );
}

interface StoreSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  stores: any[];
  selectedStoreId: string | number;
  onSelect: (id: string | number) => void;
}

export function StoreSelectorModal({ visible, onClose, stores, selectedStoreId, onSelect }: StoreSelectorModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Seleccionar Tienda</Text>
            <TouchableOpacity onPress={onClose}>
              <MaterialIcons name="close" size={24} color={Theme.colors.onSurface} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalList} showsVerticalScrollIndicator={false}>
            <TouchableOpacity 
              style={[styles.modalItem, !selectedStoreId && styles.modalItemActive]} 
              onPress={() => onSelect('')}
            >
              <Text style={[styles.modalItemText, !selectedStoreId && styles.modalItemTextActive]}>Todas las Tiendas</Text>
              {!selectedStoreId && <MaterialIcons name="check-circle" size={20} color={Theme.colors.primary} />}
            </TouchableOpacity>
            {stores.map((s: any) => (
              <TouchableOpacity 
                key={s.id} 
                style={[styles.modalItem, selectedStoreId === s.id && styles.modalItemActive]} 
                onPress={() => onSelect(s.id)}
              >
                <Text style={[styles.modalItemText, selectedStoreId === s.id && styles.modalItemTextActive]}>{s.name}</Text>
                {selectedStoreId === s.id && <MaterialIcons name="check-circle" size={20} color={Theme.colors.primary} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  filterBox: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e4e2e1',
    ...Theme.elevation.level1,
  },
  filterLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  filterLabel: {
    ...Theme.typography.labelSm,
    color: Theme.colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  filterValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterValue: {
    ...Theme.typography.bodyMd,
    color: Theme.colors.onSurface,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: '80%',
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
    fontWeight: '700',
  },
  modalList: {
    padding: 12,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 4,
  },
  modalItemActive: {
    backgroundColor: 'rgba(242, 153, 74, 0.05)',
  },
  modalItemText: {
    ...Theme.typography.bodyMd,
    color: Theme.colors.onSurface,
  },
  modalItemTextActive: {
    color: Theme.colors.primary,
    fontWeight: '700',
  },
});
