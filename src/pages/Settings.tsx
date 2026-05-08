import React, { useState } from 'react';
import { Settings as SettingsIcon, Globe, Database, Download, Upload, Trash2, CheckCircle, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { clearAllData, exportData, importData } from '../services/storage';
import { formatRelativeTime } from '../utils/formatters';

const Settings: React.FC = () => {
  const { settings, updateSettings, refreshData } = useApp();
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const handleCurrencyChange = (currency: 'BRL' | 'USD') => {
    updateSettings({ ...settings, currency });
  };

  const handleTimezoneChange = (timezone: string) => {
    updateSettings({ ...settings, timezone });
  };

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consolidator_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (importData(content)) {
        refreshData();
        alert('Dados importados com sucesso!');
      } else {
        alert('Erro ao importar dados. Verifique o arquivo.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearData = () => {
    clearAllData();
    refreshData();
    setShowConfirmClear(false);
    alert('Todos os dados foram removidos.');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500 mt-1">Personalize sua experiência</p>
      </div>

      {/* General Settings */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Globe className="text-primary" size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Geral</h2>
            <p className="text-sm text-gray-500">Preferências básicas do aplicativo</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Currency */}
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-900">Moeda Base</label>
              <p className="text-sm text-gray-500">Moeda principal para exibição de valores</p>
            </div>
            <select
              value={settings.currency}
              onChange={(e) => handleCurrencyChange(e.target.value as 'BRL' | 'USD')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="BRL">Real Brasileiro (BRL)</option>
              <option value="USD">Dólar Americano (USD)</option>
            </select>
          </div>

          {/* Timezone */}
          <div className="flex items-center justify-between">
            <div>
              <label className="font-medium text-gray-900">Fuso Horário</label>
              <p className="text-sm text-gray-500">Fuso horário para display de datas</p>
            </div>
            <select
              value={settings.timezone}
              onChange={(e) => handleTimezoneChange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="America/Sao_Paulo">São Paulo (GMT-3)</option>
              <option value="America/New_York">Nova York (GMT-5)</option>
              <option value="America/Los_Angeles">Los Angeles (GMT-8)</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Database className="text-primary" size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Dados</h2>
            <p className="text-sm text-gray-500">Gerencie seus dados armazenados localmente</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Export */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="font-medium text-gray-900">Exportar Dados</label>
              <p className="text-sm text-gray-500">Baixe todos os seus dados em formato JSON</p>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              <Download size={18} />
              Exportar
            </button>
          </div>

          {/* Import */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="font-medium text-gray-900">Importar Dados</label>
              <p className="text-sm text-gray-500">Restaure seus dados de um arquivo de backup</p>
            </div>
            <label className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <Upload size={18} />
              <span>Importar</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </div>

          {/* Clear Data */}
          <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
            <div>
              <label className="font-medium text-red-700">Limpar Todos os Dados</label>
              <p className="text-sm text-red-600">Remove todos os ativos, operações e configurações</p>
            </div>
            <button
              onClick={() => setShowConfirmClear(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 size={18} />
              Limpar
            </button>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <SettingsIcon className="text-primary" size={24} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Sobre o Consolidador</h2>
            <p className="text-sm text-gray-500">Informações sobre o aplicativo</p>
          </div>
        </div>

        <div className="space-y-4 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Versão</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Última atualização de dados</span>
            <span className="font-medium">
              {settings.lastApiUpdate
                ? formatRelativeTime(settings.lastApiUpdate)
                : 'Nunca'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Armazenamento</span>
            <span className="font-medium">Local (localStorage)</span>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t">
          <p className="text-sm text-gray-500 text-center">
            Consolidador de Ativos - Um projeto para ajudar investidores a acompanhar seus portafólios de investimento.
          </p>
          <p className="text-xs text-gray-400 text-center mt-2">
            Desenvolvido com React, TypeScript e Tailwind CSS
          </p>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmClear && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-xl p-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="text-red-600" size={32} />
              </div>
              <h2 className="text-xl font-semibold mb-2">Confirmar Exclusão</h2>
              <p className="text-gray-500 mb-6">
                Tem certeza que deseja remover TODOS os dados? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirmClear(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleClearData}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Sim, Limpar Tudo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;