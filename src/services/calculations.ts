import { Asset, Operation, Dividend, PortfolioSummary, GrahamAnalysis, MarketData } from '../types';

// Graham Formula - Valor Intrínseco de Graham
// VNG = √(22,5 × LPA × VPA)
export const calculateGrahamValue = (lpa: number, vpa: number): number => {
  if (lpa <= 0 || vpa <= 0) return 0;
  return Math.sqrt(22.5 * lpa * vpa);
};

// Análise de Graham para um ativo
export const analyzeGraham = (
  symbol: string,
  currentPrice: number,
  vpa: number,
  lpa: number
): GrahamAnalysis => {
  const grahamValue = calculateGrahamValue(lpa, vpa);
  const percentage = grahamValue > 0 ? (currentPrice / grahamValue) * 100 : 0;

  let status: 'barato' | 'justo' | 'caro';
  if (percentage <= 70) {
    status = 'barato';
  } else if (percentage <= 100) {
    status = 'justo';
  } else {
    status = 'caro';
  }

  return {
    symbol,
    currentPrice,
    vpa,
    lpa,
    grahamValue,
    percentage,
    status
  };
};

// Preço médio ponderado
export const calculateAveragePrice = (operations: Operation[]): number => {
  if (operations.length === 0) return 0;

  let totalCost = 0;
  let totalQuantity = 0;

  operations.forEach(op => {
    if (op.type === 'buy') {
      totalCost += op.quantity * op.price;
      totalQuantity += op.quantity;
    } else {
      totalQuantity -= op.quantity;
    }
  });

  return totalQuantity > 0 ? totalCost / totalQuantity : 0;
};

// Cálculo de PnL
export const calculatePnL = (currentPrice: number, averagePrice: number): number => {
  if (averagePrice === 0) return 0;
  return ((currentPrice - averagePrice) / averagePrice) * 100;
};

// Cálculo de PnL em valor absoluto
export const calculatePnLAbsolute = (
  currentPrice: number,
  averagePrice: number,
  quantity: number
): number => {
  return (currentPrice - averagePrice) * quantity;
};

// Dividend yield
export const calculateDividendYield = (
  totalDividends: number,
  currentValue: number
): number => {
  if (currentValue === 0) return 0;
  return (totalDividends / currentValue) * 100;
};

// Resumo do portfólio
export const calculatePortfolioSummary = (
  assets: Asset[],
  marketData: Record<string, MarketData>,
  dividends: Dividend[]
): PortfolioSummary => {
  let totalValue = 0;
  let totalCost = 0;
  let totalDividends = 0;
  let b3Value = 0;
  let usValue = 0;

  assets.forEach(asset => {
    const data = marketData[asset.symbol];
    const currentPrice = data?.currentPrice || asset.averagePrice;
    const assetValue = currentPrice * asset.quantity;
    const assetCost = asset.averagePrice * asset.quantity;

    totalValue += assetValue;
    totalCost += assetCost;

    if (asset.market === 'B3') {
      b3Value += assetValue;
    } else {
      usValue += assetValue;
    }
  });

  // Total de dividendos
  totalDividends = dividends.reduce((sum, d) => sum + d.netAmount, 0);

  const totalPnL = totalValue - totalCost;
  const totalPnLPercent = totalCost > 0 ? (totalPnL / totalCost) * 100 : 0;

  return {
    totalValue,
    totalCost,
    totalPnL,
    totalPnLPercent,
    totalDividends,
    b3Value,
    usValue,
    assetsCount: assets.length
  };
};

// Valor atual de um ativo
export const calculateAssetCurrentValue = (
  asset: Asset,
  marketData: Record<string, MarketData>
): number => {
  const data = marketData[asset.symbol];
  const currentPrice = data?.currentPrice || asset.averagePrice;
  return currentPrice * asset.quantity;
};

// Lucro/prejuízo de um ativo específico
export const calculateAssetPnL = (
  asset: Asset,
  marketData: Record<string, MarketData>
): { absolute: number; percentage: number } => {
  const data = marketData[asset.symbol];
  const currentPrice = data?.currentPrice || asset.averagePrice;
  const currentValue = currentPrice * asset.quantity;
  const cost = asset.averagePrice * asset.quantity;

  return {
    absolute: currentValue - cost,
    percentage: cost > 0 ? ((currentValue - cost) / cost) * 100 : 0
  };
};

// Dividendos por ativo
export const getDividendsByAsset = (
  assetId: string,
  dividends: Dividend[]
): Dividend[] => {
  return dividends.filter(d => d.assetId === assetId);
};

// Total de dividendos por ativo
export const getTotalDividendsByAsset = (
  assetId: string,
  dividends: Dividend[]
): number => {
  return getDividendsByAsset(assetId, dividends)
    .reduce((sum, d) => sum + d.netAmount, 0);
};

// Operações por ativo
export const getOperationsByAsset = (
  assetId: string,
  operations: Operation[]
): Operation[] => {
  return operations.filter(o => o.assetId === assetId);
};

