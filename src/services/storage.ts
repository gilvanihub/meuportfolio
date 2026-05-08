import { STORAGE_KEYS, Asset, Operation, Dividend, PriceAlert, Settings, MarketData } from '../types';

// Generic storage helpers
const getItem = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const setItem = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving to localStorage:`, error);
  }
};

// Asset Operations
export const getAssets = (): Asset[] => getItem<Asset[]>(STORAGE_KEYS.ASSETS, []);

export const saveAsset = (asset: Asset): void => {
  const assets = getAssets();
  const existingIndex = assets.findIndex(a => a.id === asset.id);
  if (existingIndex >= 0) {
    assets[existingIndex] = asset;
  } else {
    assets.push(asset);
  }
  setItem(STORAGE_KEYS.ASSETS, assets);
};

export const deleteAsset = (id: string): void => {
  const assets = getAssets().filter(a => a.id !== id);
  setItem(STORAGE_KEYS.ASSETS, assets);
};

// Operation Operations
export const getOperations = (): Operation[] => getItem<Operation[]>(STORAGE_KEYS.OPERATIONS, []);

export const saveOperation = (operation: Operation): void => {
  const operations = getOperations();
  const existingIndex = operations.findIndex(o => o.id === operation.id);
  if (existingIndex >= 0) {
    operations[existingIndex] = operation;
  } else {
    operations.push(operation);
  }
  setItem(STORAGE_KEYS.OPERATIONS, operations);
};

export const deleteOperation = (id: string): void => {
  const operations = getOperations().filter(o => o.id !== id);
  setItem(STORAGE_KEYS.OPERATIONS, operations);
};

// Dividend Operations
export const getDividends = (): Dividend[] => getItem<Dividend[]>(STORAGE_KEYS.DIVIDENDS, []);

export const saveDividend = (dividend: Dividend): void => {
  const dividends = getDividends();
  const existingIndex = dividends.findIndex(d => d.id === dividend.id);
  if (existingIndex >= 0) {
    dividends[existingIndex] = dividend;
  } else {
    dividends.push(dividend);
  }
  setItem(STORAGE_KEYS.DIVIDENDS, dividends);
};

export const deleteDividend = (id: string): void => {
  const dividends = getDividends().filter(d => d.id !== id);
  setItem(STORAGE_KEYS.DIVIDENDS, dividends);
};

// Alert Operations
export const getAlerts = (): PriceAlert[] => getItem<PriceAlert[]>(STORAGE_KEYS.ALERTS, []);

export const saveAlert = (alert: PriceAlert): void => {
  const alerts = getAlerts();
  const existingIndex = alerts.findIndex(a => a.id === alert.id);
  if (existingIndex >= 0) {
    alerts[existingIndex] = alert;
  } else {
    alerts.push(alert);
  }
  setItem(STORAGE_KEYS.ALERTS, alerts);
};

export const deleteAlert = (id: string): void => {
  const alerts = getAlerts().filter(a => a.id !== id);
  setItem(STORAGE_KEYS.ALERTS, alerts);
};

// Settings Operations
export const getSettings = (): Settings => getItem<Settings>(STORAGE_KEYS.SETTINGS, {
  currency: 'BRL',
  timezone: 'America/Sao_Paulo'
});

export const saveSettings = (settings: Settings): void => {
  setItem(STORAGE_KEYS.SETTINGS, settings);
};

// Market Data Cache
export const getMarketDataCache = (): Record<string, MarketData> =>
  getItem<Record<string, MarketData>>(STORAGE_KEYS.MARKET_CACHE, {});

export const setMarketDataCache = (data: Record<string, MarketData>): void => {
  setItem(STORAGE_KEYS.MARKET_CACHE, data);
};

export const getMarketData = (symbol: string): MarketData | undefined => {
  const cache = getMarketDataCache();
  return cache[symbol];
};

export const saveMarketData = (symbol: string, data: MarketData): void => {
  const cache = getMarketDataCache();
  cache[symbol] = data;
  setMarketDataCache(cache);
};

// Utility functions
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const clearAllData = (): void => {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
};

export const exportData = (): string => {
  return JSON.stringify({
    assets: getAssets(),
    operations: getOperations(),
    dividends: getDividends(),
    alerts: getAlerts(),
    settings: getSettings()
  }, null, 2);
};

export const importData = (jsonString: string): boolean => {
  try {
    const data = JSON.parse(jsonString);
    if (data.assets) setItem(STORAGE_KEYS.ASSETS, data.assets);
    if (data.operations) setItem(STORAGE_KEYS.OPERATIONS, data.operations);
    if (data.dividends) setItem(STORAGE_KEYS.DIVIDENDS, data.dividends);
    if (data.alerts) setItem(STORAGE_KEYS.ALERTS, data.alerts);
    if (data.settings) setItem(STORAGE_KEYS.SETTINGS, data.settings);
    return true;
  } catch {
    return false;
  }
};