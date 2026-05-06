import React from 'react';
import { View, StyleSheet, Text, LogBox } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { MaterialIcons } from '@expo/vector-icons';
import { Theme } from '@/constants/Theme';

// Ignore the VirtualizedList warning caused by GooglePlacesAutocomplete's internal FlatList
LogBox.ignoreLogs(['VirtualizedLists should never be nested']);

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export interface AddressResult {
  fullAddress: string;
  street: string;
  city: string;
  department: string;
  country: string;
  postalCode: string;
  lat: number;
  lng: number;
  admin1: string;
  admin2: string;
  admin3: string;
}

interface GoogleAddressSearchProps {
  onAddressSelected: (result: AddressResult) => void;
  placeholder?: string;
}

function extractComponent(components: any[], types: string[]): string {
  const found = components.find((c: any) =>
    types.some((t) => c.types.includes(t))
  );
  return found ? found.long_name : '';
}

export const GoogleAddressSearch: React.FC<GoogleAddressSearchProps> = ({
  onAddressSelected,
  placeholder = 'Buscar dirección...',
}) => {
  const handleSelect = (data: any, details: any) => {
    if (!details) return;
    const comps = details.address_components || [];
    const street = [
      extractComponent(comps, ['route']),
      extractComponent(comps, ['street_number']),
    ]
      .filter(Boolean)
      .join(' ');

    const hasAdmin2 = comps.some((c: any) => c.types.includes('administrative_area_level_2'));
    
    const admin1 = extractComponent(comps, ['administrative_area_level_1']);
    const admin2 = hasAdmin2 
      ? extractComponent(comps, ['administrative_area_level_2'])
      : extractComponent(comps, ['locality']);
    const admin3 = hasAdmin2
      ? extractComponent(comps, ['locality'])
      : extractComponent(comps, ['sublocality_level_1']);

    const countryComponent = comps.find((c: any) => c.types.includes('country'));
    const countryIso = countryComponent ? countryComponent.short_name : '';

    const result: AddressResult = {
      fullAddress: data.description,
      street: street || data.description,
      city: admin3 || admin2 || extractComponent(comps, ['locality']),
      department: admin1,
      country: countryIso,
      postalCode: extractComponent(comps, ['postal_code']),
      lat: details.geometry?.location?.lat ?? 0,
      lng: details.geometry?.location?.lng ?? 0,
      admin1,
      admin2,
      admin3,
    };

    onAddressSelected(result);
  };

  return (
    <View style={styles.container}>
      <MaterialIcons
        name="location-on"
        size={20}
        color={Theme.colors.onSurfaceVariant}
        style={styles.icon}
      />
      <GooglePlacesAutocomplete
        placeholder={placeholder}
        fetchDetails={true}
        onPress={handleSelect}
        query={{
          key: GOOGLE_MAPS_API_KEY,
          language: 'es',
        }}
        styles={{
          container: styles.autocompleteContainer,
          textInputContainer: styles.textInputContainer,
          textInput: styles.textInput,
          listView: styles.listView,
          row: styles.row,
          description: styles.description,
          poweredContainer: styles.poweredContainer,
        }}
        enablePoweredByContainer={false}
        keyboardShouldPersistTaps="handled"
        debounce={300}
        minLength={3}
        renderLeftButton={() => null}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: Theme.colors.outline,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    minHeight: 44,
  },
  icon: {
    position: 'absolute',
    left: 12,
    top: 12,
    zIndex: 1,
  },
  autocompleteContainer: {
    flex: 1,
    zIndex: 999,
  },
  textInputContainer: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderBottomWidth: 0,
    paddingLeft: 36,
  },
  textInput: {
    height: 44,
    backgroundColor: 'transparent',
    ...Theme.typography.bodyMd,
    color: Theme.colors.onSurface,
    margin: 0,
    padding: 0,
  },
  listView: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e2e1',
    borderRadius: 8,
    marginTop: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 9999,
  },
  row: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  description: {
    ...Theme.typography.bodyMd,
    color: Theme.colors.onSurface,
  },
  poweredContainer: {
    display: 'none',
  },
});
