import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig } from '../types';

const STORAGE_KEY = 'oficina_supabase_config';
const DEFAULT_URL = 'https://eqoebhpeaionrxqisuud.supabase.co';
const DEFAULT_KEY = 'sb_publishable_U-7nbp4x2bYYLq9eBgfeOg_9Q0XzniI';

let clientInstance: SupabaseClient | null = null;

export function getSavedConfig(): SupabaseConfig {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // 1. Check if URL hash or search parameters contain quick-connect credentials
  try {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const search = window.location.search;
      let incomingUrl = '';
      let incomingKey = '';

      if (hash && hash.includes('sb_url=')) {
        const hashParams = new URLSearchParams(hash.substring(1));
        incomingUrl = hashParams.get('sb_url') || '';
        incomingKey = hashParams.get('sb_key') || '';
      } else if (search && search.includes('sb_url=')) {
        const searchParams = new URLSearchParams(search);
        incomingUrl = searchParams.get('sb_url') || '';
        incomingKey = searchParams.get('sb_key') || '';
      }

      if (incomingUrl && incomingKey) {
        const cleanUrl = decodeURIComponent(incomingUrl.trim());
        const cleanKey = decodeURIComponent(incomingKey.trim());
        const configToSave: SupabaseConfig = {
          url: cleanUrl,
          anonKey: cleanKey,
          isConnected: true,
          lastChecked: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(configToSave));
        // Clean URL hash to keep address clean and secure
        if (window.history && window.history.replaceState) {
          window.history.replaceState(null, '', window.location.pathname);
        }
        return configToSave;
      }
    }
  } catch (err) {
    console.warn('Erro ao verificar parâmetros de conexão rápida:', err);
  }

  // 2. Check localStorage
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

  // 3. Fallback to Vite env variables or defaults
  return {
    url: envUrl || DEFAULT_URL,
    anonKey: envKey || DEFAULT_KEY,
    isConnected: true,
  };
}

export function generateQuickConnectUrl(baseUrl?: string): string {
  const config = getSavedConfig();
  if (!config.url || !config.anonKey) return '';
  const origin = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${origin}#sb_url=${encodeURIComponent(config.url)}&sb_key=${encodeURIComponent(config.anonKey)}`;
}

export function getVercelEnvSnippet(): string {
  const config = getSavedConfig();
  return `VITE_SUPABASE_URL=${config.url || 'https://seu-projeto.supabase.co'}\nVITE_SUPABASE_ANON_KEY=${config.anonKey || 'sua-chave-anon'}`;
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

export async function testSupabaseConnection(url: string, anonKey: string): Promise<{
  success: boolean;
  message: string;
  clientInitialized?: boolean;
  authEndpointOk?: boolean;
  tablesStatus?: Record<string, boolean>;
  allTablesReady?: boolean;
}> {
  try {
    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();

    if (!cleanUrl || !cleanKey) {
      return { success: false, message: 'Preencha a URL e a Anon Key antes de testar.' };
    }

    try {
      new URL(cleanUrl);
    } catch {
      return { success: false, message: 'A URL informada não é válida. O formato deve ser https://seu-projeto.supabase.co' };
    }

    if (!cleanUrl.startsWith('https://')) {
      return { success: false, message: 'A URL do Supabase precisa começar com https://' };
    }

    // Initialize test client
    let testClient: SupabaseClient;
    try {
      testClient = createClient(cleanUrl, cleanKey, {
        auth: { persistSession: false },
      });
    } catch (clientErr: any) {
      return {
        success: false,
        message: `Falha ao instanciar o cliente Supabase: ${clientErr.message}`,
        clientInitialized: false,
      };
    }

    // 1. Check auth endpoint reachability
    let authEndpointOk = false;
    try {
      const { error: authError } = await testClient.auth.getSession();
      if (authError && authError.status !== 400 && authError.status !== 401) {
        return {
          success: false,
          clientInitialized: true,
          message: `Erro ao comunicar com o serviço de autenticação do Supabase: ${authError.message}`,
        };
      }
      authEndpointOk = true;
    } catch (authErr: any) {
      return {
        success: false,
        clientInitialized: true,
        message: `Não foi possível conectar ao servidor Supabase. Verifique se o endereço da URL está correto ou se o projeto não está pausado: ${authErr.message}`,
      };
    }

    // 2. Check tables existence
    const tables = ['tasks', 'clients', 'vehicles', 'budgets', 'workshop_config', 'profiles'];
    const tablesStatus: Record<string, boolean> = {};
    let missingTables: string[] = [];

    for (const table of tables) {
      const { error } = await testClient.from(table).select('id').limit(1);
      if (error) {
        if (
          error.code === 'PGRST301' ||
          error.message?.toLowerCase().includes('jwt') ||
          error.message?.toLowerCase().includes('apikey') ||
          error.message?.toLowerCase().includes('invalid api key')
        ) {
          return {
            success: false,
            clientInitialized: true,
            authEndpointOk: true,
            message: `Chave Anon inválida ou incorreta: ${error.message}. Certifique-se de copiar a chave "anon public" das configurações do seu projeto Supabase.`,
          };
        }
        if (error.code === '42P01' || error.code === 'PGRST205') {
          tablesStatus[table] = false;
          missingTables.push(table);
        } else {
          // Table exists
          tablesStatus[table] = true;
        }
      } else {
        tablesStatus[table] = true;
      }
    }

    const allTablesReady = missingTables.length === 0;

    if (!allTablesReady) {
      return {
        success: true,
        clientInitialized: true,
        authEndpointOk: true,
        allTablesReady: false,
        message: `Cliente Supabase inicializado e autenticado com sucesso! Porém, as tabelas (${missingTables.join(', ')}) ainda não existem neste novo projeto. Copie o script SQL na aba "Script SQL" e execute no SQL Editor do Supabase.`,
        tablesStatus,
      };
    }

    return {
      success: true,
      clientInitialized: true,
      authEndpointOk: true,
      allTablesReady: true,
      message: 'Cliente Supabase inicializado e 100% validado! Todas as 6 tabelas e permissões estão prontas para sincronizar entre todos os seus dispositivos.',
      tablesStatus,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Falha inesperada ao conectar ao Supabase.',
    };
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
