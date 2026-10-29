import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, RegisteredUserAccount } from '../types';
import { getSupabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, pass: string, name: string, role: UserProfile['role']) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isSupabaseAuth: boolean;
  localPendingAccounts: RegisteredUserAccount[];
  migrateLocalAccount: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
}

const USER_SESSION_KEY = 'oficina_active_session_v3';
const REGISTERED_USERS_KEY = 'oficina_registered_users_v3';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to get registered accounts
export function getRegisteredAccounts(): RegisteredUserAccount[] {
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error('Erro ao ler contas registradas:', err);
  }
  return [];
}

function saveRegisteredAccounts(accounts: RegisteredUserAccount[]): void {
  try {
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(accounts));
  } catch (err) {
    console.error('Erro ao salvar contas registradas:', err);
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSupabaseAuth, setIsSupabaseAuth] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const supabase = getSupabase();

      // 1. Check if Supabase has an active session
      if (supabase && isSupabaseConfigured()) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && isMounted) {
            let name = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário';
            let role = session.user.user_metadata?.role || 'Administrador';
            let avatar = session.user.user_metadata?.avatar;

            try {
              const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
              if (prof) {
                name = prof.name || name;
                role = prof.role || role;
                avatar = prof.avatar || avatar;
              }
            } catch {}

            const profile: UserProfile = {
              id: session.user.id,
              email: session.user.email || '',
              name,
              role,
              avatar,
            };
            setUser(profile);
            setIsSupabaseAuth(true);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.warn('Erro ao verificar sessão Supabase:', err);
        }

        // If Supabase is configured and has no active session, do not auto-login to stale local session!
        localStorage.removeItem(USER_SESSION_KEY);
        if (isMounted) {
          setUser(null);
          setIsSupabaseAuth(false);
          setLoading(false);
        }
        return;
      }

      // 2. Offline fallback ONLY if Supabase is completely unconfigured
      const saved = localStorage.getItem(USER_SESSION_KEY);
      if (saved && isMounted) {
        try {
          const parsed: UserProfile = JSON.parse(saved);
          if (parsed && parsed.email) {
            setUser(parsed);
            setLoading(false);
            return;
          }
        } catch (err) {
          localStorage.removeItem(USER_SESSION_KEY);
        }
      }

      // 3. If no active session, stay at login screen
      if (isMounted) {
        setUser(null);
        setIsSupabaseAuth(false);
        setLoading(false);
      }
    };

    initAuth();

    // Listen to Supabase Auth state changes if available
    const supabase = getSupabase();
    let authListener: { subscription: { unsubscribe: () => void } } | null = null;
    if (supabase && isSupabaseConfigured()) {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!isMounted) return;
        if (session?.user) {
          const name = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário';
          const role = session.user.user_metadata?.role || 'Administrador';
          const avatar = session.user.user_metadata?.avatar;

          const profile: UserProfile = {
            id: session.user.id,
            email: session.user.email || '',
            name,
            role,
            avatar,
          };
          setUser(profile);
          setIsSupabaseAuth(true);
          localStorage.setItem(USER_SESSION_KEY, JSON.stringify(profile));
        } else {
          // If explicitly signed out in Supabase
          setUser(null);
          setIsSupabaseAuth(false);
          localStorage.removeItem(USER_SESSION_KEY);
        }
      });
      authListener = data;
    }

    return () => {
      isMounted = false;
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Strict Login Function
  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    if (!cleanEmail || !cleanPass) {
      return { success: false, error: 'Por favor, informe o e-mail e a senha.' };
    }

    if (!isSupabaseConfigured()) {
      return {
        success: false,
        error: 'O novo projeto Supabase ainda não foi conectado. Clique em "Configurar Supabase" para inserir a URL e Chave Anon do seu novo projeto.',
      };
    }

    const supabase = getSupabase();

    // 1. Authenticate with Supabase Auth
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPass,
        });

        if (error) {
          const lowerMsg = error.message.toLowerCase();
          if (lowerMsg.includes('email not confirmed')) {
            return {
              success: false,
              error: 'E-mail cadastrado no Supabase, mas ainda pendente de confirmação. Verifique sua caixa postal ou desative "Confirm email" no painel Supabase (Authentication -> Providers -> Email).',
            };
          }

          if (lowerMsg.includes('invalid login credentials')) {
            // Check if user previously registered only in localStorage
            const localAccounts = getRegisteredAccounts();
            const matchedLocal = localAccounts.find((acc) => acc.email.toLowerCase() === cleanEmail);

            if (matchedLocal && matchedLocal.passwordHash === cleanPass) {
              // Attempt to migrate this local user into Supabase Auth!
              const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
                email: cleanEmail,
                password: cleanPass,
                options: {
                  data: { name: matchedLocal.name, role: matchedLocal.role },
                },
              });

              if (!signUpErr && signUpData?.user) {
                // Upsert to profiles table
                await supabase.from('profiles').upsert([
                  {
                    id: signUpData.user.id,
                    email: cleanEmail,
                    name: matchedLocal.name,
                    role: matchedLocal.role,
                    created_at: new Date().toISOString(),
                  },
                ]);

                if (signUpData.session) {
                  const profile: UserProfile = {
                    id: signUpData.user.id,
                    email: cleanEmail,
                    name: matchedLocal.name,
                    role: matchedLocal.role,
                  };
                  setUser(profile);
                  setIsSupabaseAuth(true);
                  localStorage.setItem(USER_SESSION_KEY, JSON.stringify(profile));
                  return { success: true };
                }

                return {
                  success: false,
                  error: 'Sua conta anterior foi cadastrada agora no Supabase Authentication! Se o Supabase exigir confirmação de e-mail, autorize pelo link enviado ou desative "Confirm email" no painel Supabase.',
                };
              }
            }

            return {
              success: false,
              error: 'E-mail ou senha incorretos. Verifique suas credenciais no Supabase.',
            };
          }

          return { success: false, error: `Erro no Supabase: ${error.message}` };
        }

        if (data?.user) {
          const profile: UserProfile = {
            id: data.user.id,
            email: data.user.email || cleanEmail,
            name: data.user.user_metadata?.name || cleanEmail.split('@')[0],
            role: data.user.user_metadata?.role || 'Administrador',
            avatar: data.user.user_metadata?.avatar,
          };
          setUser(profile);
          setIsSupabaseAuth(true);
          localStorage.setItem(USER_SESSION_KEY, JSON.stringify(profile));
          return { success: true };
        }
      } catch (authErr: any) {
        console.error('Falha de conexão com Supabase Auth:', authErr);
        const msg = (authErr.message || '').toLowerCase();
        if (msg.includes('failed to fetch') || msg.includes('network') || msg.includes('fetch')) {
          return {
            success: false,
            error: 'Falha ao conectar no Supabase (Failed to fetch). O servidor do projeto não respondeu. Verifique se o seu novo projeto está ativo (não pausado) no painel do Supabase e se a URL e a Chave Anon foram salvas corretamente.',
          };
        }
        return { success: false, error: `Falha ao conectar no Supabase: ${authErr.message || 'Verifique sua conexão'}` };
      }
    }

    // 2. Offline fallback ONLY if Supabase is completely unavailable/not configured
    const accounts = getRegisteredAccounts();
    const matchedAccount = accounts.find((acc) => acc.email.toLowerCase() === cleanEmail);

    if (!matchedAccount) {
      return {
        success: false,
        error: 'E-mail não cadastrado no Supabase. Por favor, crie uma conta primeiro.',
      };
    }

    if (matchedAccount.passwordHash !== cleanPass) {
      return {
        success: false,
        error: 'Senha incorreta. Verifique suas credenciais e tente novamente.',
      };
    }

    const userProfile: UserProfile = {
      id: matchedAccount.id,
      email: matchedAccount.email,
      name: matchedAccount.name,
      role: matchedAccount.role,
    };

    setUser(userProfile);
    setIsSupabaseAuth(false);
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(userProfile));
    return { success: true };
  };

  // Strict Register Function
  const register = async (
    email: string,
    pass: string,
    name: string,
    role: UserProfile['role']
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();
    const cleanName = name.trim();

    // Validations
    if (!cleanName || cleanName.length < 2) {
      return { success: false, error: 'Informe seu nome completo (mínimo 2 caracteres).' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return { success: false, error: 'Informe um endereço de e-mail válido (ex: seu.nome@gmail.com).' };
    }

    if (cleanPass.length < 6) {
      return { success: false, error: 'A senha deve conter no mínimo 6 caracteres.' };
    }

    if (!isSupabaseConfigured()) {
      return {
        success: false,
        error: 'O novo projeto Supabase ainda não foi conectado. Clique em "Configurar Supabase" para inserir a URL e a Chave Anon do seu novo projeto antes de cadastrar novos usuários.',
      };
    }

    const supabase = getSupabase();

    // 1. Register with Supabase Auth
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPass,
          options: {
            data: { name: cleanName, role },
          },
        });

        if (error) {
          let errorMsg = error.message;
          const lower = error.message.toLowerCase();
          if (lower.includes('failed to fetch') || lower.includes('network') || lower.includes('fetch')) {
            errorMsg = 'Falha ao conectar no servidor do Supabase (Failed to fetch). O endereço do projeto não respondeu. Verifique se o seu novo projeto está ativo (não pausado) no painel do Supabase e se a URL e a Chave Anon estão corretas.';
          } else if (lower.includes('user already registered') || lower.includes('already exists')) {
            errorMsg = 'Este e-mail já está cadastrado no Supabase. Faça login com sua senha.';
          }
          return { success: false, error: `Erro no Supabase: ${errorMsg}` };
        }

        if (data?.user) {
          // Record in public.profiles table in Supabase
          try {
            await supabase.from('profiles').upsert([
              {
                id: data.user.id,
                email: cleanEmail,
                name: cleanName,
                role,
                created_at: new Date().toISOString(),
              },
            ]);
          } catch (profErr) {
            console.warn('Aviso ao registrar na tabela profiles:', profErr);
          }

          // Cache in local accounts registry for offline backup
          const existingAccounts = getRegisteredAccounts();
          const newAccount: RegisteredUserAccount = {
            id: data.user.id,
            email: cleanEmail,
            passwordHash: cleanPass,
            name: cleanName,
            role,
            createdAt: new Date().toISOString(),
          };
          saveRegisteredAccounts([...existingAccounts.filter(a => a.email !== cleanEmail), newAccount]);

          // Check if session was granted or email confirmation required
          if (!data.session) {
            return {
              success: true,
              error: 'Usuário cadastrado com sucesso no Supabase! Verifique seu e-mail caso a confirmação esteja ativada no painel Supabase (Authentication -> Providers -> Email).',
            };
          }

          // Active session immediately available
          const userProfile: UserProfile = {
            id: data.user.id,
            email: cleanEmail,
            name: cleanName,
            role,
          };

          setUser(userProfile);
          setIsSupabaseAuth(true);
          localStorage.setItem(USER_SESSION_KEY, JSON.stringify(userProfile));

          return { success: true };
        }
      } catch (err: any) {
        const msg = (err.message || '').toLowerCase();
        if (msg.includes('failed to fetch') || msg.includes('network') || msg.includes('fetch')) {
          return {
            success: false,
            error: 'Falha de conexão com o Supabase (Failed to fetch). O endereço do projeto não respondeu. Causas mais prováveis: 1) O projeto está Pausado ("Paused") no painel do Supabase; 2) A URL foi digitada com erro; 3) O projeto acabou de ser criado e ainda está inicializando na nuvem.',
          };
        }
        return { success: false, error: `Falha ao registrar no Supabase: ${err.message || 'Erro de conexão'}` };
      }
    }

    return {
      success: false,
      error: 'Não foi possível conectar ao Supabase Auth. Verifique a URL e a Anon Key nas configurações do Supabase.',
    };
  };

  // Explicit tool to migrate locally stored accounts into Supabase Authentication
  const migrateLocalAccount = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();
    const supabase = getSupabase();

    if (!supabase) {
      return { success: false, error: 'Supabase não conectado. Configure as credenciais primeiro.' };
    }

    const localAccounts = getRegisteredAccounts();
    const matched = localAccounts.find((a) => a.email.toLowerCase() === cleanEmail);

    if (!matched) {
      return { success: false, error: 'Nenhuma conta local encontrada com este e-mail.' };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password: cleanPass,
        options: {
          data: { name: matched.name, role: matched.role },
        },
      });

      if (error) {
        if (error.message.includes('User already registered') || error.message.includes('already exists')) {
          return { success: true, error: 'Este e-mail já existia no Supabase Authentication! Você já pode entrar com sua senha.' };
        }
        return { success: false, error: `Erro no Supabase Auth: ${error.message}` };
      }

      if (data?.user) {
        // Upsert to profiles
        await supabase.from('profiles').upsert([
          {
            id: data.user.id,
            email: cleanEmail,
            name: matched.name,
            role: matched.role,
            created_at: new Date().toISOString(),
          },
        ]);

        if (data.session) {
          const profile: UserProfile = {
            id: data.user.id,
            email: cleanEmail,
            name: matched.name,
            role: matched.role,
          };
          setUser(profile);
          setIsSupabaseAuth(true);
          localStorage.setItem(USER_SESSION_KEY, JSON.stringify(profile));
          return { success: true };
        }

        return {
          success: true,
          error: 'Conta transferida com sucesso para o Supabase Authentication! Verifique seu e-mail caso a confirmação esteja ativada no painel Supabase.',
        };
      }
      return { success: false, error: 'Resposta inesperada do Supabase ao migrar.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao sincronizar conta com o Supabase' };
    }
  };

  // Complete and Strict Logout
  const logout = async (): Promise<void> => {
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Erro ao deslogar do Supabase:', err);
      }
    }

    // Clear active session
    localStorage.removeItem(USER_SESSION_KEY);
    setUser(null);
    setIsSupabaseAuth(false);
  };

  const localPendingAccounts = getRegisteredAccounts();

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isSupabaseAuth,
        localPendingAccounts,
        migrateLocalAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};
