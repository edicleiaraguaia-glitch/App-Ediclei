import { Task, Client, Vehicle, Budget, ServiceItem, WorkshopConfig, ActivityLog, Checklist } from '../types';
import { getSupabase } from './supabase';

const KEYS = {
  TASKS: 'oficina_tasks_v2',
  CLIENTS: 'oficina_clientes_v2',
  VEHICLES: 'oficina_veiculos_v2',
  CHECKLISTS: 'oficina_checklists_v2',
  BUDGETS: 'oficina_orcamentos_v2',
  SERVICES: 'oficina_servicos_v2',
  CONFIG: 'oficina_config_v2',
  ACTIVITIES: 'oficina_activities_v2',
};

// Seed initial data
const INITIAL_SERVICES: ServiceItem[] = [
  { id: '1', nome: 'Martelinho de ouro', preco: 180, categoria: 'funilaria' },
  { id: '2', nome: 'Pintura de peça (Para-choque/Porta)', preco: 450, categoria: 'pintura' },
  { id: '3', nome: 'Polimento técnico e cristalização', preco: 350, categoria: 'polimento' },
  { id: '4', nome: 'Recuperação de para-choque trincado', preco: 250, categoria: 'funilaria' },
  { id: '5', nome: 'Alinhamento de monobloco e frente', preco: 600, categoria: 'funilaria' },
  { id: '6', nome: 'Pintura capô / teto', preco: 580, categoria: 'pintura' },
  { id: '7', nome: 'Troca de farol e alinhamento', preco: 120, categoria: 'mecanica' },
  { id: '8', nome: 'Higienização e lavagem detalhada', preco: 150, categoria: 'lavagem' },
];

const INITIAL_CLIENTS: Client[] = [
  {
    id: 'c1',
    nome: 'Carlos Eduardo Silva',
    doc: '123.456.789-00',
    tel: '(11) 98765-4321',
    email: 'carlos.silva@email.com',
    end: 'Av. Paulista, 1500 - Bela Vista, São Paulo/SP',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'c2',
    nome: 'Mariana Santos Oliveira',
    doc: '987.654.321-99',
    tel: '(11) 97123-9988',
    email: 'mariana.santos@email.com',
    end: 'Rua Vergueiro, 890 - Vila Mariana, São Paulo/SP',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'c3',
    nome: 'Transportes & Logística Rocha ME',
    doc: '12.345.678/0001-90',
    tel: '(11) 99888-2233',
    email: 'frota@transprocha.com.br',
    end: 'Rua das Indústrias, 440 - Lapa, São Paulo/SP',
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
];

const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 'v1',
    clienteId: 'c1',
    placa: 'BRA-2E19',
    marca: 'Volkswagen',
    modelo: 'T-Cross Highline',
    ano: '2022',
    cor: 'Prata Pyrit',
    km: '42.500',
  },
  {
    id: 'v2',
    clienteId: 'c2',
    placa: 'FGH-9A82',
    marca: 'Jeep',
    modelo: 'Compass Longitude',
    ano: '2021',
    cor: 'Preto Carbon',
    km: '58.000',
  },
  {
    id: 'v3',
    clienteId: 'c3',
    placa: 'RTY-3344',
    marca: 'Fiat',
    modelo: 'Strada Freedom CD',
    ano: '2023',
    cor: 'Branco Banchisa',
    km: '31.200',
  },
];

