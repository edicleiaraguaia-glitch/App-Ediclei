import React, { useState } from 'react';
import { X, Settings, Database, Plus, Trash2, Edit2, Building2, Wrench, Shield, Check } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { ServiceItem } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenSupabaseModal: () => void;
}

export const SettingsModal: React.FC<Props> = ({ isOpen, onClose, onOpenSupabaseModal }) => {
  const { config, saveConfig, services, saveServices } = useTasks();
  const { user, logout, quickLoginAs } = useAuth();

  const [activeTab, setActiveTab] = useState<'oficina' | 'servicos' | 'perfil'>('oficina');

  // Config states
  const [nome, setNome] = useState(config.nome);
  const [cnpj, setCnpj] = useState(config.cnpj);
  const [tel, setTel] = useState(config.tel);
  const [end, setEnd] = useState(config.end);
  const [validade, setValidade] = useState(config.validade);
  const [pagto, setPagto] = useState(config.pagto);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Service form
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState<number>(150);

  if (!isOpen) return null;

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveConfig({
      nome,
      cnpj,
      tel,
      end,
      validade,
      pagto,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;
    const newSrv: ServiceItem = {
      id: 'srv_' + Date.now(),
      nome: newServiceName.trim(),
      preco: newServicePrice,
      categoria: 'geral',
    };
    saveServices([...services, newSrv]);
    setNewServiceName('');
    setNewServicePrice(150);
  };

  const handleDeleteService = (id: string) => {
    saveServices(services.filter((s) => s.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-blue-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Settings className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Configurações da Oficina</h2>
              <p className="text-xs text-slate-300">Dados cadastrais, serviços e integrações</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-4">
          <button
            onClick={() => setActiveTab('oficina')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'oficina'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" /> Dados da Oficina
          </button>
          <button
            onClick={() => setActiveTab('servicos')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'servicos'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Wrench className="w-4 h-4" /> Catálogo de Serviços
          </button>
          <button
            onClick={() => setActiveTab('perfil')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'perfil'
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-4 h-4" /> Usuário & Sessão
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'oficina' && (
            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Database className="w-5 h-5 text-emerald-600" />
                  <div className="text-xs">
                    <p className="font-bold text-emerald-950">Banco de Dados & Supabase</p>
                    <p className="text-emerald-700">Gerencie a conexão e o script de tabelas em tempo real</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSupabaseModal();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                >
                  Configurar Supabase
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nome da Oficina / Razão Social</label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">CNPJ</label>
                  <input
                    type="text"
                    value={cnpj}
                    onChange={(e) => setCnpj(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Telefone de Contato</label>
                  <input
                    type="text"
                    value={tel}
                    onChange={(e) => setTel(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Endereço Completo</label>
                <textarea
                  rows={2}
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Validade do Orçamento (Dias)</label>
                  <input
                    type="number"
                    value={validade}
                    onChange={(e) => setValidade(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Formas de Pagamento (Orçamentos)</label>
                  <input
                    type="text"
                    value={pagto}
                    onChange={(e) => setPagto(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                {savedSuccess ? (
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <Check className="w-4 h-4" /> Configurações salvas com sucesso!
                  </span>
                ) : (
                  <span></span>
                )}
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-700 text-white text-xs font-semibold shadow-md shadow-blue-700/20"
                >
                  Salvar Dados
                </button>
              </div>
            </form>
          )}

          {activeTab === 'servicos' && (
            <div className="space-y-4">
              <form onSubmit={handleAddService} className="p-3 bg-slate-50 border rounded-xl flex items-center gap-2">
                <input
                  type="text"
                  required
                  value={newServiceName}
                  onChange={(e) => setNewServiceName(e.target.value)}
                  placeholder="Nome do serviço (Ex: Pintura de Parachoque)"
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200"
                />
                <input
                  type="number"
                  step="0.01"
                  required
                  value={newServicePrice}
                  onChange={(e) => setNewServicePrice(Number(e.target.value))}
                  placeholder="Preço R$"
                  className="w-24 px-3 py-1.5 text-xs rounded-lg border border-slate-200 text-right"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar
                </button>
              </form>

              <div className="space-y-2 max-h-72 overflow-y-auto">
                {services.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white"
                  >
                    <div>
                      <h4 className="text-sm font-semibold text-slate-800">{s.nome}</h4>
                      <span className="text-xs text-blue-700 font-bold">R$ {s.preco.toFixed(2).replace('.', ',')}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteService(s.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'perfil' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-800 font-bold text-lg flex items-center justify-center">
                  {user?.name.charAt(0) || 'U'}
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">{user?.name}</h4>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                  <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                    {user?.role}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
                  Trocar para outro perfil de teste (Demonstração rápida):
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    onClick={() => quickLoginAs('Administrador')}
                    className="p-2.5 rounded-xl border text-left hover:bg-slate-50"
                  >
                    <strong>João (Gerente Geral)</strong>
                    <span className="block text-[11px] text-slate-400">Administrador</span>
                  </button>
                  <button
                    onClick={() => quickLoginAs('Funileiro')}
                    className="p-2.5 rounded-xl border text-left hover:bg-slate-50"
                  >
                    <strong>Marcos Funileiro</strong>
                    <span className="block text-[11px] text-slate-400">Funileiro</span>
                  </button>
                  <button
                    onClick={() => quickLoginAs('Pintor')}
                    className="p-2.5 rounded-xl border text-left hover:bg-slate-50"
                  >
                    <strong>Roberto Pintor</strong>
                    <span className="block text-[11px] text-slate-400">Pintor</span>
                  </button>
                  <button
                    onClick={() => quickLoginAs('Mecânico')}
                    className="p-2.5 rounded-xl border text-left hover:bg-slate-50"
                  >
                    <strong>Lucas Montador</strong>
                    <span className="block text-[11px] text-slate-400">Mecânico</span>
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t flex justify-end">
                <button
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl text-xs font-semibold"
                >
                  Encerrar Sessão
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
