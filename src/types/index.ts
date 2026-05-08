// Asset Consolidator - TypeScript Type Definitions

export type Market = 'B3' | 'US';
export type AssetType = 'stock' | 'etf' | 'bdr' | 'fii';
export type OperationType = 'buy' | 'sell' | 'bonus' | 'subscription';
export type DividendType = 'dividend' | 'jcp' | 'rendimento';
export type AlertType = 'above' | 'below' | 'change';

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  market: Market;
  type: AssetType;
  quantity: number;
  averagePrice: number;
  sector?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Operation {
  id: string;
  assetId: string;
  symbol: string;
  type: OperationType;
  quantity: number;
  price: number;
  total: number;
  date: string;
  broker?: string;
  notes?: string;
  createdAt: string;
}

export interface Dividend {
  id: string;
  assetId: string;
  symbol: string;
  date: string;
  type: DividendType;
  grossAmount: number;
  taxAmount: number;
  netAmount: number;
  createdAt: string;
}

export interface PriceAlert {
  id: string;
  assetId: string;
  symbol: string;
  type: AlertType;
  value: number;
  triggered: boolean;
  triggeredAt?: string;
  createdAt: string;
}

export interface MarketData {
  symbol: string;
  currentPrice: number;
  previousClose: number;
  change: number;
  changePercent: number;
  vpa?: number;
  lpa?: number;
  dividendYield?: number;
  lastUpdated: string;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalPnL: number;
  totalPnLPercent: number;
  totalDividends: number;
  b3Value: number;
  usValue: number;
  assetsCount: number;
}

export interface GrahamAnalysis {
  symbol: string;
  currentPrice: number;
  vpa: number;
  lpa: number;
  grahamValue: number;
  percentage: number;
  status: 'barato' | 'justo' | 'caro';
}

export interface Settings {
  currency: 'BRL' | 'USD';
  timezone: string;
  lastApiUpdate?: string;
}

// Storage Keys
export const STORAGE_KEYS = {
  ASSETS: 'consolidator_assets',
  OPERATIONS: 'consolidator_operations',
  DIVIDENDS: 'consolidator_dividends',
  ALERTS: 'consolidator_alerts',
  SETTINGS: 'consolidator_settings',
  MARKET_CACHE: 'consolidator_market_data'
} as const;