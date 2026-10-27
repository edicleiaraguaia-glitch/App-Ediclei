export type TaskPriority = 'baixa' | 'media' | 'alta' | 'urgente';

export type TaskStatus = 'pendente' | 'em_andamento' | 'aguardando_pecas' | 'em_revisao' | 'concluida';

export type TaskCategory = 'funilaria' | 'pintura' | 'mecanica' | 'eletrica' | 'polimento' | 'orcamento' | 'inspecao' | 'lavagem';

export interface ChecklistSubItem {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  clientName?: string;
  clientPhone?: string;
  vehiclePlate?: string;
  vehicleModel?: string;
  assignedTo?: string;
  assignedToName?: string;
  assignedAvatar?: string;
  dueDate?: string;
  checklistItems: ChecklistSubItem[];
  estimatedHours?: number;
  actualHours?: number;
  cost?: number;
  tags?: string[];
  notes?: string;
  photos?: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface ActivityLog {
  id: string;
  taskId?: string;
  taskTitle?: string;
  userName: string;
  action: string;
  timestamp: string;
  type: 'status_change' | 'create' | 'complete' | 'comment' | 'checklist';
}

export interface Client {
  id: string;
  nome: string;
  doc?: string;
  tel: string;
  email?: string;
  end?: string;
  createdAt: string;
}

export interface Vehicle {
  id: string;
  clienteId: string;
  placa: string;
  marca: string;
  modelo: string;
  ano?: string;
  cor?: string;
  km?: string;
}

export interface DamageItem {
  nome: string;
  status: string;
  observacao: string;
  fotos: string[];
  servicos: {
    nome: string;
    qtd: number;
    valor: number;
  }[];
}

export interface Checklist {
  id: string;
  clienteId: string;
  veiculoId: string;
  data: string;
  combustivel: string;
  km: string;
  itens: string;
  partesVisuais: string[];
  itensCarroceria: DamageItem[];
  subtotal: number;
  desconto: number;
  total: number;
}

export interface Budget {
  id: string;
  numero: number;
  clienteId: string;
  veiculoId: string;
  checklistId?: string;
  data: string;
  subtotal: number;
  desconto: number;
  total: number;
  status: 'rascunho' | 'enviado' | 'aprovado' | 'recusado';
  itens: {
    peca: string;
    servico: string;
    qtd: number;
    valor: number;
  }[];
}

export interface ServiceItem {
  id: string;
  nome: string;
  preco: number;
  categoria?: string;
}

export interface WorkshopConfig {
  nome: string;
  cnpj: string;
  tel: string;
  end: string;
  logo?: string;
  validade: number;
  pagto: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: 'Administrador' | 'Funileiro' | 'Pintor' | 'Mecânico' | 'Atendente';
  avatar?: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  lastChecked?: string;
}
