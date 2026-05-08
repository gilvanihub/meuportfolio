import React, { useMemo } from 'react';
import { BarChart3, Download, TrendingUp, TrendingDown, DollarSign, PieChart, Gift } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useApp } from '../context/AppContext';
import { formatCurrency, formatPercent } from '../utils/formatters';
import {
  calculatePortfolioSummary,
  calculateAssetPnL,
  getMarketAllocation,
  getYearlyDividends
} from '../services/calculations';

const Reports: React.FC = () => {
  const { assets, dividends, marketData, operations } = useApp();

  const portfolioSummary = calculatePortfolioSummary(assets, marketData, dividends);
  const marketAllocation = getMarketAllocation(assets, marketData);
  const yearlyDividends = getYearlyDividends(dividends);

  // Asset performance data
  const assetPerformance = useMemo(() => {
    return assets.map(asset => {
      const pnl = calculateAssetPnL(asset, marketData);
      return {
        symbol: asset.symbol,
        market: asset.market,
        value: (marketData[asset.symbol]?.currentPrice || asset.averagePrice) * asset.quantity,
        cost: asset.averagePrice * asset.quantity,
        pnlAbsolute: pnl.absolute,
        pnlPercent: pnl.percentage
      };
    }).sort((a, b) => b.value - a.value);
  }, [assets, marketData]);

  // Market allocation pie data
  const pieData = [
    { name: 'B3', value: marketAllocation.b3, color: '#1E3A5F' },
    { name: 'EUA', value: marketAllocation.us, color: '#4A90A4' }
  ].filter(d => d.value > 0);

  // Dividend chart data
  const dividendChartData = Object.entries(yearlyDividends)
    .map(([year, amount]) => ({ year, amount }))
    .sort((a, b) => parseInt(a.year) - parseInt(b.year))
    .slice(-5);

  // Top performers
  const topPerformers = [...assetPerformance]
    .sort((a, b) => b.pnlPercent - a.pnlPercent)
    .slice(0, 3);

  const worstPerformers = [...assetPerformance]
    .sort((a, b) => a.pnlPercent - b.pnlPercent)
    .slice(0, 3);

  // Calculate dividend yield
  const averageDividendYield = useMemo(() => {
    if (portfolioSummary.totalDividends === 0 || portfolioSummary.totalValue === 0) return 0;
    return (portfolioSummary.totalDividends / portfolioSummary.totalValue) * 100;
  }, [portfolioSummary]);

  if (assets.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios e Estatísticas</h1>
          <p className="text-gray-500 mt-1">Análise completa do seu portfólio</p>
        </div>
        <div className="bg-white rounded-xl p-12 shadow-sm text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 size={32} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Sem dados para analisar</h3>
            <p className="text-gray-500">
              Adicione ativos ao seu portfólio para visualizar relatórios e estatísticas detalhadas.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios e Estatísticas</h1>
          <p className="text-gray-500 mt-1">Análise completa do seu portfólio</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
          <Download size={18} />
          Exportar Relatório
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign size={20} className="text-primary" />
            <span className="text-sm text-gray-500">Retorno Total</span>
          </div>
          <div className={`text-2xl font-bold ${portfolioSummary.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatPercent(portfolioSummary.totalPnLPercent)}
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Gift size={20} className="text-primary" />
            <span className="text-sm text-gray-500">Dividend Yield</span>
          </div>
          <div className="text-2xl font-bold text-primary">
            {formatPercent(averageDividendYield, 1)}
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={20} className="text-green-600" />
            <span className="text-sm text-gray-500">Maior Alta</span>
          </div>
          <div className="text-lg font-bold text-green-600">
            {topPerformers[0] ? `${topPerformers[0].symbol} ${formatPercent(topPerformers[0].pnlPercent)}` : '-'}
          </div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown size={20} className="text-red-600" />
            <span className="text-sm text-gray-500">Maior Queda</span>
          </div>
          <div className="text-lg font-bold text-red-600">
            {worstPerformers[0] ? `${worstPerformers[0].symbol} ${formatPercent(worstPerformers[0].pnlPercent)}` : '-'}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Market Allocation */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Diversificação por Mercado</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartPie>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
              </RechartPie>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {pieData.map(entry => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-sm">{entry.name}: {formatCurrency(entry.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dividends by Year */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Dividendos por Ano</h3>
          {dividendChartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dividendChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={(value) => `R$ ${value.toLocaleString()}`} />
                  <Tooltip formatter={(value: number) => [formatCurrency(value), 'Total']} />
                  <Bar dataKey="amount" fill="#1E3A5F" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              <p>Sem dados de dividendos</p>
            </div>
          )}
        </div>
      </div>

      {/* Performance Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Rentabilidade por Ativo</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ativo</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Valor</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Custo</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">PnL</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {assetPerformance.map(asset => (
                <tr key={asset.symbol} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{asset.symbol}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        asset.market === 'B3' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                      }`}>
                        {asset.market}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {formatCurrency(asset.value)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-gray-600">
                    {formatCurrency(asset.cost)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-right font-semibold ${
                    asset.pnlAbsolute >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {asset.pnlAbsolute >= 0 ? '+' : ''}{formatCurrency(asset.pnlAbsolute)}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-right font-semibold ${
                    asset.pnlPercent >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatPercent(asset.pnlPercent)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Statistics Summary */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Resumo Estatístico</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <span className="text-sm text-gray-500 block mb-1">Valor Total</span>
            <span className="text-xl font-bold">{formatCurrency(portfolioSummary.totalValue)}</span>
          </div>
          <div>
            <span className="text-sm text-gray-500 block mb-1">Custo Total</span>
            <span className="text-xl font-bold">{formatCurrency(portfolioSummary.totalCost)}</span>
          </div>
          <div>
            <span className="text-sm text-gray-500 block mb-1">Lucro/Prejuízo</span>
            <span className={`text-xl font-bold ${portfolioSummary.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {portfolioSummary.totalPnL >= 0 ? '+' : ''}{formatCurrency(portfolioSummary.totalPnL)}
            </span>
          </div>
          <div>
            <span className="text-sm text-gray-500 block mb-1">Total Dividendos</span>
            <span className="text-xl font-bold text-primary">{formatCurrency(portfolioSummary.totalDividends)}</span>
          </div>
          <div>
            <span className="text-sm text-gray-500 block mb-1">Qtd. Ativos</span>
            <span className="text-xl font-bold">{assets.length}</span>
          </div>
          <div>
            <span className="text-sm text-gray-500 block mb-1">Alocação B3</span>
            <span className="text-xl font-bold">
              {portfolioSummary.totalValue > 0
                ? `${((portfolioSummary.b3Value / portfolioSummary.totalValue) * 100).toFixed(1)}%`
                : '0%'}
            </span>
          </div>
          <div>
            <span className="text-sm text-gray-500 block mb-1">Alocação EUA</span>
            <span className="text-xl font-bold">
              {portfolioSummary.totalValue > 0
                ? `${((portfolioSummary.usValue / portfolioSummary.totalValue) * 100).toFixed(1)}%`
                : '0%'}
            </span>
          </div>
          <div>
            <span className="text-sm text-gray-500 block mb-1">Operações</span>
            <span className="text-xl font-bold">{operations.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;