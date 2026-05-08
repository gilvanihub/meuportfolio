// Vercel API Serverless Function para buscar cotação de ações usando yahoo-finance2 v3
// Endpoint: /api/quote?symbol=PETR4&market=B3

import YahooFinance from 'yahoo-finance2';

// Criar instância do YahooFinance com configuração para suprimir avisos
const yf = new YahooFinance({
  suppressNotices: ['yahooSurvey'],
});

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { symbol, market = 'B3' } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: 'Symbol is required' });
  }

  try {
    // Adicionar sufixo .SA para ações da B3
    const yahooSymbol = market === 'B3' ? `${symbol}.SA` : symbol;

    // Buscar dados de cotação e fundamentalistas usando quoteSummary
    const quoteResult = await yf.quoteSummary(yahooSymbol, {
      modules: ['price', 'summaryDetail', 'defaultKeyStatistics', 'financialData']
    });

    if (!quoteResult) {
      return res.status(404).json({
        error: 'No data available',
        symbol,
        market
      });
    }

    const priceInfo = quoteResult.price || {};
    const summaryDetail = quoteResult.summaryDetail || {};
    const defaultKeyStatistics = quoteResult.defaultKeyStatistics || {};
    const financialData = quoteResult.financialData || {};

    // Verificar se tem preço válido
    const currentPrice = priceInfo.regularMarketPrice || summaryDetail.previousClose || 0;
    if (currentPrice <= 0) {
      return res.status(404).json({
        error: 'Invalid price data',
        symbol,
        market
      });
    }

    // Extrair dados fundamentais
    const bookValue = defaultKeyStatistics?.bookValue?.raw || summaryDetail?.bookValue?.raw || null;
    const eps = defaultKeyStatistics?.epsTrailingTwelveMonths?.raw || defaultKeyStatistics?.epsCurrentYear?.raw || financialData?.earningsPerShare?.raw || null;
    const dividendYield = summaryDetail?.dividendYield?.raw ? summaryDetail.dividendYield.raw * 100 : null;
    const trailingAnnualDividendRate = summaryDetail?.trailingAnnualDividendRate?.raw || null;

    // Calcular dividend yield se necessário
    let finalDividendYield = dividendYield;
    if (!finalDividendYield && trailingAnnualDividendRate && currentPrice > 0) {
      finalDividendYield = (trailingAnnualDividendRate / currentPrice) * 100;
    }

    // Retornar dados formatados
    return res.status(200).json({
      symbol: symbol,
      name: priceInfo.shortName || priceInfo.symbol || symbol,
      currentPrice: currentPrice,
      previousClose: priceInfo.regularMarketPreviousClose || currentPrice,
      change: priceInfo.regularMarketChange || 0,
      changePercent: priceInfo.regularMarketChangePercent || 0,
      market: market,
      currency: priceInfo.currency || (market === 'B3' ? 'BRL' : 'USD'),
      lastUpdated: new Date().toISOString(),
      // Dados fundamentais
      bookValue: bookValue,
      eps: eps,
      dividendYield: finalDividendYield,
      trailingAnnualDividendRate: trailingAnnualDividendRate
    });

  } catch (error) {
    console.error('Error fetching stock data:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      symbol,
      market
    });
  }
}
