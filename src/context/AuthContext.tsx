import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { getSupabase } from '../lib/supabase';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, pass: string, name: string, role: UserProfile['role']) => Promise<{ success: boolean; error?: string }>;
  quickLoginAs: (role: UserProfile['role']) => void;
  logout: () => Promise<void>;
  isSupabaseAuth: boolean;
}

const DEFAULT_USERS: Record<string, UserProfile> = {
  admin: {
    id: 'usr_admin',
    email: 'gerente@oficina.com',
    name: 'João da Silva (Gerente Geral)',
    role: 'Administrador',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=faces',
  },
  funileiro: {
    id: 'usr_funileiro',
    email: 'marcos@oficina.com',
    name: 'Marcos Funileiro',
    role: 'Funileiro',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop&crop=faces',
  },
  pintor: {
    id: 'usr_pintor',
    email: 'roberto@oficina.com',
    name: 'Roberto Pintor',
    role: 'Pintor',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=120&h=120&fit=crop&crop=faces',
  },
  mecanico: {
    id: 'usr_mecanico',
    email: 'lucas@oficina.com',
    name: 'Lucas Montador e Mecânico',
    role: 'Mecânico',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&crop=faces',
  },
};

const USER_SESSION_KEY = 'oficina_active_session';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSupabaseAuth, setIsSupabaseAuth] = useState<boolean>(false);

  useEffect(() => {
    // 1. Try to see if Supabase has an active session
    const supabase = getSupabase();
    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || 'usuario@supabase.com',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário Supabase',
            role: session.user.user_metadata?.role || 'Administrador',
            avatar: session.user.user_metadata?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop',
          });
          setIsSupabaseAuth(true);
          setLoading(false);
          return;
        }
      }).catch(err => {
        console.warn('Supabase getSession error:', err);
      });

      // Listen for auth state changes
      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || 'usuario@supabase.com',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuário Supabase',
            role: session.user.user_metadata?.role || 'Administrador',
            avatar: session.user.user_metadata?.avatar,
          });
          setIsSupabaseAuth(true);
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }

    // 2. Check local session
    const saved = localStorage.getItem(USER_SESSION_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
      } catch {
        setUser(DEFAULT_USERS.admin);
      }
    } else {
      // Default to admin for seamless onboarding
      setUser(DEFAULT_USERS.admin);
      localStorage.setItem(USER_SESSION_KEY, JSON.stringify(DEFAULT_USERS.admin));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) {
        // Fallback or explicit error
        if (email === 'oficina@demo.com' && pass === '123456') {
          quickLoginAs('Administrador');
          return { success: true };
        }
        return { success: false, error: error.message };
      }
      if (data.user) {
        const profile: UserProfile = {
          id: data.user.id,
          email: data.user.email || email,
          name: data.user.user_metadata?.name || email.split('@')[0],
          role: data.user.user_metadata?.role || 'Administrador',
          avatar: data.user.user_metadata?.avatar,
        };
        setUser(profile);
        setIsSupabaseAuth(true);
        localStorage.setItem(USER_SESSION_KEY, JSON.stringify(profile));
        return { success: true };
      }
    }

    // Local / Demo Login
    if (email === 'oficina@demo.com' || email.includes('admin') || email.includes('gerente')) {
      setUser(DEFAULT_USERS.admin);
      localStorage.setItem(USER_SESSION_KEY, JSON.stringify(DEFAULT_USERS.admin));
      return { success: true };
    }

    const matched = Object.values(DEFAULT_USERS).find(u => u.email.toLowerCase() === email.toLowerCase());
    if (matched) {
      setUser(matched);
      localStorage.setItem(USER_SESSION_KEY, JSON.stringify(matched));
      return { success: true };
    }

    // Create ad-hoc user for any other email
    const adHocUser: UserProfile = {
      id: 'usr_' + Date.now(),
      email,
      name: email.split('@')[0],
      role: 'Administrador',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop',
    };
    setUser(adHocUser);
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(adHocUser));
    return { success: true };
  };

  const register = async (
    email: string,
    pass: string,
    name: string,
    role: UserProfile['role']
  ): Promise<{ success: boolean; error?: string }> => {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: {
          data: { name, role },
        },
      });
      if (error) {
        return { success: false, error: error.message };
      }
      if (data.user) {
        const profile: UserProfile = {
          id: data.user.id,
          email: data.user.email || email,
          name,
          role,
        };
        setUser(profile);
        setIsSupabaseAuth(true);
        localStorage.setItem(USER_SESSION_KEY, JSON.stringify(profile));
        return { success: true };
      }
    }

    // Local account creation
    const newUser: UserProfile = {
      id: 'usr_' + Date.now(),
      email,
      name,
      role,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop',
    };
    setUser(newUser);
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(newUser));
    return { success: true };
  };

  const quickLoginAs = (role: UserProfile['role']) => {
    const key = Object.keys(DEFAULT_USERS).find(k => DEFAULT_USERS[k].role === role) || 'admin';
    const profile = DEFAULT_USERS[key];
    setUser(profile);
    setIsSupabaseAuth(false);
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(profile));
  };

  const logout = async () => {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.auth.signOut().catch(() => {});
    }
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
        quickLoginAs,
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
