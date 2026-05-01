import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, TextInput, SafeAreaView, Switch } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '@/constants/Theme';
import { Card } from '@/components/ui/Card';

export default function OrderCreationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [hasNotes, setHasNotes] = useState(false);
  const [isForMe, setIsForMe] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [shippingType, setShippingType] = useState<'with_collection' | 'without_collection'>('without_collection');

  return (
    <View style={styles.flex}>
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={Theme.colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Creación de orden manual</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del cliente</Text>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Tienda</Text>
            <TouchableOpacity style={styles.dropdown}>
              <Text style={styles.dropdownText}>Seleccionar tienda</Text>
              <MaterialIcons name="expand-more" size={20} color={Theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Nombres</Text>
              <TextInput style={styles.input} placeholder="Ej. Juan" placeholderTextColor={Theme.colors.placeholder} />
            </View>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Apellidos</Text>
              <TextInput style={styles.input} placeholder="Ej. Pérez" placeholderTextColor={Theme.colors.placeholder} />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Número de teléfono</Text>
            <View style={styles.row}>
              <TouchableOpacity style={[styles.dropdown, { width: 80, marginRight: 8 }]}>
                <Text style={styles.dropdownText}>+57</Text>
                <MaterialIcons name="expand-more" size={16} color={Theme.colors.onSurfaceVariant} />
              </TouchableOpacity>
              <TextInput 
                style={[styles.input, { flex: 1 }]} 
                placeholder="300 000 0000" 
                keyboardType="phone-pad"
                placeholderTextColor={Theme.colors.placeholder}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Buscar dirección (Google Maps)</Text>
            <View style={styles.inputWithIcon}>
              <MaterialIcons name="location-on" size={20} color={Theme.colors.onSurfaceVariant} style={styles.leftIcon} />
              <TextInput style={[styles.input, { paddingLeft: 40 }]} placeholder="Ingresa la dirección" placeholderTextColor={Theme.colors.placeholder} />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput style={styles.input} placeholder="ejemplo@correo.com" keyboardType="email-address" placeholderTextColor={Theme.colors.placeholder} />
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

          <View style={styles.formGroup}>
            <Text style={styles.label}>Voucher de pago</Text>
            <TouchableOpacity style={styles.uploadBox}>
              <MaterialIcons name="cloud-upload" size={32} color={Theme.colors.outline} />
              <Text style={styles.uploadTitle}>Toca para subir o arrastra el archivo aquí</Text>
              <Text style={styles.uploadSubtitle}>JPG, PNG, PDF (Max. 5MB)</Text>
            </TouchableOpacity>
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

          <View style={styles.productItemCard}>
            <TouchableOpacity style={styles.deleteButton}>
              <MaterialIcons name="delete" size={18} color={Theme.colors.error} />
            </TouchableOpacity>
            <Text style={styles.productName}>PANTALLA LED 24"</Text>
            <View style={styles.row}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.smallLabel}>Precio (COP)</Text>
                <TextInput style={styles.smallInput} value="450000" keyboardType="numeric" />
              </View>
              <View style={[styles.formGroup, { width: 100, marginLeft: 16 }]}>
                <Text style={styles.smallLabel}>Cantidad</Text>
                <View style={styles.quantityControls}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(Math.max(1, quantity - 1))}>
                    <Text style={styles.qtyBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyValue}>{quantity}</Text>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => setQuantity(quantity + 1)}>
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.searchProductBox}>
            <MaterialIcons name="search" size={20} color={Theme.colors.primaryContainer} style={styles.searchProductIcon} />
            <TextInput 
              style={styles.searchProductInput} 
              placeholder="Buscar y agregar producto..." 
              placeholderTextColor={Theme.colors.primaryContainer + 'b3'} 
            />
          </View>
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

          <View style={styles.row}>
            <View style={styles.carrierPlaceholder}>
              <Text style={styles.carrierText}>Servientrega</Text>
            </View>
            <View style={[styles.carrierPlaceholder, styles.carrierSelected, { marginLeft: 12 }]}>
              <Text style={[styles.carrierText, styles.carrierTextSelected]}>Inter Rapidísimo</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen de la orden</Text>
          <View style={styles.summaryTable}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>Producto</Text>
              <Text style={[styles.tableHeaderText, { textAlign: 'right' }]}>Precio de venta</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableCell}>PANTALLA LED 24" x{quantity}</Text>
              <Text style={[styles.tableCell, { textAlign: 'right' }]}>${(450000 * quantity).toLocaleString()}</Text>
            </View>
          </View>

          <View style={styles.totalsContainer}>
            <SummaryRow label="Total a recaudar" value={`$${(450000 * quantity).toLocaleString()}`} />
            <SummaryRow label="Precio de envío" value="$15,000" />
            <SummaryRow label="Comisión de la plataforma" value="$4,500" />
            <View style={styles.totalDivider} />
            <View style={styles.finalTotalRow}>
              <Text style={styles.finalTotalLabel}>Total</Text>
              <Text style={styles.finalTotalValue}>${(450000 * quantity + 15000 + 4500).toLocaleString()}</Text>
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
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  } as const,
  productName: {
    ...Theme.typography.labelLg,
    color: Theme.colors.onSurface,
    paddingRight: 24,
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
    height: 44,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Theme.colors.primaryContainer,
    borderRadius: 8,
    backgroundColor: '#fff',
    paddingHorizontal: 12,
  } as const,
  searchProductIcon: {
    marginRight: 8,
  } as const,
  searchProductInput: {
    flex: 1,
    fontSize: 14,
    color: Theme.colors.primaryContainer,
  } as const,
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
});
