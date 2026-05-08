import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define basic types based on Payload CMS response
export interface Country {
  id: number;
  name: string;
  iso2: string;
  phone_code?: string;
}

export interface Store {
  id: number;
  name: string;
  slug: string;
  country?: any;
  owner?: any;
}

export interface User {
  id: number;
  email: string;
  role: string;
}

import axios, { AxiosInstance } from 'axios';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://shop.giborcommunity.com/api';

interface AppDataContextType {
  user: User | null;
  token: string | null;
  stores: Store[];
  countries: Country[];
  selectedStore: Store | null;
  preferredCountry: any | null;
  selectedProduct: any | null;
  setSelectedProduct: (product: any) => void;
  catalogProducts: any[];
  setCatalogProducts: (products: any[]) => void;
  favorites: string[];
  toggleFavorite: (productId: string) => void;
  isLoading: boolean;
  api: AxiosInstance;
  login: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  setSelectedStore: (store: Store) => void;
  setPreferredCountry: (country: any) => void;
  refreshStores: () => Promise<void>;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  pendingOrdersCount: number;
  refreshPendingCount: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedStore, setSelectedStoreState] = useState<Store | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [preferredCountry, setPreferredCountryState] = useState<any | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

  const openDrawer = () => {
    refreshPendingCount();
    setIsDrawerOpen(true);
  };
  const closeDrawer = () => setIsDrawerOpen(false);
  const toggleDrawer = () => setIsDrawerOpen(prev => !prev);

  const refreshPendingCount = async () => {
    if (!user) return;
    try {
      // Fetch only the totalDocs by setting limit=1
      const response = await api.get(`/orders?where[status][equals]=pending&where[store.owner][equals]=${user.id}&limit=1`);
      setPendingOrdersCount(response.data.totalDocs || 0);
    } catch (error) {
      console.error('Error fetching pending orders count:', error);
    }
  };

  const api = axios.create({
    baseURL: BASE_URL,
  });

  if (token) {
    api.defaults.headers.common['Authorization'] = `JWT ${token}`;
  }

  // Initialize app data from storage
  useEffect(() => {
    const initAppData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        const storedToken = await AsyncStorage.getItem('token');
        const storedStores = await AsyncStorage.getItem('stores');
        const storedSelectedStore = await AsyncStorage.getItem('selectedStore');
        const storedCountry = await AsyncStorage.getItem('preferredCountry');
        const storedFavorites = await AsyncStorage.getItem('favoriteProducts');

        if (storedUser) setUser(JSON.parse(storedUser));
        if (storedToken) setToken(storedToken);
        if (storedStores) setStores(JSON.parse(storedStores));
        if (storedSelectedStore) setSelectedStoreState(JSON.parse(storedSelectedStore));
        if (storedCountry) setPreferredCountryState(JSON.parse(storedCountry));
        if (storedFavorites) setFavorites(JSON.parse(storedFavorites));
      } catch (error) {
        console.error('Error initializing app data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAppData();
    fetchInitialCountries();
  }, []);

  const fetchInitialCountries = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/products/catalog-filters`);
      if (response.data.filters?.countries) {
        setCountries(response.data.filters.countries);
      }
    } catch (error) {
      console.error('Error fetching initial countries:', error);
    }
  };

  const login = async (userData: any) => {
    const userObj = {
      id: userData.user.id,
      email: userData.user.email,
      role: userData.user.role || 'user',
    };
    const userToken = userData.token;
    
    setUser(userObj);
    setToken(userToken);
    
    await AsyncStorage.setItem('user', JSON.stringify(userObj));
    await AsyncStorage.setItem('token', userToken);
    
    try {
      const response = await axios.get(`${BASE_URL}/stores?where[owner][equals]=${userObj.id}&limit=100`, {
        headers: { Authorization: `JWT ${userToken}` }
      });
      const data = response.data;
      
      if (data.docs) {
        setStores(data.docs);
        await AsyncStorage.setItem('stores', JSON.stringify(data.docs));
        
        if (data.docs.length > 0) {
          setSelectedStore(data.docs[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching stores during login:', error);
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    setStores([]);
    setSelectedStoreState(null);
    setPreferredCountryState(null);
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('stores');
    await AsyncStorage.removeItem('selectedStore');
    await AsyncStorage.removeItem('preferredCountry');
  };

  const refreshStores = async () => {
    if (!user || !token) return;
    
    try {
      const response = await api.get(`/stores?where[owner][equals]=${user.id}&limit=100`);
      const data = response.data;
      
      if (data.docs) {
        setStores(data.docs);
        await AsyncStorage.setItem('stores', JSON.stringify(data.docs));
        
        if (!selectedStore && data.docs.length > 0) {
          setSelectedStore(data.docs[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
    }
  };

  const setSelectedStore = async (store: Store) => {
    setSelectedStoreState(store);
    await AsyncStorage.setItem('selectedStore', JSON.stringify(store));
  };

  const setPreferredCountry = async (country: any) => {
    setPreferredCountryState(country);
    await AsyncStorage.setItem('preferredCountry', JSON.stringify(country));
  };

  const toggleFavorite = async (productId: string) => {
    const newFavorites = favorites.includes(productId)
      ? favorites.filter(id => id !== productId)
      : [...favorites, productId];
    
    setFavorites(newFavorites);
    await AsyncStorage.setItem('favoriteProducts', JSON.stringify(newFavorites));
  };

  return (
    <AppDataContext.Provider
      value={{
        user,
        token,
        stores,
        countries,
        selectedStore,
        preferredCountry,
        selectedProduct,
        setSelectedProduct,
        catalogProducts,
        setCatalogProducts,
        favorites,
        isLoading,
        api,
        login,
        logout,
        setSelectedStore,
        setPreferredCountry,
        refreshStores,
        toggleFavorite,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        toggleDrawer,
        pendingOrdersCount,
        refreshPendingCount,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};
