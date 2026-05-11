import React, { useEffect } from 'react';
import { StyleSheet, ScrollView, View, Text, TouchableOpacity, TextInput, Image, FlatList, ActivityIndicator, Modal, Alert } from 'react-native';
import axios from 'axios';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Theme } from '@/constants/Theme';
import { useAppData } from '@/context/AppDataContext';
import TopAppBar from '@/components/TopAppBar';
import CountrySelectorModal from '@/components/CountrySelectorModal';
import { SvgUri } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';

import { useFocusEffect } from '@react-navigation/native';

export default function MyProductsScreen() {
  const router = useRouter();
  const { api, user, countries } = useAppData();
  const [products, setProducts] = React.useState<any[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // View State
  const [viewMode, setViewMode] = React.useState<'list' | 'create-type' | 'create-catalog' | 'create-scratch'>('list');
  
  interface ScratchForm {
    country: any;
    name: string;
    description: string;
    images: string[];
    category: any;
    stock: string;
    price: string;
    costPrice: string;
    suggested_price: string;
  }

  // Create Scratch State
  const [scratchForm, setScratchForm] = React.useState<ScratchForm>({
    country: null,
    name: '',
    description: '',
    images: [],
    category: null,
    stock: '',
    price: '',
    costPrice: '',
    suggested_price: ''
  });
  const [editingProductId, setEditingProductId] = React.useState<number | null>(null);
  const [categories, setCategories] = React.useState<any[]>([]);
  const [showCategoryPicker, setShowCategoryPicker] = React.useState(false);
  
  const [step1Country, setStep1Country] = React.useState<any>(null);
  const [step2Product, setStep2Product] = React.useState<any>(null);
  const [catalogForCreate, setCatalogForCreate] = React.useState<any[]>([]);
  const [catalogCache, setCatalogCache] = React.useState<Record<number, any[]>>({});
  const [isLoadingCatalog, setIsLoadingCatalog] = React.useState(false);
  const [isCreating, setIsCreating] = React.useState(false);
  const [showCountryPicker, setShowCountryPicker] = React.useState(false);
  const [showProductPicker, setShowProductPicker] = React.useState(false);
  const [showMediaPicker, setShowMediaPicker] = React.useState(false);
  const [allMedia, setAllMedia] = React.useState<any[]>([]);
  const [isLoadingMedia, setIsLoadingMedia] = React.useState(false);

  const fetchMyProducts = React.useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // Traemos todos los productos del dueño, el filtrado de país lo hacemos en memoria por ahora
      // para mayor velocidad de respuesta al cambiar de país, similar a la web.
      const url = `/products?limit=100&sort=-createdAt&depth=1&where[owner][equals]=${user.id}`;
      const res = await api.get(url);
      setProducts(res.data.docs || []);
    } catch (err) {
      console.error('Error fetching my products:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, api]);

  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a tus fotos para subir imágenes del producto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const selectedUris = result.assets.map(asset => asset.uri);
      setScratchForm(prev => ({
        ...prev,
        images: [...prev.images, ...selectedUris]
      }));
    }
  };

  const removeImage = (index: number) => {
    setScratchForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const fetchMedia = async () => {
    setIsLoadingMedia(true);
    try {
      const res = await api.get('/media?limit=100&sort=-createdAt');
      setAllMedia(res.data.docs || []);
    } catch (err) {
      console.error('Error fetching media:', err);
    } finally {
      setIsLoadingMedia(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories?limit=0');
      setCategories(res.data.docs);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };

  useEffect(() => {
    fetchMyProducts();
    fetchCategories();
  }, [fetchMyProducts]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchMyProducts();
  };

  const handleEditProduct = (product: any) => {
    setEditingProductId(product.id);
    
    // Map backend data to form state
    setScratchForm({
      name: product.name || '',
      description: typeof product.description === 'object' ? 
        (product.description.root?.children?.[0]?.children?.[0]?.text || '') : 
        (product.description || ''),
      country: product.country,
      category: product.category,
      price: product.price?.toString() || '',
      stock: product.stock?.toString() || '',
      suggested_price: product.suggested_price?.toString() || '',
      costPrice: '', // Not used anymore
      images: (product.images || []).map((img: any) => 
        typeof img === 'object' ? `https://shop.giborcommunity.com/api/media-url/${img.id}` : `https://shop.giborcommunity.com/api/media-url/${img}`
      )
    });
    
    setViewMode('create-scratch');
  };

  const handleSaveScratch = async () => {
    if (!scratchForm.name || !scratchForm.country || !scratchForm.category || !scratchForm.price || !scratchForm.stock) {
      Alert.alert('Error', 'Por favor completa todos los campos obligatorios (*).');
      return;
    }

    if (scratchForm.images.length === 0) {
      Alert.alert('Error', 'Debes subir al menos una imagen.');
      return;
    }

    setIsCreating(true);
    try {
      // 1. Subir imágenes nuevas
      const imageIds = [];
      for (const uri of scratchForm.images) {
        if (uri.startsWith('http')) {
          // Extraer ID de la URL de forma robusta
          const cleanUri = uri.split('?')[0];
          const parts = cleanUri.split('/');
          const idStr = parts[parts.length - 1];
          const id = isNaN(Number(idStr)) ? idStr : Number(idStr);
          imageIds.push(id);
          continue;
        }

        const formData = new FormData();
        const filename = uri.split('/').pop() || 'image.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image/jpeg`;

        formData.append('file', {
          uri,
          name: filename,
          type,
        } as any);

        const uploadRes = await api.post('/media', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        
        const newId = uploadRes.data.doc?.id || uploadRes.data.id;
        if (newId) {
          imageIds.push(newId);
        } else {
          console.error('No ID found in upload response:', uploadRes.data);
        }
      }

      // 2. Preparar payload (Lexical format)
      const payload = {
        name: scratchForm.name,
        description: {
          root: {
            type: 'root',
            format: '',
            indent: 0,
            version: 1,
            children: [
              {
                type: 'paragraph',
                format: '',
                indent: 0,
                version: 1,
                children: [
                  {
                    type: 'text',
                    text: scratchForm.description,
                    format: 0,
                    style: '',
                    detail: 0,
                    mode: 'normal',
                    version: 1
                  }
                ]
              }
            ]
          }
        },
        country: typeof scratchForm.country === 'object' ? scratchForm.country.id : scratchForm.country,
        category: typeof scratchForm.category === 'object' ? scratchForm.category.id : scratchForm.category,
        price: parseFloat(scratchForm.price) || 0,
        suggested_price: scratchForm.suggested_price ? parseFloat(scratchForm.suggested_price) : undefined,
        stock: parseInt(scratchForm.stock) || 0,
        status: 'available',
        owner: user?.id,
        images: imageIds,
      };

      console.log('Final Payload:', JSON.stringify(payload, null, 2));

      if (editingProductId) {
        await api.patch(`/products/${editingProductId}`, payload);
        Alert.alert('¡Éxito!', 'Producto actualizado.');
      } else {
        await api.post('/products', payload);
        Alert.alert('¡Éxito!', 'Producto creado.');
      }
      
      setViewMode('list');
      setEditingProductId(null);
      fetchMyProducts();
      
      // Reset form
      setScratchForm({
        country: null,
        name: '',
        description: '',
        images: [],
        category: null,
        stock: '',
        price: '',
        costPrice: '',
        suggested_price: ''
      });
    } catch (err: any) {
      console.error('Save Product Error:', err);
      if (err.response?.data) {
        console.error('Response details:', JSON.stringify(err.response.data, null, 2));
      }
      const msg = err.response?.data?.errors?.[0]?.message || 'Error al guardar. Revisa los campos.';
      Alert.alert('Error', msg);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    Alert.alert(
      'Eliminar Producto',
      '¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/products/${id}`);
              Alert.alert('Éxito', 'Producto eliminado correctamente.');
              fetchMyProducts();
            } catch (err) {
              console.error('Error deleting product:', err);
              Alert.alert('Error', 'No se pudo eliminar el producto.');
            }
          }
        }
      ]
    );
  };

  const fetchCatalogForCreate = async (countryId: number) => {
    // Check cache first
    if (catalogCache[countryId]) {
      setCatalogForCreate(catalogCache[countryId]);
      return;
    }

    setIsLoadingCatalog(true);
    try {
      const res = await api.get(`/products/catalog-filters?country=${countryId}&limit=100`);
      const docs = res.data.products?.docs || [];
      setCatalogForCreate(docs);
      
      // Update cache
      setCatalogCache(prev => ({
        ...prev,
        [countryId]: docs
      }));
    } catch (err) {
      console.error('Error fetching catalog for create:', err);
    } finally {
      setIsLoadingCatalog(false);
    }
  };

  const handleCreateVersion = async () => {
    if (!step2Product || !user) return;
    
    setIsCreating(true);
    try {
      const payload = {
        name: step2Product.name,
        description: step2Product.description,
        category: typeof step2Product.category === 'object' ? step2Product.category.id : step2Product.category,
        country: typeof step2Product.country === 'object' ? step2Product.country.id : step2Product.country,
        parentProduct: step2Product.id,
        owner: user.id,
        images: (step2Product.images || []).map((img: any) => typeof img === 'object' ? img.id : img),
        stock: step2Product.stock,
        price: step2Product.price,
        suggested_price: step2Product.suggested_price,
        status: 'available',
      };

      await api.post('/products', payload);
      
      Alert.alert('¡Éxito!', 'Tu versión del producto ha sido creada.');
      setViewMode('list');
      setStep1Country(null);
      setStep2Product(null);
      fetchMyProducts();
    } catch (err) {
      console.error('Error creating product version:', err);
      Alert.alert('Error', 'No se pudo crear la versión del producto.');
    } finally {
      setIsCreating(false);
    }
  };

  const filteredProducts = React.useMemo(() => {
    let result = products;

    // Filtro por búsqueda
    if (searchQuery) {
      const s = searchQuery.toLowerCase();
      result = result.filter(p =>
        (p.name || '').toLowerCase().includes(s) ||
        (typeof p.category === 'object' && (p.category?.title || '').toLowerCase().includes(s))
      );
    }

    return result;
  }, [products, searchQuery]);

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.titleRow}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="category" size={24} color={Theme.colors.secondary} />
        </View>
        <View>
          <Text style={styles.title}>Mis Productos</Text>
          <Text style={styles.subtitle}>Gestiona tus propias versiones de productos</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.createButton}
        onPress={() => {
          setViewMode('create-type');
        }}
      >
        <MaterialIcons name="add" size={20} color="#fff" />
        <Text style={styles.createButtonText}>Crear Producto</Text>
      </TouchableOpacity>

      <View style={styles.searchBar}>
        <MaterialIcons name="search" size={20} color={Theme.colors.onSurfaceVariant} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar en mis productos..."
          placeholderTextColor={Theme.colors.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filters simplified: only search is active */}
    </View>
  );

  return (
    <View style={styles.container}>
      {viewMode === 'list' && (
        <>
          <TopAppBar />
          {isLoading && products.length === 0 ? (
            <View style={styles.centerLoader}>
              <ActivityIndicator size="large" color={Theme.colors.primary} />
              <Text style={styles.loadingText}>Cargando tus productos...</Text>
            </View>
          ) : (
            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => item.id.toString()}
              ListHeaderComponent={renderHeader}
              renderItem={({ item }) => (
                <ProductItem 
                  product={item} 
                  onEdit={() => handleEditProduct(item)}
                  onDelete={() => handleDeleteProduct(item.id)} 
                />
              )}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              ListEmptyComponent={
                !isLoading ? (
                  <View style={styles.emptyState}>
                    <MaterialIcons name="inventory" size={48} color={Theme.colors.outline} />
                    <Text style={styles.emptyStateText}>
                      {searchQuery ? 'No se encontraron productos con estos filtros' : 'Aún no tienes productos propios'}
                    </Text>
                    {searchQuery && (
                      <TouchableOpacity 
                        onPress={() => {
                          setSearchQuery('');
                        }}
                      >
                        <Text style={{ color: Theme.colors.primary, marginTop: 8, fontWeight: 'bold' }}>Limpiar búsqueda</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ) : null
              }
            />
          )}
        </>
      )}

      {viewMode === 'create-type' && (
        <View style={styles.creationScreen}>
          <TopAppBar title="Crear Producto" onBack={() => setViewMode('list')} />

          {/* Body Content */}
          <ScrollView style={styles.creationBody} contentContainerStyle={styles.creationBodyContent}>
            <View style={styles.subtitleContainer}>
              <Text style={styles.optionDescriptionText}>¿Qué tipo de producto deseas crear?</Text>
            </View>

            <View style={[styles.optionsGrid, { gap: 24 }]}>
              {/* Card 1: Versión de catálogo */}
              <TouchableOpacity 
                style={styles.optionCardLarge}
                onPress={() => setViewMode('create-catalog')}
              >
                <View style={[styles.optionIconCircle, { backgroundColor: Theme.colors.secondaryFixed }]}>
                  <MaterialIcons name="inventory-2" size={32} color={Theme.colors.secondary} />
                </View>
                <Text style={styles.optionTitleText}>Versión de catálogo</Text>
                <Text style={styles.optionSubtext}>
                  Crear una variante de un producto base existente en el catálogo público.
                </Text>
              </TouchableOpacity>

              {/* Card 2: Producto desde cero */}
              <TouchableOpacity 
                style={styles.optionCardLarge}
                onPress={() => setViewMode('create-scratch')}
              >
                <View style={[styles.optionIconCircle, { backgroundColor: Theme.colors.tertiaryFixed }]}>
                  <MaterialIcons name="add" size={32} color={Theme.colors.tertiary} />
                </View>
                <Text style={[styles.optionTitleText, styles.underlineDecor]}>Producto desde cero</Text>
                <Text style={[styles.optionSubtext, styles.underlineDecor]}>
                  Crear un producto completamente nuevo con tus propios datos.
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={styles.screenFooter}>
            <TouchableOpacity 
              style={styles.fullWidthCancelButton}
              onPress={() => setViewMode('list')}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {viewMode === 'create-catalog' && (
        <View style={styles.creationScreen}>
          <TopAppBar title="Crear mi propia versión" onBack={() => setViewMode('create-type')} />

          {/* Body Content */}
          <ScrollView style={styles.creationBody} contentContainerStyle={styles.creationBodyContent}>
            <View style={styles.subtitleContainer}>
              <Text style={styles.optionDescriptionText}>
                Selecciona un producto del catálogo base para empezar a <Text style={{ color: Theme.colors.secondary, fontWeight: 'bold' }}>personalizarlo</Text>.
              </Text>
            </View>

            <View style={{ gap: 32 }}>
              {/* Step 1: Country */}
              <TouchableOpacity 
                style={[styles.stepCard, step1Country && styles.stepCardActive]}
                onPress={() => setShowCountryPicker(true)}
              >
                <Text style={styles.stepLabel}>1. Selecciona el País</Text>
                <View style={styles.stepSelector}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    {step1Country?.iso2 && (
                      <SvgUri
                        uri={`https://purecatamphetamine.github.io/country-flag-icons/3x2/${step1Country.iso2.toUpperCase()}.svg`}
                        width={24}
                        height={16}
                      />
                    )}
                    <Text style={[styles.stepValue, !step1Country && styles.stepPlaceholder]}>
                      {step1Country?.name || 'Elegir país para ver catálogo'}
                    </Text>
                  </View>
                  <MaterialIcons name="expand-more" size={24} color={Theme.colors.onSurfaceVariant} />
                </View>
              </TouchableOpacity>

              {/* Step 2: Product */}
              <TouchableOpacity 
                style={[
                  styles.stepCard, 
                  !step1Country && styles.stepCardDisabled,
                  step2Product && styles.stepCardActive
                ]}
                disabled={!step1Country}
                onPress={() => setShowProductPicker(true)}
              >
                <Text style={[styles.stepLabel, !step1Country && styles.stepLabelDisabled]}>2. Selecciona el Producto</Text>
                <View style={styles.stepSelector}>
                  <Text style={[
                    styles.stepValue, 
                    !step1Country && styles.stepPlaceholderDisabled,
                    !step2Product && styles.stepPlaceholder
                  ]}>
                    {step2Product?.name || 'Buscar producto base'}
                  </Text>
                  {isLoadingCatalog ? (
                    <ActivityIndicator size="small" color={Theme.colors.primary} />
                  ) : (
                    <MaterialIcons 
                      name="expand-more" 
                      size={24} 
                      color={step1Country ? Theme.colors.onSurfaceVariant : Theme.colors.onSurfaceVariant + '80'} 
                    />
                  )}
                </View>
              </TouchableOpacity>

              {/* Info Alert */}
              <View style={styles.infoAlert}>
                <MaterialIcons name="filter-alt" size={20} color="#F57C00" />
                <Text style={styles.infoAlertText}>
                  Al crear tu versión, se copiarán las imágenes, nombre y descripción iniciales. Podrás personalizarlos después. El precio y stock permanecerán sincronizados con el producto base.
                </Text>
              </View>
            </View>
          </ScrollView>

          <View style={styles.screenFooter}>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setViewMode('create-type')}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmButton, (!step2Product || isCreating) && styles.confirmButtonDisabled]}
                disabled={!step2Product || isCreating}
                onPress={handleCreateVersion}
              >
                {isCreating ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Crear Mi Versión</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {viewMode === 'create-scratch' && (
        <View style={styles.creationScreen}>
          {/* Header Actions */}
          <TopAppBar 
            title={editingProductId ? "Editar Producto" : "Crear Producto"} 
            onBack={() => {
              if (editingProductId) {
                setViewMode('list');
                setEditingProductId(null);
                // Reset form
                setScratchForm({
                  country: null,
                  name: '',
                  description: '',
                  images: [],
                  category: null,
                  stock: '',
                  price: '',
                  costPrice: '',
                  suggested_price: ''
                });
              } else {
                setViewMode('create-type');
              }
            }} 
            showNotifications={false}
          />
          <View style={styles.stickyActionHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerSubtitle}>{scratchForm.name || '[Untitled]'}</Text>
              <Text style={styles.headerMainTitle}>{editingProductId ? 'Editing Producto' : 'Creating new Producto'}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.headerSaveButton, isCreating && styles.headerSaveButtonDisabled]}
              onPress={handleSaveScratch}
              disabled={isCreating}
            >
              {isCreating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.headerSaveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.creationBody} contentContainerStyle={styles.creationBodyContent}>
            {/* Card: Basic Info */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Información Básica</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>País <Text style={{ color: Theme.colors.error }}>*</Text></Text>
                <TouchableOpacity 
                  style={styles.formInputContainer}
                  onPress={() => setShowCountryPicker(true)}
                >
                  <Text style={[styles.formInputText, !scratchForm.country && { color: Theme.colors.placeholder }]}>
                    {scratchForm.country?.name || 'Select a value'}
                  </Text>
                  <MaterialIcons name="expand-more" size={24} color={Theme.colors.onSurfaceVariant} />
                </TouchableOpacity>
                <Text style={styles.inputHelper}>En qué país se vende este producto</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nombre del producto <Text style={{ color: Theme.colors.error }}>*</Text></Text>
                <TextInput 
                  style={styles.formTextInput}
                  placeholder="Ej: Zapatillas Running X"
                  value={scratchForm.name}
                  onChangeText={(v) => setScratchForm({...scratchForm, name: v})}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Descripción (HTML) <Text style={{ color: Theme.colors.error }}>*</Text></Text>
                <View style={styles.editorContainer}>
                  <View style={styles.editorToolbar}>
                    <MaterialIcons name="format-bold" size={20} color={Theme.colors.onSurfaceVariant} />
                    <MaterialIcons name="format-italic" size={20} color={Theme.colors.onSurfaceVariant} />
                    <MaterialIcons name="format-underlined" size={20} color={Theme.colors.onSurfaceVariant} />
                    <View style={{ width: 1, height: 16, backgroundColor: '#d9c2b3' }} />
                    <MaterialIcons name="format-list-bulleted" size={20} color={Theme.colors.onSurfaceVariant} />
                    <MaterialIcons name="link" size={20} color={Theme.colors.onSurfaceVariant} />
                  </View>
                  <TextInput 
                    style={styles.editorInput}
                    placeholder="Start typing, or press '/' for commands..."
                    multiline
                    numberOfLines={6}
                    value={scratchForm.description}
                    onChangeText={(v) => setScratchForm({...scratchForm, description: v})}
                  />
                </View>
              </View>
            </View>

            {/* Card: Images */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Imágenes <Text style={{ color: Theme.colors.error }}>*</Text></Text>
              
              {scratchForm.images.length > 0 && (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  contentContainerStyle={styles.imagePreviewList}
                >
                  {scratchForm.images.map((uri, index) => (
                    <View key={index} style={styles.previewImageWrapper}>
                      <Image source={{ uri }} style={styles.previewImage} />
                      <TouchableOpacity 
                        style={styles.removeImageButton}
                        onPress={() => removeImage(index)}
                      >
                        <MaterialIcons name="close" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <TouchableOpacity 
                    style={styles.addImageMiniButton}
                    onPress={pickImage}
                  >
                    <MaterialIcons name="add-a-photo" size={24} color={Theme.colors.onSurfaceVariant} />
                  </TouchableOpacity>
                </ScrollView>
              )}

              <TouchableOpacity style={styles.uploadArea} onPress={pickImage}>
                <MaterialIcons name="cloud-upload" size={40} color={Theme.colors.onSurfaceVariant} />
                <View style={styles.uploadActions}>
                  <TouchableOpacity 
                    style={styles.uploadMiniButton}
                    onPress={pickImage}
                  >
                    <Text style={styles.uploadMiniButtonText}>Create New</Text>
                  </TouchableOpacity>
                  <Text style={styles.uploadOrText}>or</Text>
                  <TouchableOpacity 
                    style={styles.uploadMiniButton}
                    onPress={() => {
                      fetchMedia();
                      setShowMediaPicker(true);
                    }}
                  >
                    <Text style={styles.uploadMiniButtonText}>Choose from existing</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.uploadSubtext}>o toca para seleccionar fotos</Text>
              </TouchableOpacity>
              <Text style={styles.inputHelper}>Sube una o varias imágenes del producto</Text>
            </View>

            {/* Card: Categorization */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Categorización</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Categoría <Text style={{ color: Theme.colors.error }}>*</Text></Text>
                <TouchableOpacity 
                  style={styles.formInputContainer}
                  onPress={() => setShowCategoryPicker(true)}
                >
                  <Text style={[styles.formInputText, !scratchForm.category && { color: Theme.colors.placeholder }]}>
                    {(scratchForm.category && typeof scratchForm.category === 'object') ? scratchForm.category.title : (scratchForm.category || 'Select a value')}
                  </Text>
                  <MaterialIcons name="expand-more" size={24} color={Theme.colors.onSurfaceVariant} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Card: Pricing */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Precio e Inventario</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Precio <Text style={{ color: Theme.colors.error }}>*</Text></Text>
                <View style={styles.priceInputWrapper}>
                  <Text style={styles.pricePrefix}>$</Text>
                  <TextInput 
                    style={styles.priceInput}
                    placeholder="0.00"
                    keyboardType="decimal-pad"
                    value={scratchForm.price}
                    onChangeText={(v) => setScratchForm({...scratchForm, price: v})}
                  />
                </View>
                <Text style={styles.inputHelper}>Precio de venta / costo</Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 16 }}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Precio sugerido</Text>
                  <View style={styles.priceInputWrapper}>
                    <Text style={styles.pricePrefix}>$</Text>
                    <TextInput 
                      style={styles.priceInput}
                      placeholder="0.00"
                      keyboardType="decimal-pad"
                      value={scratchForm.suggested_price}
                      onChangeText={(v) => setScratchForm({...scratchForm, suggested_price: v})}
                    />
                  </View>
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Inventario disponible <Text style={{ color: Theme.colors.error }}>*</Text></Text>
                  <TextInput 
                    style={styles.formTextInput}
                    placeholder="0"
                    keyboardType="numeric"
                    value={scratchForm.stock}
                    onChangeText={(v) => setScratchForm({...scratchForm, stock: v})}
                  />
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={styles.screenFooter}>
            <TouchableOpacity 
              style={styles.fullWidthCancelButton}
              onPress={() => {
                if (editingProductId) {
                  setViewMode('list');
                } else {
                  setViewMode('create-type');
                }
                setEditingProductId(null);
                setScratchForm({
                  country: null,
                  name: '',
                  description: '',
                  images: [],
                  category: null,
                  stock: '',
                  price: '',
                  costPrice: '',
                  suggested_price: ''
                });
              }}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Country Picker Reusable Modal */}
      <CountrySelectorModal
        visible={showCountryPicker}
        countries={countries}
        selectedCountryId={step1Country?.id}
        onClose={() => setShowCountryPicker(false)}
        onSelect={(c) => {
          if (viewMode === 'create-scratch') {
            setScratchForm(prev => ({ ...prev, country: c }));
          } else {
            setStep1Country(c);
            setStep2Product(null);
            setCatalogForCreate([]);
            fetchCatalogForCreate(c.id);
          }
          setShowCountryPicker(false);
        }}
      />

      {/* Category Picker BottomSheet */}
      <Modal
        visible={showCategoryPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategoryPicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowCategoryPicker(false)}
        >
          <View style={styles.bottomSheet}>
            <View style={styles.bottomSheetHeader}>
              <View style={styles.bottomSheetHandle} />
              <Text style={styles.bottomSheetTitle}>Seleccionar Categoría</Text>
            </View>
            <FlatList
              data={categories}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.bottomSheetOption, scratchForm.category?.id === item.id && styles.bottomSheetOptionActive]}
                  onPress={() => {
                    setScratchForm({ ...scratchForm, category: item });
                    setShowCategoryPicker(false);
                  }}
                >
                  <Text style={[styles.bottomSheetOptionText, scratchForm.category?.id === item.id && styles.bottomSheetOptionTextActive]}>
                    {item.title}
                  </Text>
                  {scratchForm.category?.id === item.id && <MaterialIcons name="check" size={20} color={Theme.colors.primary} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Product Picker BottomSheet */}
      <Modal
        visible={showProductPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowProductPicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowProductPicker(false)}
        >
          <View style={styles.bottomSheetLarge}>
            <View style={styles.bottomSheetHeader}>
              <View style={styles.bottomSheetHandle} />
              <Text style={styles.bottomSheetTitle}>Seleccionar Producto Base</Text>
            </View>
            <FlatList
              data={catalogForCreate}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.bottomSheetOption, step2Product?.id === item.id && styles.bottomSheetOptionActive]}
                  onPress={() => {
                    setStep2Product(item);
                    setShowProductPicker(false);
                  }}
                >
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <Image 
                      source={{ uri: item.images?.[0] ? `https://shop.giborcommunity.com/api/media-url/${typeof item.images[0] === 'object' ? item.images[0].id : item.images[0]}` : 'https://via.placeholder.com/40' }} 
                      style={styles.pickerImage} 
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.bottomSheetOptionText, step2Product?.id === item.id && styles.bottomSheetOptionTextActive]} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={{ fontSize: 12, color: Theme.colors.onSurfaceVariant }}>{item.price} {step1Country?.currency || 'USD'}</Text>
                    </View>
                  </View>
                  {step2Product?.id === item.id && <MaterialIcons name="check" size={20} color={Theme.colors.primary} />}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <Text style={{ color: Theme.colors.onSurfaceVariant }}>No hay productos disponibles en este país</Text>
                </View>
              }
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Media Picker Modal */}
      <Modal
        visible={showMediaPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowMediaPicker(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowMediaPicker(false)}
        >
          <View style={styles.bottomSheetLarge}>
            <View style={styles.bottomSheetHeader}>
              <View style={styles.bottomSheetHandle} />
              <Text style={styles.bottomSheetTitle}>Seleccionar de existencias</Text>
            </View>
            
            {isLoadingMedia ? (
              <View style={{ padding: 60, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={Theme.colors.primary} />
              </View>
            ) : (
              <FlatList
                data={allMedia}
                keyExtractor={(item) => item.id.toString()}
                numColumns={3}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
                renderItem={({ item }) => {
                  const url = `https://shop.giborcommunity.com/api/media-url/${item.id}`;
                  const isSelected = scratchForm.images.includes(url);
                  
                  return (
                    <TouchableOpacity 
                      style={styles.mediaGridItem}
                      onPress={() => {
                        if (isSelected) {
                          setScratchForm(prev => ({
                            ...prev,
                            images: prev.images.filter(img => img !== url)
                          }));
                        } else {
                          setScratchForm(prev => ({
                            ...prev,
                            images: [...prev.images, url]
                          }));
                        }
                      }}
                    >
                      <Image source={{ uri: url }} style={styles.mediaGridImage} />
                      {isSelected && (
                        <View style={styles.mediaSelectedOverlay}>
                          <MaterialIcons name="check-circle" size={24} color={Theme.colors.primary} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <View style={{ padding: 40, alignItems: 'center' }}>
                    <Text style={{ color: Theme.colors.onSurfaceVariant }}>No hay imágenes en la biblioteca</Text>
                  </View>
                }
              />
            )}
            
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={() => setShowMediaPicker(false)}
              >
                <Text style={styles.confirmButtonText}>Listo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}


function ProductItem({ product, onEdit, onDelete }: { product: any, onEdit: () => void, onDelete: () => void }) {
  const imageId = typeof product.images?.[0] === 'object' ? product.images[0].id : product.images?.[0];
  const imageUrl = imageId ? `https://shop.giborcommunity.com/api/media-url/${imageId}` : null;
  const categoryName = typeof product.category === 'object' ? product.category.title : (product.category || 'Sin categoría');
  const currency = typeof product.country === 'object' ? product.country.currency : 'USD';
  const typeLabel = product.parentProduct ? `Heredado de: ${typeof product.parentProduct === 'object' ? product.parentProduct.name : 'Producto Base'}` : 'Producto propio';

  return (
    <View style={styles.itemCard}>
      <View style={styles.itemMain}>
        <View style={styles.imageWrapper}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.itemImage} />
          ) : (
            <MaterialIcons name="image" size={24} color={Theme.colors.onSurfaceVariant} />
          )}
        </View>
        
        <View style={styles.itemDetails}>
          <View style={styles.nameRow}>
            <Text style={styles.itemName} numberOfLines={2}>{product.name}</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{categoryName}</Text>
            </View>
          </View>
          <Text style={styles.itemId}>ID: {product.id}</Text>
          
          <View style={styles.dataRow}>
            <View style={styles.dataPill}>
              <View style={[styles.dot, { backgroundColor: Theme.colors.secondary }]} />
              <Text style={styles.pillText}>{product.price} {currency}</Text>
            </View>
            <View style={styles.dataPill}>
              <View style={[styles.dot, { backgroundColor: product.stock < 10 ? Theme.colors.error : Theme.colors.tertiary }]} />
              <Text style={styles.pillText}>Stock: {product.stock}</Text>
            </View>
          </View>
          <Text style={styles.typeLabel}>{typeLabel}</Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
          <MaterialIcons name="edit-square" size={20} color={Theme.colors.secondary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={onDelete}>
          <MaterialIcons name="delete" size={20} color={Theme.colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  headerContainer: {
    paddingVertical: 24,
    gap: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Theme.colors.secondary + '20', // Opacity
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    ...Theme.typography.headlineLg,
    color: Theme.colors.onSurface,
  },
  subtitle: {
    ...Theme.typography.bodySm,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  createButton: {
    backgroundColor: Theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  createButtonText: {
    ...Theme.typography.labelLg,
    color: '#fff',
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e4e2e1',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    marginTop: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    ...Theme.typography.bodyMd,
    color: Theme.colors.onSurface,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e4e2e1',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  itemMain: {
    flexDirection: 'row',
    gap: 16,
  },
  imageWrapper: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f6f3f2',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e4e2e1',
  },
  itemImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  itemDetails: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemName: {
    ...Theme.typography.labelLg,
    color: Theme.colors.onSurface,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  categoryBadge: {
    backgroundColor: '#e4e2e1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
  },
  categoryText: {
    ...Theme.typography.labelSm,
    color: Theme.colors.onSurfaceVariant,
    fontSize: 10,
  },
  itemId: {
    ...Theme.typography.bodySm,
    color: Theme.colors.onSurfaceVariant,
  },
  dataRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  dataPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fbf9f8',
    borderWidth: 1,
    borderColor: '#e4e2e1',
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pillText: {
    ...Theme.typography.labelSm,
    color: Theme.colors.onSurface,
    fontSize: 11,
  },
  typeLabel: {
    ...Theme.typography.bodySm,
    color: Theme.colors.onSurfaceVariant,
    fontSize: 10,
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f2f2f2',
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Theme.colors.secondary + '10',
  },
  deleteButton: {
    backgroundColor: Theme.colors.error + '10',
    borderWidth: 1,
    borderColor: Theme.colors.error + '20',
  },
  centerLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    ...Theme.typography.bodyMd,
    color: Theme.colors.onSurfaceVariant,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyStateText: {
    ...Theme.typography.bodyMd,
    color: Theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  creationScreen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  creationBody: {
    flex: 1,
  },
  creationBodyContent: {
    padding: 16,
    paddingTop: 24,
    paddingBottom: 40,
    gap: 32,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  subtitleContainer: {
    gap: 4,
  },
  optionDescriptionText: {
    ...Theme.typography.bodyMd,
    color: Theme.colors.onSurfaceVariant,
  },
  optionsGrid: {
    flexDirection: 'column',
    gap: 16,
  },
  optionCardLarge: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e4e2e1',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  optionIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTitleText: {
    ...Theme.typography.headlineSm,
    color: Theme.colors.onSurface,
    textAlign: 'center',
  },
  optionSubtext: {
    ...Theme.typography.bodyMd,
    color: Theme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  underlineDecor: {
    textDecorationLine: 'underline',
    textDecorationColor: '#d9c2b3',
  },
  creationFooter: {
    marginTop: 8,
  },
  fullWidthCancelButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  screenFooter: {
    padding: 16,
    paddingBottom: 32,
    backgroundColor: 'transparent',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  modalTitle: {
    ...Theme.typography.headlineLg,
    color: Theme.colors.onSurface,
    marginBottom: 4,
  },
  modalSubtitle: {
    ...Theme.typography.bodyMd,
    color: Theme.colors.onSurfaceVariant,
  },
  modalBody: {
    paddingVertical: 16,
  },
  stepCard: {
    borderWidth: 1,
    borderColor: '#eae8e7',
    borderRadius: 16,
    padding: 20,
    gap: 8,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  stepCardActive: {
    borderColor: Theme.colors.primary,
  },
  stepCardDisabled: {
    borderColor: '#f2f2f2',
    backgroundColor: '#fbf9f8',
    opacity: 0.6,
  },
  stepLabel: {
    ...Theme.typography.labelMd,
    color: Theme.colors.onSurfaceVariant,
  },
  stepLabelDisabled: {
    color: Theme.colors.onSurfaceVariant + '70',
  },
  stepSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepValue: {
    ...Theme.typography.bodyLg,
    color: Theme.colors.onSurface,
    flex: 1,
  },
  stepPlaceholder: {
    color: Theme.colors.onSurfaceVariant,
  },
  stepPlaceholderDisabled: {
    color: Theme.colors.onSurfaceVariant + '50',
  },
  infoAlert: {
    backgroundColor: '#FFF9E6',
    borderWidth: 1,
    borderColor: '#FFE082',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  infoAlertText: {
    flex: 1,
    ...Theme.typography.bodySm,
    color: '#E65100',
    lineHeight: 18,
  },
  modalFooter: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#f2f2f2',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e4e2e1',
  },
  cancelButtonText: {
    ...Theme.typography.labelLg,
    color: Theme.colors.onSurface,
  },
  confirmButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Theme.colors.secondary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  confirmButtonDisabled: {
    backgroundColor: '#abc7ff',
    opacity: 0.8,
  },
  confirmButtonText: {
    ...Theme.typography.labelLg,
    color: '#ffffff',
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
    maxHeight: '60%',
    paddingBottom: 40,
  },
  bottomSheetLarge: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
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
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
    gap: 12,
  },
  bottomSheetOptionActive: {
    backgroundColor: '#f6f3f2',
    borderRadius: 8,
  },
  bottomSheetOptionText: {
    ...Theme.typography.bodyLg,
    color: Theme.colors.onSurface,
  },
  bottomSheetOptionTextActive: {
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  pickerImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  stickyActionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderBottomWidth: 1,
    borderBottomColor: '#d9c2b3',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerSubtitle: {
    ...Theme.typography.labelSm,
    color: Theme.colors.onSurfaceVariant,
    fontSize: 10,
  },
  headerMainTitle: {
    ...Theme.typography.headlineSm,
    color: Theme.colors.onSurface,
  },
  headerSaveButton: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerSaveButtonText: {
    ...Theme.typography.labelLg,
    color: '#ffffff',
    fontWeight: '700',
  },
  headerSaveButtonDisabled: {
    backgroundColor: '#abc7ff',
    opacity: 0.8,
  },
  formSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: '#e4e2e1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  sectionTitle: {
    ...Theme.typography.labelLg,
    color: Theme.colors.onSurface,
    fontWeight: '700',
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    ...Theme.typography.labelMd,
    color: Theme.colors.onSurface,
    fontWeight: '600',
  },
  inputHelper: {
    ...Theme.typography.bodySm,
    color: Theme.colors.onSurfaceVariant,
    fontSize: 11,
  },
  formInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d9c2b3',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  formInputText: {
    ...Theme.typography.bodyMd,
    color: Theme.colors.onSurface,
  },
  formTextInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d9c2b3',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    ...Theme.typography.bodyMd,
    color: Theme.colors.onSurface,
  },
  editorContainer: {
    borderWidth: 1,
    borderColor: '#d9c2b3',
    borderRadius: 8,
    overflow: 'hidden',
  },
  editorToolbar: {
    flexDirection: 'row',
    backgroundColor: '#f6f3f2',
    padding: 8,
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#d9c2b3',
  },
  editorInput: {
    padding: 12,
    minHeight: 150,
    textAlignVertical: 'top',
    ...Theme.typography.bodyMd,
    color: Theme.colors.onSurface,
  },
  uploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#d9c2b3',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#f6f3f2',
  },
  uploadActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  uploadMiniButton: {
    backgroundColor: '#e4e2e1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d9c2b3',
  },
  uploadMiniButtonText: {
    ...Theme.typography.labelMd,
    color: Theme.colors.onSurface,
  },
  uploadOrText: {
    ...Theme.typography.bodySm,
    color: Theme.colors.onSurfaceVariant,
  },
  uploadSubtext: {
    ...Theme.typography.bodySm,
    color: Theme.colors.onSurfaceVariant,
    marginTop: 8,
  },
  priceInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d9c2b3',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  pricePrefix: {
    ...Theme.typography.bodyMd,
    color: Theme.colors.onSurfaceVariant,
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    paddingVertical: 10,
    ...Theme.typography.bodyMd,
    color: Theme.colors.onSurface,
  },
  imagePreviewList: {
    gap: 12,
    paddingVertical: 8,
  },
  previewImageWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  previewImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e4e2e1',
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Theme.colors.error,
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  addImageMiniButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#d9c2b3',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f6f3f2',
  },
  mediaGridItem: {
    flex: 1/3,
    aspectRatio: 1,
    padding: 2,
    position: 'relative',
  },
  mediaGridImage: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  mediaSelectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
});
