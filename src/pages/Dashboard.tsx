import React from 'react';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, DollarSign, Gift, Briefcase, RefreshCw } from 'lucide-react';
import SummaryCard from '../components/ui/SummaryCard';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatPercent, formatRelativeTime } from '../utils/formatters';
import { calculatePortfolioSummary, getMarketAllocation } from '../services/calculations';

const Dashboard: React.FC = () => {
  const { assets, dividends, marketData, isLoading, refreshMarketData } = useApp();

  const portfolioSummary = calculatePortfolioSummary(assets, marketData, dividends);
  const marketAllocation = getMarketAllocation(assets, marketData);

  // Prepare pie chart data
  const pieData = [
    { name: 'B3', value: marketAllocation.b3, color: '#1E3A5F' },
    { name: 'EUA', value: marketAllocation.us, color: '#4A90A4' },
  ].filter(d => d.value > 0);

  // Top holdings sorted by value
  const topHoldings = [...assets]
    .map(asset => ({
      ...asset,
      value: (marketData[asset.symbol]?.currentPrice || asset.averagePrice) * asset.quantity
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const handleRefresh = () => {
    if (assets.length > 0) {
      const symbols = assets.map(a => a.symbol);
      const b3Symbols = assets.filter(a => a.market === 'B3').map(a => a.symbol);
      if (b3Symbols.length > 0) refreshMarketData(b3Symbols, 'B3');
      const usSymbols = assets.filter(a => a.market === 'US').map(a => a.symbol);
      if (usSymbols.length > 0) refreshMarketData(usSymbols, 'US');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Visão geral do seu portfólio</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Valor Total"
          value={formatCurrency(portfolioSummary.totalValue)}
          subtitle="Patrimônio atual"
          variant="primary"
          icon={<DollarSign size={24} />}
        />
        <SummaryCard
          title="Lucro/Prejuízo"
          value={`${portfolioSummary.totalPnL >= 0 ? '+' : ''}${formatCurrency(portfolioSummary.totalPnL)}`}
          change={portfolioSummary.totalPnLPercent}
          subtitle="Total geral"
          variant={portfolioSummary.totalPnL >= 0 ? 'success' : undefined}
        />
        <SummaryCard
          title="Dividendos"
          value={formatCurrency(portfolioSummary.totalDividends)}
          subtitle="Total recebido"
          variant="warning"
          icon={<Gift size={24} />}
        />
        <SummaryCard
          title="Ativos"
          value={portfolioSummary.assetsCount.toString()}
          subtitle={`${marketAllocation.b3 > 0 ? 'B3' : ''} ${marketAllocation.b3 > 0 && marketAllocation.us > 0 ? '•' : ''} ${marketAllocation.us > 0 ? 'EUA' : ''}`}
          variant="default"
          icon={<Briefcase size={24} />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Market Allocation Pie Chart */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Alocação por Mercado</h3>
          {pieData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <Briefcase size={48} className="mx-auto mb-2 opacity-50" />
                <p>Adicione ativos para ver a distribuição</p>
              </div>
            </div>
          )}
        </div>

        {/* Top Holdings */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Maiores Posições</h3>
          {topHoldings.length > 0 ? (
            <div className="space-y-3">
              {topHoldings.map((asset, index) => {
                const currentPrice = marketData[asset.symbol]?.currentPrice || asset.averagePrice;
                const value = currentPrice * asset.quantity;
                const percentage = portfolioSummary.totalValue > 0
                  ? (value / portfolioSummary.totalValue) * 100
                  : 0;

                return (
                  <div key={asset.id} className="flex items-center gap-4">
                    <span className="text-gray-400 font-medium w-5">{index + 1}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{asset.symbol}</span>
                        <span className="text-xs text-gray-500">{asset.market}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(value)}</div>
                      <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <TrendingUp size={48} className="mx-auto mb-2 opacity-50" />
                <p>Adicione ativos para ver suas posições</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Empty State */}
      {assets.length === 0 && (
        <div className="bg-white rounded-xl p-12 shadow-sm text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase size={32} className="text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Bem-vindo ao Consolidador!</h3>
            <p className="text-gray-500 mb-6">
              Comece adicionando seus ativos para acompanhar seu portfólio,
              calcular o indicador de Graham e monitorar seus investimentos.
            </p>
            <a
              href="/portfolio"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              <span>Adicionar Primeiro Ativo</span>
              <TrendingUp size={18} />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;