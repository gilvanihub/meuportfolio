import { MarketData } from '../types';
import { saveMarketData, getMarketData } from './storage';

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

// API Serverless endpoint (Vercel)
const API_BASE = '/api';

// Fetch from our serverless API (which proxies to Yahoo Finance)
async function fetchFromServerAPI(symbol: string, market: 'B3' | 'US'): Promise<Partial<MarketData> | null> {
  try {
    const response = await fetch(
      `${API_BASE}/quote?symbol=${encodeURIComponent(symbol)}&market=${market}`
    );

    if (!response.ok) {
      console.log(`API returned status ${response.status} for ${symbol}`);
      return null;
    }

    const data = await response.json();

    if (data.error) {
      console.log(`API error for ${symbol}:`, data.error);
      return null;
    }

    if (!data.currentPrice || data.currentPrice <= 0) {
      console.log(`Invalid price from API for ${symbol}`);
      return null;
    }

    return {
      currentPrice: data.currentPrice,
      previousClose: data.previousClose || data.currentPrice,
      change: data.change || 0,
      changePercent: data.changePercent || 0,
      dividendYield: data.dividendYield
    };
  } catch (error) {
    console.error(`API fetch error for ${symbol}:`, error);
    return null;
  }
}

// Fetch fundamental data for Graham calculation
export async function fetchFundamentalData(symbol: string, market: 'B3' | 'US'): Promise<{ vpa: number; lpa: number } | null> {
  try {
    const response = await fetch(
      `${API_BASE}/quote?symbol=${encodeURIComponent(symbol)}&market=${market}`
    );

    if (!response.ok) return null;

    const data = await response.json();

    if (data.error) return null;

    // Try to get VPA (book value) and LPA (EPS) from the response
    if (data.bookValue && data.eps && data.bookValue > 0 && data.eps > 0) {
      return { vpa: data.bookValue, lpa: data.eps };
    }

    // Try to get from alternative fields
    if (data.bookValue && data.eps && data.bookValue > 0 && data.eps > 0) {
      return { vpa: data.bookValue, lpa: data.eps };
    }
  } catch (error) {
    console.error(`Failed to fetch fundamental data for ${symbol}:`, error);
  }

  return null;
}

// Fetch complete market data for a symbol
export async function fetchMarketData(symbol: string, market: 'B3' | 'US'): Promise<MarketData | null> {
  // Check cache first
  const cached = getMarketData(symbol);
  if (cached) {
    const cacheAge = Date.now() - new Date(cached.lastUpdated).getTime();
    if (cacheAge < CACHE_DURATION) {
      console.log(`Using cached data for ${symbol}`);
      return cached;
    }
  }

  // Fetch from serverless API
  const quoteData = await fetchFromServerAPI(symbol, market);

  // Fetch fundamental data
  const fundamentalData = await fetchFundamentalData(symbol, market);

  if (!quoteData || quoteData.currentPrice === 0) {
    // Return cached data if available
    if (cached && cached.currentPrice > 0) {
      console.log(`API failed, using cached data for ${symbol}`);
      return cached;
    }
    console.log(`No data available for ${symbol}`);
    return null;
  }

  const marketData: MarketData = {
    symbol,
    currentPrice: quoteData.currentPrice || 0,
    previousClose: quoteData.previousClose || 0,
    change: quoteData.change || 0,
    changePercent: quoteData.changePercent || 0,
    vpa: fundamentalData?.vpa,
    lpa: fundamentalData?.lpa,
    dividendYield: quoteData.dividendYield,
    lastUpdated: new Date().toISOString()
  };

  // Save to cache
  saveMarketData(symbol, marketData);

  return marketData;
}

