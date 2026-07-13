import { createContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import * as authApi from '../api/auth';
import { authEvents } from '../api/authEvents';
import { tokenStorage } from '../api/tokenStorage';
import type { User } from '../api/types';
import { DEV_EMAIL, DEV_PASSWORD } from './devAuth';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  loginAsDevUser: () => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    tokenStorage.get().then((token) => {
      if (!token) {
        if (!cancelled) setIsLoading(false);
        return;
      }
      authApi
        .me()
        .then((currentUser) => {
          if (!cancelled) setUser(currentUser);
        })
        .catch(() => {
          tokenStorage.clear();
          if (!cancelled) setUser(null);
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => authEvents.onUnauthorized(() => setUser(null)), []);

  const login = useCallback(async (email: string, password: string) => {
    const token = await authApi.login(email, password);
    await tokenStorage.set(token.access_token);
    setUser(await authApi.me());
  }, []);

  const register = useCallback(
    async (email: string, password: string) => {
      await authApi.register(email, password);
      await login(email, password);
    },
    [login],
  );

  const loginAsDevUser = useCallback(async () => {
    try {
      await login(DEV_EMAIL, DEV_PASSWORD);
    } catch {
      // Account probably doesn't exist yet on this backend — create it.
      await register(DEV_EMAIL, DEV_PASSWORD);
    }
  }, [login, register]);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, register, loginAsDevUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
