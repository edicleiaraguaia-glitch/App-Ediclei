import React from 'react';
import {
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  ArrowUpRight,
  TrendingUp,
  Package,
  Wrench,
  Paintbrush,
  Sparkles,
  Car,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { TaskStatus } from '../types';

interface Props {
  onOpenNewTask: () => void;
  onOpenChecklist: () => void;
  onNavigateToTasks: (filterStatus?: TaskStatus | 'urgentes') => void;
}

export const RealtimeProgressDashboard: React.FC<Props> = ({
  onOpenNewTask,
  onOpenChecklist,
  onNavigateToTasks,
}) => {
  const { stats, activities, lastUpdated, isRealtimeActive, tasks } = useTasks();

  const activePendencies = stats.pendentes + stats.emAndamento + stats.aguardandoPecas + stats.emRevisao;

  // Category progress calculation
  const categoriesConfig = [
    { key: 'funilaria', label: 'Funilaria & Lataria', icon: Wrench, color: 'from-amber-500 to-amber-600', barColor: 'bg-amber-500' },
    { key: 'pintura', label: 'Pintura & Estufa', icon: Paintbrush, color: 'from-blue-500 to-indigo-600', barColor: 'bg-blue-600' },
    { key: 'mecanica', label: 'Mecânica & Peças', icon: Package, color: 'from-purple-500 to-indigo-700', barColor: 'bg-purple-600' },
    { key: 'polimento', label: 'Polimento & Estética', icon: Sparkles, color: 'from-teal-500 to-emerald-600', barColor: 'bg-teal-500' },
  ] as const;

  return (
    <div className="space-y-6">
      {/* Real-time Status Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl shadow-lg border border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-3.5 w-3.5 rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold tracking-tight">Painel de Pendências em Tempo Real</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                LIVE SYNC
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Última sincronização: {lastUpdated.toLocaleTimeString('pt-BR')} • {isRealtimeActive ? 'Canal ativo' : 'Local'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenNewTask}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-900/40 transition-all hover:scale-[1.02] active:scale-95"
          >
            <Plus className="w-4 h-4" /> Nova Pendência
          </button>
          <button
            onClick={onOpenChecklist}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 border border-white/15 transition-all"
          >
            <Car className="w-4 h-4" /> Vistoria / Checklist
          </button>
        </div>
      </div>

      {/* Main Realtime Progress Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Big Progress Gauge Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Progresso Geral</span>
                <h3 className="text-xl font-bold text-slate-900">Eficiência e Resolução de Pendências</h3>
              </div>
              <div className="text-right">
                <span className="text-3xl font-extrabold text-blue-700">{stats.taxaConclusao}%</span>
                <span className="block text-xs font-medium text-slate-500">concluído</span>
              </div>
            </div>

            {/* Visual Multi-Segment Bar */}
            <div className="space-y-2 mb-6">
              <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                <div
                  style={{ width: `${stats.total > 0 ? (stats.concluidas / stats.total) * 100 : 0}%` }}
                  className="bg-emerald-500 transition-all duration-700 ease-out"
                  title={`Concluídas: ${stats.concluidas}`}
                />
                <div
                  style={{ width: `${stats.total > 0 ? (stats.emAndamento / stats.total) * 100 : 0}%` }}
                  className="bg-blue-600 transition-all duration-700 ease-out"
                  title={`Em Andamento: ${stats.emAndamento}`}
                />
                <div
                  style={{ width: `${stats.total > 0 ? (stats.aguardandoPecas / stats.total) * 100 : 0}%` }}
                  className="bg-amber-500 transition-all duration-700 ease-out"
                  title={`Aguardando Peças: ${stats.aguardandoPecas}`}
                />
                <div
                  style={{ width: `${stats.total > 0 ? (stats.emRevisao / stats.total) * 100 : 0}%` }}
                  className="bg-purple-500 transition-all duration-700 ease-out"
                  title={`Em Revisão: ${stats.emRevisao}`}
                />
                <div
                  style={{ width: `${stats.total > 0 ? (stats.pendentes / stats.total) * 100 : 0}%` }}
                  className="bg-slate-300 transition-all duration-700 ease-out"
                  title={`Pendentes: ${stats.pendentes}`}
                />
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>Concluídas ({stats.concluidas})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                  <span>Em Andamento ({stats.emAndamento})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span>Aguardando Peças ({stats.aguardandoPecas})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                  <span>Em Revisão ({stats.emRevisao})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span>
                  <span>Fila Pendente ({stats.pendentes})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Metrics Sub-row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
            <div
              onClick={() => onNavigateToTasks()}
              className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors"
            >
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Total Ativo</span>
              <span className="text-xl font-bold text-slate-800">{activePendencies}</span>
              <span className="text-[10px] text-slate-400 block">pendências na oficina</span>
            </div>

            <div
              onClick={() => onNavigateToTasks('em_andamento')}
              className="p-3 rounded-xl bg-blue-50/70 hover:bg-blue-100/70 cursor-pointer transition-colors border border-blue-100"
            >
              <span className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider block">Em Execução</span>
              <span className="text-xl font-bold text-blue-800">{stats.emAndamento}</span>
              <span className="text-[10px] text-blue-600 block">sendo trabalhadas</span>
            </div>

            <div
              onClick={() => onNavigateToTasks('aguardando_pecas')}
              className="p-3 rounded-xl bg-amber-50/70 hover:bg-amber-100/70 cursor-pointer transition-colors border border-amber-100"
            >
              <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">Peças / Bloqueio</span>
              <span className="text-xl font-bold text-amber-800">{stats.aguardandoPecas}</span>
              <span className="text-[10px] text-amber-600 block">aguardando fornecedor</span>
            </div>

            <div
              onClick={() => onNavigateToTasks('urgentes')}
              className="p-3 rounded-xl bg-rose-50/70 hover:bg-rose-100/70 cursor-pointer transition-colors border border-rose-100"
            >
              <span className="text-[11px] font-semibold text-rose-700 uppercase tracking-wider block">Prioridade Alta</span>
              <span className="text-xl font-bold text-rose-800">{stats.urgentes}</span>
              <span className="text-[10px] text-rose-600 block">atenção imediata</span>
            </div>
          </div>
        </div>

        {/* Real-time Alerts & Critical Attention Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Atenção Crítica</span>
              <Flame className="w-5 h-5 text-rose-500 animate-pulse" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-3">Gargalos e Prioridades</h3>

            <div className="space-y-3">
              {stats.atrasadas > 0 && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold">{stats.atrasadas} pendência(s) com prazo estourado!</p>
                    <p className="text-rose-700 mt-0.5">Priorize a entrega para evitar atrasos com clientes.</p>
                  </div>
                </div>
              )}

              {stats.aguardandoPecas > 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5">
                  <Package className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold">{stats.aguardandoPecas} veículo(s) aguardando peças</p>
                    <p className="text-amber-700 mt-0.5">Verifique com os distribuidores de autopeças.</p>
                  </div>
                </div>
              )}

              {stats.atrasadas === 0 && stats.aguardandoPecas === 0 && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div className="text-xs">
                    <p className="font-bold">Oficina operando no prazo!</p>
                    <p className="text-emerald-700">Nenhum atraso crítico registrado no momento.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <button
              onClick={() => onNavigateToTasks('pendente')}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              Ver Fila de Pendências <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Progress Breakdown By Department / Category */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Distribuição Operacional</span>
            <h3 className="text-lg font-bold text-slate-900">Pendências por Setor da Oficina</h3>
          </div>
          <span className="text-xs font-medium text-slate-500">Atualização instantânea</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categoriesConfig.map((cat) => {
            const count = stats.porCategoria[cat.key as keyof typeof stats.porCategoria] || 0;
            const catTasks = tasks.filter((t) => t.category === cat.key);
            const completedInCat = catTasks.filter((t) => t.status === 'concluida').length;
            const pct = catTasks.length > 0 ? Math.round((completedInCat / catTasks.length) * 100) : 0;
            const Icon = cat.icon;

            return (
              <div
                key={cat.key}
                onClick={() => onNavigateToTasks()}
                className="p-4 rounded-2xl border border-slate-200/90 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer bg-slate-50/50"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${cat.color} text-white flex items-center justify-center shadow-sm`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                    {count} {count === 1 ? 'tarefa' : 'tarefas'}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-800 mb-1">{cat.label}</h4>
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                  <span>Progresso</span>
                  <span className="font-semibold text-slate-700">{pct}%</span>
                </div>

                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${pct}%` }}
                    className={`h-full ${cat.barColor} transition-all duration-500`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Activity Feed */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Fluxo de Atividades em Tempo Real</h3>
              <p className="text-xs text-slate-400">Histórico de ações dos operadores e funileiros</p>
            </div>
          </div>
          <span className="text-xs font-mono text-slate-400">Registro ao vivo</span>
        </div>

        <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto pr-1">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              Nenhuma atividade recente registrada.
            </div>
          ) : (
            activities.map((act) => {
              const dateObj = new Date(act.timestamp);
              const timeStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

              return (
                <div key={act.id} className="py-3 flex items-start gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition-colors">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm text-slate-800">
                      <strong className="text-slate-900 font-semibold">{act.userName}</strong>{' '}
                      <span className="text-slate-600">{act.action}</span>
                      {act.taskTitle && (
                        <span className="font-medium text-blue-700 ml-1">"{act.taskTitle}"</span>
                      )}
                    </p>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">{timeStr}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