// Fetch multiple symbols at once
export async function fetchMultipleMarketData(
  symbols: string[],
  market: 'B3' | 'US'
): Promise<Record<string, MarketData>> {
  const results: Record<string, MarketData> = {};

  // Process in batches to avoid overwhelming the API
  const batchSize = 3;
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    const promises = batch.map(async (symbol) => {
      try {
        const data = await fetchMarketData(symbol, market);
        if (data) {
          results[symbol] = data;
        }
      } catch (error) {
        console.error(`Failed to fetch market data for ${symbol}:`, error);
      }
    });

    await Promise.allSettled(promises);

    // Delay between batches
    if (i + batchSize < symbols.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return results;
}

// Simulated data for demo/testing when API is not available
export const getSimulatedMarketData = (symbol: string, market: 'B3' | 'US'): MarketData => {
  const hash = symbol.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0);
  const randomFactor = Math.abs(hash % 100) / 100;

  const basePrice = market === 'B3' ? 20 + randomFactor * 80 : 50 + randomFactor * 300;
  const previousClose = basePrice * (0.95 + randomFactor * 0.1);
  const currentPrice = basePrice * (0.97 + randomFactor * 0.06);

  const vpa = 20 + randomFactor * 40;
  const lpa = 1 + randomFactor * 8;

  return {
    symbol,
    currentPrice: Math.round(currentPrice * 100) / 100,
    previousClose: Math.round(previousClose * 100) / 100,
    change: Math.round((currentPrice - previousClose) * 100) / 100,
    changePercent: Math.round(((currentPrice - previousClose) / previousClose) * 10000) / 100,
    vpa: Math.round(vpa * 100) / 100,
    lpa: Math.round(lpa * 100) / 100,
    dividendYield: Math.round(randomFactor * 10 * 100) / 100,
    lastUpdated: new Date().toISOString()
  };
};

// Format currency based on market
export const formatMarketCurrency = (
  value: number,
  market: 'B3' | 'US'
): string => {
  const currency = market === 'B3' ? 'BRL' : 'USD';
  return new Intl.NumberFormat(currency === 'BRL' ? 'pt-BR' : 'en-US', {
    style: 'currency',
    currency
  }).format(value);
};

// Get stock info for autocomplete
export const searchStocks = async (query: string): Promise<Array<{ symbol: string; name: string; market: 'B3' | 'US' }>> => {
  try {
    const b3StocksData = await import('../data/b3Stocks.json');
    const b3Stocks: Array<{ symbol: string; name: string; market: 'B3' | 'US' }> = b3StocksData.default || b3StocksData;

    const usStocks: Array<{ symbol: string; name: string; market: 'US' }> = [
      { symbol: 'AAPL', name: 'Apple Inc.', market: 'US' },
      { symbol: 'MSFT', name: 'Microsoft Corporation', market: 'US' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', market: 'US' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', market: 'US' },
      { symbol: 'META', name: 'Meta Platforms Inc.', market: 'US' },
      { symbol: 'TSLA', name: 'Tesla Inc.', market: 'US' },
      { symbol: 'NVDA', name: 'NVIDIA Corporation', market: 'US' },
      { symbol: 'JPM', name: 'JPMorgan Chase & Co.', market: 'US' },
      { symbol: 'V', name: 'Visa Inc.', market: 'US' },
      { symbol: 'JNJ', name: 'Johnson & Johnson', market: 'US' },
      { symbol: 'WMT', name: 'Walmart Inc.', market: 'US' },
      { symbol: 'PG', name: 'Procter & Gamble Co.', market: 'US' },
      { symbol: 'MA', name: 'Mastercard Inc.', market: 'US' },
      { symbol: 'UNH', name: 'UnitedHealth Group Inc.', market: 'US' },
      { symbol: 'HD', name: 'Home Depot Inc.', market: 'US' },
      { symbol: 'DIS', name: 'Walt Disney Co.', market: 'US' },
      { symbol: 'BAC', name: 'Bank of America Corp.', market: 'US' },
      { symbol: 'NFLX', name: 'Netflix Inc.', market: 'US' },
      { symbol: 'ADBE', name: 'Adobe Inc.', market: 'US' },
      { symbol: 'CRM', name: 'Salesforce Inc.', market: 'US' },
    ];

    const queryLower = query.toLowerCase();

    const results = [...b3Stocks, ...usStocks].filter(
      stock =>
        stock.symbol.toLowerCase().includes(queryLower) ||
        stock.name.toLowerCase().includes(queryLower)
    );

    return results.slice(0, 10);
  } catch (error) {
    console.error('Error searching stocks:', error);
    return [];
  }
};