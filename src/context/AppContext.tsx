import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Asset, Operation, Dividend, PriceAlert, MarketData, Settings } from '../types';
import * as storage from '../services/storage';
import { fetchMarketData } from '../services/marketApi';

interface AppContextType {
  // Assets
  assets: Asset[];
  addAsset: (asset: Asset) => void;
  updateAsset: (asset: Asset) => void;
  deleteAsset: (id: string) => void;

  // Operations
  operations: Operation[];
  addOperation: (operation: Operation) => void;
  updateOperation: (operation: Operation) => void;
  deleteOperation: (id: string) => void;

  // Dividends
  dividends: Dividend[];
  addDividend: (dividend: Dividend) => void;
  deleteDividend: (id: string) => void;

  // Alerts
  alerts: PriceAlert[];
  addAlert: (alert: PriceAlert) => void;
  updateAlert: (alert: PriceAlert) => void;
  deleteAlert: (id: string) => void;

  // Market Data
  marketData: Record<string, MarketData>;
  refreshMarketData: (symbols: string[], market: 'B3' | 'US') => Promise<void>;
  isLoading: boolean;

  // Settings
  settings: Settings;
  updateSettings: (settings: Settings) => void;

  // Utility
  refreshData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const [dividends, setDividends] = useState<Dividend[]>([]);
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [marketData, setMarketData] = useState<Record<string, MarketData>>({});
  const [settings, setSettings] = useState<Settings>(storage.getSettings());
  const [isLoading, setIsLoading] = useState(false);

  // Load initial data
  useEffect(() => {
    refreshData();
  }, []);

  // Initialize market data for existing assets
  useEffect(() => {
    if (assets.length > 0) {
      const loadMarketData = async () => {
        const newMarketData: Record<string, MarketData> = {};

        for (const asset of assets) {
          try {
            const data = await fetchMarketData(asset.symbol, asset.market);
            if (data) {
              newMarketData[asset.symbol] = data;
            }
          } catch (error) {
            console.error(`Failed to fetch market data for ${asset.symbol}:`, error);
          }
        }

        setMarketData(newMarketData);
      };

      loadMarketData();
    }
  }, [assets.length]);

  const refreshData = () => {
    setAssets(storage.getAssets());
    setOperations(storage.getOperations());
    setDividends(storage.getDividends());
    setAlerts(storage.getAlerts());
    setSettings(storage.getSettings());
  };

  // Asset operations
  const addAsset = (asset: Asset) => {
    storage.saveAsset(asset);
    setAssets(storage.getAssets());

    // Fetch real market data
    fetchMarketData(asset.symbol, asset.market).then(data => {
      if (data) {
        setMarketData(prev => ({ ...prev, [asset.symbol]: data }));
      }
    });
  };

  const updateAsset = (asset: Asset) => {
    storage.saveAsset(asset);
    setAssets(storage.getAssets());
  };

  const deleteAsset = (id: string) => {
    storage.deleteAsset(id);
    setAssets(storage.getAssets());
  };

  // Operation operations
  const addOperation = (operation: Operation) => {
    storage.saveOperation(operation);
    setOperations(storage.getOperations());
  };

  const updateOperation = (operation: Operation) => {
    storage.saveOperation(operation);
    setOperations(storage.getOperations());
  };

  const deleteOperation = (id: string) => {
    storage.deleteOperation(id);
    setOperations(storage.getOperations());
  };

  // Dividend operations
  const addDividend = (dividend: Dividend) => {
    storage.saveDividend(dividend);
    setDividends(storage.getDividends());
  };

  const deleteDividend = (id: string) => {
    storage.deleteDividend(id);
    setDividends(storage.getDividends());
  };

  // Alert operations
  const addAlert = (alert: PriceAlert) => {
    storage.saveAlert(alert);
    setAlerts(storage.getAlerts());
  };

  const updateAlert = (alert: PriceAlert) => {
    storage.saveAlert(alert);
    setAlerts(storage.getAlerts());
  };

  const deleteAlert = (id: string) => {
    storage.deleteAlert(id);
    setAlerts(storage.getAlerts());
  };

  // Market data operations
  const refreshMarketData = async (symbols: string[], market: 'B3' | 'US') => {
    setIsLoading(true);

    const newMarketData: Record<string, MarketData> = {};

    for (const symbol of symbols) {
      try {
        const data = await fetchMarketData(symbol, market);
        if (data) {
          newMarketData[symbol] = data;
        }
      } catch (error) {
        console.error(`Failed to fetch market data for ${symbol}:`, error);
      }
    }

    setMarketData(prev => ({ ...prev, ...newMarketData }));
    setIsLoading(false);
  };

  // Settings operations
  const updateSettings = (newSettings: Settings) => {
    storage.saveSettings(newSettings);
    setSettings(newSettings);
  };

  const value: AppContextType = {
    assets,
    addAsset,
    updateAsset,
    deleteAsset,
    operations,
    addOperation,
    updateOperation,
    deleteOperation,
    dividends,
    addDividend,
    deleteDividend,
    alerts,
    addAlert,
    updateAlert,
    deleteAlert,
    marketData,
    refreshMarketData,
    isLoading,
    settings,
    updateSettings,
    refreshData
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};