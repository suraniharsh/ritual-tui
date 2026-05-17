import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { storageService } from '../services/storage';
import type { StorageSchema } from '../types/storage';
import { logger } from '../utils/logger';

interface StorageContextType {
  data: StorageSchema | null;
  isLoading: boolean;
  error: Error | null;
  save: (data: StorageSchema) => Promise<void>;
  saveNow: (data?: StorageSchema) => Promise<void>;
}

const StorageContext = createContext<StorageContextType | undefined>(undefined);

interface StorageProviderProps {
  children: React.ReactNode;
}

const AUTO_SAVE_DEBOUNCE_MS = 100;

export const StorageProvider: React.FC<StorageProviderProps> = ({ children }) => {
  const [data, setData] = useState<StorageSchema | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  // Keep a ref to always have the latest data for sync saves
  const latestDataRef = useRef<StorageSchema | null>(null);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const loadedData = await storageService.load();
        setData(loadedData);
        latestDataRef.current = loadedData;
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Debounced save keeps disk writes low without slowing UI feedback
  const save = useCallback(async (newData: StorageSchema) => {
    // Update ref synchronously to ensure latest data is always available
    latestDataRef.current = newData;
    setData(newData);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await storageService.save(newData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to save'));
      }
    }, AUTO_SAVE_DEBOUNCE_MS);
  }, []);

  // Immediate save (for exit)
  const saveNow = useCallback(async (dataToSave?: StorageSchema) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    const data = dataToSave || latestDataRef.current;
    if (data) {
      try {
        await storageService.save(data);
      } catch (err) {
        logger.log('Failed to save', { error: String(err) });
      }
    }
  }, []);

  // Save on unmount using the ref (always has latest data)
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (latestDataRef.current) {
        // Use sync write for unmount to ensure data is saved
        storageService.save(latestDataRef.current).catch((err) => {
          logger.log('Failed to save on unmount', { error: String(err) });
        });
      }
    };
  }, []);

  const contextValue = React.useMemo(
    () => ({ data, isLoading, error, save, saveNow }),
    [data, isLoading, error, save, saveNow],
  );

  return <StorageContext.Provider value={contextValue}>{children}</StorageContext.Provider>;
};

export const useStorage = (): StorageContextType => {
  const context = useContext(StorageContext);
  if (!context) {
    throw new Error('useStorage must be used within StorageProvider');
  }
  return context;
};
