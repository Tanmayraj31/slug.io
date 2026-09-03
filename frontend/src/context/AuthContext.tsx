import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthUserDto } from "@/types/api";
import * as authApi from "@/api/auth";
import { clearAccessToken } from "@/api/client";

interface AuthContextValue {
  user: AuthUserDto | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUserDto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const currentUser = await authApi.me();
        if (!cancelled) {
          setUser(currentUser);
        }
      } catch {
        // Access token expired or invalid. Try a silent refresh; `me()` already
        // triggers that on 401, so a failure here means the session is gone.
        clearAccessToken();
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    restoreSession();

    function handleSessionExpired() {
      setUser(null);
    }

    window.addEventListener("session-expired", handleSessionExpired);
    return () => {
      cancelled = true;
      window.removeEventListener("session-expired", handleSessionExpired);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user: loggedInUser } = await authApi.login({ email, password });
    setUser(loggedInUser);
  }, []);

  const register = useCallback(
    async (email: string, password: string, username?: string) => {
      await authApi.register({ email, password, username });
      // Auto-login after successful registration.
      const { user: loggedInUser } = await authApi.login({ email, password });
      setUser(loggedInUser);
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, login, register, logout }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
