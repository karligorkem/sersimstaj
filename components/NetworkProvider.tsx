import React, { createContext, useContext, useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { processOfflineQueue } from '~/services/offlineQueue';

interface NetworkContextType {
  isConnected: boolean | null;
}

const NetworkContext = createContext<NetworkContextType>({ isConnected: null });

export const useNetwork = () => useContext(NetworkContext);

export const NetworkProvider = ({ children }: { children: React.ReactNode }) => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const isOnline = state.isConnected != null && state.isConnected && state.isInternetReachable !== false;
      setIsConnected(isOnline);

      if (isOnline) {
        console.log('İnternet bağlantısı var, çevrimdışı kuyruk işleniyor...');
        processOfflineQueue();
      } else {
        console.log('İnternet bağlantısı yok.');
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <NetworkContext.Provider value={{ isConnected }}>
      {children}
    </NetworkContext.Provider>
  );
};