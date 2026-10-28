import React, { useState } from 'react';
import {
  Wrench,
  Database,
  Settings,
  Plus,
  LogOut,
  User,
  LayoutDashboard,
  CheckSquare,
  Car,
  FileText,
  Users,
  Radio,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TaskContext';

interface Props {
  activeTab: 'dashboard' | 'tasks' | 'checklist' | 'budgets' | 'clients';
  setActiveTab: (tab: 'dashboard' | 'tasks' | 'checklist' | 'budgets' | 'clients') => void;
  onOpenNewTask: () => void;
  onOpenSupabaseModal: () => void;
  onOpenSettingsModal: () => void;
}

export const Header: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  onOpenNewTask,
  onOpenSupabaseModal,
  onOpenSettingsModal,
}) => {
  const { user, logout } = useAuth();
  const { config, stats, isRealtimeActive } = useTasks();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const pendingCount = stats.pendentes + stats.emAndamento + stats.aguardandoPecas;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {config.logo ? (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border border-slate-200 p-0.5 flex items-center justify-center overflow-hidden shadow-xs shrink-0">
                <img src={config.logo} alt={config.nome} className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-800 text-white flex items-center justify-center shadow-xs shrink-0">
                <Wrench className="w-4 h-4 text-white" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="font-bold text-slate-900 text-sm sm:text-base leading-tight truncate max-w-[125px] xs:max-w-[170px] sm:max-w-none">
                  {config.nome || 'Oficina Evaldo Pinturas'}
                </h1>
                {/* Live Realtime Indicator */}
                <div
                  onClick={onOpenSupabaseModal}
                  className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] sm:text-[10px] font-bold cursor-pointer hover:bg-emerald-100 transition-colors shrink-0"
                  title="Clique para gerenciar o Supabase e Realtime"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="hidden xs:inline">Tempo Real</span>
                </div>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 hidden sm:block truncate">
                Gestão de Pendências de Funilaria, Pintura & Mecânica
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" /> Painel
            </button>

            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all relative ${
                activeTab === 'tasks'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" /> Tarefas & Pendências
              {pendingCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('checklist')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'checklist'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Car className="w-3.5 h-3.5" /> Checklist & Carro
            </button>

            <button
              onClick={() => setActiveTab('budgets')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'budgets'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Orçamentos
            </button>

            <button
              onClick={() => setActiveTab('clients')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'clients'
                  ? 'bg-white text-blue-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Clientes
            </button>
          </nav>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Supabase Button */}
            <button
              onClick={onOpenSupabaseModal}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Configurar Conexão com Supabase e Sincronização"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden md:inline">Supabase</span>
            </button>

            {/* Quick Add Task */}
            <button
              onClick={onOpenNewTask}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1 shadow-sm shadow-blue-700/20 transition-all hover:scale-105 active:scale-95"
              title="Nova Tarefa ou Pendência"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nova Tarefa</span>
            </button>

            {/* Settings */}
            <button
              onClick={onOpenSettingsModal}
              className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
              title="Configurações da Oficina"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1 pl-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center overflow-hidden">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    user?.name?.charAt(0) || 'U'
                  )}
                </div>
                <span className="text-xs font-semibold text-slate-700 hidden sm:block max-w-[100px] truncate">
                  {user?.name?.split(' ')[0] || 'Usuário'}
                </span>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <p className="text-xs font-bold text-slate-900 truncate">{user?.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">
                      {user?.role}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onOpenSettingsModal();
                    }}
                    className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                  >
                    <Settings className="w-3.5 h-3.5" /> Configurações
                  </button>

                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      onOpenSupabaseModal();
                    }}
                    className="w-full px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg flex items-center gap-2"
                  >
                    <Database className="w-3.5 h-3.5 text-emerald-600" /> Banco & Supabase
                  </button>

                  <div className="border-t border-slate-100 mt-1 pt-1">
                    <button
                      onClick={async () => {
                        setUserMenuOpen(false);
                        await logout();
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Desligar / Sair da Conta
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
