import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Kanban,
  ListFilter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Car,
  User,
  Calendar,
  MoreVertical,
  CheckSquare,
  Square,
  ArrowRight,
  Flame,
  ChevronDown,
  Trash2,
  Edit2,
  Filter,
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useAuth } from '../context/AuthContext';
import { Task, TaskStatus, TaskPriority, TaskCategory } from '../types';

interface Props {
  onOpenNewTask: () => void;
  onEditTask: (task: Task) => void;
  initialFilter?: TaskStatus | 'urgentes' | 'todas';
}

export const TaskList: React.FC<Props> = ({ onOpenNewTask, onEditTask, initialFilter = 'todas' }) => {
  const { tasks, updateTaskStatus, toggleSubtask, deleteTask } = useTasks();
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>(initialFilter);
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [selectedPriority, setSelectedPriority] = useState<string>('todas');

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Search
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        t.title.toLowerCase().includes(q) ||
        (t.vehiclePlate && t.vehiclePlate.toLowerCase().includes(q)) ||
        (t.clientName && t.clientName.toLowerCase().includes(q)) ||
        (t.assignedToName && t.assignedToName.toLowerCase().includes(q)) ||
        t.category.toLowerCase().includes(q);

      if (!matchSearch) return false;

      // Status filter
      if (selectedStatus === 'urgentes') {
        if (t.priority !== 'urgente' && t.priority !== 'alta') return false;
      } else if (selectedStatus === 'minhas') {
        if (!user || !t.assignedToName?.toLowerCase().includes(user.name.toLowerCase().split(' ')[0])) {
          return false;
        }
      } else if (selectedStatus !== 'todas') {
        if (t.status !== selectedStatus) return false;
      }

      // Category filter
      if (selectedCategory !== 'todas' && t.category !== selectedCategory) return false;

      // Priority filter
      if (selectedPriority !== 'todas' && t.priority !== selectedPriority) return false;

      return true;
    });
  }, [tasks, search, selectedStatus, selectedCategory, selectedPriority, user]);

  const kanbanColumns: { status: TaskStatus; label: string; color: string; badgeBg: string }[] = [
    { status: 'pendente', label: 'Pendente', color: 'border-slate-300 text-slate-700', badgeBg: 'bg-slate-100' },
    { status: 'em_andamento', label: 'Em Andamento', color: 'border-blue-500 text-blue-700', badgeBg: 'bg-blue-100' },
    { status: 'aguardando_pecas', label: 'Aguardando Peças', color: 'border-amber-500 text-amber-700', badgeBg: 'bg-amber-100' },
    { status: 'em_revisao', label: 'Em Revisão / CQ', color: 'border-purple-500 text-purple-700', badgeBg: 'bg-purple-100' },
    { status: 'concluida', label: 'Concluída', color: 'border-emerald-500 text-emerald-700', badgeBg: 'bg-emerald-100' },
  ];

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'urgente':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">🔴 Urgente</span>;
      case 'alta':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">🟠 Alta</span>;
      case 'media':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-800">🟡 Média</span>;
      case 'baixa':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">🟢 Baixa</span>;
    }
  };

  const getCategoryLabel = (category: TaskCategory) => {
    const map: Record<TaskCategory, string> = {
      funilaria: '🔨 Funilaria',
      pintura: '🎨 Pintura',
      mecanica: '⚙️ Mecânica',
      polimento: '✨ Polimento',
      eletrica: '⚡ Elétrica',
      inspecao: '📋 Vistoria',
      orcamento: '📄 Orçamento',
      lavagem: '🚿 Lavagem',
    };
    return map[category] || category;
  };

  return (
    <div className="space-y-4">
      {/* Search and Main Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por tarefa, placa, modelo, cliente ou técnico..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-slate-50/50"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* View Toggles & Add Button */}
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === 'kanban'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Kanban className="w-3.5 h-3.5" /> Quadro
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" /> Lista
              </button>
            </div>

            <button
              onClick={onOpenNewTask}
              className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-700/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <Plus className="w-4 h-4" /> Nova Pendência
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-medium flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Status:
          </span>
          {[
            { id: 'todas', label: 'Todas as Pendências' },
            { id: 'pendente', label: '⏳ Pendentes' },
            { id: 'em_andamento', label: '🚀 Em Andamento' },
            { id: 'aguardando_pecas', label: '📦 Aguardando Peças' },
            { id: 'em_revisao', label: '🔍 Em Revisão' },
            { id: 'concluida', label: '✅ Concluídas' },
            { id: 'urgentes', label: '🔥 Urgentes/Alta' },
            { id: 'minhas', label: '👤 Minhas' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedStatus(f.id)}
              className={`px-3 py-1 rounded-full font-medium transition-all ${
                selectedStatus === f.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {kanbanColumns.map((col) => {
            const columnTasks = filteredTasks.filter((t) => t.status === col.status);

            return (
              <div
                key={col.status}
                className="bg-slate-50/70 rounded-2xl p-3 border border-slate-200 flex flex-col min-w-[280px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 px-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${col.status === 'concluida' ? 'bg-emerald-500' : col.status === 'em_andamento' ? 'bg-blue-600' : col.status === 'aguardando_pecas' ? 'bg-amber-500' : col.status === 'em_revisao' ? 'bg-purple-500' : 'bg-slate-400'}`}></span>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">{col.label}</h3>
                  </div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white text-slate-700 border border-slate-200">
                    {columnTasks.length}
                  </span>
                </div>

                {/* Task Cards in Column */}
                <div className="space-y-3 flex-1 overflow-y-auto max-h-[72vh] pr-0.5">
                  {columnTasks.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                      Nenhuma pendência
                    </div>
                  ) : (
                    columnTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onEdit={() => onEditTask(task)}
                        onDelete={() => deleteTask(task.id)}
                        onToggleSubtask={(subId) => toggleSubtask(task.id, subId)}
                        onStatusChange={(status) => updateTaskStatus(task.id, status)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filteredTasks.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                Nenhuma tarefa ou pendência encontrada para os filtros selecionados.
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {getCategoryLabel(task.category)}
                      </span>
                      {getPriorityBadge(task.priority)}
                      {task.vehiclePlate && (
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-white font-mono text-[11px] font-bold">
                          {task.vehiclePlate}
                        </span>
                      )}
                      <h4 className="text-sm font-bold text-slate-900">{task.title}</h4>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-0.5">
                      {task.clientName && (
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" /> {task.clientName}
                        </span>
                      )}
                      {task.assignedToName && (
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-blue-500" /> {task.assignedToName}
                        </span>
                      )}
                      {task.dueDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" /> Prazo: {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                      {task.checklistItems.length > 0 && (
                        <span>
                          Checklist: {task.checklistItems.filter((i) => i.completed).length}/{task.checklistItems.length} concluídos
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={task.status}
                      onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white text-slate-700"
                    >
                      <option value="pendente">Pendente</option>
                      <option value="em_andamento">Em Andamento</option>
                      <option value="aguardando_pecas">Aguardando Peças</option>
                      <option value="em_revisao">Em Revisão</option>
                      <option value="concluida">Concluída</option>
                    </select>

                    <button
                      onClick={() => onEditTask(task)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Subcomponent: Task Card for Kanban
interface TaskCardProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  onToggleSubtask: (subId: string) => void;
  onStatusChange: (status: TaskStatus) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete, onToggleSubtask, onStatusChange }) => {
  const completedSubtasks = task.checklistItems.filter((i) => i.completed).length;
  const totalSubtasks = task.checklistItems.length;
  const progressPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  const isOverdue = task.dueDate && task.status !== 'concluida' && new Date(task.dueDate) < new Date();

  return (
    <div className="bg-white rounded-xl p-3.5 shadow-sm border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all group">
      {/* Top badges */}
      <div className="flex items-center justify-between gap-1 mb-2">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
          {task.category}
        </span>
        <div className="flex items-center gap-1">
          {task.priority === 'urgente' && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-rose-100 text-rose-700 rounded-md">🔴 Urgente</span>
          )}
          {task.priority === 'alta' && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-md">🟠 Alta</span>
          )}
        </div>
      </div>

      {/* Vehicle Plate & Client */}
      {task.vehiclePlate && (
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono text-[11px] font-bold tracking-wider">
            {task.vehiclePlate}
          </span>
          {task.vehicleModel && (
            <span className="text-xs text-slate-500 truncate">{task.vehicleModel}</span>
          )}
        </div>
      )}

      {/* Title */}
      <h4 className="text-sm font-bold text-slate-800 leading-snug mb-1 group-hover:text-blue-700 transition-colors">
        {task.title}
      </h4>

      {task.description && (
        <p className="text-xs text-slate-500 line-clamp-2 mb-2">{task.description}</p>
      )}

      {/* Interactive Subtask Progress */}
      {totalSubtasks > 0 && (
        <div className="my-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
          <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
            <span className="font-semibold">Checklist de etapas</span>
            <span>
              {completedSubtasks}/{totalSubtasks}
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-2">
            <div
              style={{ width: `${progressPercent}%` }}
              className={`h-full ${progressPercent === 100 ? 'bg-emerald-500' : 'bg-blue-600'} transition-all duration-300`}
            />
          </div>

          <div className="space-y-1 max-h-24 overflow-y-auto">
            {task.checklistItems.map((item) => (
              <div
                key={item.id}
                onClick={() => onToggleSubtask(item.id)}
                className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 hover:text-blue-700 select-none py-0.5"
              >
                {item.completed ? (
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                )}
                <span className={item.completed ? 'line-through text-slate-400 text-[11px]' : 'text-[11px]'}>
                  {item.title}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assignee & Due Date */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-[10px]">
            {task.assignedToName?.charAt(0) || 'O'}
          </div>
          <span className="text-[11px] truncate max-w-[90px]">{task.assignedToName || 'Geral'}</span>
        </div>

        {task.dueDate && (
          <div className={`text-[10px] font-semibold flex items-center gap-1 ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
            <Clock className="w-3 h-3" />
            {new Date(task.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
            {isOverdue && ' (Atrasado!)'}
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between gap-1 pt-2 mt-2 border-t border-slate-100">
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
            title="Editar"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
            title="Excluir"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick status advance button */}
        {task.status === 'pendente' && (
          <button
            onClick={() => onStatusChange('em_andamento')}
            className="px-2 py-1 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 text-[10px] font-bold flex items-center gap-1"
          >
            Iniciar <ArrowRight className="w-3 h-3" />
          </button>
        )}
        {task.status === 'em_andamento' && (
          <button
            onClick={() => onStatusChange('concluida')}
            className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[10px] font-bold flex items-center gap-1"
          >
            Concluir <CheckCircle2 className="w-3 h-3" />
          </button>
        )}
        {task.status === 'aguardando_pecas' && (
          <button
            onClick={() => onStatusChange('em_andamento')}
            className="px-2 py-1 rounded-md bg-amber-50 text-amber-700 hover:bg-amber-100 text-[10px] font-bold flex items-center gap-1"
          >
            Retomar <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
