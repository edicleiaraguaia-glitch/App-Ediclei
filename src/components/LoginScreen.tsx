import React, { useState } from 'react';
import { Wrench, Lock, Mail, User, Database, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from '../types';

export const LoginScreen: React.FC = () => {
  const { login, register } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserProfile['role']>('Administrador');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    if (mode === 'login') {
      const res = await login(email, password);
      if (!res.success) {
        setError(res.error || 'Credenciais inválidas. Verifique seu e-mail e senha.');
      }
    } else {
      if (!name.trim()) {
        setError('Por favor, informe o seu nome completo.');
        setLoading(false);
        return;
      }
      const res = await register(email, password, name, role);
      if (!res.success) {
        setError(res.error || 'Erro ao realizar o cadastro. Tente novamente.');
      } else {
        setSuccessMessage(res.error || 'Conta cadastrada com sucesso no Supabase Authentication!');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 flex items-center justify-center p-3 sm:p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        {/* Top Header */}
        <div className="p-6 sm:p-8 text-center bg-gradient-to-b from-blue-50 to-white border-b border-slate-100">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-blue-700 text-white flex items-center justify-center mx-auto shadow-xl shadow-blue-700/30 mb-3 sm:mb-4">
            <Wrench className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Oficina Evaldo Pinturas</h2>
          <p className="text-xs text-slate-500 mt-1">Gestor de Tarefas, Funilaria & Pendências em Tempo Real</p>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold mt-3">
            <Database className="w-3.5 h-3.5 text-emerald-600" />
            <span>Autenticação Supabase Auth (Users)</span>
          </div>
        </div>

        {/* Tab switcher: Entrar vs Cadastrar */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 ${
              mode === 'login'
                ? 'border-blue-700 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Entrar na Conta
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-3 text-xs font-bold transition-all border-b-2 ${
              mode === 'register'
                ? 'border-blue-700 text-blue-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Criar Cadastro
          </button>
        </div>

        {/* Form Body */}
        <div className="p-8 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Nome Completo *
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
                E-mail {mode === 'register' ? '*' : ''}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu.email@exemplo.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Senha {mode === 'register' ? '(mínimo 6 caracteres) *' : ''}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  minLength={6}
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
              className="w-full py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm shadow-lg shadow-blue-700/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.01] active:scale-95"
            >
              {loading
                ? 'Validando...'
                : mode === 'login'
                ? 'Entrar no Aplicativo'
                : 'Cadastrar no Supabase'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Helper hint */}
          <div className="text-center pt-2">
            <p className="text-[11px] text-slate-400">
              {mode === 'login'
                ? 'Ainda não possui conta? Clique em "Criar Cadastro" acima.'
                : 'Seus dados serão gravados de forma segura no Supabase.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
