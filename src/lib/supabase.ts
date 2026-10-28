import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig } from '../types';

const STORAGE_KEY = 'oficina_supabase_config';
const DEFAULT_URL = 'https://eqoebhpeaionrxqisuud.supabase.co';
const DEFAULT_KEY = 'sb_publishable_U-7nbp4x2bYYLq9eBgfeOg_9Q0XzniI';

let clientInstance: SupabaseClient | null = null;

export function getSavedConfig(): SupabaseConfig {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.anonKey) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Erro ao carregar configuração salva do Supabase', err);
  }

  return {
    url: envUrl || DEFAULT_URL,
    anonKey: envKey || DEFAULT_KEY,
    isConnected: true,
  };
}

export function initSupabaseClient(config?: { url: string; anonKey: string }): SupabaseClient | null {
  const activeConfig = config || getSavedConfig();
  if (!activeConfig.url || !activeConfig.anonKey) {
    clientInstance = null;
    return null;
  }

  try {
    // Validate basic URL format
    new URL(activeConfig.url);
    clientInstance = createClient(activeConfig.url, activeConfig.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    return clientInstance;
  } catch (err) {
    console.error('Falha ao inicializar cliente Supabase:', err);
    clientInstance = null;
    return null;
  }
}

export function getSupabase(): SupabaseClient | null {
  if (!clientInstance) {
    clientInstance = initSupabaseClient();
  }
  return clientInstance;
}

export function saveSupabaseConfig(url: string, anonKey: string): { success: boolean; error?: string } {
  try {
    if (!url.trim() || !anonKey.trim()) {
      localStorage.removeItem(STORAGE_KEY);
      clientInstance = null;
      return { success: true };
    }

    new URL(url);
    const newConfig: SupabaseConfig = {
      url: url.trim(),
      anonKey: anonKey.trim(),
      isConnected: false,
      lastChecked: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    initSupabaseClient(newConfig);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'URL inválida' };
  }
}

export async function testSupabaseConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string; tablesStatus?: Record<string, boolean> }> {
  try {
    const testClient = createClient(url, anonKey, {
      auth: { persistSession: false },
    });
    
    // Check auth endpoint reachability
    const { error: authError } = await testClient.auth.getSession();
    if (authError && authError.status !== 400 && authError.status !== 401) {
      return { success: false, message: `Erro no endpoint de autenticação: ${authError.message}` };
    }

    // Check tables existence
    const tables = ['tasks', 'clients', 'vehicles', 'budgets', 'workshop_config', 'profiles'];
    const tablesStatus: Record<string, boolean> = {};
    let missingTables: string[] = [];

    for (const table of tables) {
      const { error } = await testClient.from(table).select('id').limit(1);
      if (error && (error.code === '42P01' || error.code === 'PGRST205')) {
        tablesStatus[table] = false;
        missingTables.push(table);
      } else {
        tablesStatus[table] = true;
      }
    }

    if (missingTables.length > 0) {
      return {
        success: true,
        message: `Conectado ao Supabase com sucesso! Atenção: as tabelas (${missingTables.join(', ')}) ainda não foram criadas. Copie e execute o script SQL no SQL Editor do Supabase.`,
        tablesStatus,
      };
    }

    return {
      success: true,
      message: 'Conexão com Supabase 100% validada! Todas as tabelas (tasks, clients, vehicles, budgets, workshop_config, profiles) estão prontas para sincronização.',
      tablesStatus,
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Falha ao conectar no host Supabase' };
  }
}

export function getSupabaseSchemaSql(): string {
  return `-- ========================================================
-- SCRIPT DE INICIALIZAÇÃO COMPLETO - OFICINA EVALDO PINTURAS
-- Execute este script no SQL Editor do seu projeto Supabase
-- ========================================================

-- 1. Tabela de Tarefas e Ordens de Serviço
CREATE TABLE IF NOT EXISTS public.tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'funilaria',
  priority TEXT NOT NULL DEFAULT 'media',
  status TEXT NOT NULL DEFAULT 'pendente',
  client_name TEXT,
  client_phone TEXT,
  vehicle_plate TEXT,
  vehicle_model TEXT,
  assigned_to TEXT,
  assigned_to_name TEXT,
  assigned_avatar TEXT,
  due_date TIMESTAMPTZ,
  checklist_items JSONB DEFAULT '[]'::jsonb,
  estimated_hours NUMERIC DEFAULT 0,
  actual_hours NUMERIC DEFAULT 0,
  cost NUMERIC DEFAULT 0,
  tags TEXT[],
  notes TEXT,
  photos TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 2. Tabela de Clientes
CREATE TABLE IF NOT EXISTS public.clients (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  doc TEXT,
  tel TEXT NOT NULL,
  email TEXT,
  "end" TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Veículos
CREATE TABLE IF NOT EXISTS public.vehicles (
  id TEXT PRIMARY KEY,
  cliente_id TEXT,
  placa TEXT NOT NULL,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  ano TEXT,
  cor TEXT,
  km TEXT
);

-- 4. Tabela de Orçamentos
CREATE TABLE IF NOT EXISTS public.budgets (
  id TEXT PRIMARY KEY,
  numero INT,
  cliente_id TEXT,
  veiculo_id TEXT,
  checklist_id TEXT,
  data TIMESTAMPTZ DEFAULT NOW(),
  subtotal NUMERIC DEFAULT 0,
  desconto NUMERIC DEFAULT 0,
  total NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'rascunho',
  itens JSONB DEFAULT '[]'::jsonb,
  fotos JSONB DEFAULT '[]'::jsonb
);

-- Adicionar colunas caso a tabela já tenha sido criada anteriormente
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS fotos JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS checklist_items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS photos TEXT[];

-- 5. Tabela de Configuração da Oficina (Nome, Logo, Endereço, etc.)
CREATE TABLE IF NOT EXISTS public.workshop_config (
  id TEXT PRIMARY KEY DEFAULT 'config_default',
  nome TEXT NOT NULL DEFAULT 'Oficina Evaldo Pinturas',
  cnpj TEXT,
  tel TEXT,
  "end" TEXT,
  logo TEXT,
  validade INT DEFAULT 15,
  pagto TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabela de Perfis de Usuários (Sincronizada com Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY,
  email TEXT,
  name TEXT,
  role TEXT,
  avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir configuração inicial da Oficina se não existir
INSERT INTO public.workshop_config (id, nome, validade, pagto)
VALUES ('config_default', 'Oficina Evaldo Pinturas', 15, 'Pix, Cartão de Crédito até 6x, Boleto Bancário')
ON CONFLICT (id) DO NOTHING;

-- 7. Habilitar Realtime nas tabelas para sincronização instantânea
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.vehicles;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.budgets;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.workshop_config;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- 8. Habilitar Row Level Security (RLS) permissivo para leitura e escrita
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso total tasks" ON public.tasks;
CREATE POLICY "Acesso total tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total clients" ON public.clients;
CREATE POLICY "Acesso total clients" ON public.clients FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total vehicles" ON public.vehicles;
CREATE POLICY "Acesso total vehicles" ON public.vehicles FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total budgets" ON public.budgets;
CREATE POLICY "Acesso total budgets" ON public.budgets FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total workshop_config" ON public.workshop_config;
CREATE POLICY "Acesso total workshop_config" ON public.workshop_config FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acesso total profiles" ON public.profiles;
CREATE POLICY "Acesso total profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
`;
}
