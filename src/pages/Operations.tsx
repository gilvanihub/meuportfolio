import React, { useState, useEffect } from 'react';
import { Plus, X, ArrowUpRight, ArrowDownRight, Check, AlertTriangle, Edit2, Gift, FileText, MoreHorizontal, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Operation, Asset, OperationType } from '../types';
import { generateId } from '../services/storage';
import { formatCurrency, formatDate } from '../utils/formatters';

const RECENT_BROKERS_KEY = 'consolidator_recent_brokers';
const MAX_RECENT_BROKERS = 5;

const Operations: React.FC = () => {
  const { operations, assets, addOperation, updateOperation, deleteOperation, deleteAsset, refreshData } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingOperation, setEditingOperation] = useState<Operation | null>(null);
  const [filterType, setFilterType] = useState<'all' | OperationType>('all');
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [recentBrokers, setRecentBrokers] = useState<string[]>([]);
  const [activePopup, setActivePopup] = useState<string | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    assetId: '',
    type: 'buy' as OperationType,
    quantity: '',
    price: '',
    date: new Date().toISOString().split('T')[0],
    broker: '',
    notes: ''
  });

  // Load recent brokers from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_BROKERS_KEY);
      if (stored) {
        setRecentBrokers(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading recent brokers:', e);
    }
  }, []);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activePopup) {
        const target = event.target as HTMLElement;
        if (!target.closest('.popup-menu')) {
          setActivePopup(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activePopup]);

  // Filter and sort operations
  const filteredOperations = operations
    .filter(op => filterType === 'all' || op.type === filterType)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getAssetById = (assetId: string): Asset | undefined => {
    return assets.find(a => a.id === assetId);
  };

  // Save broker to recent list
  const saveBrokerToRecent = (broker: string) => {
    if (!broker.trim()) return;

    const trimmed = broker.trim();
    const updated = [trimmed, ...recentBrokers.filter(b => b !== trimmed)].slice(0, MAX_RECENT_BROKERS);
    setRecentBrokers(updated);
    localStorage.setItem(RECENT_BROKERS_KEY, JSON.stringify(updated));
  };

  const openModal = (operation?: Operation) => {
    refreshData();
    setErrorMessage('');

    if (operation) {
      // Edit mode
      setEditingOperation(operation);
      setFormData({
        assetId: operation.assetId,
        type: operation.type,
        quantity: operation.quantity.toString(),
        price: operation.price.toString(),
        date: operation.date,
        broker: operation.broker || '',
        notes: operation.notes || ''
      });
    } else {
      // Create mode
      setEditingOperation(null);
      setFormData({
        assetId: '',
        type: 'buy',
        quantity: '',
        price: '',
        date: new Date().toISOString().split('T')[0],
        broker: recentBrokers[0] || '',
        notes: ''
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingOperation(null);
    setErrorMessage('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Validate asset selection
    if (!formData.assetId) {
      setErrorMessage('Por favor, selecione um ativo. Você precisa primeiro adicionar ativos na página Carteira.');
      return;
    }

    const asset = getAssetById(formData.assetId);
    if (!asset) {
      setErrorMessage('Ativo não encontrado. Por favor, adicione o ativo na Carteira primeiro.');
      return;
    }

    // Validate quantity and price (for buy/sell/bonus/subscription)
    if ((formData.type === 'buy' || formData.type === 'sell' || formData.type === 'bonus' || formData.type === 'subscription') && (!formData.quantity || parseFloat(formData.quantity) <= 0)) {
      setErrorMessage('Por favor, insira uma quantidade válida.');
      return;
    }

    if ((formData.type === 'buy' || formData.type === 'sell' || formData.type === 'bonus' || formData.type === 'subscription') && (!formData.price || parseFloat(formData.price) <= 0)) {
      setErrorMessage('Por favor, insira um preço válido.');
      return;
    }

    const quantity = parseFloat(formData.quantity) || 0;
    const price = parseFloat(formData.price) || 0;
    const total = quantity * price;

    if (editingOperation) {
      // Update existing operation
      const updated: Operation = {
        ...editingOperation,
        assetId: formData.assetId,
        symbol: asset.symbol,
        type: formData.type,
        quantity: quantity,
        price: price,
        total: total,
        date: formData.date,
        broker: formData.broker || undefined,
        notes: formData.notes || undefined
      };
      updateOperation(updated);
      setSuccessMessage('Operação atualizada com sucesso!');
    } else {
      // Create new operation
      const operation: Operation = {
        id: generateId(),
        assetId: formData.assetId,
        symbol: asset.symbol,
        type: formData.type,
        quantity: quantity,
        price: price,
        total: total,
        date: formData.date,
        broker: formData.broker || undefined,
        notes: formData.notes || undefined,
        createdAt: new Date().toISOString()
      };
      addOperation(operation);
      saveBrokerToRecent(formData.broker);
      setSuccessMessage(`${getOperationTypeLabel(formData.type)} registrada com sucesso!`);
    }

    closeModal();
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 4000);
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta operação?')) {
      const operation = operations.find(op => op.id === id);
      deleteOperation(id);

      // If this was the only operation for this asset, also delete the asset
      if (operation) {
        const remainingOps = operations.filter(op => op.assetId === operation.assetId && op.id !== id);
        if (remainingOps.length === 0) {
          deleteAsset(operation.assetId);
        }
      }
    }
  };

  const getOperationTypeLabel = (type: OperationType): string => {
    switch (type) {
      case 'buy': return 'Compra';
      case 'sell': return 'Venda';
      case 'bonus': return 'Bonificação';
      case 'subscription': return 'Subscrição';
      default: return type;
    }
  };

  const getOperationTypeIcon = (type: OperationType) => {
    switch (type) {
      case 'buy': return <ArrowDownRight size={14} />;
      case 'sell': return <ArrowUpRight size={14} />;
      case 'bonus': return <Gift size={14} />;
      case 'subscription': return <FileText size={14} />;
      default: return null;
    }
  };

  const getOperationTypeColor = (type: OperationType): string => {
    switch (type) {
      case 'buy': return 'bg-green-100 text-green-600';
      case 'sell': return 'bg-red-100 text-red-600';
      case 'bonus': return 'bg-blue-100 text-blue-600';
      case 'subscription': return 'bg-purple-100 text-purple-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  // Operation type buttons configuration
  const operationTypes: { type: OperationType; label: string; icon: React.ReactNode }[] = [
    { type: 'buy', label: 'Compra', icon: <ArrowDownRight className="mx-auto mb-1" size={20} /> },
    { type: 'sell', label: 'Venda', icon: <ArrowUpRight className="mx-auto mb-1" size={20} /> },
    { type: 'bonus', label: 'Bônus', icon: <Gift className="mx-auto mb-1" size={20} /> },
    { type: 'subscription', label: 'Subscrição', icon: <FileText className="mx-auto mb-1" size={20} /> }
  ];

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
          <h1 className="text-2xl font-bold text-gray-900">Histórico de Operações</h1>
          <p className="text-gray-500 mt-1">
            {operations.length > 0
              ? `${operations.length} operação(ões) registrada(s)`
              : 'Registre suas compras e vendas'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filterType === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Todas ({operations.length})
            </button>
            {operationTypes.map(op => (
              <button
                key={op.type}
                onClick={() => setFilterType(op.type)}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-1 ${
                  filterType === op.type
                    ? getOperationTypeColor(op.type).replace('100', '600').replace('text-', 'bg-')
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {op.icon}
                {op.label} ({operations.filter(o => o.type === op.type).length})
              </button>
            ))}
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            <Plus size={18} />
            Nova Operação
          </button>
        </div>
      </div>

      {/* Info Banner */}
      {operations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-blue-700">
            <strong>Dica:</strong> Para registrar novas compras, use a página <a href="/portfolio" className="underline font-medium">Carteira</a>.
            Aqui você pode visualizar e gerenciar todas as operações e registrar vendas.
          </div>
        </div>
      )}

      {/* Help text for empty state */}
      {operations.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm text-blue-700">
            <strong>Como funciona:</strong>
            <ol className="mt-2 ml-4 list-decimal space-y-1">
              <li>Cadastre suas compras na página <a href="/portfolio" className="underline font-medium">Carteira</a> (ativo + compra em um único passo)</li>
              <li>Todas as compras aparecem automaticamente aqui</li>
              <li>Use esta página para ver o histórico completo e registrar vendas</li>
            </ol>
          </div>
        </div>
      )}

      {/* Operations Table */}
      {filteredOperations.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Ativo</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Corretora</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Qtd</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Preço</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOperations.map(operation => {
                  const asset = getAssetById(operation.assetId);
                  return (
                    <tr key={operation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(operation.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{operation.symbol}</span>
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
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${getOperationTypeColor(operation.type)}`}>
                          {getOperationTypeIcon(operation.type)}
                          {getOperationTypeLabel(operation.type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {operation.broker || '--'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        {operation.quantity > 0 ? operation.quantity : '--'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        {operation.price > 0 ? formatCurrency(operation.price) : '--'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold">
                        {operation.total > 0 ? formatCurrency(operation.total) : '--'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActivePopup(activePopup === operation.id ? null : operation.id);
                              if (activePopup !== operation.id) {
                                setPopupPosition({ x: e.clientX, y: e.clientY });
                              }
                            }}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                            title="Mais opções"
                          >
                            <MoreHorizontal size={16} />
                          </button>
                          {activePopup === operation.id && popupPosition && (
                            <div
                              className="fixed popup-menu bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-[9999]"
                              style={{
                                top: popupPosition.y,
                                left: Math.min(popupPosition.x, window.innerWidth - 160)
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openModal(operation);
                                  setActivePopup(null);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors whitespace-nowrap"
                              >
                                <Edit2 size={14} />
                                Editar
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActivePopup(null);
                                  handleDelete(operation.id);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors whitespace-nowrap"
                              >
                                <Trash2 size={14} />
                                Excluir
                              </button>
                            </div>
                          )}
                        </div>
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
              <ArrowUpRight size={32} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Nenhuma operação registrada</h3>
            <p className="text-gray-500 mb-6">
              Registre suas operações de compra e venda para acompanhar seu histórico de investimentos.
            </p>
            <button
              onClick={() => openModal()}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              <Plus size={18} />
              Registrar Operação
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
              <h2 className="text-xl font-semibold">
                {editingOperation ? 'Editar Operação' : 'Nova Operação'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Error Message */}
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={18} />
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              )}

              {/* Asset */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ativo <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.assetId}
                  onChange={(e) => {
                    setFormData({ ...formData, assetId: e.target.value });
                    setErrorMessage('');
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  <option value="">Selecione o ativo</option>
                  {assets.length === 0 ? (
                    <option value="" disabled>Adicione ativos na Carteira primeiro</option>
                  ) : (
                    assets.map(asset => (
                      <option key={asset.id} value={asset.id}>
                        {asset.symbol} - {asset.name} ({asset.market})
                      </option>
                    ))
                  )}
                </select>
                {assets.length === 0 && (
                  <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-sm text-orange-700">
                      <strong>Importante:</strong> Você precisa primeiro adicionar ativos na página
                      <a href="/portfolio" className="underline font-medium ml-1">Carteira</a>
                      antes de registrar operações.
                    </p>
                  </div>
                )}
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Operação
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {operationTypes.map(op => (
                    <button
                      key={op.type}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: op.type })}
                      className={`p-3 rounded-lg border-2 transition-colors flex flex-col items-center ${
                        formData.type === op.type
                          ? op.type === 'buy' ? 'border-green-500 bg-green-50 text-green-600' :
                            op.type === 'sell' ? 'border-red-500 bg-red-50 text-red-600' :
                            op.type === 'bonus' ? 'border-blue-500 bg-blue-50 text-blue-600' :
                            'border-purple-500 bg-purple-50 text-purple-600'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      {op.icon}
                      <span className="text-xs font-medium mt-1">{op.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity and Price (for buy/sell/bonus/subscription) */}
              {(formData.type === 'buy' || formData.type === 'sell' || formData.type === 'bonus' || formData.type === 'subscription') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantidade <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={formData.quantity}
                      onChange={(e) => {
                        setFormData({ ...formData, quantity: e.target.value });
                        setErrorMessage('');
                      }}
                      placeholder="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
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
                      onChange={(e) => {
                        setFormData({ ...formData, price: e.target.value });
                        setErrorMessage('');
                      }}
                      placeholder="0.00"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data da Operação <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              {/* Broker with recent suggestions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Corretora (opcional)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.broker}
                    onChange={(e) => setFormData({ ...formData, broker: e.target.value })}
                    placeholder="Ex: XP, BTG, Clear"
                    list="recent-brokers"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <datalist id="recent-brokers">
                    {recentBrokers.map((broker, index) => (
                      <option key={index} value={broker} />
                    ))}
                  </datalist>
                </div>
                {recentBrokers.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    <span className="text-xs text-gray-500 mr-1">Recentes:</span>
                    {recentBrokers.slice(0, 5).map((broker, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => setFormData({ ...formData, broker })}
                        className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 text-gray-600"
                      >
                        {broker}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes (optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações (opcional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Alguma observação..."
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
              </div>

              {/* Total Preview (for buy/sell/bonus/subscription) */}
              {((formData.type === 'buy' || formData.type === 'sell' || formData.type === 'bonus' || formData.type === 'subscription') && formData.quantity && formData.price && parseFloat(formData.quantity) > 0 && parseFloat(formData.price) > 0) && (
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">Valor Total</div>
                  <div className="text-2xl font-bold text-primary">
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
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!formData.assetId}
                >
                  {editingOperation ? 'Salvar' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Operations;