import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { Task, Client, Vehicle, Budget, ServiceItem, WorkshopConfig, ActivityLog, Checklist, TaskStatus, TaskPriority, TaskCategory } from '../types';
import { StorageService } from '../lib/storage';
import { getSupabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface Stats {
  total: number;
  pendentes: number;
  emAndamento: number;
  aguardandoPecas: number;
  emRevisao: number;
  concluidas: number;
  taxaConclusao: number;
  urgentes: number;
  atrasadas: number;
  porCategoria: Record<TaskCategory, number>;
  porPrioridade: Record<TaskPriority, number>;
}

interface TaskContextType {
  tasks: Task[];
  clients: Client[];
  vehicles: Vehicle[];
  budgets: Budget[];
  services: ServiceItem[];
  config: WorkshopConfig;
  activities: ActivityLog[];
  stats: Stats;
  isRealtimeActive: boolean;
  lastUpdated: Date;

  // Task Actions
  addTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  updateTaskStatus: (id: string, status: TaskStatus) => Promise<void>;
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  generateTasksFromChecklist: (checklist: Checklist, client: Client, vehicle: Vehicle) => Promise<number>;

  // Entity Actions
  addClient: (clientData: Omit<Client, 'id' | 'createdAt'>) => Client;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  addVehicle: (vehicleData: Omit<Vehicle, 'id'>) => Vehicle;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;

  saveBudget: (budget: Budget) => void;
  deleteBudget: (id: string) => void;
  updateBudgetStatus: (id: string, status: Budget['status']) => void;

  saveServices: (services: ServiceItem[]) => void;
  saveConfig: (config: WorkshopConfig) => void;
  refreshData: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>(() => StorageService.getTasks());
  const [clients, setClients] = useState<Client[]>(() => StorageService.getClients());
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => StorageService.getVehicles());
  const [budgets, setBudgets] = useState<Budget[]>(() => StorageService.getBudgets());
  const [services, setServices] = useState<ServiceItem[]>(() => StorageService.getServices());
  const [config, setConfig] = useState<WorkshopConfig>(() => StorageService.getConfig());
  const [activities, setActivities] = useState<ActivityLog[]>(() => StorageService.getActivities());
  const [isRealtimeActive, setIsRealtimeActive] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const reloadFromLocal = useCallback(() => {
    setTasks(StorageService.getTasks());
    setClients(StorageService.getClients());
    setVehicles(StorageService.getVehicles());
    setBudgets(StorageService.getBudgets());
    setServices(StorageService.getServices());
    setConfig(StorageService.getConfig());
    setActivities(StorageService.getActivities());
    setLastUpdated(new Date());
  }, []);

  // Sync with Supabase on mount and establish real-time subscription
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      // Local realtime simulation
      setIsRealtimeActive(true);
      return;
    }

    // Initial fetch from Supabase if available
    const fetchRemote = async () => {
      try {
        const { data: remoteTasks, error: taskErr } = await supabase.from('tasks').select('*');
        if (!taskErr && remoteTasks && remoteTasks.length > 0) {
          const mapped: Task[] = remoteTasks.map((r: any) => ({
            id: r.id,
            title: r.title,
            description: r.description,
            category: r.category,
            priority: r.priority,
            status: r.status,
            clientName: r.client_name,
            clientPhone: r.client_phone,
            vehiclePlate: r.vehicle_plate,
            vehicleModel: r.vehicle_model,
            assignedTo: r.assigned_to,
            assignedToName: r.assigned_to_name,
            assignedAvatar: r.assigned_avatar,
            dueDate: r.due_date,
            checklistItems: r.checklist_items || [],
            estimatedHours: Number(r.estimated_hours || 0),
            actualHours: Number(r.actual_hours || 0),
            cost: Number(r.cost || 0),
            tags: r.tags || [],
            notes: r.notes,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
            completedAt: r.completed_at,
          }));
          setTasks(mapped);
          StorageService.saveTasks(mapped);
        }

        const { data: remoteClients } = await supabase.from('clients').select('*');
        if (remoteClients && remoteClients.length > 0) {
          setClients(remoteClients);
        }
      } catch (err) {
        console.warn('Supabase fetchRemote err:', err);
      }
    };

    fetchRemote();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('tasks_realtime_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
        console.log('Realtime change received from Supabase:', payload);
        fetchRemote();
        setLastUpdated(new Date());
      })
      .subscribe((status) => {
        setIsRealtimeActive(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Listen to cross-window or local storage updates
  useEffect(() => {
    const handleStorageUpdate = () => {
      reloadFromLocal();
    };
    window.addEventListener('oficina_storage_update', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);
    return () => {
      window.removeEventListener('oficina_storage_update', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, [reloadFromLocal]);

  // Derived Realtime Statistics
  const stats: Stats = useMemo(() => {
    const total = tasks.length;
    let pendentes = 0;
    let emAndamento = 0;
    let aguardandoPecas = 0;
    let emRevisao = 0;
    let concluidas = 0;
    let urgentes = 0;
    let atrasadas = 0;
    const now = new Date();

    const porCategoria: Record<TaskCategory, number> = {
      funilaria: 0,
      pintura: 0,
      mecanica: 0,
      eletrica: 0,
      polimento: 0,
      orcamento: 0,
      inspecao: 0,
      lavagem: 0,
    };

    const porPrioridade: Record<TaskPriority, number> = {
      baixa: 0,
      media: 0,
      alta: 0,
      urgente: 0,
    };

    tasks.forEach(t => {
      if (t.status === 'pendente') pendentes++;
      else if (t.status === 'em_andamento') emAndamento++;
      else if (t.status === 'aguardando_pecas') aguardandoPecas++;
      else if (t.status === 'em_revisao') emRevisao++;
      else if (t.status === 'concluida') concluidas++;

      if (t.priority === 'urgente' || t.priority === 'alta') urgentes++;
      if (porPrioridade[t.priority] !== undefined) porPrioridade[t.priority]++;
      if (porCategoria[t.category] !== undefined) porCategoria[t.category]++;

      // Check if overdue
      if (t.dueDate && t.status !== 'concluida') {
        const due = new Date(t.dueDate);
        if (due < now) atrasadas++;
      }
    });

    const taxaConclusao = total > 0 ? Math.round((concluidas / total) * 100) : 0;

    return {
      total,
      pendentes,
      emAndamento,
      aguardandoPecas,
      emRevisao,
      concluidas,
      taxaConclusao,
      urgentes,
      atrasadas,
      porCategoria,
      porPrioridade,
    };
  }, [tasks]);

  // Task Operations
  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> => {
    const newTask: Task = {
      ...taskData,
      id: 'tsk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [newTask, ...tasks];
    setTasks(updated);
    await StorageService.saveTasks(updated);

    StorageService.addActivity({
      taskId: newTask.id,
      taskTitle: newTask.title,
      userName: user?.name || 'Oficina',
      action: `criou a tarefa/pendência (${newTask.vehiclePlate ? `Placa ${newTask.vehiclePlate}` : newTask.category})`,
      type: 'create',
    });
    setActivities(StorageService.getActivities());
    setLastUpdated(new Date());

    return newTask;
  };

  const updateTask = async (id: string, updates: Partial<Task>): Promise<void> => {
    const updated = tasks.map(t => {
      if (t.id === id) {
        return {
          ...t,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
      }
      return t;
    });

    setTasks(updated);
    await StorageService.saveTasks(updated);
    setLastUpdated(new Date());
  };

  const updateTaskStatus = async (id: string, status: TaskStatus): Promise<void> => {
    const target = tasks.find(t => t.id === id);
    if (!target) return;

    const isCompleting = status === 'concluida';
    const nowIso = new Date().toISOString();

    const updated = tasks.map(t => {
      if (t.id === id) {
        return {
          ...t,
          status,
          updatedAt: nowIso,
          completedAt: isCompleting ? nowIso : t.completedAt,
        };
      }
      return t;
    });

    setTasks(updated);
    await StorageService.saveTasks(updated);

    // Confetti celebration if completed!
    if (isCompleting) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10B981', '#3B82F6', '#F59E0B', '#6366F1'],
        });
      } catch (err) {
        console.log(err);
      }
    }

    const statusLabels: Record<TaskStatus, string> = {
      pendente: 'Pendente',
      em_andamento: 'Em Andamento',
      aguardando_pecas: 'Aguardando Peças',
      em_revisao: 'Em Revisão',
      concluida: 'Concluída 🎉',
    };

    StorageService.addActivity({
      taskId: target.id,
      taskTitle: target.title,
      userName: user?.name || 'Membro da equipe',
      action: `mudou status para "${statusLabels[status]}"`,
      type: isCompleting ? 'complete' : 'status_change',
    });
    setActivities(StorageService.getActivities());
    setLastUpdated(new Date());
  };

  const toggleSubtask = async (taskId: string, subtaskId: string): Promise<void> => {
    const target = tasks.find(t => t.id === taskId);
    if (!target) return;

    let toggledItemTitle = '';
    let isNowCompleted = false;

    const updatedItems = target.checklistItems.map(item => {
      if (item.id === subtaskId) {
        toggledItemTitle = item.title;
        isNowCompleted = !item.completed;
        return {
          ...item,
          completed: !item.completed,
          completedAt: !item.completed ? new Date().toISOString() : undefined,
        };
      }
      return item;
    });

    // Check if all subtasks are now completed
    const allCompleted = updatedItems.length > 0 && updatedItems.every(i => i.completed);
    const newStatus: TaskStatus = allCompleted ? 'concluida' : target.status === 'concluida' ? 'em_andamento' : target.status;

    const updated: Task[] = tasks.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          checklistItems: updatedItems,
          status: newStatus,
          updatedAt: new Date().toISOString(),
          completedAt: allCompleted ? new Date().toISOString() : t.completedAt,
        };
      }
      return t;
    });

    setTasks(updated);
    await StorageService.saveTasks(updated);

    if (allCompleted) {
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch {}
    }

    StorageService.addActivity({
      taskId: target.id,
      taskTitle: target.title,
      userName: user?.name || 'Operador',
      action: `${isNowCompleted ? 'concluiu' : 'reabriu'} o item "${toggledItemTitle}"`,
      type: 'checklist',
    });
    setActivities(StorageService.getActivities());
    setLastUpdated(new Date());
  };

  const deleteTask = async (id: string): Promise<void> => {
    const target = tasks.find(t => t.id === id);
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    await StorageService.saveTasks(updated);

    if (target) {
      StorageService.addActivity({
        taskTitle: target.title,
        userName: user?.name || 'Operador',
        action: `excluiu a tarefa`,
        type: 'status_change',
      });
      setActivities(StorageService.getActivities());
    }
    setLastUpdated(new Date());
  };

  const generateTasksFromChecklist = async (checklist: Checklist, client: Client, vehicle: Vehicle): Promise<number> => {
    let createdCount = 0;
    const newTasks: Task[] = [];

    // For every damaged part with services or status != 'Sem avaria'
    checklist.itensCarroceria.forEach((item) => {
      if (item.status !== 'Sem avaria' || item.servicos.length > 0) {
        const subtasks = item.servicos.map((s, idx) => ({
          id: `gen_sub_${idx}_${Date.now()}`,
          title: `${s.nome} (${s.qtd}x)`,
          completed: false,
        }));

        const isPintura = item.status.toLowerCase().includes('pintura') || item.servicos.some(s => s.nome.toLowerCase().includes('pintura'));
        const category: TaskCategory = isPintura ? 'pintura' : 'funilaria';

        const task: Task = {
          id: 'tsk_ck_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          title: `${item.nome} - ${item.status}`,
          description: item.observacao || `Dano constatado na peça ${item.nome} durante vistoria inicial.`,
          category,
          priority: item.status.includes('troca') ? 'alta' : 'media',
          status: 'pendente',
          clientName: client.nome,
          clientPhone: client.tel,
          vehiclePlate: vehicle.placa,
          vehicleModel: `${vehicle.marca} ${vehicle.modelo}`,
          dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
          checklistItems: subtasks.length > 0 ? subtasks : [{ id: 'sub_default', title: `Reparar avaria em ${item.nome}`, completed: false }],
          cost: item.servicos.reduce((acc, curr) => acc + (curr.qtd * curr.valor), 0),
          photos: item.fotos,
          tags: ['Vistoria', vehicle.placa, item.nome],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        newTasks.push(task);
        createdCount++;
      }
    });

    if (newTasks.length > 0) {
      const allUpdated = [...newTasks, ...tasks];
      setTasks(allUpdated);
      await StorageService.saveTasks(allUpdated);

      StorageService.addActivity({
        userName: user?.name || 'Vistoriador',
        action: `gerou ${newTasks.length} nova(s) pendência(s) a partir do Checklist do veículo ${vehicle.placa}`,
        type: 'create',
      });
      setActivities(StorageService.getActivities());
      setLastUpdated(new Date());
    }

    return createdCount;
  };

  // Client Operations
  const addClient = (clientData: Omit<Client, 'id' | 'createdAt'>): Client => {
    const newClient: Client = {
      ...clientData,
      id: 'c_' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    const updated = [newClient, ...clients];
    setClients(updated);
    StorageService.saveClients(updated);
    return newClient;
  };

  const updateClient = (id: string, updates: Partial<Client>) => {
    const updated = clients.map(c => (c.id === id ? { ...c, ...updates } : c));
    setClients(updated);
    StorageService.saveClients(updated);
  };

  const deleteClient = (id: string) => {
    const updated = clients.filter(c => c.id !== id);
    setClients(updated);
    StorageService.saveClients(updated);
  };

  // Vehicle Operations
  const addVehicle = (vehicleData: Omit<Vehicle, 'id'>): Vehicle => {
    const newVehicle: Vehicle = {
      ...vehicleData,
      id: 'v_' + Date.now(),
    };
    const updated = [newVehicle, ...vehicles];
    setVehicles(updated);
    StorageService.saveVehicles(updated);
    return newVehicle;
  };

  const updateVehicle = (id: string, updates: Partial<Vehicle>) => {
    const updated = vehicles.map(v => (v.id === id ? { ...v, ...updates } : v));
    setVehicles(updated);
    StorageService.saveVehicles(updated);
  };

  const deleteVehicle = (id: string) => {
    const updated = vehicles.filter(v => v.id !== id);
    setVehicles(updated);
    StorageService.saveVehicles(updated);
  };

  // Budget Operations
  const saveBudget = (budget: Budget) => {
    const exists = budgets.find(b => b.id === budget.id);
    let updated: Budget[];
    if (exists) {
      updated = budgets.map(b => (b.id === budget.id ? budget : b));
    } else {
      updated = [budget, ...budgets];
    }
    setBudgets(updated);
    StorageService.saveBudgets(updated);
  };

  const deleteBudget = (id: string) => {
    const updated = budgets.filter(b => b.id !== id);
    setBudgets(updated);
    StorageService.saveBudgets(updated);
  };

  const updateBudgetStatus = (id: string, status: Budget['status']) => {
    const updated = budgets.map(b => (b.id === id ? { ...b, status } : b));
    setBudgets(updated);
    StorageService.saveBudgets(updated);
  };

  // Services Operations
  const saveServices = (newServices: ServiceItem[]) => {
    setServices(newServices);
    StorageService.saveServices(newServices);
  };

  // Config Operations
  const saveConfig = (newConfig: WorkshopConfig) => {
    setConfig(newConfig);
    StorageService.saveConfig(newConfig);
  };

  const refreshData = async () => {
    reloadFromLocal();
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        clients,
        vehicles,
        budgets,
        services,
        config,
        activities,
        stats,
        isRealtimeActive,
        lastUpdated,
        addTask,
        updateTask,
        deleteTask,
        updateTaskStatus,
        toggleSubtask,
        generateTasksFromChecklist,
        addClient,
        updateClient,
        deleteClient,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        saveBudget,
        deleteBudget,
        updateBudgetStatus,
        saveServices,
        saveConfig,
        refreshData,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTasks deve ser usado dentro de TaskProvider');
  }
  return context;
};
