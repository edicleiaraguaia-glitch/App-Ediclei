import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Calendar, User, Wrench, AlertTriangle, Car, Clock, DollarSign } from 'lucide-react';
import { Task, TaskCategory, TaskPriority, TaskStatus, ChecklistSubItem } from '../types';
import { useTasks } from '../context/TaskContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  taskToEdit?: Task | null;
}

export const TaskModal: React.FC<Props> = ({ isOpen, onClose, taskToEdit }) => {
  const { addTask, updateTask, clients, vehicles } = useTasks();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('funilaria');
  const [priority, setPriority] = useState<TaskPriority>('media');
  const [status, setStatus] = useState<TaskStatus>('pendente');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [assignedToName, setAssignedToName] = useState('Marcos Funileiro');
  const [dueDate, setDueDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState<number>(4);
  const [cost, setCost] = useState<number>(350);
  const [notes, setNotes] = useState('');
  const [checklistItems, setChecklistItems] = useState<ChecklistSubItem[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || '');
      setCategory(taskToEdit.category);
      setPriority(taskToEdit.priority);
      setStatus(taskToEdit.status);
      setClientName(taskToEdit.clientName || '');
      setClientPhone(taskToEdit.clientPhone || '');
      setVehiclePlate(taskToEdit.vehiclePlate || '');
      setVehicleModel(taskToEdit.vehicleModel || '');
      setAssignedToName(taskToEdit.assignedToName || 'Equipe Geral');
      setDueDate(taskToEdit.dueDate ? taskToEdit.dueDate.substring(0, 10) : '');
      setEstimatedHours(taskToEdit.estimatedHours || 0);
      setCost(taskToEdit.cost || 0);
      setNotes(taskToEdit.notes || '');
      setChecklistItems(taskToEdit.checklistItems || []);
    } else {
      // Defaults for a new task
      setTitle('');
      setDescription('');
      setCategory('funilaria');
      setPriority('media');
      setStatus('pendente');
      setClientName('');
      setClientPhone('');
      setVehiclePlate('');
      setVehicleModel('');
      setAssignedToName('Marcos Funileiro');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);
      setDueDate(tomorrow.toISOString().substring(0, 10));
      setEstimatedHours(4);
      setCost(350);
      setNotes('');
      setChecklistItems([
        { id: 'sub_1', title: 'Inspeção inicial da peça', completed: false },
        { id: 'sub_2', title: 'Execução do reparo', completed: false },
        { id: 'sub_3', title: 'Acabamento e conferência', completed: false },
      ]);
    }
  }, [taskToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    setChecklistItems([
      ...checklistItems,
      {
        id: 'sub_' + Date.now(),
        title: newSubtaskTitle.trim(),
        completed: false,
      },
    ]);
    setNewSubtaskTitle('');
  };

  const handleRemoveSubtask = (id: string) => {
    setChecklistItems(checklistItems.filter((item) => item.id !== id));
  };

  const handleClientSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cid = e.target.value;
    const cl = clients.find((c) => c.id === cid);
    if (cl) {
      setClientName(cl.nome);
      setClientPhone(cl.tel);
      const veic = vehicles.find((v) => v.clienteId === cl.id);
      if (veic) {
        setVehiclePlate(veic.placa);
        setVehicleModel(`${veic.marca} ${veic.modelo}`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (taskToEdit) {
      await updateTask(taskToEdit.id, {
        title,
        description,
        category,
        priority,
        status,
        clientName,
        clientPhone,
        vehiclePlate: vehiclePlate.toUpperCase(),
        vehicleModel,
        assignedToName,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        estimatedHours,
        cost,
        notes,
        checklistItems,
      });
    } else {
      await addTask({
        title,
        description,
        category,
        priority,
        status,
        clientName,
        clientPhone,
        vehiclePlate: vehiclePlate.toUpperCase(),
        vehicleModel,
        assignedToName,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        estimatedHours,
        cost,
        notes,
        checklistItems,
        tags: [category, vehiclePlate].filter(Boolean),
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-md">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {taskToEdit ? 'Editar Pendência / Ordem de Serviço' : 'Nova Tarefa & Pendência'}
              </h2>
              <p className="text-xs text-blue-100">Controle de reparo em tempo real</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Título da Tarefa / Pendência *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Desamassar e pintar para-lama dianteiro direito"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
              >
                <option value="funilaria">🔨 Funilaria</option>
                <option value="pintura">🎨 Pintura</option>
                <option value="mecanica">⚙️ Mecânica / Montagem</option>
                <option value="polimento">✨ Polimento / Estética</option>
                <option value="eletrica">⚡ Elétrica</option>
                <option value="inspecao">📋 Vistoria / Checklist</option>
                <option value="orcamento">📄 Orçamento</option>
                <option value="lavagem">🚿 Lavagem Final</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Prioridade
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
              >
                <option value="baixa">🟢 Baixa</option>
                <option value="media">🟡 Média</option>
                <option value="alta">🟠 Alta</option>
                <option value="urgente">🔴 Urgente</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white font-medium"
              >
                <option value="pendente">⏳ Pendente</option>
                <option value="em_andamento">🚀 Em Andamento</option>
                <option value="aguardando_pecas">📦 Aguardando Peças</option>
                <option value="em_revisao">🔍 Em Revisão / CQ</option>
                <option value="concluida">✅ Concluída</option>
              </select>
            </div>
          </div>

          {/* Quick link with clients */}
          {clients.length > 0 && !taskToEdit && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Preencher dados a partir de cliente cadastrado:
              </label>
              <select
                onChange={handleClientSelect}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-700"
              >
                <option value="">Selecione para autopreencher...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome} ({c.tel})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Vehicle and Client info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-blue-600" /> Placa do Veículo
              </label>
              <input
                type="text"
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                placeholder="Ex: ABC-1234 ou BRA-2E19"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 uppercase font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Modelo do Veículo
              </label>
              <input
                type="text"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                placeholder="Ex: VW T-Cross Highline"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" /> Cliente
              </label>
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Nome do cliente"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Telefone / WhatsApp
              </label>
              <input
                type="text"
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" /> Responsável
              </label>
              <select
                value={assignedToName}
                onChange={(e) => setAssignedToName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
              >
                <option value="Marcos Funileiro">Marcos Funileiro</option>
                <option value="Roberto Pintor">Roberto Pintor</option>
                <option value="Lucas Montador">Lucas Montador</option>
                <option value="André Polidor">André Polidor</option>
                <option value="João da Silva (Gerente)">João da Silva (Gerente)</option>
                <option value="Equipe Geral">Equipe Geral</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" /> Prazo de Entrega
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-blue-600" /> Valor Estimado (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={cost}
                onChange={(e) => setCost(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Descrição Técnica
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes dos procedimentos, desmontagem, tintas, especificações..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          {/* Subtasks checklist */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Checklist de Etapas ({checklistItems.filter((i) => i.completed).length}/{checklistItems.length})
              </label>
            </div>

            <div className="space-y-2 mb-3">
              {checklistItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-sm"
                >
                  <span className={item.completed ? 'line-through text-slate-400' : 'text-slate-800'}>
                    {item.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSubtask(item.id)}
                    className="text-slate-400 hover:text-rose-500 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder="Adicionar etapa (Ex: Lixamento 600, Primer PU, Desmontagem...)"
                className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar
              </button>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 shadow-md shadow-blue-700/20 transition-all"
            >
              {taskToEdit ? 'Salvar Alterações' : 'Criar Pendência'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
