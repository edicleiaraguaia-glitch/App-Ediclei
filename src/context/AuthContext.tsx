import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, RegisteredUserAccount } from '../types';
import { getSupabase } from '../lib/supabase';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, pass: string, name: string, role: UserProfile['role']) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isSupabaseAuth: boolean;
}

const USER_SESSION_KEY = 'oficina_active_session_v3';
const REGISTERED_USERS_KEY = 'oficina_registered_users_v3';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to get registered accounts
function getRegisteredAccounts(): RegisteredUserAccount[] {
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
      if (supabase) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user && isMounted) {
            const profile: UserProfile = {
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário',
              role: session.user.user_metadata?.role || 'Administrador',
              avatar: session.user.user_metadata?.avatar,
            };
            setUser(profile);
            setIsSupabaseAuth(true);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.warn('Erro ao verificar sessão Supabase:', err);
        }
      }

      // 2. Check local authenticated session
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

      // 3. If no active session, STRICTLY do NOT log in. Stay at login screen!
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
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!isMounted) return;
        if (session?.user) {
          const profile: UserProfile = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário',
            role: session.user.user_metadata?.role || 'Administrador',
            avatar: session.user.user_metadata?.avatar,
          };
          setUser(profile);
          setIsSupabaseAuth(true);
          localStorage.setItem(USER_SESSION_KEY, JSON.stringify(profile));
        } else {
          // If explicitly signed out in Supabase
          if (isSupabaseAuth) {
            setUser(null);
            setIsSupabaseAuth(false);
            localStorage.removeItem(USER_SESSION_KEY);
          }
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

    const supabase = getSupabase();

    // 1. Try Supabase Auth first
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password: cleanPass,
        });

        if (!error && data?.user) {
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
      } catch (authErr) {
        console.warn('Tentativa no Supabase Auth falhou, verificando base de dados:', authErr);
      }
    }

    // 2. Validate against registered accounts registry
    const accounts = getRegisteredAccounts();
    const matchedAccount = accounts.find((acc) => acc.email.toLowerCase() === cleanEmail);

    if (!matchedAccount) {
      return {
        success: false,
        error: 'E-mail ou usuário não cadastrado. Por favor, crie uma conta primeiro.',
      };
    }

    // Strict password comparison
    if (matchedAccount.passwordHash !== cleanPass) {
      return {
        success: false,
        error: 'Senha incorreta. Verifique suas credenciais e tente novamente.',
      };
    }

    // Login successful
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

    // Check if already registered
    const existingAccounts = getRegisteredAccounts();
    const isAlreadyRegistered = existingAccounts.some((acc) => acc.email.toLowerCase() === cleanEmail);
    if (isAlreadyRegistered) {
      return { success: false, error: 'Este e-mail já está cadastrado. Por favor, faça login.' };
    }

    const newUserId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const newAccount: RegisteredUserAccount = {
      id: newUserId,
      email: cleanEmail,
      passwordHash: cleanPass,
      name: cleanName,
      role,
      createdAt: new Date().toISOString(),
    };

    // 1. Register with Supabase
    const supabase = getSupabase();
    if (supabase) {
      try {
        // Try Supabase Auth
        await supabase.auth.signUp({
          email: cleanEmail,
          password: cleanPass,
          options: {
            data: { name: cleanName, role },
          },
        });
      } catch (err) {
        console.warn('Supabase auth signUp background notice:', err);
      }

      // Try recording in Supabase profiles/sync
      try {
        await supabase.from('profiles').upsert([
          {
            id: newUserId,
            email: cleanEmail,
            name: cleanName,
            role,
            created_at: newAccount.createdAt,
          },
        ]);
      } catch (err) {
        console.warn('Supabase profiles upsert notice:', err);
      }
    }

    // 2. Persist in registered users registry
    saveRegisteredAccounts([...existingAccounts, newAccount]);

    // 3. Create active session for the registered user
    const userProfile: UserProfile = {
      id: newUserId,
      email: cleanEmail,
      name: cleanName,
      role,
    };

    setUser(userProfile);
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(userProfile));

    return { success: true };
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

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isSupabaseAuth,
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