const INITIAL_TASKS: Task[] = [
  {
    id: 't1',
    title: 'Funilaria e Reparo Porta Dianteira Esquerda',
    description: 'Desamassado de impacto lateral médio e alinhamento de vinco com martelinho e repuxadeira.',
    category: 'funilaria',
    priority: 'alta',
    status: 'em_andamento',
    clientName: 'Carlos Eduardo Silva',
    clientPhone: '(11) 98765-4321',
    vehiclePlate: 'BRA-2E19',
    vehicleModel: 'VW T-Cross',
    assignedTo: 'funileiro_1',
    assignedToName: 'Marcos Funileiro',
    assignedAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=faces',
    dueDate: new Date(Date.now() + 86400000 * 1).toISOString(),
    checklistItems: [
      { id: 'sub-1', title: 'Desmontagem da forração interna da porta', completed: true, completedAt: new Date(Date.now() - 3600000 * 4).toISOString() },
      { id: 'sub-2', title: 'Repuxo e correção da folha externa', completed: true, completedAt: new Date(Date.now() - 3600000 * 2).toISOString() },
      { id: 'sub-3', title: 'Aplicação de massa poliéster e lixamento a seco', completed: false },
      { id: 'sub-4', title: 'Envio para cabine de pintura', completed: false },
    ],
    estimatedHours: 6,
    actualHours: 3.5,
    cost: 450,
    tags: ['Lateral', 'Porta', 'Martelinho'],
    notes: 'Atenção aos sensores de fechamento na desmontagem.',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 't2',
    title: 'Pintura Completa do Para-choque Dianteiro e Capô',
    description: 'Preparação com primer PU, tinta poliéster Prata Pyrit e verniz alto sólidos com secagem em estufa.',
    category: 'pintura',
    priority: 'urgente',
    status: 'pendente',
    clientName: 'Carlos Eduardo Silva',
    clientPhone: '(11) 98765-4321',
    vehiclePlate: 'BRA-2E19',
    vehicleModel: 'VW T-Cross',
    assignedTo: 'pintor_1',
    assignedToName: 'Roberto Pintor',
    assignedAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&h=100&fit=crop&crop=faces',
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    checklistItems: [
      { id: 'sub-201', title: 'Mascaramento e proteção do cofre e faróis', completed: false },
      { id: 'sub-202', title: 'Acerto de cor na balança e teste em chapa', completed: false },
      { id: 'sub-203', title: 'Aplicação de base poliéster (3 demãos)', completed: false },
      { id: 'sub-204', title: 'Verniz HS e secagem 60°C por 45min', completed: false },
    ],
    estimatedHours: 8,
    cost: 1030,
    tags: ['Cabine', 'Estufa', 'Prata'],
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 't3',
    title: 'Troca de Grade Frontal e Farol Direito',
    description: 'Aguardando chegada da peça original da concessionária para montagem final.',
    category: 'mecanica',
    priority: 'alta',
    status: 'aguardando_pecas',
    clientName: 'Mariana Santos Oliveira',
    clientPhone: '(11) 97123-9988',
    vehiclePlate: 'FGH-9A82',
    vehicleModel: 'Jeep Compass',
    assignedTo: 'mecanico_1',
    assignedToName: 'Lucas Montador',
    assignedAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces',
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
    checklistItems: [
      { id: 'sub-301', title: 'Pedido de peças registrado junto ao fornecedor', completed: true },
      { id: 'sub-302', title: 'Conferência física das presilhas e farol na entrega', completed: false },
      { id: 'sub-303', title: 'Instalação elétrica e alinhamento de foco', completed: false },
    ],
    estimatedHours: 4,
    cost: 890,
    tags: ['Peças', 'Fornecedor', 'Farol'],
    notes: 'Previsão de entrega da distribuidora para amanhã às 14h.',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 't4',
    title: 'Polimento Técnico Comercial & Espelhamento',
    description: 'Etapa de corte, refino e lustro para entrega do veículo.',
    category: 'polimento',
    priority: 'media',
    status: 'em_revisao',
    clientName: 'Transportes Rocha ME',
    clientPhone: '(11) 99888-2233',
    vehiclePlate: 'RTY-3344',
    vehicleModel: 'Fiat Strada',
    assignedTo: 'detalhe_1',
    assignedToName: 'André Polidor',
    assignedAvatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&h=100&fit=crop&crop=faces',
    dueDate: new Date(Date.now() + 86400000 * 1).toISOString(),
    checklistItems: [
      { id: 'sub-401', title: 'Descontaminação de pintura com clay bar', completed: true },
      { id: 'sub-402', title: 'Corte com boina de lã e composto polidor', completed: true },
      { id: 'sub-403', title: 'Lustro anti-holograma e selante sintético', completed: true },
      { id: 'sub-404', title: 'Inspeção com lanterna de controle de cor', completed: false },
    ],
    estimatedHours: 5,
    cost: 380,
    tags: ['Estética', 'Entrega'],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 't5',
    title: 'Vistoria e Checklist de Entrada - Danos de Granizo',
    description: 'Mapeamento das peças avariadas no teto e capô para aprovação do cliente.',
    category: 'inspecao',
    priority: 'baixa',
    status: 'concluida',
    clientName: 'Mariana Santos Oliveira',
    clientPhone: '(11) 97123-9988',
    vehiclePlate: 'FGH-9A82',
    vehicleModel: 'Jeep Compass',
    assignedTo: 'admin',
    assignedToName: 'João da Oficina (Gerente)',
    dueDate: new Date(Date.now() - 86400000 * 1).toISOString(),
    checklistItems: [
      { id: 'sub-501', title: 'Fotos 360° do veículo e iluminação difusa', completed: true },
      { id: 'sub-502', title: 'Marcação do número de mossas no teto (14 pontos)', completed: true },
      { id: 'sub-503', title: 'Envio do orçamento em PDF ao cliente via WhatsApp', completed: true },
    ],
    estimatedHours: 2,
    actualHours: 1.5,
    cost: 0,
    tags: ['Vistoria', 'Checklist'],
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    completedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
];

const INITIAL_ACTIVITIES: ActivityLog[] = [
  {
    id: 'act-1',
    taskId: 't1',
    taskTitle: 'Funilaria e Reparo Porta Dianteira Esquerda',
    userName: 'Marcos Funileiro',
    action: 'concluiu o subitem "Repuxo e correção da folha externa"',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    type: 'checklist',
  },
  {
    id: 'act-2',
    taskId: 't4',
    taskTitle: 'Polimento Técnico Comercial & Espelhamento',
    userName: 'André Polidor',
    action: 'avançou status para "Em Revisão / Controle de Qualidade"',
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
    type: 'status_change',
  },
  {
    id: 'act-3',
    taskId: 't3',
    taskTitle: 'Troca de Grade Frontal e Farol Direito',
    userName: 'Lucas Montador',
    action: 'alterou status para "Aguardando Peças"',
    timestamp: new Date(Date.now() - 3600000 * 7).toISOString(),
    type: 'status_change',
  },
  {
    id: 'act-4',
    taskId: 't5',
    taskTitle: 'Vistoria e Checklist de Entrada',
    userName: 'João da Oficina',
    action: 'marcou como CONCLUÍDA 🎉',
    timestamp: new Date(Date.now() - 86400000 * 1).toISOString(),
    type: 'complete',
  },
];

const INITIAL_CONFIG: WorkshopConfig = {
  nome: 'Oficina Evaldo Pinturas',
  cnpj: '34.890.123/0001-45',
  tel: '(11) 99876-5432',
  end: 'Av. Principal, 1000 - Centro',
  validade: 15,
  pagto: 'Pix, Cartão de Crédito até 6x, Boleto Bancário e Faturamento para Frotistas',
};

// ==========================================
// DB <-> APP MAPPERS (SNAKE_CASE <-> CAMELCASE)
// ==========================================
export function taskToDb(t: Task) {
  const safeDate = (val?: string | null) => {
    if (!val || typeof val !== 'string' || !val.trim()) return null;
    try {
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d.toISOString();
    } catch {
      return null;
    }
  };

  return {
    id: t.id,
    title: t.title,
    description: t.description || null,
    category: t.category,
    priority: t.priority,
    status: t.status,
    client_name: t.clientName || null,
    client_phone: t.clientPhone || null,
    vehicle_plate: t.vehiclePlate || null,
    vehicle_model: t.vehicleModel || null,
    assigned_to: t.assignedTo || null,
    assigned_to_name: t.assignedToName || null,
    assigned_avatar: t.assignedAvatar || null,
    due_date: safeDate(t.dueDate),
    checklist_items: t.checklistItems || [],
    estimated_hours: Number(t.estimatedHours || 0),
    actual_hours: Number(t.actualHours || 0),
    cost: Number(t.cost || 0),
    tags: t.tags || [],
    notes: t.notes || null,
    photos: t.photos || [],
    created_at: safeDate(t.createdAt) || new Date().toISOString(),
    updated_at: safeDate(t.updatedAt) || new Date().toISOString(),
    completed_at: safeDate(t.completedAt),
  };
}

export function dbToTask(r: any): Task {
  return {
    id: r.id,
    title: r.title,
    description: r.description || undefined,
    category: r.category || 'funilaria',
    priority: r.priority || 'media',
    status: r.status || 'pendente',
    clientName: r.client_name || undefined,
    clientPhone: r.client_phone || undefined,
    vehiclePlate: r.vehicle_plate || undefined,
    vehicleModel: r.vehicle_model || undefined,
    assignedTo: r.assigned_to || undefined,
    assignedToName: r.assigned_to_name || undefined,
    assignedAvatar: r.assigned_avatar || undefined,
    dueDate: r.due_date || undefined,
    checklistItems: Array.isArray(r.checklist_items) ? r.checklist_items : [],
    estimatedHours: Number(r.estimated_hours || 0),
    actualHours: Number(r.actual_hours || 0),
    cost: Number(r.cost || 0),
    tags: Array.isArray(r.tags) ? r.tags : [],
    notes: r.notes || undefined,
    photos: Array.isArray(r.photos) ? r.photos : [],
    createdAt: r.created_at || new Date().toISOString(),
    updatedAt: r.updated_at || new Date().toISOString(),
    completedAt: r.completed_at || undefined,
  };
}

export function clientToDb(c: Client) {
  return {
    id: c.id,
    nome: c.nome,
    doc: c.doc || null,
    tel: c.tel,
    email: c.email || null,
    end: c.end || null,
    created_at: c.createdAt || new Date().toISOString(),
  };
}

export function dbToClient(r: any): Client {
  return {
    id: r.id,
    nome: r.nome,
    doc: r.doc || undefined,
    tel: r.tel || '',
    email: r.email || undefined,
    end: r.end || undefined,
    createdAt: r.created_at || new Date().toISOString(),
  };
}

export function vehicleToDb(v: Vehicle) {
  return {
    id: v.id,
    cliente_id: v.clienteId,
    placa: v.placa,
    marca: v.marca,
    modelo: v.modelo,
    ano: v.ano || null,
    cor: v.cor || null,
    km: v.km || null,
  };
}

export function dbToVehicle(r: any): Vehicle {
  return {
    id: r.id,
    clienteId: r.cliente_id || '',
    placa: r.placa,
    marca: r.marca,
    modelo: r.modelo,
    ano: r.ano || undefined,
    cor: r.cor || undefined,
    km: r.km || undefined,
  };
}

export function budgetToDb(b: Budget) {
  let safeData = new Date().toISOString();
  if (b.data && typeof b.data === 'string' && b.data.trim()) {
    try {
      const d = new Date(b.data);
      if (!isNaN(d.getTime())) {
        safeData = d.toISOString();
      }
    } catch {}
  }

  return {
    id: b.id,
    numero: b.numero,
    cliente_id: b.clienteId,
    veiculo_id: b.veiculoId,
    checklist_id: b.checklistId || null,
    data: safeData,
    subtotal: Number(b.subtotal || 0),
    desconto: Number(b.desconto || 0),
    total: Number(b.total || 0),
    status: b.status || 'rascunho',
    itens: b.itens || [],
    fotos: b.fotos || [],
  };
}

export function dbToBudget(r: any): Budget {
  return {
    id: r.id,
    numero: Number(r.numero || 1),
    clienteId: r.cliente_id || '',
    veiculoId: r.veiculo_id || '',
    checklistId: r.checklist_id || undefined,
    data: r.data || new Date().toISOString(),
    subtotal: Number(r.subtotal || 0),
    desconto: Number(r.desconto || 0),
    total: Number(r.total || 0),
    status: r.status || 'rascunho',
    itens: Array.isArray(r.itens) ? r.itens : [],
    fotos: Array.isArray(r.fotos) ? r.fotos : [],
  };
}

export function configToDb(cfg: WorkshopConfig) {
  return {
    id: 'config_default',
    nome: cfg.nome || 'Oficina Evaldo Pinturas',
    cnpj: cfg.cnpj || null,
    tel: cfg.tel || null,
    end: cfg.end || null,
    logo: cfg.logo || null,
    validade: cfg.validade || 15,
    pagto: cfg.pagto || null,
    updated_at: new Date().toISOString(),
  };
}

export function dbToConfig(r: any): WorkshopConfig {
  return {
    nome: r.nome || 'Oficina Evaldo Pinturas',
    cnpj: r.cnpj || '',
    tel: r.tel || '',
    end: r.end || '',
    logo: r.logo || undefined,
    validade: Number(r.validade || 15),
    pagto: r.pagto || '',
  };
}

// Storage Helpers
function getLocal<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    const parsed = JSON.parse(raw);
    // If it's config and still has old generic default name, upgrade to Oficina Evaldo Pinturas
    if (key === KEYS.CONFIG && parsed && parsed.nome === 'Oficina Master Auto Center') {
      parsed.nome = 'Oficina Evaldo Pinturas';
      localStorage.setItem(key, JSON.stringify(parsed));
    }
    return parsed;
  } catch (err) {
    console.error(`Erro ao ler localStorage ${key}:`, err);
    return defaultValue;
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    // Broadcast event across components and tabs
    window.dispatchEvent(new CustomEvent('oficina_storage_update', { detail: { key } }));
  } catch (err) {
    console.error(`Erro ao salvar localStorage ${key}:`, err);
  }
}