// Proventos por período (mês/ano)
export const getDividendsByPeriod = (
  dividends: Dividend[],
  year?: number,
  month?: number
): Dividend[] => {
  return dividends.filter(d => {
    const date = new Date(d.date);
    if (year && date.getFullYear() !== year) return false;
    if (month && date.getMonth() !== month - 1) return false;
    return true;
  });
};

// Total de dividendos por ano
export const getYearlyDividends = (
  dividends: Dividend[]
): Record<number, number> => {
  return dividends.reduce((acc, d) => {
    const year = new Date(d.date).getFullYear();
    acc[year] = (acc[year] || 0) + d.netAmount;
    return acc;
  }, {} as Record<number, number>);
};

// Diversificação por mercado
export const getMarketAllocation = (
  assets: Asset[],
  marketData: Record<string, MarketData>
): { b3: number; us: number; total: number } => {
  let b3 = 0;
  let us = 0;
  let total = 0;

  assets.forEach(asset => {
    const data = marketData[asset.symbol];
    const currentPrice = data?.currentPrice || asset.averagePrice;
    const value = currentPrice * asset.quantity;

    total += value;
    if (asset.market === 'B3') {
      b3 += value;
    } else {
      us += value;
    }
  });

  return { b3, us, total };
};

// Verificar se alerta foi disparado
export const checkAlertTriggered = (
  alertType: 'above' | 'below' | 'change',
  alertValue: number,
  currentPrice: number,
  previousPrice: number
): boolean => {
  switch (alertType) {
    case 'above':
      return currentPrice >= alertValue;
    case 'below':
      return currentPrice <= alertValue;
    case 'change':
      if (previousPrice === 0) return false;
      const changePercent = Math.abs((currentPrice - previousPrice) / previousPrice * 100);
      return changePercent >= alertValue;
    default:
      return false;
  }
};

// Formatar símbolo para API (ex: PETR4 -> PETR4.SA para B3)
export const formatSymbolForApi = (symbol: string, market: 'B3' | 'US'): string => {
  if (market === 'B3') {
    return symbol.includes('.SA') ? symbol : `${symbol}.SA`;
  }
  return symbol;
};

// Reverter símbolo da API (ex: PETR4.SA -> PETR4)
export const formatSymbolFromApi = (symbol: string): string => {
  return symbol.replace('.SA', '');
};

// Calcular Preço Teto de Bazin
// Preço Teto = Dividendos Anuais / Taxa de Retorno Desejada
// Para B3, usar 6% como taxa base (ou seja, divide os dividendos por 0.06)
export const calculateBazinPrice = (annualDividends: number, desiredRate: number = 0.06): number => {
  if (desiredRate <= 0) return 0;
  return annualDividends / desiredRate;
};

// Analisar Bazin para um ativo
export const analyzeBazin = (
  symbol: string,
  currentPrice: number,
  annualDividends: number,
  desiredRate: number = 0.06
): { price: number; percentage: number; status: 'barato' | 'justo' | 'caro' } | null => {
  if (annualDividends <= 0) return null;

  const bazinPrice = calculateBazinPrice(annualDividends, desiredRate);
  if (bazinPrice <= 0) return null;

  // Se o preço atual é menor que o preço teto, está barato
  // A porcentagem indica quanto do preço justo está sendo pago
  const percentage = (currentPrice / bazinPrice) * 100;

  let status: 'barato' | 'justo' | 'caro';
  if (percentage <= 70) {
    status = 'barato';
  } else if (percentage <= 100) {
    status = 'justo';
  } else {
    status = 'caro';
  }

  return {
    price: bazinPrice,
    percentage,
    status
  };
};

// Calcular P/VP para FIIs
export const calculatePVP = (currentPrice: number, netAssetValue: number): number => {
  if (netAssetValue <= 0) return 0;
  return currentPrice / netAssetValue;
};

// Calcular dividend yield médio dos últimos 12 meses
export const calculateAverageDividendYield12M = (
  dividends: Dividend[],
  currentPrice: number,
  quantity: number
): number => {
  if (currentPrice <= 0 || quantity <= 0) return 0;

  const now = new Date();
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  // Filtrar dividendos dos últimos 12 meses
  const recentDividends = dividends.filter(d => {
    const date = new Date(d.date);
    return date >= twelveMonthsAgo;
  });

  // Somar dividendos brutos dos últimos 12 meses
  const totalDividends = recentDividends.reduce((sum, d) => sum + d.netAmount, 0);

  // Calcular yield baseado nos dividendos anuais
  const currentValue = currentPrice * quantity;
  if (currentValue <= 0) return 0;

  // Dividendos totais no período / Valor atual = yield
  return (totalDividends / currentValue) * 100;
};

// Verificar se é FII baseado no tipo do ativo
export const isFII = (type: AssetType): boolean => {
  return type === 'fii';
};

// Verificar se é ação baseado no tipo do ativo
export const isStock = (type: AssetType): boolean => {
  return type === 'stock' || type === 'bdr';
};