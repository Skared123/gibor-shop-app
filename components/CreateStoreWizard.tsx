import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  ScrollView, 
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Theme } from '@/constants/Theme';
import { useAppData } from '@/context/AppDataContext';
import { SvgUri } from 'react-native-svg';

interface CreateStoreWizardProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateStoreWizard({ visible, onClose, onSuccess }: CreateStoreWizardProps) {
  const [step, setStep] = useState(1);
  const [countries, setCountries] = useState<any[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { api, user } = useAppData();

  // Form Data
  const [formData, setFormData] = useState({
    countryId: '',
    name: '',
    slug: '',
    template: 'template-1'
  });

  useEffect(() => {
    if (visible) {
      setStep(1);
      setFormData({ countryId: '', name: '', slug: '', template: 'template-1' });
      fetchCountries();
    }
  }, [visible]);

  const fetchCountries = async () => {
    try {
      setLoadingCountries(true);
      const res = await api.get('/countries?limit=100');
      if (res.data) {
        setCountries(res.data.docs || []);
      }
    } catch (err) {
      console.error('Error fetching countries:', err);
      Alert.alert('Error', 'No se pudieron cargar los países.');
    } finally {
      setLoadingCountries(false);
    }
  };

  const handleNameChange = (val: string) => {
    setFormData(prev => ({
      ...prev,
      name: val,
      slug: val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    }));
  };

  const handleNext = () => {
    if (step === 1 && !formData.countryId) {
      Alert.alert('Atención', 'Por favor selecciona un país.');
      return;
    }
    if (step === 2 && (!formData.name || !formData.slug)) {
      Alert.alert('Atención', 'El nombre y enlace son requeridos.');
      return;
    }
    if (step === 2) {
      const slugValid = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(formData.slug);
      if (!slugValid) {
        Alert.alert('Error', 'Formato de enlace inválido. Solo usa minúsculas, números y guiones.');
        return;
      }
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);

      // Fetch at least 1 product to satisfy validation (like in web)
      const catalogParams = {
        page: 1,
        limit: 1,
        sort: 'name',
      };
      
      const parts = [`${encodeURIComponent('where[parent_product_id][exists]')}=false`];
      parts.push(`country=${formData.countryId}`);
      const whereClause = parts.length ? `&${parts.join('&')}` : '';
      const catalogUrl = `/products/catalog-filters?page=1&limit=1&sort=name${whereClause}&depth=1`;

      const prodRes = await api.get(catalogUrl);
      const prodData = prodRes.data;
      const firstProduct = prodData?.products?.docs?.[0] || prodData?.docs?.[0];

      if (!firstProduct) {
        Alert.alert('Error', 'No hay productos disponibles en este país para crear la tienda.');
        setIsSubmitting(false);
        return;
      }

      let landingPageBlocks = [];
      if (formData.template === 'template-1') {
        landingPageBlocks = [
          { 
            blockType: 'hero',
            bgImage: 1876,
            content: {
              title: `Bienvenido a ${formData.name}`,
              subtitle: 'Descubre nuestros mejores productos.',
            }
          },
          { blockType: 'productCarousel' },
          { 
            blockType: 'testimonials',
            items: [
              { quote: 'Excelente tienda y atención.', author: 'Cliente Satisfecho', rating: 5 }
            ]
          }
        ];
      } else {
        landingPageBlocks = [
          { 
            blockType: 'hero',
            bgImage: 1876,
            content: {
              title: `Bienvenido a ${formData.name}`,
              subtitle: 'La mejor opción del mercado.',
            }
          },
          { blockType: 'archive' },
          { 
            blockType: 'comparisonTable',
            features: [
              { name: 'Calidad Premium', ours: 'check', others: 'cross' }
            ]
          },
          { 
            blockType: 'testimonials',
            items: [
              { quote: 'Excelente tienda y atención.', author: 'Cliente Satisfecho', rating: 5 }
            ]
          }
        ];
      }

      const payload = {
        country: Number(formData.countryId),
        name: formData.name,
        slug: formData.slug,
        products: [
          {
            product: firstProduct.id,
            price: firstProduct.suggested_price || firstProduct.price || 10,
          }
        ],
        "landing-page": landingPageBlocks
      };

      const res = await api.post('/stores/create-wizard', payload);

      if (res.status === 200 || res.status === 201) {
        onSuccess();
      } else {
        Alert.alert('Error', 'No se pudo crear la tienda. Verifica tus límites.');
      }
    } catch (err: any) {
      console.error('Error creating store:', err);
      const message = err.response?.data?.errors?.[0]?.message || 'Error al crear la tienda.';
      Alert.alert('Error', message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>¿En qué país operará tu tienda?</Text>
      <Text style={styles.stepSubtitle}>Esta configuración es permanente e influirá en monedas y catálogos.</Text>
      
      {loadingCountries ? (
        <ActivityIndicator size="large" color={Theme.colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView style={styles.countryList} showsVerticalScrollIndicator={false}>
          {countries.map((c) => (
            <TouchableOpacity 
              key={c.id} 
              style={[
                styles.countryItem,
                formData.countryId === c.id.toString() && styles.countryItemActive
              ]}
              onPress={() => setFormData({ ...formData, countryId: c.id.toString() })}
            >
              <View style={styles.countryInfo}>
                {c.iso2 && (
                  <SvgUri
                    uri={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${c.iso2.toUpperCase()}.svg`}
                    width={24}
                    height={16}
                  />
                )}
                <Text style={[
                  styles.countryName,
                  formData.countryId === c.id.toString() && styles.countryNameActive
                ]}>{c.name}</Text>
              </View>
              {formData.countryId === c.id.toString() && (
                <MaterialIcons name="check-circle" size={20} color={Theme.colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Nombre y Dirección</Text>
      <Text style={styles.stepSubtitle}>Define cómo te verán tus clientes.</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nombre de la Tienda</Text>
        <View style={styles.inputWrapper}>
          <MaterialIcons name="storefront" size={20} color={Theme.colors.onSurfaceVariant} style={styles.inputIcon} />
          <TextInput 
            style={styles.input}
            placeholder="Ej. Mi Tienda de Moda"
            value={formData.name}
            onChangeText={handleNameChange}
            placeholderTextColor={Theme.colors.placeholder}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Enlace Único (Slug)</Text>
        <View style={styles.inputWrapper}>
          <MaterialIcons name="link" size={20} color={Theme.colors.onSurfaceVariant} style={styles.inputIcon} />
          <TextInput 
            style={styles.input}
            placeholder="mi-tienda"
            value={formData.slug}
            onChangeText={(val) => setFormData({ ...formData, slug: val.toLowerCase().replace(/[^a-z0-9\-]/g, '') })}
            placeholderTextColor={Theme.colors.placeholder}
            autoCapitalize="none"
          />
        </View>
      </View>

      <View style={styles.urlPreview}>
        <MaterialIcons name="public" size={16} color={Theme.colors.primary} />
        <Text style={styles.urlPreviewText}>
          gibor.com/store/<Text style={styles.urlPreviewBold}>{formData.slug || 'mi-tienda'}</Text>
        </Text>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Selecciona una Plantilla</Text>
      <Text style={styles.stepSubtitle}>Elige la estructura inicial para tu Landing Page.</Text>

      <TouchableOpacity 
        style={[styles.templateCard, formData.template === 'template-1' && styles.templateCardActive]}
        onPress={() => setFormData({ ...formData, template: 'template-1' })}
        activeOpacity={0.8}
      >
        <View style={styles.templateHeader}>
          <View style={styles.templateIcon}>
            <MaterialIcons name="dashboard" size={20} color={Theme.colors.primary} />
          </View>
          <Text style={styles.templateName}>Plantilla Básica</Text>
        </View>
        <Text style={styles.templateDesc}>Ideal para tiendas sencillas con productos destacados.</Text>
        <View style={styles.tagContainer}>
          <View style={styles.tag}><Text style={styles.tagText}>Portada</Text></View>
          <View style={styles.tag}><Text style={styles.tagText}>Carrusel</Text></View>
          <View style={styles.tag}><Text style={styles.tagText}>Testimonios</Text></View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.templateCard, formData.template === 'template-2' && styles.templateCardActive]}
        onPress={() => setFormData({ ...formData, template: 'template-2' })}
        activeOpacity={0.8}
      >
        <View style={styles.templateHeader}>
          <View style={styles.templateIcon}>
            <MaterialIcons name="view-quilt" size={20} color={Theme.colors.primary} />
          </View>
          <Text style={styles.templateName}>Plantilla Completa</Text>
        </View>
        <Text style={styles.templateDesc}>Incluye tabla comparativa y archivo completo.</Text>
        <View style={styles.tagContainer}>
          <View style={styles.tag}><Text style={styles.tagText}>Portada</Text></View>
          <View style={styles.tag}><Text style={styles.tagText}>Cuadricula</Text></View>
          <View style={styles.tag}><Text style={styles.tagText}>Comparativa</Text></View>
        </View>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <MaterialIcons name="store" size={24} color={Theme.colors.primary} />
              <Text style={styles.headerTitle}>Crear Nueva Tienda</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color={Theme.colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressRow}>
            <View style={[styles.progressDot, step >= 1 && styles.progressDotActive]} />
            <View style={[styles.progressDot, step >= 2 && styles.progressDotActive]} />
            <View style={[styles.progressDot, step >= 3 && styles.progressDotActive]} />
          </View>

          <View style={styles.content}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
          </View>

          <View style={styles.footer}>
            {step > 1 ? (
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={handleBack}
                disabled={isSubmitting}
              >
                <MaterialIcons name="chevron-left" size={24} color={Theme.colors.onSurface} />
                <Text style={styles.backButtonText}>Atrás</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            )}

            {step < 3 ? (
              <TouchableOpacity 
                style={styles.nextButton} 
                onPress={handleNext}
              >
                <Text style={styles.nextButtonText}>Siguiente</Text>
                <MaterialIcons name="chevron-right" size={24} color={Theme.colors.onPrimary} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={styles.submitButton} 
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color={Theme.colors.onPrimary} />
                ) : (
                  <>
                    <Text style={styles.nextButtonText}>Crear Tienda</Text>
                    <MaterialIcons name="check-circle" size={20} color={Theme.colors.onPrimary} />
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    ...Theme.typography.headlineMd,
    color: Theme.colors.onSurface,
  },
  closeButton: {
    padding: 4,
  },
  progressRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 10,
  },
  progressDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: Theme.colors.outline,
  },
  progressDotActive: {
    backgroundColor: Theme.colors.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepContainer: {
    flex: 1,
    paddingTop: 10,
  },
  stepTitle: {
    ...Theme.typography.headlineSm,
    color: Theme.colors.onSurface,
    marginBottom: 4,
  },
  stepSubtitle: {
    ...Theme.typography.bodyMd,
    color: Theme.colors.onSurfaceVariant,
    marginBottom: 20,
  },
  countryList: {
    flex: 1,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.outline,
    marginBottom: 8,
  },
  countryItemActive: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primary + '10',
  },
  countryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  countryName: {
    ...Theme.typography.bodyLg,
    color: Theme.colors.onSurface,
  },
  countryNameActive: {
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    ...Theme.typography.labelLg,
    color: Theme.colors.onSurface,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.outline,
    borderRadius: 12,
    backgroundColor: Theme.colors.background,
    paddingHorizontal: 12,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    ...Theme.typography.bodyLg,
    color: Theme.colors.onSurface,
  },
  urlPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: Theme.colors.primary + '15',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.primary + '30',
  },
  urlPreviewText: {
    ...Theme.typography.bodySm,
    color: Theme.colors.onPrimaryContainer,
  },
  urlPreviewBold: {
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  templateCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Theme.colors.outline,
    marginBottom: 16,
    backgroundColor: Theme.colors.surface,
  },
  templateCardActive: {
    borderColor: Theme.colors.primary,
    backgroundColor: Theme.colors.primary + '05',
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  templateIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  templateName: {
    ...Theme.typography.headlineSm,
    color: Theme.colors.onSurface,
  },
  templateDesc: {
    ...Theme.typography.bodyMd,
    color: Theme.colors.onSurfaceVariant,
    marginBottom: 12,
  },
  tagContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    backgroundColor: Theme.colors.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    ...Theme.typography.labelSm,
    color: Theme.colors.onSurfaceVariant,
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.divider,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  cancelButtonText: {
    ...Theme.typography.labelLg,
    color: Theme.colors.error,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 4,
  },
  backButtonText: {
    ...Theme.typography.labelLg,
    color: Theme.colors.onSurface,
  },
  nextButton: {
    backgroundColor: Theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonText: {
    ...Theme.typography.labelLg,
    color: Theme.colors.onPrimary,
  },
  submitButton: {
    backgroundColor: Theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    minWidth: 140,
    justifyContent: 'center',
  }
});
