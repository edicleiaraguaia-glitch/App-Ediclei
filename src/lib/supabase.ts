import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig } from '../types';

const STORAGE_KEY = 'oficina_supabase_config';
export const LEGACY_DEAD_HOST = 'eqoebhpeaionrxqisuud.supabase.co';

let clientInstance: SupabaseClient | null = null;

export function normalizeSupabaseUrl(rawUrl: string): { url: string; autoCorrected: boolean; warning?: string } {
  let clean = (rawUrl || '').trim();
  if (!clean) return { url: '', autoCorrected: false };

  // Remove surrounding quotes and whitespaces
  clean = clean.replace(/^["']+|["']+$/g, '').trim();

  let autoCorrected = false;
  let warning: string | undefined;

  // Check if user pasted a dashboard URL (e.g. https://supabase.com/dashboard/project/xxxxxx or https://app.supabase.com/project/xxxxxx)
  const dashboardMatch = clean.match(/supabase\.com\/dashboard\/project\/([a-zA-Z0-9_-]+)/) ||
                         clean.match(/app\.supabase\.com\/project\/([a-zA-Z0-9_-]+)/);
  if (dashboardMatch && dashboardMatch[1]) {
    const projectRef = dashboardMatch[1];
    clean = `https://${projectRef}.supabase.co`;
    autoCorrected = true;
    warning = `Link do painel detectado! Convertido automaticamente para a URL de API: ${clean}`;
  }

  // Prepend https:// if missing
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = `https://${clean}`;
    autoCorrected = true;
  }

  // Remove trailing slashes
  clean = clean.replace(/\/+$/, '');

  return { url: clean, autoCorrected, warning };
}

export function isSupabaseConfigured(): boolean {
  const config = getSavedConfig();
  if (!config.url || !config.anonKey) return false;
  if (config.url.includes(LEGACY_DEAD_HOST)) return false;
  return true;
}

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
        const { url: cleanUrl } = normalizeSupabaseUrl(decodeURIComponent(incomingUrl));
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
        // If it's pointing to the old deleted project, do not treat as configured
        if (parsed.url.includes(LEGACY_DEAD_HOST)) {
          return {
            url: '',
            anonKey: '',
            isConnected: false,
          };
        }
        const { url: normalized } = normalizeSupabaseUrl(parsed.url);
        return {
          ...parsed,
          url: normalized,
        };
      }
    }
  } catch (err) {
    console.warn('Erro ao carregar configuração salva do Supabase', err);
  }

  // 3. Fallback to Vite env variables or empty
  if (envUrl && envKey && !envUrl.includes(LEGACY_DEAD_HOST)) {
    const { url: normalizedEnvUrl } = normalizeSupabaseUrl(envUrl);
    return {
      url: normalizedEnvUrl,
      anonKey: envKey,
      isConnected: true,
    };
  }

  return {
    url: '',
    anonKey: '',
    isConnected: false,
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

export function saveSupabaseConfig(rawUrl: string, rawAnonKey: string): { success: boolean; error?: string; normalizedUrl?: string } {
  try {
    const cleanKey = (rawAnonKey || '').trim().replace(/^["']+|["']+$/g, '');
    const { url: normalizedUrl } = normalizeSupabaseUrl(rawUrl);

    if (!normalizedUrl || !cleanKey) {
      localStorage.removeItem(STORAGE_KEY);
      clientInstance = null;
      return { success: true };
    }

    try {
      new URL(normalizedUrl);
    } catch {
      return { success: false, error: 'URL do Supabase inválida. O formato deve ser https://seu-projeto.supabase.co' };
    }

    const newConfig: SupabaseConfig = {
      url: normalizedUrl,
      anonKey: cleanKey,
      isConnected: true,
      lastChecked: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
    initSupabaseClient(newConfig);
    return { success: true, normalizedUrl };
  } catch (err: any) {
    return { success: false, error: err.message || 'URL inválida' };
  }
}

export async function testSupabaseConnection(rawUrl: string, rawAnonKey: string): Promise<{
  success: boolean;
  message: string;
  clientInitialized?: boolean;
  authEndpointOk?: boolean;
  tablesStatus?: Record<string, boolean>;
  allTablesReady?: boolean;
  normalizedUrl?: string;
  warning?: string;
}> {
  try {
    const cleanKey = (rawAnonKey || '').trim().replace(/^["']+|["']+$/g, '');
    const { url: cleanUrl, autoCorrected, warning } = normalizeSupabaseUrl(rawUrl);

    if (!cleanUrl || !cleanKey) {
      return { success: false, message: 'Preencha a URL e a Anon Key antes de testar.' };
    }

    if (cleanUrl.includes(LEGACY_DEAD_HOST)) {
      return {
        success: false,
        message: 'Esta é a URL do projeto anterior. Por favor, insira a URL do seu novo projeto Supabase.',
      };
    }

    try {
      new URL(cleanUrl);
    } catch {
      return { success: false, message: 'A URL informada não é válida. O formato correto é https://seu-projeto.supabase.co' };
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
      const msg = (authErr.message || '').toLowerCase();
      if (msg.includes('failed to fetch') || msg.includes('network') || msg.includes('fetch')) {
        return {
          success: false,
          clientInitialized: true,
          message: `Não foi possível conectar ao servidor (${cleanUrl}): Failed to fetch. Motivos prováveis: 1) O projeto está PAUSADO ('Paused') no painel do Supabase; 2) O endereço contém algum caractere incorreto; 3) O projeto acabou de ser criado e ainda está inicializando na nuvem.`,
        };
      }
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
      try {
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
              message: `Chave Anon inválida ou incorreta: ${error.message}. Certifique-se de copiar a chave "anon public" das configurações do seu novo projeto Supabase.`,
            };
          }
          if (error.code === '42P01' || error.code === 'PGRST205') {
            tablesStatus[table] = false;
            missingTables.push(table);
          } else {
            tablesStatus[table] = true;
          }
        } else {
          tablesStatus[table] = true;
        }
      } catch (tblErr: any) {
        const msg = (tblErr.message || '').toLowerCase();
        if (msg.includes('failed to fetch')) {
          return {
            success: false,
            clientInitialized: true,
            authEndpointOk: true,
            message: `Falha de rede ao consultar as tabelas (${cleanUrl}): Failed to fetch. Verifique se o projeto está ativo.`,
          };
        }
        tablesStatus[table] = false;
        missingTables.push(table);
      }
    }

    const allTablesReady = missingTables.length === 0;

    let successMsg = 'Cliente Supabase inicializado e 100% validado! Todas as 6 tabelas e permissões estão prontas para sincronizar entre todos os seus dispositivos.';
    if (autoCorrected && warning) {
      successMsg = `${warning}. ` + successMsg;
    }

    if (!allTablesReady) {
      return {
        success: true,
        clientInitialized: true,
        authEndpointOk: true,
        allTablesReady: false,
        normalizedUrl: cleanUrl,
        warning,
        message: `Cliente Supabase inicializado e autenticado com sucesso! Porém, as tabelas (${missingTables.join(', ')}) ainda não existem neste novo projeto. Copie o script SQL na aba "Script SQL" e execute no SQL Editor do Supabase.`,
        tablesStatus,
      };
    }

    return {
      success: true,
      clientInitialized: true,
      authEndpointOk: true,
      allTablesReady: true,
      normalizedUrl: cleanUrl,
      warning,
      message: successMsg,
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

-- 8. Trigger para sincronizar novos usuários do Supabase Auth para a tabela public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'Administrador'),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.profiles.name),
    role = COALESCE(EXCLUDED.role, public.profiles.role);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Sincronizar usuários existentes em auth.users para public.profiles
INSERT INTO public.profiles (id, email, name, role, created_at)
SELECT
  id,
  email,
  COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1)),
  COALESCE(raw_user_meta_data->>'role', 'Administrador'),
  created_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 9. Segurança e Row Level Security (RLS) - Exclusivo para Usuários Autenticados
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_config ENABLE ROW LEVEL SECURITY;

-- Políticas de Profiles: apenas usuários autenticados
DROP POLICY IF EXISTS "Perfis visíveis por usuários autenticados" ON public.profiles;
DROP POLICY IF EXISTS "Acesso total profiles" ON public.profiles;
CREATE POLICY "Perfis visíveis por usuários autenticados" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Usuário edita próprio perfil" ON public.profiles;
CREATE POLICY "Usuário edita próprio perfil" 
ON public.profiles FOR ALL 
TO authenticated 
USING (auth.uid() = id) 
WITH CHECK (auth.uid() = id);

-- Políticas de Clientes: restrito a autenticados
DROP POLICY IF EXISTS "Clientes restritos a autenticados" ON public.clients;
DROP POLICY IF EXISTS "Acesso total clients" ON public.clients;
CREATE POLICY "Clientes restritos a autenticados" 
ON public.clients FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Políticas de Veículos: restrito a autenticados
DROP POLICY IF EXISTS "Veiculos restritos a autenticados" ON public.vehicles;
DROP POLICY IF EXISTS "Acesso total vehicles" ON public.vehicles;
CREATE POLICY "Veiculos restritos a autenticados" 
ON public.vehicles FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Políticas de Tasks (Ordens de Serviço): restrito a autenticados
DROP POLICY IF EXISTS "Tarefas restritas a autenticados" ON public.tasks;
DROP POLICY IF EXISTS "Acesso total tasks" ON public.tasks;
CREATE POLICY "Tarefas restritas a autenticados" 
ON public.tasks FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Políticas de Orçamentos: restrito a autenticados
DROP POLICY IF EXISTS "Orcamentos restritos a autenticados" ON public.budgets;
DROP POLICY IF EXISTS "Acesso total budgets" ON public.budgets;
CREATE POLICY "Orcamentos restritos a autenticados" 
ON public.budgets FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Políticas de Configuração: restrito a autenticados
DROP POLICY IF EXISTS "Configuração restrita a autenticados" ON public.workshop_config;
DROP POLICY IF EXISTS "Acesso total workshop_config" ON public.workshop_config;
CREATE POLICY "Configuração restrita a autenticados" 
ON public.workshop_config FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);
`;
}
