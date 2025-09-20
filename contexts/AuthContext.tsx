import React, { createContext, useState, ReactNode, useCallback } from 'react';
import { User } from '../types';
import { MOCK_USERS } from '../constants';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false); // No initial loading as there's no async check
  const [error, setError] = useState<string | null>(null);

  const logout = useCallback(() => {
    setUser(null);
    setError(null);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setError(null);
    setLoading(true);

    // Simulate network delay for a better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    const foundUser = MOCK_USERS.find(u => u.email === email && u.password === password);

    if (foundUser) {
      setUser(foundUser);
      setLoading(false);
      return true;
    } else {
      setError('Email ou password inválidos. Verifique os dados de demonstração.');
      setLoading(false);
      return false;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
