import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define basic types based on Payload CMS response
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

const BASE_URL = 'https://shop.giborcommunity.com/api';

interface AppDataContextType {
  user: User | null;
  token: string | null;
  stores: Store[];
  selectedStore: Store | null;
  isLoading: boolean;
  api: AxiosInstance;
  login: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  setSelectedStore: (store: Store) => void;
  refreshStores: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStoreState] = useState<Store | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

        if (storedUser) setUser(JSON.parse(storedUser));
        if (storedToken) setToken(storedToken);
        if (storedStores) setStores(JSON.parse(storedStores));
        if (storedSelectedStore) setSelectedStoreState(JSON.parse(storedSelectedStore));
      } catch (error) {
        console.error('Error initializing app data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAppData();
  }, []);

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
    
    // We need to wait for state update or use local variables
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
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('stores');
    await AsyncStorage.removeItem('selectedStore');
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

  const setSelectedStore = (store: Store) => {
    setSelectedStoreState(store);
    AsyncStorage.setItem('selectedStore', JSON.stringify(store));
  };

  return (
    <AppDataContext.Provider
      value={{
        user,
        token,
        stores,
        selectedStore,
        isLoading,
        api,
        login,
        logout,
        setSelectedStore,
        refreshStores,
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
