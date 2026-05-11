import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal, FlatList, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SvgUri } from 'react-native-svg';
import { Theme } from '@/constants/Theme';

interface CountrySelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (country: any) => void;
  countries: any[];
  selectedCountryId?: number | string;
  title?: string;
}

export default function CountrySelectorModal({ 
  visible, 
  onClose, 
  onSelect, 
  countries, 
  selectedCountryId,
  title = 'Seleccionar País'
}: CountrySelectorModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={onClose}
      >
        <View style={styles.bottomSheet}>
          <View style={styles.bottomSheetHeader}>
            <View style={styles.bottomSheetHandle} />
            <Text style={styles.bottomSheetTitle}>{title}</Text>
          </View>
          <View style={styles.bottomSheetContent}>
            <FlatList
              data={countries}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[
                    styles.bottomSheetOption, 
                    selectedCountryId === item.id && styles.bottomSheetOptionActive
                  ]}
                  onPress={() => onSelect(item)}
                >
                  <View style={styles.countryInfo}>
                    {item.iso2 && (
                      <SvgUri
                        uri={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${item.iso2.toUpperCase()}.svg`}
                        width={28}
                        height={20}
                      />
                    )}
                    <Text style={[
                      styles.bottomSheetOptionText, 
                      selectedCountryId === item.id && styles.bottomSheetOptionTextActive
                    ]}>
                      {item.name}
                    </Text>
                  </View>
                  {selectedCountryId === item.id && (
                    <MaterialIcons name="check" size={20} color={Theme.colors.primary} />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={<ActivityIndicator size="small" color={Theme.colors.primary} style={{ margin: 20 }} />}
            />
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 40,
  },
  bottomSheetHeader: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginBottom: 8,
  },
  bottomSheetTitle: {
    ...Theme.typography.headlineSm,
    color: Theme.colors.onSurface,
    fontWeight: '700',
  },
  bottomSheetContent: {
    paddingHorizontal: 16,
  },
  bottomSheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
    gap: 12,
  },
  bottomSheetOptionActive: {
    backgroundColor: '#f6f3f2',
    borderRadius: 8,
  },
  countryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  bottomSheetOptionText: {
    ...Theme.typography.bodyLg,
    color: Theme.colors.onSurface,
  },
  bottomSheetOptionTextActive: {
    color: Theme.colors.primary,
    fontWeight: '700',
  },
});
