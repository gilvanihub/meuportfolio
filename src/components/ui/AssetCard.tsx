import React from 'react';
import { Asset, MarketData, AssetType } from '../../types';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { calculatePnL, analyzeGraham, analyzeBazin, isFII, calculateAverageDividendYield12M } from '../../services/calculations';
import { useApp } from '../../context/AppContext';

interface AssetCardProps {
  asset: Asset;
  marketData?: MarketData;
  onClick?: () => void;
}

// Helper para calcular cor baseada no desconto
const getDiscountColor = (percentage: number): string => {
  if (percentage <= 50) return 'bg-green-400';
  if (percentage <= 70) return 'bg-green-300';
  if (percentage <= 85) return 'bg-green-200';
  if (percentage <= 100) return 'bg-lime-200';
  if (percentage <= 115) return 'bg-yellow-200';
  if (percentage <= 130) return 'bg-orange-200';
  return 'bg-red-200';
};

const getDiscountTextColor = (percentage: number): string => {
  if (percentage <= 70) return 'text-green-700';
  if (percentage <= 100) return 'text-lime-700';
  if (percentage <= 130) return 'text-orange-700';
  return 'text-red-700';
};

const AssetCard: React.FC<AssetCardProps> = ({ asset, marketData, onClick }) => {
  const { dividends, operations } = useApp();
  const currentPrice = marketData?.currentPrice || asset.averagePrice;
  const currentValue = currentPrice * asset.quantity;
  const costBasis = asset.averagePrice * asset.quantity;
  const pnl = calculatePnL(currentPrice, asset.averagePrice);
  const pnlAbsolute = currentValue - costBasis;

  const assetOperations = operations.filter(op => op.assetId === asset.id);
  const operationCount = assetOperations.length;

  const graham = marketData?.vpa && marketData?.lpa
    ? analyzeGraham(asset.symbol, currentPrice, marketData.vpa, marketData.lpa)
    : null;

  const annualDividendPerShare = marketData?.dividendYield
    ? (currentPrice * marketData.dividendYield / 100)
    : 0;
  
  const bazin = annualDividendPerShare > 0
    ? analyzeBazin(asset.symbol, currentPrice, annualDividendPerShare)
    : null;

  const isFIIAsset = isFII(asset.type);

  const pvp = marketData?.vpa && marketData?.vpa > 0
    ? currentPrice / marketData.vpa
    : null;

  const assetDividends = dividends.filter(d => d.assetId === asset.id);
  const avgYield12M = assetDividends.length > 0
    ? calculateAverageDividendYield12M(assetDividends, currentPrice, asset.quantity)
    : null;

  const marketColor = asset.market === 'B3' ? 'text-blue-600' : 'text-purple-600';
  const marketBg = asset.market === 'B3' ? 'bg-blue-100' : 'bg-purple-100';

  const getTypeBadge = (type: AssetType) => {
    switch (type) {
      case 'stock': return { label: 'Ação', bg: 'bg-blue-100', text: 'text-blue-700' };
      case 'fii': return { label: 'FII', bg: 'bg-purple-100', text: 'text-purple-700' };
      case 'etf': return { label: 'ETF', bg: 'bg-teal-100', text: 'text-teal-700' };
      case 'bdr': return { label: 'BDR', bg: 'bg-orange-100', text: 'text-orange-700' };
      default: return { label: type.toUpperCase(), bg: 'bg-gray-100', text: 'text-gray-700' };
    }
  };

  const typeBadge = getTypeBadge(asset.type);

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer border-l-4 border-transparent hover:border-primary"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg">{asset.symbol}</span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${marketBg} ${marketColor}`}>
                {asset.market}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeBadge.bg} ${typeBadge.text}`}>
                {typeBadge.label}
              </span>
            </div>
            <span className="text-sm text-gray-500">{asset.name}</span>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          <span className="bg-gray-100 px-2 py-1 rounded">
            {operationCount} {operationCount === 1 ? 'operação' : 'operações'}
          </span>
        </div>
      </div>

      {/* Main Info */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <span className="text-xs text-gray-500 block mb-1">Quantidade</span>
          <span className="font-semibold">{asset.quantity} {asset.type === 'fii' ? 'cotas' : 'ações'}</span>
        </div>
        <div>
          <span className="text-xs text-gray-500 block mb-1">Preço Médio</span>
          <span className="font-semibold">{formatCurrency(asset.averagePrice)}</span>
        </div>
        <div>
          <span className="text-xs text-gray-500 block mb-1">Preço Atual</span>
          <span className="font-semibold">{formatCurrency(currentPrice)}</span>
        </div>
        <div>
          <span className="text-xs text-gray-500 block mb-1">Valor Total</span>
          <span className="font-semibold">{formatCurrency(currentValue)}</span>
        </div>
      </div>

      {/* PnL */}
      <div className={`flex items-center justify-between p-3 rounded-lg ${pnl >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
        <div>
          <span className="text-xs text-gray-500 block">Lucro/Prejuízo</span>
          <div className={`text-lg font-bold ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {pnlAbsolute >= 0 ? '+' : ''}{formatCurrency(pnlAbsolute)}
          </div>
        </div>
        <div className={`text-lg font-bold ${pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatPercent(pnl)}
        </div>
      </div>

      {/* Valuation Indicators */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="text-xs text-gray-500 mb-2">Indicadores de Valuation</div>

        {isFIIAsset ? (
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-3 rounded-lg ${pvp ? (pvp <= 1 ? 'bg-green-50' : pvp <= 1.2 ? 'bg-yellow-50' : 'bg-red-50') : 'bg-gray-50'}`}>
              <span className="text-xs text-gray-500 block">P/VP</span>
              <span className={`font-semibold ${pvp ? (pvp <= 1 ? 'text-green-700' : pvp <= 1.2 ? 'text-yellow-700' : 'text-red-700') : 'text-gray-400'}`}>
                {pvp ? pvp.toFixed(2) : '--'}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-gray-50">
              <span className="text-xs text-gray-500 block">Yield 12M</span>
              <span className={`font-semibold ${avgYield12M && avgYield12M > 0 ? 'text-green-700' : 'text-gray-400'}`}>
                {avgYield12M && avgYield12M > 0 ? `${avgYield12M.toFixed(2)}%` : '--'}
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-3 rounded-lg ${graham ? (graham.percentage <= 70 ? 'bg-green-50' : graham.percentage <= 100 ? 'bg-lime-50' : 'bg-red-50') : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">Graham</span>
                {graham && (
                  <span className={`text-xs font-medium ${graham.percentage <= 70 ? 'text-green-600' : graham.percentage <= 100 ? 'text-lime-600' : 'text-red-600'}`}>
                    {graham.percentage.toFixed(0)}%
                  </span>
                )}
              </div>
              {graham ? (
                <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden mb-1">
                  <div
                    className={getDiscountColor(graham.percentage)}
                    style={{ width: `${Math.min(graham.percentage, 150)}%` }}
                  />
                </div>
              ) : (
                <div className="h-2 bg-gray-100 rounded-full mb-1" />
              )}
              <span className={`text-xs ${graham ? getDiscountTextColor(graham.percentage) : 'text-gray-400'}`}>
                {graham ? `Justo: ${formatCurrency(graham.grahamValue)}` : 'VPA/LPA indisponível'}
              </span>
            </div>

            <div className={`p-3 rounded-lg ${bazin ? (bazin.percentage <= 70 ? 'bg-green-50' : bazin.percentage <= 100 ? 'bg-lime-50' : 'bg-red-50') : 'bg-gray-50'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">Bazin</span>
                {bazin && (
                  <span className={`text-xs font-medium ${bazin.percentage <= 70 ? 'text-green-600' : bazin.percentage <= 100 ? 'text-lime-600' : 'text-red-600'}`}>
                    {bazin.percentage.toFixed(0)}%
                  </span>
                )}
              </div>
              {bazin ? (
                <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden mb-1">
                  <div
                    className={getDiscountColor(bazin.percentage)}
                    style={{ width: `${Math.min(bazin.percentage, 150)}%` }}
                  />
                </div>
              ) : (
                <div className="h-2 bg-gray-100 rounded-full mb-1" />
              )}
              <span className={`text-xs ${bazin ? getDiscountTextColor(bazin.percentage) : 'text-gray-400'}`}>
                {bazin ? `Teto: ${formatCurrency(bazin.price)}` : 'Dividendos indisponível'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetCard;