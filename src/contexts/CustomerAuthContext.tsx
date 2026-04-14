import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../services/api';

export interface CustomerUser {
  id: number;
  name: string;
  phone: string;
  email: string;
}

interface CustomerAuthContextValue {
  customer: CustomerUser | null;
  token: string | null;
  isLoggedIn: boolean;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => void;
}

const CUSTOMER_TOKEN_KEY = 'customer_token';
const CUSTOMER_USER_KEY = 'customer_user';

const CustomerAuthContext = createContext<CustomerAuthContextValue | undefined>(undefined);

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<CustomerUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(CUSTOMER_TOKEN_KEY);
      const storedUser = localStorage.getItem(CUSTOMER_USER_KEY);
      if (storedToken && storedUser) {
        setToken(storedToken);
        setCustomer(JSON.parse(storedUser));
      }
    } catch {
      localStorage.removeItem(CUSTOMER_TOKEN_KEY);
      localStorage.removeItem(CUSTOMER_USER_KEY);
    }
  }, []);

  const login = useCallback(async (phone: string, password: string): Promise<void> => {
    const response = await api.post<{ token: string; customer: CustomerUser } | { error?: string; message?: string }>(
      '/customers/login',
      { phone, password },
      { validateStatus: (status) => status < 500 }
    );

    if (response.status === 401) {
      const apiMessage =
        (response.data as { error?: string; message?: string } | undefined)?.error ??
        (response.data as { error?: string; message?: string } | undefined)?.message ??
        'Telefone ou senha incorretos.';
      throw new Error(apiMessage);
    }

    if (response.status < 200 || response.status >= 300) {
      throw new Error('Erro ao fazer login');
    }

    const data = response.data as { token: string; customer: CustomerUser };
    localStorage.setItem(CUSTOMER_TOKEN_KEY, data.token);
    localStorage.setItem(CUSTOMER_USER_KEY, JSON.stringify(data.customer));
    setToken(data.token);
    setCustomer(data.customer);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(CUSTOMER_TOKEN_KEY);
    localStorage.removeItem(CUSTOMER_USER_KEY);
    setToken(null);
    setCustomer(null);
  }, []);

  return (
    <CustomerAuthContext.Provider value={{ customer, token, isLoggedIn: !!customer && !!token, login, logout }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth(): CustomerAuthContextValue {
  const context = useContext(CustomerAuthContext);
  if (!context) throw new Error('useCustomerAuth must be used within CustomerAuthProvider');
  return context;
}
