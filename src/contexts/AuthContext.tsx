import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const USER_STORAGE_KEY = 'auth_user';
const TOKEN_STORAGE_KEY = 'auth_token';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData?.message ?? `Login failed with status ${response.status}`
      );
    }

    const data: { token: string; user: User } = await response.json();

    localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));

    setToken(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);

    setToken(null);
    setUser(null);

    window.location.href = '/';
  }, []);

  const isAuthenticated = user !== null && token !== null;

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
