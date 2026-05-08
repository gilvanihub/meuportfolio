import React, { useState, useEffect } from 'react';
import { Plus, X, Bell, BellOff, Trash2, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PriceAlert, Asset } from '../types';
import { generateId } from '../services/storage';
import { formatCurrency, formatDate, formatRelativeTime } from '../utils/formatters';
import { checkAlertTriggered } from '../services/calculations';

const Alerts: React.FC = () => {
  const { alerts, assets, marketData, addAlert, updateAlert, deleteAlert } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [triggeredAlerts, setTriggeredAlerts] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    assetId: '',
    type: 'above' as 'above' | 'below',
    value: ''
  });

  // Check alerts periodically
  useEffect(() => {
    const checkAlerts = () => {
      alerts.forEach(alert => {
        if (alert.triggered) return;

        const asset = assets.find(a => a.id === alert.assetId);
        if (!asset) return;

        const data = marketData[asset.symbol];
        if (!data) return;

        const isTriggered = checkAlertTriggered(
          alert.type,
          alert.value,
          data.currentPrice,
          data.previousClose
        );

        if (isTriggered) {
          updateAlert({
            ...alert,
            triggered: true,
            triggeredAt: new Date().toISOString()
          });
          setTriggeredAlerts(prev => [...prev, alert.id]);

          // Show notification if permitted
          if (Notification.permission === 'granted') {
            new Notification(`Alerta: ${asset.symbol}`, {
              body: `Preço ${alert.type === 'above' ? 'acima' : 'abaixo'} de ${formatCurrency(alert.value)}`,
              icon: '/favicon.ico'
            });
          }
        }
      });
    };

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Check every minute
    const interval = setInterval(checkAlerts, 60000);
    checkAlerts(); // Initial check

    return () => clearInterval(interval);
  }, [alerts, assets, marketData, updateAlert]);

  const getAssetById = (assetId: string): Asset | undefined => {
    return assets.find(a => a.id === assetId);
  };

  const activeAlerts = alerts.filter(a => !a.triggered);
  const triggeredAlertsList = alerts.filter(a => a.triggered);

  const openModal = () => {
    setFormData({
      assetId: '',
      type: 'above',
      value: ''
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

    const alert: PriceAlert = {
      id: generateId(),
      assetId: formData.assetId,
      symbol: asset.symbol,
      type: formData.type,
      value: parseFloat(formData.value) || 0,
      triggered: false,
      createdAt: new Date().toISOString()
    };

    addAlert(alert);
    closeModal();
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este alerta?')) {
      deleteAlert(id);
    }
  };

  const handleResetAlert = (alert: PriceAlert) => {
    updateAlert({
      ...alert,
      triggered: false,
      triggeredAt: undefined
    });
  };

  const getAlertTypeLabel = (type: 'above' | 'below' | 'change'): string => {
    switch (type) {
      case 'above':
        return 'Acima de';
      case 'below':
        return 'Abaixo de';
      case 'change':
        return 'Variação de';
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alertas de Preço</h1>
          <p className="text-gray-500 mt-1">Configure notificações para seus ativos</p>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
        >
          <Plus size={18} />
          Criar Alerta
        </button>
      </div>

      {/* Notification Permission Banner */}
      {'Notification' in window && Notification.permission === 'default' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="text-yellow-600 flex-shrink-0" size={24} />
          <p className="text-sm text-yellow-800">
            Ative as notificações do navegador para receber alertas mesmo quando a página estiver fechada.
          </p>
        </div>
      )}

      {/* Triggered Alerts */}
      {triggeredAlertsList.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
            <Bell size={18} />
            Alertas Disparanados Recentemente
          </h3>
          <div className="space-y-2">
            {triggeredAlertsList.slice(0, 5).map(alert => {
              const asset = getAssetById(alert.assetId);
              return (
                <div key={alert.id} className="flex items-center justify-between bg-white rounded-lg p-3">
                  <div>
                    <span className="font-semibold">{alert.symbol}</span>
                    <span className="text-gray-500 ml-2">
                      {getAlertTypeLabel(alert.type)} {formatCurrency(alert.value)}
                    </span>
                    {alert.triggeredAt && (
                      <span className="text-xs text-gray-400 ml-2">
                        {formatRelativeTime(alert.triggeredAt)}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleResetAlert(alert)}
                    className="text-xs text-primary hover:underline"
                  >
                    Reativar
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Alerts */}
      {activeAlerts.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Alertas Ativos</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {activeAlerts.map(alert => {
              const asset = getAssetById(alert.assetId);
              const data = asset ? marketData[asset.symbol] : undefined;
              const currentPrice = data?.currentPrice || 0;

              return (
                <div key={alert.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${
                      alert.type === 'above' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {alert.type === 'above' ? (
                        <TrendingUp className={alert.type === 'above' ? 'text-green-600' : 'text-red-600'} size={20} />
                      ) : (
                        <TrendingDown className={alert.type === 'above' ? 'text-green-600' : 'text-red-600'} size={20} />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{alert.symbol}</span>
                        {asset && (
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            asset.market === 'B3' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                          }`}>
                            {asset.market}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {getAlertTypeLabel(alert.type)} {formatCurrency(alert.value)}
                        {currentPrice > 0 && (
                          <span className="ml-2">
                            (atual: {formatCurrency(currentPrice)})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(alert.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : alerts.length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BellOff size={32} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Nenhum alerta configurado</h3>
            <p className="text-gray-500 mb-6">
              Crie alertas para ser notificado quando o preço de seus ativos atingir valores específicos.
            </p>
            <button
              onClick={openModal}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              <Plus size={18} />
              Criar Primeiro Alerta
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl p-12 shadow-sm text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell size={32} className="text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Todos os alertas foram disparados</h3>
            <p className="text-gray-500 mb-6">
              Seus alertas foram disparados. Você pode reativá-los ou criar novos alertas.
            </p>
            <button
              onClick={openModal}
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              <Plus size={18} />
              Criar Novo Alerta
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-semibold">Criar Alerta</h2>
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

              {/* Alert Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Alerta
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'above' })}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      formData.type === 'above'
                        ? 'border-green-500 bg-green-50 text-green-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <TrendingUp className="mx-auto mb-1" size={20} />
                    <span className="font-medium">Preço Sobe</span>
                    <span className="text-xs block mt-1 opacity-70">Notificar quando subir</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'below' })}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      formData.type === 'below'
                        ? 'border-red-500 bg-red-50 text-red-600'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <TrendingDown className="mx-auto mb-1" size={20} />
                    <span className="font-medium">Preço Cai</span>
                    <span className="text-xs block mt-1 opacity-70">Notificar quando cair</span>
                  </button>
                </div>
              </div>

              {/* Value */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor de Referência
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

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
                  Criar Alerta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Alerts;