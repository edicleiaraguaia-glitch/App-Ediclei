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
  nome: 'Oficina Master Auto Center',
  cnpj: '34.890.123/0001-45',
  tel: '(11) 99876-5432',
  end: 'Av. das Nações Unidas, 8500 - Pinheiros, São Paulo/SP',
  validade: 15,
  pagto: 'Pix, Cartão de Crédito até 6x, Boleto Bancário e Faturamento para Frotistas',
};

// Storage Helpers
function getLocal<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
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

  async saveTasks(tasks: Task[]): Promise<void> {
    setLocal(KEYS.TASKS, tasks);

    // Sync to Supabase if connected
    const supabase = getSupabase();
    if (supabase) {
      try {
        // Upsert tasks in Supabase in background
        const formatted = tasks.map(t => ({
          id: t.id,
          title: t.title,
          description: t.description,
          category: t.category,
          priority: t.priority,
          status: t.status,
          client_name: t.clientName,
          client_phone: t.clientPhone,
          vehicle_plate: t.vehiclePlate,
          vehicle_model: t.vehicleModel,
          assigned_to: t.assignedTo,
          assigned_to_name: t.assignedToName,
          assigned_avatar: t.assignedAvatar,
          due_date: t.dueDate,
          checklist_items: t.checklistItems,
          estimated_hours: t.estimatedHours,
          actual_hours: t.actualHours,
          cost: t.cost,
          tags: t.tags,
          notes: t.notes,
          created_at: t.createdAt,
          updated_at: t.updatedAt,
          completed_at: t.completedAt,
        }));
        await supabase.from('tasks').upsert(formatted);
      } catch (err) {
        console.warn('Sync to Supabase background task upsert:', err);
      }
    }
  },

  // Clients
  getClients(): Client[] {
    return getLocal<Client[]>(KEYS.CLIENTS, INITIAL_CLIENTS);
  },

  saveClients(clients: Client[]): void {
    setLocal(KEYS.CLIENTS, clients);
    const supabase = getSupabase();
    if (supabase) {
      (async () => {
        try {
          await supabase.from('clients').upsert(clients);
        } catch (err) {
          console.warn('Supabase clients sync:', err);
        }
      })();
    }
  },

  // Vehicles
  getVehicles(): Vehicle[] {
    return getLocal<Vehicle[]>(KEYS.VEHICLES, INITIAL_VEHICLES);
  },

  saveVehicles(vehicles: Vehicle[]): void {
    setLocal(KEYS.VEHICLES, vehicles);
    const supabase = getSupabase();
    if (supabase) {
      (async () => {
        try {
          await supabase.from('vehicles').upsert(vehicles);
        } catch (err) {
          console.warn('Supabase vehicles sync:', err);
        }
      })();
    }
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

  saveBudgets(budgets: Budget[]): void {
    setLocal(KEYS.BUDGETS, budgets);
    const supabase = getSupabase();
    if (supabase) {
      (async () => {
        try {
          await supabase.from('budgets').upsert(budgets);
        } catch (err) {
          console.warn('Supabase budgets sync:', err);
        }
      })();
    }
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

  saveConfig(config: WorkshopConfig): void {
    setLocal(KEYS.CONFIG, config);
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
};
