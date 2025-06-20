// import React, { createContext, useContext, useState } from 'react';

// type AuthContextType = {
//   isAuthenticated: boolean;
//   updateAuthStatus: (status: boolean) => void;
// };

// const AuthContext = createContext<AuthContextType>({
//   isAuthenticated: false,
//   updateAuthStatus: () => {},
// });

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const [isAuthenticated, setIsAuthenticated] = useState(false);

//   const updateAuthStatus = (status: boolean) => {
//     setIsAuthenticated(status);
//   };

//   return (
//     <AuthContext.Provider value={{ isAuthenticated, updateAuthStatus }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export const useAuth = () => {

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/Superbase';
import { Platform } from 'react-native';


interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize session
    const initializeSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
      } catch (error) {
        console.error('Error loading session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const getRedirectURL = () => {
    if (Platform.OS === 'web') {
      return `${window.location.origin}/auth/callback`;
    }
    return 'your-app-scheme://auth/callback';
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: getRedirectURL(),
      }
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getRedirectURL(),
    });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      isLoading, 
      signUp, 
      signIn, 
      signOut,
      resetPassword 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};