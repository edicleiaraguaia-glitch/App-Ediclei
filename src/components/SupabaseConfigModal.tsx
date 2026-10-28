import React, { useState, useEffect } from 'react';
import { Database, CheckCircle2, AlertCircle, Copy, ExternalLink, RefreshCw, X, ShieldCheck, Zap, ArrowUpCircle, Check, Smartphone, Share2, Code } from 'lucide-react';
import { getSavedConfig, saveSupabaseConfig, testSupabaseConnection, getSupabaseSchemaSql, generateQuickConnectUrl, getVercelEnvSnippet } from '../lib/supabase';
import { StorageService } from '../lib/storage';
import { useTasks } from '../context/TaskContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConfigModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { isRealtimeActive, refreshData, tasks, clients, vehicles, budgets } = useTasks();
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; tablesStatus?: Record<string, boolean> } | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'migration' | 'sql' | 'multidevice'>('config');

  // Migration states
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    tasksSynced: number;
    clientsSynced: number;
    vehiclesSynced: number;
    budgetsSynced: number;
    error?: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      const config = getSavedConfig();
      setUrl(config.url || '');
      setAnonKey(config.anonKey || '');
      setTestResult(null);
      setSyncResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTest = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setTestResult({ success: false, message: 'Preencha a URL e a Anon Key do Supabase antes de testar.' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    const res = await testSupabaseConnection(url.trim(), anonKey.trim());
    setTesting(false);
    setTestResult(res);
  };

  const handleSave = () => {
    const res = saveSupabaseConfig(url, anonKey);
    if (!res.success) {
      setTestResult({ success: false, message: res.error || 'Erro ao salvar configuração' });
      return;
    }
    refreshData();
    onClose();
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(getSupabaseSchemaSql());
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleRunMigration = async () => {
    setSyncing(true);
    setSyncResult(null);
    const res = await StorageService.syncAllLocalToSupabase();
    setSyncing(false);
    setSyncResult(res);
    if (res.success) {
      refreshData();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-md shrink-0">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Integração Supabase & Sincronização</h2>
              <p className="text-[11px] sm:text-xs text-emerald-100">Banco na nuvem, autenticação e sincronização entre dispositivos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 sm:px-6 pt-2.5 gap-2 sm:gap-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('config')}
            className={`pb-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'config'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Zap className="w-3.5 h-3.5" /> Conexão & Chaves
          </button>
          <button
            onClick={() => setActiveTab('migration')}
            className={`pb-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'migration'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ArrowUpCircle className="w-3.5 h-3.5" /> Migrar Dados Antigos
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`pb-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'sql'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" /> Script SQL (Tabelas)
          </button>
          <button
            onClick={() => setActiveTab('multidevice')}
            className={`pb-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'multidevice'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" /> Celular & Vercel
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'config' && (
            <>
              {/* Status Banner */}
              <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/70 flex items-start gap-2.5 sm:gap-3">
                <div className="p-1.5 bg-emerald-500 text-white rounded-lg mt-0.5 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="text-xs sm:text-sm">
                  <p className="font-semibold text-emerald-950">
                    {isRealtimeActive ? 'Canal em Tempo Real Ativo!' : 'Conexão Supabase Configurada'}
                  </p>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Os dados são transmitidos instantaneamente para todos os celulares e computadores conectados ao mesmo projeto Supabase.
                  </p>
                </div>
              </div>

              {/* Form fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Project URL do Supabase
                  </label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    No painel Supabase: Project Settings &gt; API &gt; Project URL
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Project API Key (Anon / Public)
                  </label>
                  <input
                    type="password"
                    value={anonKey}
                    onChange={(e) => setAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Chave pública com permissões anônimas de cliente (anon public)
                  </span>
                </div>
              </div>

              {/* Test result */}
              {testResult && (
                <div
                  className={`p-3.5 rounded-xl text-xs flex flex-col gap-2 ${
                    testResult.success
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : 'bg-rose-50 text-rose-900 border border-rose-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <span>{testResult.message}</span>
                  </div>

                  {testResult.tablesStatus && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-2 border-t border-emerald-200/50">
                      {Object.entries(testResult.tablesStatus).map(([tbl, ok]) => (
                        <div key={tbl} className="flex items-center gap-1.5 text-[11px]">
                          <span className={`w-2 h-2 rounded-full ${ok ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          <span className="font-mono text-slate-700">{tbl}</span>
                          <span className="text-[10px] text-slate-400">{ok ? '✓ OK' : '✕ pendente'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2 flex items-center justify-between text-xs text-slate-500">
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1 hover:underline"
                >
                  Abrir painel do Supabase <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setUrl('');
                    setAnonKey('');
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  Limpar credenciais
                </button>
              </div>
            </>
          )}

          {activeTab === 'migration' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/70 text-blue-900 text-xs sm:text-sm">
                <p className="font-bold text-blue-950 mb-1">
                  Recuperação e Migração de Ordens Antigas
                </p>
                <p className="text-xs text-blue-800 leading-relaxed">
                  Se você criou ordens de serviço, clientes ou orçamentos em seu celular ou navegador antes de configurar o Supabase, eles ficaram gravados com segurança no armazenamento local deste aparelho.
                </p>
                <p className="text-xs text-blue-800 mt-1 font-semibold">
                  Clique no botão abaixo para enviar todos os registros locais para as tabelas do Supabase sem apagar nem duplicar nenhum dado existente.
                </p>
              </div>

              {/* Data Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Tarefas / Ordens</span>
                  <span className="text-xl font-black text-slate-800">{tasks.length}</span>
                  <span className="text-[10px] text-slate-500 block">no dispositivo</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Clientes</span>
                  <span className="text-xl font-black text-slate-800">{clients.length}</span>
                  <span className="text-[10px] text-slate-500 block">cadastrados</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Veículos</span>
                  <span className="text-xl font-black text-slate-800">{vehicles.length}</span>
                  <span className="text-[10px] text-slate-500 block">registrados</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Orçamentos</span>
                  <span className="text-xl font-black text-slate-800">{budgets.length}</span>
                  <span className="text-[10px] text-slate-500 block">salvos</span>
                </div>
              </div>

              {/* Migration Action Button */}
              <button
                type="button"
                onClick={handleRunMigration}
                disabled={syncing}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <ArrowUpCircle className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing
                  ? 'Sincronizando com o Supabase...'
                  : 'Sincronizar Todas as Ordens Antigas com o Supabase Agora'}
              </button>

              {/* Migration Result Message */}
              {syncResult && (
                <div
                  className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                    syncResult.success
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : 'bg-rose-50 text-rose-900 border border-rose-200'
                  }`}
                >
                  {syncResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="font-bold">
                      {syncResult.success ? 'Migração concluída com sucesso!' : 'Falha na migração'}
                    </p>
                    {syncResult.success ? (
                      <p className="mt-0.5 text-emerald-800">
                        {syncResult.tasksSynced} ordens de serviço, {syncResult.clientsSynced} clientes e {syncResult.budgetsSynced} orçamentos sincronizados no Supabase. Agora qualquer outro dispositivo conectado poderá visualizá-los imediatamente!
                      </p>
                    ) : (
                      <p className="mt-0.5 text-rose-800">
                        {syncResult.error || 'Erro ao sincronizar. Verifique se o script SQL foi executado no Supabase.'}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600">
                  Copie e execute no <strong>SQL Editor</strong> do painel Supabase para criar as tabelas com suporte a Realtime e RLS:
                </p>
                <button
                  onClick={handleCopySql}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSql ? 'Copiado!' : 'Copiar SQL'}
                </button>
              </div>
              <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl text-xs font-mono overflow-x-auto max-h-72 border border-slate-800">
                {getSupabaseSchemaSql()}
              </pre>
            </div>
          )}

          {activeTab === 'multidevice' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/70 text-indigo-900 text-xs sm:text-sm">
                <p className="font-bold text-indigo-950 mb-1">
                  Como Compartilhar os Dados entre Dispositivos (Celular e PC)
                </p>
                <p className="text-xs text-indigo-800 leading-relaxed">
                  Para que o aplicativo no seu smartphone Android ou em outro computador visualize <strong>as mesmas ordens de serviço e o mesmo banco de clientes</strong>, o outro dispositivo precisa estar conectado ao mesmo projeto Supabase.
                </p>
              </div>

              {/* Method 1: Instant Quick Connect Link */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                    Método 1: Link de Conexão Rápida para o Celular (WhatsApp)
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Envie este link para você mesmo pelo WhatsApp ou abra no navegador do seu smartphone. Ao carregar a página por este link, o celular salva as credenciais e se conecta instantaneamente sem precisar digitar nada:
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const link = generateQuickConnectUrl();
                    navigator.clipboard.writeText(link);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2500);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedLink ? 'Link Copiado! Envie no WhatsApp ou abra no Celular' : 'Copiar Link de Conexão para o Celular'}
                </button>
              </div>

              {/* Method 2: Vercel Environment Variables */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2.5">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800">
                    Método 2: Configuração Definitiva na Vercel (Recomendado)
                  </h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Configure as variáveis no painel da Vercel (<strong>Project &gt; Settings &gt; Environment Variables</strong>). Assim, qualquer pessoa ou celular que abrir o site já estará automaticamente conectado sem nenhuma configuração manual:
                </p>
                <pre className="p-3 bg-slate-900 text-emerald-300 rounded-xl text-xs font-mono overflow-x-auto border border-slate-800">
                  {getVercelEnvSnippet()}
                </pre>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(getVercelEnvSnippet());
                    setCopiedEnv(true);
                    setTimeout(() => setCopiedEnv(false), 2500);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  {copiedEnv ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copiedEnv ? 'Variáveis Copiadas!' : 'Copiar Variáveis de Ambiente para Vercel'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={handleTest}
            disabled={testing}
            className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            {testing ? 'Testando...' : 'Testar Conexão'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 transition-all"
          >
            Salvar Configuração
          </button>
        </div>
      </div>
    </div>
  );
};
