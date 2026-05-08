import React, { useState, useMemo } from 'react';
import { Plus, X, Gift, TrendingUp, Calendar, Filter } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useApp } from '../context/AppContext';
import { Dividend, Asset } from '../types';
import { generateId } from '../services/storage';
import { formatCurrency, formatDate } from '../utils/formatters';
import { getYearlyDividends } from '../services/calculations';

const Dividends: React.FC = () => {
  const { dividends, assets, addDividend, deleteDividend } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [filterYear, setFilterYear] = useState<number | 'all'>('all');

  // Form state
  const [formData, setFormData] = useState({
    assetId: '',
    date: new Date().toISOString().split('T')[0],
    type: 'dividend' as 'dividend' | 'jcp' | 'rendimento',
    grossAmount: '',
    taxAmount: ''
  });

  // Calculate yearly dividends
  const yearlyDividends = useMemo(() => getYearlyDividends(dividends), [dividends]);
  const years = Object.keys(yearlyDividends).map(Number).sort((a, b) => b - a);

  // Filter by year
  const filteredDividends = dividends
    .filter(d => {
      if (filterYear === 'all') return true;
      return new Date(d.date).getFullYear() === filterYear;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Chart data
  const chartData = years.slice(0, 5).map(year => ({
    year: year.toString(),
    amount: yearlyDividends[year] || 0
  })).reverse();

  const getAssetById = (assetId: string): Asset | undefined => {
    return assets.find(a => a.id === assetId);
  };

  const getTotalByYear = (year: number): number => {
    return dividends
      .filter(d => new Date(d.date).getFullYear() === year)
      .reduce((sum, d) => sum + d.netAmount, 0);
  };

  const openModal = () => {
    setFormData({
      assetId: '',
      date: new Date().toISOString().split('T')[0],
      type: 'dividend',
      grossAmount: '',
      taxAmount: '0'
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const asset = getAssetById(formData.assetId);
    if (!asset) return;

    const grossAmount = parseFloat(formData.grossAmount) || 0;
    const taxAmount = parseFloat(formData.taxAmount) || 0;

    const dividend: Dividend = {
      id: generateId(),
      assetId: formData.assetId,
      symbol: asset.symbol,
      date: formData.date,
      type: formData.type,
      grossAmount,
      taxAmount,
      netAmount: grossAmount - taxAmount,
      createdAt: new Date().toISOString()
    };

    addDividend(dividend);
    closeModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este dividendo?')) {
      deleteDividend(id);
    }
  };

  const getTypeLabel = (type: 'dividend' | 'jcp' | 'rendimento'): string => {
    switch (type) {
      case 'dividend':
        return 'Dividendo';
      case 'jcp':
        return 'JCP';
      case 'rendimento':
        return 'Rendimento';
    }
  };

  const getTypeColor = (type: 'dividend' | 'jcp' | 'rendimento'): string => {
    switch (type) {
      case 'dividend':
        return 'bg-green-100 text-green-600';
      case 'jcp':
        return 'bg-blue-100 text-blue-600';
      case 'rendimento':
        return 'bg-purple-100 text-purple-600';
    }
  };

  const currentYear = new Date().getFullYear();
  const totalDividends = Object.values(yearlyDividends).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Controle de Dividendos</h1>
          <p className="text-gray-500 mt-1">Acompanhe seus proventos recebidos</p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus size={18} />
          Registrar Provento
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Gift className="text-green-600" size={24} />
            </div>
            <div>
              <span className="text-sm text-gray-500">Total Recebido</span>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(totalDividends)}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="text-blue-600" size={24} />
            </div>
            <div>
              <span className="text-sm text-gray-500">{currentYear}</span>
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(getTotalByYear(currentYear))}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <TrendingUp className="text-purple-600" size={24} />
            </div>
            <div>
              <span className="text-sm text-gray-500">Anos com Proventos</span>
              <div className="text-2xl font-bold text-gray-900">{years.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart and Year Filter */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Dividendos por Ano</h3>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
          >
            <option value="all">Todos os anos</option>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        {chartData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis
                  tickFormatter={(value) => `R$ ${value.toLocaleString()}`}
                />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Total']}
                />
                <Bar dataKey="amount" fill="#1E3A5F" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-400">
            <p>Registre dividendos para ver o gráfico</p>
          </div>
        )}
      </div>

      {/* Dividends Table */}
      {filteredDividends.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ativo</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Bruto</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">IRRF</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Líquido</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDividends.map(dividend => {
                  const asset = getAssetById(dividend.assetId);
                  return (
                    <tr key={dividend.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(dividend.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{dividend.symbol}</span>
                          {asset && (
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              asset.market === 'B3' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                            }`}>
                              {asset.market}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getTypeColor(dividend.type)}`}>
                          {getTypeLabel(dividend.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        {formatCurrency(dividend.grossAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-red-600">
                        {formatCurrency(dividend.taxAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-green-600">
                        {formatCurrency(dividend.netAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleDelete(dividend.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-12 shadow-sm text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift size={32} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Nenhum dividendo registrado</h3>
            <p className="text-gray-500 mb-6">
              Registre os proventos que você recebeu para acompanhar seus rendimentos.
            </p>
            <button
              onClick={openModal}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              <Plus size={18} />
              Registrar Provento
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Registrar Provento</h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Asset */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ativo
                </label>
                <select
                  value={formData.assetId}
                  onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  <option value="">Selecione o ativo</option>
                  {assets.map(asset => (
                    <option key={asset.id} value={asset.id}>
                      {asset.symbol} - {asset.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Provento
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'dividend' | 'jcp' | 'rendimento' })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="dividend">Dividendo</option>
                  <option value="jcp">JCP (Juros sobre Capital Próprio)</option>
                  <option value="rendimento">Rendimento</option>
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data do Crédito
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              {/* Amounts */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor Bruto
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.grossAmount}
                    onChange={(e) => setFormData({ ...formData, grossAmount: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IRRF (opcional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.taxAmount}
                    onChange={(e) => setFormData({ ...formData, taxAmount: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              {/* Net Amount Preview */}
              {formData.grossAmount && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Valor Líquido</div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(
                      (parseFloat(formData.grossAmount) || 0) - (parseFloat(formData.taxAmount) || 0)
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dividends;