export const StorageService = {
  // Tasks
  getTasks(): Task[] {
    return getLocal<Task[]>(KEYS.TASKS, INITIAL_TASKS);
  },

  saveTasksLocally(tasks: Task[]): void {
    setLocal(KEYS.TASKS, tasks);
  },

  async saveTasks(tasks: Task[]): Promise<{ success: boolean; error?: string }> {
    setLocal(KEYS.TASKS, tasks);

    // Sync to Supabase if connected
    const supabase = getSupabase();
    if (supabase) {
      try {
        const formatted = tasks.map(taskToDb);
        const { error } = await supabase.from('tasks').upsert(formatted);
        if (error) {
          console.error('Erro ao sincronizar tarefas no Supabase:', error);
          return { success: false, error: `[${error.code}] ${error.message}` };
        }
        return { success: true };
      } catch (err: any) {
        console.error('Falha de rede ao sincronizar tarefas:', err);
        return { success: false, error: err.message };
      }
    }
    return { success: true };
  },

  // Clients
  getClients(): Client[] {
    return getLocal<Client[]>(KEYS.CLIENTS, INITIAL_CLIENTS);
  },

  saveClientsLocally(clients: Client[]): void {
    setLocal(KEYS.CLIENTS, clients);
  },

  async saveClients(clients: Client[]): Promise<{ success: boolean; error?: string }> {
    setLocal(KEYS.CLIENTS, clients);
    const supabase = getSupabase();
    if (supabase) {
      try {
        const formatted = clients.map(clientToDb);
        const { error } = await supabase.from('clients').upsert(formatted);
        if (error) {
          console.error('Erro ao sincronizar clientes no Supabase:', error);
          return { success: false, error: error.message };
        }
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }
    return { success: true };
  },

  // Vehicles
  getVehicles(): Vehicle[] {
    return getLocal<Vehicle[]>(KEYS.VEHICLES, INITIAL_VEHICLES);
  },

  saveVehiclesLocally(vehicles: Vehicle[]): void {
    setLocal(KEYS.VEHICLES, vehicles);
  },

  async saveVehicles(vehicles: Vehicle[]): Promise<{ success: boolean; error?: string }> {
    setLocal(KEYS.VEHICLES, vehicles);
    const supabase = getSupabase();
    if (supabase) {
      try {
        const formatted = vehicles.map(vehicleToDb);
        const { error } = await supabase.from('vehicles').upsert(formatted);
        if (error) {
          console.error('Erro ao sincronizar veículos no Supabase:', error);
          return { success: false, error: error.message };
        }
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }
    return { success: true };
  },

  // Checklists
  getChecklists(): Checklist[] {
    return getLocal<Checklist[]>(KEYS.CHECKLISTS, []);
  },

  saveChecklists(checklists: Checklist[]): void {
    setLocal(KEYS.CHECKLISTS, checklists);
  },

  // Budgets
  getBudgets(): Budget[] {
    return getLocal<Budget[]>(KEYS.BUDGETS, []);
  },

  saveBudgetsLocally(budgets: Budget[]): void {
    setLocal(KEYS.BUDGETS, budgets);
  },

  async saveBudgets(budgets: Budget[]): Promise<{ success: boolean; error?: string }> {
    setLocal(KEYS.BUDGETS, budgets);
    const supabase = getSupabase();
    if (supabase) {
      try {
        const formatted = budgets.map(budgetToDb);
        const { error } = await supabase.from('budgets').upsert(formatted);
        if (error) {
          console.error('Erro ao sincronizar orçamentos no Supabase:', error);
          return { success: false, error: error.message };
        }
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }
    return { success: true };
  },

  // Services Catalog
  getServices(): ServiceItem[] {
    return getLocal<ServiceItem[]>(KEYS.SERVICES, INITIAL_SERVICES);
  },

  saveServices(services: ServiceItem[]): void {
    setLocal(KEYS.SERVICES, services);
  },

  // Workshop Config
  getConfig(): WorkshopConfig {
    return getLocal<WorkshopConfig>(KEYS.CONFIG, INITIAL_CONFIG);
  },

  saveConfigLocally(config: WorkshopConfig): void {
    setLocal(KEYS.CONFIG, config);
  },

  async saveConfig(config: WorkshopConfig): Promise<{ success: boolean; error?: string }> {
    setLocal(KEYS.CONFIG, config);
    const supabase = getSupabase();
    if (supabase) {
      try {
        const formatted = configToDb(config);
        const { error } = await supabase.from('workshop_config').upsert([formatted]);
        if (error) {
          console.error('Erro ao salvar configuração no Supabase:', error);
          return { success: false, error: error.message };
        }
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }
    return { success: true };
  },

  // Activity Logs
  getActivities(): ActivityLog[] {
    return getLocal<ActivityLog[]>(KEYS.ACTIVITIES, INITIAL_ACTIVITIES);
  },

  addActivity(activity: Omit<ActivityLog, 'id' | 'timestamp'>): void {
    const list = this.getActivities();
    const newEntry: ActivityLog = {
      ...activity,
      id: 'act_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
    };
    const updated = [newEntry, ...list.slice(0, 49)];
    setLocal(KEYS.ACTIVITIES, updated);
  },

  // Export all local data to a safe JSON file for backup
  exportBackup(): void {
    try {
      const backupData = {
        app: 'Oficina & Tarefas — Oficina Evaldo Pinturas',
        exportedAt: new Date().toISOString(),
        tasks: this.getTasks(),
        clients: this.getClients(),
        vehicles: this.getVehicles(),
        budgets: this.getBudgets(),
        services: this.getServices(),
        config: this.getConfig(),
        activities: this.getActivities(),
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `backup_oficina_evaldo_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      console.error('Erro ao gerar backup:', err);
    }
  },

  // One-Click Migration Tool: Safely pushes all local data into Supabase
  async syncAllLocalToSupabase(): Promise<{
    success: boolean;
    tasksSynced: number;
    clientsSynced: number;
    vehiclesSynced: number;
    budgetsSynced: number;
    error?: string;
  }> {
    const supabase = getSupabase();
    if (!supabase) {
      return {
        success: false,
        tasksSynced: 0,
        clientsSynced: 0,
        vehiclesSynced: 0,
        budgetsSynced: 0,
        error: 'Cliente Supabase não inicializado. Verifique a URL e a Anon Key.',
      };
    }

    try {
      // Pre-check: verify if tables exist in the current Supabase project
      const { error: testErr } = await supabase.from('tasks').select('id').limit(1);
      if (testErr && (testErr.code === '42P01' || testErr.code === 'PGRST205')) {
        return {
          success: false,
          tasksSynced: 0,
          clientsSynced: 0,
          vehiclesSynced: 0,
          budgetsSynced: 0,
          error: 'As tabelas ainda não foram criadas no seu projeto Supabase (erro 42P01). Acesse a aba "Script SQL (Tabelas)", copie o script e execute no SQL Editor do Supabase antes de migrar os dados.',
        };
      }

      const localTasks = this.getTasks();
      const localClients = this.getClients();
      const localVehicles = this.getVehicles();
      const localBudgets = this.getBudgets();
      const localConfig = this.getConfig();

      // 1. Sync Clients first (foreign key dependency)
      if (localClients.length > 0) {
        const clientsPayload = localClients.map(clientToDb);
        const { error: clientErr } = await supabase.from('clients').upsert(clientsPayload, { onConflict: 'id' });
        if (clientErr) throw new Error(`Falha ao sincronizar clientes: ${clientErr.message}`);
      }

      // 2. Sync Vehicles
      if (localVehicles.length > 0) {
        const vehiclesPayload = localVehicles.map(vehicleToDb);
        const { error: vehErr } = await supabase.from('vehicles').upsert(vehiclesPayload, { onConflict: 'id' });
        if (vehErr) throw new Error(`Falha ao sincronizar veículos: ${vehErr.message}`);
      }

      // 3. Sync Tasks / Work Orders
      if (localTasks.length > 0) {
        const tasksPayload = localTasks.map(taskToDb);
        const { error: taskErr } = await supabase.from('tasks').upsert(tasksPayload, { onConflict: 'id' });
        if (taskErr) throw new Error(`Falha ao sincronizar tarefas: ${taskErr.message}`);
      }

      // 4. Sync Budgets
      if (localBudgets.length > 0) {
        const budgetsPayload = localBudgets.map(budgetToDb);
        const { error: budgErr } = await supabase.from('budgets').upsert(budgetsPayload, { onConflict: 'id' });
        if (budgErr) throw new Error(`Falha ao sincronizar orçamentos: ${budgErr.message}`);
      }

      // 5. Sync Config
      const configPayload = configToDb(localConfig);
      await supabase.from('workshop_config').upsert([configPayload], { onConflict: 'id' });

      return {
        success: true,
        tasksSynced: localTasks.length,
        clientsSynced: localClients.length,
        vehiclesSynced: localVehicles.length,
        budgetsSynced: localBudgets.length,
      };
    } catch (err: any) {
      console.error('Erro durante migração completa para Supabase:', err);
      return {
        success: false,
        tasksSynced: 0,
        clientsSynced: 0,
        vehiclesSynced: 0,
        budgetsSynced: 0,
        error: err.message || 'Erro inesperado na sincronização.',
      };
    }
  },
};
