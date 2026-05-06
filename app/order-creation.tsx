import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, TextInput, SafeAreaView, Switch, Image, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '@/constants/Theme';
import { Card } from '@/components/ui/Card';
import { useAppData } from '@/context/AppDataContext';
import { Modal } from 'react-native';
import { COUNTRIES } from '@/constants/Countries';
import { GoogleAddressSearch, AddressResult } from '@/components/ui/GoogleAddressSearch';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

const normalizeLocationString = (str: string): string => {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
};

const getCanonicalKey = (loc: { 
  country?: string; 
  admin1?: string; 
  admin2?: string; 
  admin3?: string 
}): string => {
  const c = loc.country || '';
  const a1 = normalizeLocationString(loc.admin1 || '');
  const a2 = loc.admin2 ? normalizeLocationString(loc.admin2) : '';
  const a3 = loc.admin3 ? normalizeLocationString(loc.admin3) : '';
  
  return `${c}|${a1}|${a2}|${a3}`;
};

export default function OrderCreationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [hasNotes, setHasNotes] = useState(false);
  const [isForMe, setIsForMe] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [shippingType, setShippingType] = useState<'with_collection' | 'without_collection'>('without_collection');
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [address, setAddress] = useState('');
  const [department, setDepartment] = useState('');
  const [district, setDistrict] = useState('');
  const [adminLocation, setAdminLocation] = useState<{ country: string, admin1: string, admin2: string, admin3: string }>({ country: '', admin1: '', admin2: '', admin3: '' });
  const [zip, setZip] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [showManualAddress, setShowManualAddress] = useState(false);
  const [notes, setNotes] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(true);
  
  // Lista de productos seleccionados
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [searchProductQuery, setSearchProductQuery] = useState('');

  // Voucher de pago
  const [voucherFile, setVoucherFile] = useState<{ uri: string, name: string, type: 'image' | 'document' } | null>(null);
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [dynamicShippingCost, setDynamicShippingCost] = useState(0);

  const { stores, selectedStore, setSelectedStore, preferredCountry, selectedProduct, catalogProducts } = useAppData();
  const [selectedPhoneCountry, setSelectedPhoneCountry] = useState<any>(null);

  // Sincronizar país del teléfono con el país seleccionado en el catálogo (filtro anterior)
  // o con el país de la tienda seleccionada (comportamiento web)
  React.useEffect(() => {
    if (!COUNTRIES || COUNTRIES.length === 0) return;

    // Buscar el país por defecto (Colombia) o el primero de la lista
    const colombia = COUNTRIES.find(c => c.iso2 === 'CO');
    const defaultFallback = colombia || COUNTRIES[0];

    let countryToSet = selectedPhoneCountry || defaultFallback;

    // 1. Intentar buscar por preferredCountry (filtro del catálogo)
    if (preferredCountry) {
      const foundByPreferred = COUNTRIES.find(
        c => c.iso2.toUpperCase() === preferredCountry.iso2?.toUpperCase() || 
             c.name.toLowerCase() === preferredCountry.name?.toLowerCase()
      );
      if (foundByPreferred) {
        countryToSet = foundByPreferred;
      }
    }

    // 2. Si hay una tienda seleccionada, intentar sincronizar con su país (comportamiento web)
    // Pero solo si no hemos encontrado uno por preferredCountry o si queremos que la tienda mande
    if (selectedStore?.country) {
      const storeCountryIso = typeof selectedStore.country === 'object' 
        ? selectedStore.country.iso2 
        : null;
      
      if (storeCountryIso) {
        const foundByStore = COUNTRIES.find(
          c => c.iso2.toUpperCase() === storeCountryIso.toUpperCase()
        );
        if (foundByStore) {
          countryToSet = foundByStore;
        }
      }
    }

    if (countryToSet && countryToSet.iso2 !== selectedPhoneCountry?.iso2) {
      setSelectedPhoneCountry(countryToSet);
    }
  }, [selectedStore, preferredCountry]);

  // Sincronizar el producto seleccionado desde el catálogo al entrar
  React.useEffect(() => {
    if (selectedProduct && selectedItems.length === 0) {
      const price = isForMe 
        ? selectedProduct.price 
        : (selectedProduct.suggested_price || selectedProduct.price);
      
      setSelectedItems([{
        product: selectedProduct,
        quantity: 1,
        price: price ? price.toString() : '0'
      }]);
    }
  }, [selectedProduct]);

  // Sincronizar precios de todos los productos basados en "Este pedido es para mí"
  React.useEffect(() => {
    setSelectedItems(prevItems => prevItems.map(item => {
      const price = isForMe 
        ? item.product.price 
        : (item.product.suggested_price || item.product.price);
      return { ...item, price: price ? price.toString() : '0' };
    }));
  }, [isForMe]);

  // Cargar costo de envío dinámico basado en la ubicación
  React.useEffect(() => {
    const fetchShippingCost = async () => {
      // Use the specific country from Google Maps if available, otherwise fallback to the phone prefix
      const countryIso = adminLocation.country || selectedPhoneCountry?.iso2;
      // We need at least department to search
      if (!countryIso || (!department && !adminLocation.admin1)) return;

      const a1 = adminLocation.admin1 || department;
      const a2 = adminLocation.admin2 || district;
      const a3 = adminLocation.admin3 || '';

      const keysToTry = [
        getCanonicalKey({ country: countryIso, admin1: a1, admin2: a2, admin3: a3 }),
        getCanonicalKey({ country: countryIso, admin1: a1, admin2: a2, admin3: '' }),
        getCanonicalKey({ country: countryIso, admin1: a1, admin2: '', admin3: '' }),
      ];

      const baseUrl = (process.env.EXPO_PUBLIC_API_URL || 'https://shop.giborcommunity.com')
        .replace(/\/api$/, ''); // strip trailing /api — path appended below

      for (const key of keysToTry) {
        try {
          const url = `${baseUrl}/api/shipping-rates?where[key][equals]=${key}`;
          const response = await fetch(url);
          const res = await response.json();
          if (res.docs && res.docs.length > 0) {
            setDynamicShippingCost(res.docs[0].cost);
            return;
          }
        } catch (err) {
          console.error(`[ShippingCost] Error fetching shipping rate for ${key}:`, err);
        }
      }

      // Fallback search using contains (e.g. for "lima|miraflores" manual entry)
      if (a1 && a2) {
        try {
          const fallbackQuery = `${normalizeLocationString(a1)}|${normalizeLocationString(a2)}`;
          const url = `${baseUrl}/api/shipping-rates?where[key][contains]=${fallbackQuery}`;
          const response = await fetch(url);
          const res = await response.json();
          if (res.docs && res.docs.length > 0) {
            setDynamicShippingCost(res.docs[0].cost);
            return;
          }
        } catch (err) {
          console.error('[ShippingCost] Error with fallback shipping rate:', err);
        }
      }

      setDynamicShippingCost(0);
    };

    fetchShippingCost();
  }, [selectedPhoneCountry, department, district, adminLocation]);

  const removeItem = (productId: string | number) => {
    setSelectedItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string | number, delta: number) => {
    setSelectedItems(prev => prev.map(item => {
      if (item.product.id === productId) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    }));
  };

  const updateItemPrice = (productId: string | number, newPrice: string) => {
    setSelectedItems(prev => prev.map(item => {
      if (item.product.id === productId) {
        return { ...item, price: newPrice };
      }
      return item;
    }));
  };

  const addProductToOrder = (product: any) => {
    if (selectedItems.find(item => item.product.id === product.id)) return;
    
    const price = isForMe 
      ? product.price 
      : (product.suggested_price || product.price);

    setSelectedItems(prev => [...prev, {
      product,
      quantity: 1,
      price: price ? price.toString() : '0'
    }]);
    setShowProductSearch(false);
  };

  const filteredProducts = (catalogProducts || []).filter(p => 
    p.name.toLowerCase().includes(searchProductQuery.toLowerCase()) &&
    !selectedItems.find(item => item.product.id === p.id)
  );

  const validateEmail = (text: string) => {
    setEmail(text);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsEmailValid(text === '' || emailRegex.test(text));
  };

  const MAX_FILE_SIZE_MB = 5;

  const validateFileSize = async (uri: string): Promise<boolean> => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const sizeMB = blob.size / (1024 * 1024);
      return sizeMB <= MAX_FILE_SIZE_MB;
    } catch (e) {
      console.warn("Could not calculate file size, allowing by default", e);
      return true; // Fallback
    }
  };

  const pickImage = async (useCamera: boolean = false) => {
    setShowVoucherModal(false);
    
    let permissionResult;
    if (useCamera) {
      permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    } else {
      permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    }

    if (permissionResult.status !== 'granted') {
      Alert.alert('Permiso denegado', 'Se requieren permisos para acceder a las fotos o cámara.');
      return;
    }

    const result = useCamera 
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          quality: 0.8,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.8,
        });

    if (!result.canceled && result.assets && result.assets[0]) {
      const asset = result.assets[0];
      const uri = asset.uri;
      const fileSizeOk = asset.fileSize ? (asset.fileSize / (1024 * 1024) <= MAX_FILE_SIZE_MB) : await validateFileSize(uri);
      
      if (!fileSizeOk) {
        Alert.alert('Error', 'El archivo excede el tamaño máximo de 5MB.');
        return;
      }
      
      const fileName = asset.fileName || uri.split('/').pop() || 'imagen.jpg';
      setVoucherFile({ uri, name: fileName, type: 'image' });
    }
  };

  const pickDocument = async () => {
    setShowVoucherModal(false);
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      const asset = result.assets[0];
      const uri = asset.uri;
      
      const fileSizeOk = asset.size ? (asset.size / (1024 * 1024) <= MAX_FILE_SIZE_MB) : await validateFileSize(uri);
      if (!fileSizeOk) {
        Alert.alert('Error', 'El archivo excede el tamaño máximo de 5MB.');
        return;
      }

      setVoucherFile({ uri, name: asset.name, type: 'document' });
    }
  };

  const subtotal = selectedItems.reduce((acc, item) => acc + (parseFloat(item.price || '0') * item.quantity), 0);
  const shippingCost = dynamicShippingCost; // Tomado dinámicamente de la API según departamento/distrito
  const platformFee = 0; // Se deja en 0 según la lógica base de la versión web
  const finalTotal = subtotal + shippingCost + platformFee;

  return (
    <View style={styles.flex}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={Theme.colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Creación de orden manual</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del cliente</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Tienda</Text>
            <TouchableOpacity 
              style={styles.dropdown}
              onPress={() => setShowStoreModal(true)}
            >
              <Text style={styles.dropdownText}>
                {selectedStore ? selectedStore.name : 'Seleccionar tienda'}
              </Text>
              <MaterialIcons name="expand-more" size={20} color={Theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Nombres</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Ej. Juan" 
                placeholderTextColor={Theme.colors.placeholder} 
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Apellidos</Text>
              <TextInput 
                style={styles.input} 
                placeholder="Ej. Pérez" 
                placeholderTextColor={Theme.colors.placeholder} 
                value={lastName}
                onChangeText={setLastName}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, { width: 110 }]}>
              <Text style={styles.label}>País</Text>
              <TouchableOpacity 
                style={styles.dropdown}
                onPress={() => setShowCountryModal(true)}
              >
                <Text style={styles.dropdownText}>
                  {selectedPhoneCountry ? `${getFlagEmoji(selectedPhoneCountry.iso2)} +${selectedPhoneCountry.phone_prefix}` : '+--'}
                </Text>
                <MaterialIcons name="expand-more" size={16} color={Theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Número de teléfono</Text>
              <TextInput 
                style={styles.input} 
                placeholder="300 000 0000" 
                keyboardType="phone-pad"
                placeholderTextColor={Theme.colors.placeholder}
                value={phoneNumber}
                onChangeText={(text) => {
                  // Solo permitir números
                  const filtered = text.replace(/[^0-9]/g, '');
                  setPhoneNumber(filtered);
                }}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <View style={styles.rowBetween}>
              <Text style={styles.label}>Buscar dirección (Google Maps)</Text>
              <TouchableOpacity onPress={() => setShowManualAddress(!showManualAddress)}>
                <Text style={styles.textLink}>{showManualAddress ? 'Ocultar campos' : 'Ingreso manual'}</Text>
              </TouchableOpacity>
            </View>
            <GoogleAddressSearch
              placeholder="Buscar dirección..."
              onAddressSelected={(result: AddressResult) => {
                setAddress(result.street || result.fullAddress);
                setDepartment(result.department);
                setDistrict(result.city);
                setAdminLocation({
                  country: result.country,
                  admin1: result.admin1,
                  admin2: result.admin2,
                  admin3: result.admin3,
                });
                setZip(result.postalCode);
                setShowManualAddress(true);
              }}
            />
          </View>

          {showManualAddress && (
            <>
              <View style={styles.row}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Departamento</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="Ej. Antioquia" 
                    placeholderTextColor={Theme.colors.placeholder} 
                    value={department}
                    onChangeText={setDepartment}
                  />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Distrito / Ciudad</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="Ej. Medellín" 
                    placeholderTextColor={Theme.colors.placeholder} 
                    value={district}
                    onChangeText={setDistrict}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Código postal</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="Ej. 050001" 
                  placeholderTextColor={Theme.colors.placeholder} 
                  value={zip}
                  onChangeText={setZip}
                  keyboardType="numeric"
                />
              </View>
            </>
          )}

          <View style={styles.formGroup}>
            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput 
              style={[styles.input, !isEmailValid && styles.inputError]} 
              placeholder="ejemplo@correo.com" 
              keyboardType="email-address" 
              placeholderTextColor={Theme.colors.placeholder} 
              value={email}
              onChangeText={validateEmail}
              autoCapitalize="none"
            />
            {!isEmailValid && <Text style={styles.errorText}>Correo electrónico inválido</Text>}
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleText}>¿Desea agregar notas para el proveedor?</Text>
            <Switch 
              value={hasNotes} 
              onValueChange={setHasNotes} 
              trackColor={{ false: Theme.colors.surfaceVariant, true: Theme.colors.primaryContainer }}
              thumbColor="#ffffff"
            />
          </View>

          {hasNotes && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Notas</Text>
              <TextInput 
                style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 12 }]} 
                placeholder="Escribe aquí tus notas..." 
                placeholderTextColor={Theme.colors.placeholder} 
                multiline={true}
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          )}

          <View style={styles.formGroup}>
            <Text style={styles.label}>Voucher de pago</Text>
            {voucherFile ? (
              <View style={styles.selectedFileContainer}>
                <View style={styles.fileIconContainer}>
                  <MaterialIcons 
                    name={voucherFile.type === 'image' ? 'image' : 'picture-as-pdf'} 
                    size={24} 
                    color={Theme.colors.primary} 
                  />
                </View>
                <View style={styles.fileDetails}>
                  <Text style={styles.fileName} numberOfLines={1}>{voucherFile.name}</Text>
                  <Text style={styles.fileSize}>Archivo adjunto</Text>
                </View>
                <TouchableOpacity 
                  style={styles.removeFileBtn}
                  onPress={() => setVoucherFile(null)}
                >
                  <MaterialIcons name="close" size={20} color={Theme.colors.error} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.uploadBox} onPress={() => setShowVoucherModal(true)}>
                <MaterialIcons name="cloud-upload" size={32} color={Theme.colors.outline} />
                <Text style={styles.uploadTitle}>Toca para subir o tomar foto</Text>
                <Text style={styles.uploadSubtitle}>JPG, PNG, PDF (Max. 5MB)</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Seleccionar Productos</Text>
            <View style={styles.meToggle}>
              <Text style={styles.meToggleText}>Este pedido es para mí</Text>
              <Switch 
                value={isForMe} 
                onValueChange={setIsForMe}
                trackColor={{ false: Theme.colors.surfaceVariant, true: Theme.colors.primaryContainer }}
                thumbColor="#ffffff"
                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
              />
            </View>
          </View>

          {selectedItems.length > 0 ? (
            selectedItems.map((item) => (
              <View key={item.product.id} style={styles.productItemCard}>
                <View style={styles.productItemHeader}>
                  {item.product.images?.[0] && (
                    <Image 
                      source={{ uri: `https://shop.giborcommunity.com/api/media-url/${typeof item.product.images[0] === 'object' ? item.product.images[0].id : item.product.images[0]}` }} 
                      style={styles.productItemImage} 
                    />
                  )}
                  <Text style={styles.productName} numberOfLines={2}>{item.product.name}</Text>
                </View>
                <View style={styles.row}>
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.smallLabel}>Precio ({preferredCountry?.currency || 'COP'})</Text>
                    <TextInput 
                      style={styles.smallInput} 
                      value={item.price} 
                      onChangeText={(text) => updateItemPrice(item.product.id, text)}
                      keyboardType="numeric" 
                    />
                  </View>
                  <View style={[styles.formGroup, { width: 100, marginLeft: 16 }]}>
                    <Text style={styles.smallLabel}>Cantidad</Text>
                    <View style={styles.quantityControls}>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.product.id, -1)}>
                        <Text style={styles.qtyBtnText}>-</Text>
                      </TouchableOpacity>
                      <Text style={styles.qtyValue}>{item.quantity}</Text>
                      <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.product.id, 1)}>
                        <Text style={styles.qtyBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Moved delete button to bottom of stack and added zIndex for better touch response */}
                <TouchableOpacity 
                  style={styles.deleteButton} 
                  onPress={() => removeItem(item.product.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialIcons name="delete" size={18} color={Theme.colors.error} />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.emptyProductsContainer}>
              <Text style={styles.emptyProductsText}>
                Agrega productos desde el catálogo (botón “Agregar a orden”).
              </Text>
            </View>
          )}

          <TouchableOpacity 
            style={styles.searchProductBox}
            onPress={() => setShowProductSearch(true)}
          >
            <MaterialIcons name="search" size={20} color={Theme.colors.primaryContainer} style={styles.searchProductIcon} />
            <Text style={[styles.searchProductInput, { color: Theme.colors.primaryContainer + 'b3' }]}>
              Buscar y agregar producto...
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seleccione una transportadora</Text>
          <View style={styles.shippingOptions}>
            <TouchableOpacity 
              style={[styles.radioOption, shippingType === 'with_collection' && styles.radioActive]} 
              onPress={() => setShippingType('with_collection')}
            >
              <View style={[styles.radioCircle, shippingType === 'with_collection' && styles.radioCircleActive]} />
              <Text style={styles.radioText}>Con Recaudo: (Contra Entrega)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.radioOption, shippingType === 'without_collection' && styles.radioActive]} 
              onPress={() => setShippingType('without_collection')}
            >
              <View style={[styles.radioCircle, shippingType === 'without_collection' && styles.radioCircleActive]} />
              <Text style={styles.radioText}>Sin Recaudo</Text>
            </TouchableOpacity>
          </View>

          {/* <View style={styles.row}>
            <View style={styles.carrierPlaceholder}>
              <Text style={styles.carrierText}>Servientrega</Text>
            </View>
            <View style={[styles.carrierPlaceholder, styles.carrierSelected, { marginLeft: 12 }]}>
              <Text style={[styles.carrierText, styles.carrierTextSelected]}>Inter Rapidísimo</Text>
            </View>
          </View> */}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen de la orden</Text>
          <View style={styles.summaryTable}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Producto</Text>
              <Text style={[styles.tableHeaderText, { textAlign: 'right' }]}>Precio de venta</Text>
            </View>
            {selectedItems.map((item) => (
              <View key={item.product.id} style={styles.tableRow}>
                <Text style={styles.tableCell}>{item.product.name} x{item.quantity}</Text>
                <Text style={[styles.tableCell, { textAlign: 'right' }]}>
                  ${(parseFloat(item.price || '0') * item.quantity).toLocaleString()}
                </Text>
              </View>
            ))}
            {selectedItems.length === 0 && (
              <View style={styles.tableRow}>
                <Text style={[styles.tableCell, { opacity: 0.5 }]}>Sin productos seleccionados</Text>
              </View>
            )}
          </View>

          <View style={styles.totalsContainer}>
            <SummaryRow label="Total a recaudar" value={`$${subtotal.toLocaleString()}`} />
            <SummaryRow label="Precio de envío" value={`$${shippingCost.toLocaleString()}`} />
            <SummaryRow label="Comisión de la plataforma" value={`$${platformFee.toLocaleString()}`} />
            <View style={styles.totalDivider} />
            <View style={styles.finalTotalRow}>
              <Text style={styles.finalTotalLabel}>Total</Text>
              <Text style={styles.finalTotalValue}>${finalTotal.toLocaleString()}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.submitButton}>
          <Text style={styles.submitButtonText}>Crear orden</Text>
        </TouchableOpacity>
      </View>

      {/* Modal Selection for Voucher */}
      <Modal visible={showVoucherModal} transparent={true} animationType="fade">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowVoucherModal(false)}
        >
          <View style={styles.bottomSheet}>
            <View style={styles.bottomSheetHeader}>
              <View style={styles.bottomSheetHandle} />
              <Text style={styles.bottomSheetTitle}>Opciones de subida</Text>
            </View>
            <View style={styles.voucherOptionsContainer}>
              <TouchableOpacity style={styles.voucherOptionBtn} onPress={() => pickImage(true)}>
                <MaterialIcons name="photo-camera" size={24} color={Theme.colors.onSurface} />
                <Text style={styles.voucherOptionText}>Tomar foto</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.voucherOptionBtn} onPress={() => pickImage(false)}>
                <MaterialIcons name="photo-library" size={24} color={Theme.colors.onSurface} />
                <Text style={styles.voucherOptionText}>Seleccionar imagen</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.voucherOptionBtn} onPress={pickDocument}>
                <MaterialIcons name="insert-drive-file" size={24} color={Theme.colors.onSurface} />
                <Text style={styles.voucherOptionText}>Subir archivo (PDF)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal Tiendas */}
      <Modal visible={showStoreModal} transparent={true} animationType="fade">
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowStoreModal(false)}
        >
          <View style={styles.bottomSheet}>
            <View style={styles.bottomSheetHeader}>
              <View style={styles.bottomSheetHandle} />
              <Text style={styles.bottomSheetTitle}>Seleccionar Tienda</Text>
            </View>
            <ScrollView style={styles.bottomSheetContent}>
              {stores.map((store) => (
                <TouchableOpacity 
                  key={store.id} 
                  style={[
                    styles.bottomSheetOption, 
                    selectedStore?.id === store.id && styles.bottomSheetOptionActive
                  ]}
                  onPress={() => {
                    setSelectedStore(store);
                    setShowStoreModal(false);
                  }}
                >
                  <View style={styles.storeOptionRow}>
                    <MaterialIcons 
                      name="storefront" 
                      size={20} 
                      color={selectedStore?.id === store.id ? Theme.colors.primary : Theme.colors.onSurfaceVariant} 
                    />
                    <Text style={[
                      styles.bottomSheetOptionText, 
                      selectedStore?.id === store.id && styles.bottomSheetOptionTextActive
                    ]}>
                      {store.name}
                    </Text>
                  </View>
                  {selectedStore?.id === store.id && <MaterialIcons name="check" size={20} color={Theme.colors.primary} />}
                </TouchableOpacity>
              ))}
              {stores.length === 0 && (
                <View style={styles.emptyStoresContainer}>
                  <Text style={styles.emptyStoresText}>No tienes tiendas registradas</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Country/Prefix Selection Modal */}
      <Modal
        visible={showCountryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCountryModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowCountryModal(false)}
        >
          <View style={styles.bottomSheet}>
            <View style={styles.bottomSheetHeader}>
              <View style={styles.bottomSheetHandle} />
              <Text style={styles.bottomSheetTitle}>Seleccionar País</Text>
            </View>
            <ScrollView style={styles.bottomSheetContent}>
              {COUNTRIES.map((country) => (
                <TouchableOpacity 
                  key={country.iso2} 
                  style={[
                    styles.bottomSheetOption, 
                    selectedPhoneCountry?.iso2 === country.iso2 && styles.bottomSheetOptionActive
                  ]}
                  onPress={() => {
                    setSelectedPhoneCountry(country);
                    setShowCountryModal(false);
                  }}
                >
                  <View style={styles.storeOptionRow}>
                    <Text style={styles.countryFlagText}>
                      {getFlagEmoji(country.iso2)}
                    </Text>
                    <Text style={[
                      styles.bottomSheetOptionText, 
                      selectedPhoneCountry?.iso2 === country.iso2 && styles.bottomSheetOptionTextActive
                    ]}>
                      {country.name} (+{country.phone_prefix})
                    </Text>
                  </View>
                  {selectedPhoneCountry?.iso2 === country.iso2 && <MaterialIcons name="check" size={20} color={Theme.colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Product Search Modal */}
      <Modal
        visible={showProductSearch}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProductSearch(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheetFull}>
            <View style={styles.bottomSheetHeader}>
              <View style={styles.bottomSheetHandle} />
              <Text style={styles.bottomSheetTitle}>Agregar Producto</Text>
              <TouchableOpacity 
                style={styles.closeModalBtn} 
                onPress={() => setShowProductSearch(false)}
              >
                <MaterialIcons name="close" size={24} color={Theme.colors.onSurface} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.searchModalInputContainer}>
              <MaterialIcons name="search" size={20} color={Theme.colors.outline} />
              <TextInput 
                style={styles.searchModalInput}
                placeholder="Buscar por nombre..."
                value={searchProductQuery}
                onChangeText={setSearchProductQuery}
                autoFocus
              />
            </View>

            <ScrollView style={styles.bottomSheetContent}>
              {filteredProducts.map((product) => (
                <TouchableOpacity 
                  key={product.id} 
                  style={styles.productSearchOption}
                  onPress={() => addProductToOrder(product)}
                >
                  <Image 
                    source={{ uri: product.images?.[0] ? `https://shop.giborcommunity.com/api/media-url/${typeof product.images[0] === 'object' ? product.images[0].id : product.images[0]}` : 'https://via.placeholder.com/40' }} 
                    style={styles.productSearchImage} 
                  />
                  <View style={styles.productSearchInfo}>
                    <Text style={styles.productSearchName}>{product.name}</Text>
                    <Text style={styles.productSearchPrice}>
                      {preferredCountry?.currency || 'COP'} {isForMe ? product.price : (product.suggested_price || product.price)}
                    </Text>
                  </View>
                  <MaterialIcons name="add-circle-outline" size={24} color={Theme.colors.primary} />
                </TouchableOpacity>
              ))}
              {filteredProducts.length === 0 && (
                <View style={styles.emptySearch}>
                  <Text style={styles.emptySearchText}>No se encontraron productos</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string, value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
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
    height: 100,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
    ...Theme.elevation.level1,
  } as const,
  headerTitle: {
    ...Theme.typography.headlineSm,
    color: Theme.colors.onSurface,
    fontWeight: '600',
  } as const,
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  } as const,
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  } as const,
  section: {
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
    gap: 16,
  } as const,
  sectionTitle: {
    ...Theme.typography.headlineSm,
    color: Theme.colors.onSurface,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
    paddingBottom: 8,
  } as const,
  formGroup: {
    gap: 4,
  } as const,
  label: {
    ...Theme.typography.labelMd,
    color: Theme.colors.onSurfaceVariant,
  } as const,
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: Theme.colors.outline,
    borderRadius: 8,
    paddingHorizontal: 12,
    ...Theme.typography.bodyMd,
    color: Theme.colors.onSurface,
    backgroundColor: '#ffffff',
  } as const,
  inputWithIcon: {
    position: 'relative',
    justifyContent: 'center',
  } as const,
  leftIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  } as const,
  dropdown: {
    height: 44,
    borderWidth: 1,
    borderColor: Theme.colors.outline,
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
  } as const,
  dropdownText: {
    ...Theme.typography.bodyMd,
    color: Theme.colors.onSurface,
  } as const,
  row: {
    flexDirection: 'row',
    gap: 12,
  } as const,
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  } as const,
  toggleText: {
    flex: 1,
    ...Theme.typography.bodyMd,
    color: Theme.colors.onSurface,
    marginRight: 12,
  } as const,
  uploadBox: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: Theme.colors.outline,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    backgroundColor: '#f6f3f2',
  } as const,
  uploadTitle: {
    ...Theme.typography.bodySm,
    color: Theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginTop: 8,
  } as const,
  uploadSubtitle: {
    ...Theme.typography.labelSm,
    color: Theme.colors.outline,
    marginTop: 4,
  } as const,
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
    paddingBottom: 8,
  } as const,
  meToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  } as const,
  meToggleText: {
    fontSize: 10,
    color: Theme.colors.onSurfaceVariant,
  } as const,
  productItemCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e4e2e1',
    position: 'relative',
    gap: 8,
  } as const,
  productName: {
    ...Theme.typography.labelLg,
    color: Theme.colors.onSurface,
    paddingRight: 36,
  } as const,
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 8,
    zIndex: 10,
  } as const,
  smallLabel: {
    fontSize: 10,
    color: Theme.colors.onSurfaceVariant,
    marginBottom: 2,
  } as const,
  smallInput: {
    height: 32,
    borderWidth: 1,
    borderColor: Theme.colors.outline,
    borderRadius: 6,
    paddingHorizontal: 8,
    fontSize: 12,
    backgroundColor: '#ffffff',
  } as const,
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.outline,
    borderRadius: 6,
    height: 32,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  } as const,
  qtyBtn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f2f2f2',
  } as const,
  qtyBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.onSurfaceVariant,
  } as const,
  qtyValue: {
    flex: 1.5,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  } as const,
  searchProductBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.primaryContainer + '20',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Theme.colors.primaryContainer,
  },
  searchProductIcon: {
    marginRight: 8,
  },
  searchProductInput: {
    flex: 1,
    fontSize: 14,
    color: Theme.colors.primaryContainer,
  },
  productItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingRight: 30,
  },
  productItemImage: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#f0eded',
    marginRight: 12,
  },
  emptyProductsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  emptyProductsText: {
    ...Theme.typography.bodyMd,
    color: Theme.colors.onSurface, // Darker text
    textAlign: 'center',
    marginTop: 0,
    paddingHorizontal: 16,
  },
  bottomSheetFull: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    flex: 1,
    marginTop: 60,
  },
  closeModalBtn: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  searchModalInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    height: 48,
  },
  searchModalInput: {
    flex: 1,
    marginLeft: 8,
    ...Theme.typography.bodyMd,
  },
  productSearchOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productSearchImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: '#f0eded',
  },
  productSearchInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productSearchName: {
    ...Theme.typography.bodyMd,
    fontWeight: '600',
    color: Theme.colors.onSurface,
  },
  productSearchPrice: {
    ...Theme.typography.bodySm,
    color: Theme.colors.primary,
    marginTop: 2,
  },
  emptySearch: {
    padding: 40,
    alignItems: 'center',
  },
  shippingOptions: {
    gap: 12,
  } as const,
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: Theme.colors.outline,
    borderRadius: 8,
    gap: 12,
  } as const,
  radioActive: {
    borderColor: Theme.colors.primaryContainer,
    backgroundColor: Theme.colors.primaryContainer + '0d',
  } as const,
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Theme.colors.outline,
  } as const,
  radioCircleActive: {
    borderColor: Theme.colors.primaryContainer,
    backgroundColor: Theme.colors.primaryContainer,
  } as const,
  radioText: {
    ...Theme.typography.bodyMd,
    color: Theme.colors.onSurface,
  } as const,
  carrierPlaceholder: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e4e2e1',
    backgroundColor: '#f6f3f2',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.5,
  } as const,
  carrierSelected: {
    borderColor: Theme.colors.primaryContainer,
    backgroundColor: '#ffffff',
    opacity: 1,
  } as const,
  carrierText: {
    fontSize: 12,
    color: Theme.colors.onSurfaceVariant,
  } as const,
  carrierTextSelected: {
    color: Theme.colors.primaryContainer,
    fontWeight: '600',
  } as const,
  summaryTable: {
    borderWidth: 1,
    borderColor: '#e4e2e1',
    borderRadius: 8,
    overflow: 'hidden',
  } as const,
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f6f3f2',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e4e2e1',
  } as const,
  tableHeaderText: {
    flex: 1,
    ...Theme.typography.labelMd,
    color: Theme.colors.onSurfaceVariant,
  } as const,
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#ffffff',
  } as const,
  tableCell: {
    flex: 1,
    ...Theme.typography.bodySm,
    color: Theme.colors.onSurface,
  } as const,
  totalsContainer: {
    gap: 4,
  } as const,
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  } as const,
  summaryLabel: {
    ...Theme.typography.bodySm,
    color: Theme.colors.onSurfaceVariant,
  } as const,
  summaryValue: {
    ...Theme.typography.bodySm,
    color: Theme.colors.onSurfaceVariant,
  } as const,
  totalDivider: {
    height: 1,
    backgroundColor: '#f2f2f2',
    marginVertical: 8,
  } as const,
  finalTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as const,
  finalTotalLabel: {
    ...Theme.typography.headlineSm,
    color: Theme.colors.onSurface,
  } as const,
  finalTotalValue: {
    ...Theme.typography.headlineSm,
    color: '#27ae60', // success color
    fontWeight: '700',
  } as const,
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f2f2f2',
    ...Theme.elevation.level2,
    gap: 12,
  } as const,
  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Theme.colors.onSurfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  } as const,
  cancelButtonText: {
    ...Theme.typography.labelLg,
    color: Theme.colors.onSurface,
  } as const,
  submitButton: {
    flex: 1.5,
    height: 48,
    borderRadius: 8,
    backgroundColor: Theme.colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Theme.colors.primaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  } as const,
  submitButtonText: {
    ...Theme.typography.labelLg,
    color: '#ffffff',
  } as const,
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textLink: {
    ...Theme.typography.labelSm,
    color: Theme.colors.primary,
    fontWeight: '600',
  },
  inputError: {
    borderColor: Theme.colors.error,
    borderWidth: 1,
  },
  errorText: {
    ...Theme.typography.bodySm,
    color: Theme.colors.error,
    marginTop: 4,
  },
  emptySearchText: {
    ...Theme.typography.bodyMd,
    color: Theme.colors.outline,
  },
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
  },
  bottomSheetContent: {
    paddingHorizontal: 16,
  },
  bottomSheetOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  bottomSheetOptionActive: {
    backgroundColor: '#f6f3f2',
    borderRadius: 8,
  },
  bottomSheetOptionText: {
    ...Theme.typography.bodyLg,
    color: Theme.colors.onSurface,
    marginLeft: 12,
  },
  bottomSheetOptionTextActive: {
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  storeOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyStoresContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyStoresText: {
    ...Theme.typography.bodyMd,
    color: Theme.colors.onSurfaceVariant,
  },
  countryFlagText: {
    fontSize: 20,
  },
  selectedFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: Theme.colors.outline,
    borderRadius: 8,
    backgroundColor: Theme.colors.surfaceVariant,
  },
  fileIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    ...Theme.typography.labelLg,
    color: Theme.colors.onSurface,
  },
  fileSize: {
    ...Theme.typography.bodySm,
    color: Theme.colors.outline,
    marginTop: 2,
  },
  removeFileBtn: {
    padding: 8,
  },
  voucherOptionsContainer: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  voucherOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.outline,
  },
  voucherOptionText: {
    ...Theme.typography.bodyLg,
    color: Theme.colors.onSurface,
    marginLeft: 16,
  },
});

function getFlagEmoji(countryCode: string) {
  if (!countryCode) return '🏳️';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}
