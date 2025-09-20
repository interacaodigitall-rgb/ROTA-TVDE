import React, { createContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Iban } from '../types';
import { useAuth } from '../hooks/useAuth';
import { MOCK_IBANS } from '../constants';

interface IbanContextType {
  ibans: Iban[];
  loading: boolean;
  addIban: (iban: Omit<Iban, 'id'>) => Promise<void>;
  updateIban: (id: string, updates: Partial<Omit<Iban, 'id'>>) => Promise<void>;
  deleteIban: (id: string) => Promise<void>;
}

export const IbanContext = createContext<IbanContextType | undefined>(undefined);

export const IbanProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [ibans, setIbans] = useState<Iban[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setIbans([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    // Simulate fetching IBANs from a local source
    setTimeout(() => {
      // Make a copy to ensure our local state is mutable
      setIbans([...MOCK_IBANS]); 
      setLoading(false);
    }, 300); // Simulate network delay
  }, [user]);

  const addIban = useCallback(async (ibanData: Omit<Iban, 'id'>) => {
    const newIban = {
        ...ibanData,
        id: `iban-demo-${Date.now()}`, // Create a unique ID for the demo session
    };
    setIbans(prev => [...prev, newIban]);
  }, []);

  const updateIban = useCallback(async (id: string, updates: Partial<Omit<Iban, 'id'>>) => {
    setIbans(prev => 
        prev.map(iban => iban.id === id ? { ...iban, ...updates } : iban)
    );
  }, []);

  const deleteIban = useCallback(async (id: string) => {
    setIbans(prev => prev.filter(iban => iban.id !== id));
  }, []);

  return (
    <IbanContext.Provider value={{ ibans, loading, addIban, updateIban, deleteIban }}>
      {children}
    </IbanContext.Provider>
  );
};
