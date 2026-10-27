import React, { useState } from 'react';
import { Wrench, Shield, CheckCircle2, Lock, Mail, User, Database, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from '../types';

export const LoginScreen: React.FC = () => {
  const { login, register, quickLoginAs, isSupabaseAuth } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('oficina@demo.com');
  const [password, setPassword] = useState('123456');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserProfile['role']>('Administrador');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === 'login') {
      const res = await login(email, password);
      if (!res.success) {
        setError(res.error || 'Credenciais inválidas. Tente usar o Acesso Rápido abaixo.');
      }
    } else {
      if (!name.trim()) {
        setError('Informe o seu nome completo');
        setLoading(false);
        return;
      }
      const res = await register(email, password, name, role);
      if (!res.success) {
        setError(res.error || 'Erro ao criar conta.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Top Header */}
        <div className="p-8 text-center bg-gradient-to-b from-blue-50 to-white border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-blue-700 text-white flex items-center justify-center mx-auto shadow-xl shadow-blue-700/30 mb-4">
            <Wrench className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">OficinaApp</h2>
          <p className="text-xs text-slate-500 mt-1">Gestor de Tarefas, Funilaria & Pendências em Tempo Real</p>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold mt-3">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>Supabase Ready & Offline Sync</span>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-8 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nome Completo
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Carlos Mecânico"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Função na Oficina
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                  >
                    <option value="Administrador">Administrador / Gerente</option>
                    <option value="Funileiro">Funileiro</option>
                    <option value="Pintor">Pintor</option>
                    <option value="Mecânico">Mecânico / Montador</option>
                    <option value="Atendente">Atendente / Vistoriador</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                E-mail
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="oficina@demo.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Senha
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm shadow-lg shadow-blue-700/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Processando...' : mode === 'login' ? 'Entrar no Sistema' : 'Criar Nova Conta'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Toggle Login / Register */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError(null);
              }}
              className="text-xs text-blue-700 hover:text-blue-800 font-semibold"
            >
              {mode === 'login'
                ? 'Não possui conta? Cadastre-se aqui'
                : 'Já possui cadastro? Clique para entrar'}
            </button>
          </div>

          {/* Quick Demo Logins Section */}
          <div className="pt-4 border-t border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block text-center mb-2.5">
              Acesso Rápido para Demonstração:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => quickLoginAs('Administrador')}
                className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-left transition-all"
              >
                <span className="font-bold text-slate-800 block">João (Gerente)</span>
                <span className="text-[10px] text-slate-500">Admin Geral</span>
              </button>

              <button
                type="button"
                onClick={() => quickLoginAs('Funileiro')}
                className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-left transition-all"
              >
                <span className="font-bold text-slate-800 block">Marcos</span>
                <span className="text-[10px] text-slate-500">Funileiro</span>
              </button>

              <button
                type="button"
                onClick={() => quickLoginAs('Pintor')}
                className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-left transition-all"
              >
                <span className="font-bold text-slate-800 block">Roberto</span>
                <span className="text-[10px] text-slate-500">Pintor</span>
              </button>

              <button
                type="button"
                onClick={() => quickLoginAs('Mecânico')}
                className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-left transition-all"
              >
                <span className="font-bold text-slate-800 block">Lucas</span>
                <span className="text-[10px] text-slate-500">Mecânico</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
