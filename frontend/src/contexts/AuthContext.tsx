/**
 * AuthContext.tsx
 *
 * Centralized React authentication context.
 * Exposes authentication state and actions across the DentiFlow application.
 * Manages session validation on startup and restoration across page refreshes.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { User, UserRole } from '../types';
import { AuthService } from '../utils/authService';
import { StorageService } from '../utils/storage';

export interface AuthContextValue {
  currentUser: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login(identifier: string, password: string, roleHint?: UserRole): Promise<{ success: boolean; error?: string }>;
  register(
    name: string,
    email: string,
    phone: string,
    password: string,
    role: 'patient' | 'doctor'
  ): Promise<{ success: boolean; error?: string }>;
  logout(): void;
  refreshSession(): Promise<User | null>;
  isAuthorized(tab: string): boolean;
  updateCurrentUser(updated: User): void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => StorageService.getCurrentUser());
  const [isLoading, setIsLoading] = useState(true);
  const initialized = useRef(false);

  // Validate and restore session on mount
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    (async () => {
      try {
        const validatedUser = await AuthService.checkSession();
        if (validatedUser) {
          setCurrentUser(validatedUser);
        } else {
          StorageService.clearCurrentUser();
          setCurrentUser(null);
        }
      } catch {
        // Fallback to locally cached user
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (
    identifier: string,
    password: string,
    roleHint?: UserRole
  ): Promise<{ success: boolean; error?: string }> => {
    const result = await AuthService.login(identifier, password, roleHint);
    if (result.success && result.user) {
      setCurrentUser(result.user);
    }
    return { success: result.success, error: result.error };
  }, []);

  const register = useCallback(async (
    name: string,
    email: string,
    phone: string,
    password: string,
    role: 'patient' | 'doctor'
  ): Promise<{ success: boolean; error?: string }> => {
    const result = await AuthService.register(name, email, phone, password, role);
    if (result.success && result.user) {
      setCurrentUser(result.user);
    }
    return { success: result.success, error: result.error };
  }, []);

  const logout = useCallback(() => {
    AuthService.logout(currentUser);
    setCurrentUser(null);
  }, [currentUser]);

  const refreshSession = useCallback(async (): Promise<User | null> => {
    const user = await AuthService.checkSession();
    setCurrentUser(user);
    return user;
  }, []);

  const isAuthorized = useCallback((tab: string): boolean => {
    return AuthService.isAuthorizedForTab(currentUser, tab);
  }, [currentUser]);

  const updateCurrentUser = useCallback((updated: User) => {
    setCurrentUser(updated);
    StorageService.updateUser(updated);
  }, []);

  const value: AuthContextValue = {
    currentUser,
    isLoading,
    isAuthenticated: currentUser !== null,
    login,
    register,
    logout,
    refreshSession,
    isAuthorized,
    updateCurrentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth() must be used within an <AuthProvider>');
  }
  return ctx;
}
