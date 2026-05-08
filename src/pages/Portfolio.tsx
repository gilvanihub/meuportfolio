import React, { useState, useEffect, useRef } from 'react';
import { Plus, X, Search, Trash2, TrendingUp, Check, ShoppingCart } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Asset, Market, AssetType, Operation } from '../types';
import { generateId } from '../services/storage';
import { formatCurrency } from '../utils/formatters';
import { searchStocks } from '../services/marketApi';
import AssetCard from '../components/ui/AssetCard';

const Portfolio: React.FC = () => {
  const { assets, operations, addAsset, updateAsset, deleteAsset, addOperation, marketData, refreshData } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMarket, setFilterMarket] = useState<Market | 'all'>('all');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    market: 'B3' as Market,
    type: 'stock' as AssetType,
    // Purchase info
    quantity: '',
    price: '',
    date: new Date().toISOString().split('T')[0],
    broker: '',
    notes: ''
  });

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<Array<{ symbol: string; name: string; market: 'B3' | 'US' }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const symbolInputRef = useRef<HTMLInputElement>(null);

  // Search stocks for autocomplete
  useEffect(() => {
    const searchStocksAsync = async () => {
      if (formData.symbol.length >= 2) {
        const results = await searchStocks(formData.symbol);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
        setSelectedSuggestionIndex(-1);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const timeoutId = setTimeout(searchStocksAsync, 150);
    return () => clearTimeout(timeoutId);
  }, [formData.symbol]);

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: { symbol: string; name: string; market: 'B3' | 'US' }) => {
    setFormData({
      ...formData,
      symbol: suggestion.symbol,
      name: suggestion.name,
      market: suggestion.market
    });
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // Handle keyboard navigation in suggestions
  const handleSymbolKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[selectedSuggestionIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target as Node) &&
          symbolInputRef.current && !symbolInputRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get operations for a specific asset
  const getAssetOperations = (assetId: string): Operation[] => {
    return operations.filter(op => op.assetId === assetId).sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  };

  // Calculate total quantity from operations
  const calculateQuantityFromOperations = (assetId: string): number => {
    const ops = getAssetOperations(assetId);
    return ops.reduce((total, op) => {
      // buy, bonus, subscription add to quantity
      if (op.type === 'buy' || op.type === 'bonus' || op.type === 'subscription') {
        return total + op.quantity;
      }
      // sell reduces quantity
      return total - op.quantity;
    }, 0);
  };

  // Calculate average price from operations
  const calculateAveragePrice = (assetId: string): number => {
    const ops = getAssetOperations(assetId);
    let totalCost = 0;
    let totalQuantity = 0;

    ops.forEach(op => {
      // buy, bonus, subscription add cost
      if (op.type === 'buy' || op.type === 'bonus' || op.type === 'subscription') {
        totalCost += op.quantity * op.price;
        totalQuantity += op.quantity;
      } else if (op.type === 'sell') {
        // sell reduces quantity
        totalQuantity -= op.quantity;
      }
    });

    return totalQuantity > 0 ? totalCost / totalQuantity : 0;
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMarket = filterMarket === 'all' || asset.market === filterMarket;
    return matchesSearch && matchesMarket;
  });

  const openModal = (asset?: Asset) => {
    if (asset) {
      setEditingAsset(asset);
      setFormData({
        symbol: asset.symbol,
        name: asset.name,
        market: asset.market,
        type: asset.type,
        quantity: '',
        price: '',
        date: new Date().toISOString().split('T')[0],
        broker: '',
        notes: ''
      });
    } else {
      setEditingAsset(null);
      setFormData({
        symbol: '',
        name: '',
        market: 'B3',
        type: 'stock',
        quantity: '',
        price: '',
        date: new Date().toISOString().split('T')[0],
        broker: '',
        notes: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAsset(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const quantity = parseFloat(formData.quantity) || 0;
    const price = parseFloat(formData.price) || 0;

    // Only add operation if quantity and price are provided
    if (quantity > 0 && price > 0) {
      const now = new Date().toISOString();
      const symbol = formData.symbol.toUpperCase();

      // Check if an asset with the same symbol already exists
      const existingAsset = assets.find(a => a.symbol === symbol);

      if (existingAsset) {
        // Adding new purchase to existing asset
        const operation: Operation = {
          id: generateId(),
          assetId: existingAsset.id,
          symbol: existingAsset.symbol,
          type: 'buy',
          quantity: quantity,
          price: price,
          total: quantity * price,
          date: formData.date,
          broker: formData.broker || undefined,
          notes: formData.notes || undefined,
          createdAt: new Date().toISOString()
        };

        addOperation(operation);

        // Update asset quantity and average price
        const currentQuantity = calculateQuantityFromOperations(existingAsset.id);
        const currentAvg = calculateAveragePrice(existingAsset.id);
        const newTotalQuantity = currentQuantity + quantity;

        // Recalculate weighted average price
        const newAvg = newTotalQuantity > 0
          ? ((currentQuantity * currentAvg) + (quantity * price)) / newTotalQuantity
          : price;

        updateAsset({
          ...existingAsset,
          quantity: newTotalQuantity,
          averagePrice: Math.round(newAvg * 100) / 100,
          updatedAt: new Date().toISOString()
        });

        setEditingAsset(existingAsset);
        setSuccessMessage(`Compra de ${quantity} ${existingAsset.symbol} adicionada ao ativo existente`);
      } else {
        // Creating new asset with purchase
        const assetId = generateId();

        // Create asset
        const asset: Asset = {
          id: assetId,
          symbol: symbol,
          name: formData.name,
          market: formData.market,
          type: formData.type,
          quantity: quantity,
          averagePrice: price,
          sector: undefined,
          createdAt: now,
          updatedAt: now
        };

        // Create purchase operation
        const operation: Operation = {
          id: generateId(),
          assetId: assetId,
          symbol: asset.symbol,
          type: 'buy',
          quantity: quantity,
          price: price,
          total: quantity * price,
          date: formData.date,
          broker: formData.broker || undefined,
          notes: formData.notes || undefined,
          createdAt: now
        };

        addAsset(asset);
        addOperation(operation);

        setEditingAsset(asset);
        setSuccessMessage(`${asset.symbol} adicionado com compra de ${quantity} ações a ${formatCurrency(price)}`);
      }

      closeModal();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);
    } else {
      // Just save asset without purchase
      const now = new Date().toISOString();
      const asset: Asset = {
        id: editingAsset?.id || generateId(),
        symbol: formData.symbol.toUpperCase(),
        name: formData.name,
        market: formData.market,
        type: formData.type,
        quantity: editingAsset?.quantity || 0,
        averagePrice: editingAsset?.averagePrice || 0,
        sector: undefined,
        createdAt: editingAsset?.createdAt || now,
        updatedAt: now
      };

      if (editingAsset) {
        updateAsset(asset);
      } else {
        addAsset(asset);
      }

      closeModal();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 4000);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este ativo e todas as suas operações?')) {
      deleteAsset(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 z-50">
          <Check size={24} />
          <div>
            <div className="font-semibold">Sucesso!</div>
            <div className="text-sm opacity-90">{successMessage}</div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Minha Carteira</h1>
          <p className="text-gray-500 mt-1">
            {assets.length > 0
              ? `${assets.length} ativo(s) • ${assets.length > 0 ? assets.reduce((sum, a) => sum + a.quantity, 0) : 0} ações`
              : 'Adicione seus investimentos'}
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus size={18} />
          {assets.length === 0 ? 'Adicionar Primeiro Ativo' : 'Nova Compra'}
        </button>
      </div>

      {/* Quick Start Guide */}
      {assets.length === 0 && (
        <div className="bg-gradient-to-r from-teal to-mint rounded-xl p-6 text-white">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <ShoppingCart size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">Comece a construir seu portfólio</h2>
              <p className="opacity-90 mb-4">
                Cadastre seus ativos e compras em um único lugar. Dados salvos automaticamente no navegador.
              </p>
              <button
                onClick={() => openModal()}
                className="px-6 py-2 bg-white text-teal font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cadastrar Primeira Compra
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      {assets.length > 0 && (
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Buscar por código ou nome..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            <select
              value={filterMarket}
              onChange={(e) => setFilterMarket(e.target.value as Market | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="all">Todos os Mercados</option>
              <option value="B3">B3 (Brasil)</option>
              <option value="US">EUA</option>
            </select>
          </div>
        </div>
      )}

      {/* Assets Grid */}
      {filteredAssets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAssets.map(asset => {
            // Calculate current values from operations
            const currentQuantity = calculateQuantityFromOperations(asset.id);
            const avgPrice = calculateAveragePrice(asset.id);
            const ops = getAssetOperations(asset.id);

            return (
              <div key={asset.id} className="relative">
                <AssetCard
                  asset={{
                    ...asset,
                    quantity: currentQuantity || asset.quantity,
                    averagePrice: avgPrice || asset.averagePrice
                  }}
                  marketData={marketData[asset.symbol]}
                  onClick={() => openModal(asset)}
                />
              </div>
            );
          })}
        </div>
      ) : assets.length === 0 ? null : (
        <div className="bg-white rounded-xl p-12 shadow-sm text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp size={32} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Nenhum ativo encontrado</h3>
            <p className="text-gray-500 mb-6">
              Tente ajustar seus filtros de busca
            </p>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold">
                {editingAsset ? `Nova Compra - ${editingAsset.symbol}` : 'Cadastrar Compra'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Symbol */}
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Código do Ativo <span className="text-red-500">*</span>
                </label>
                <input
                  ref={symbolInputRef}
                  type="text"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                  onKeyDown={handleSymbolKeyDown}
                  placeholder="Ex: PETR4, AAPL"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent uppercase"
                  required
                  disabled={!!editingAsset}
                />
                {/* Autocomplete dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                  >
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={suggestion.symbol}
                        onClick={() => handleSelectSuggestion(suggestion)}
                        className={`px-4 py-3 cursor-pointer transition-colors ${
                          index === selectedSuggestionIndex
                            ? 'bg-primary text-white'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-semibold">{suggestion.symbol}</span>
                            <span className="mx-2 text-gray-400">•</span>
                            <span className={index === selectedSuggestionIndex ? 'text-white/90' : 'text-gray-600'}>
                              {suggestion.name}
                            </span>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            index === selectedSuggestionIndex
                              ? 'bg-white/20 text-white'
                              : suggestion.market === 'B3'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-blue-100 text-blue-700'
                          }`}>
                            {suggestion.market}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Empresa <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Petrobras PN"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                  disabled={!!editingAsset}
                />
              </div>

              {/* Market and Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mercado
                  </label>
                  <select
                    value={formData.market}
                    onChange={(e) => setFormData({ ...formData, market: e.target.value as Market })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    disabled={!!editingAsset}
                  >
                    <option value="B3">B3 (Brasil)</option>
                    <option value="US">EUA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as AssetType })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    disabled={!!editingAsset}
                  >
                    <option value="stock">Ação</option>
                    <option value="etf">ETF</option>
                    <option value="bdr">BDR</option>
                    <option value="fii">FII</option>
                  </select>
                </div>
              </div>

              {/* Divider */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <ShoppingCart size={16} />
                  Dados da Compra
                </h3>

                {/* Quantity and Price */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantidade <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      placeholder="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preço Unitário <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Date */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data da Compra
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>

                {/* Broker (optional) */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Corretora (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.broker}
                    onChange={(e) => setFormData({ ...formData, broker: e.target.value })}
                    placeholder="Ex: XP, BTG, Clear"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>

              {/* Total Preview */}
              {formData.quantity && formData.price && parseFloat(formData.quantity) > 0 && parseFloat(formData.price) > 0 && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Valor Total da Compra</div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(parseFloat(formData.quantity) * parseFloat(formData.price))}
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
                  {editingAsset ? 'Adicionar Compra' : 'Cadastrar Compra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Portfolio;