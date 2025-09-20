
import React, { createContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Iban } from '../types';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { MOCK_IBANS } from '../demoData';

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
  const { user, isDemo } = useAuth();

  useEffect(() => {
    if (isDemo) {
      setIbans(MOCK_IBANS);
      setLoading(false);
      return;
    }

    if (!user) {
      setIbans([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = db.collection('ibans').onSnapshot(
      (snapshot: any) => {
        const ibanList = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data(),
        })) as Iban[];
        setIbans(ibanList);
        setLoading(false);
      },
      (error: any) => {
        console.error("Error fetching IBANs:", error);
        setIbans([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, isDemo]);

  const addIban = useCallback(async (ibanData: Omit<Iban, 'id'>) => {
    if (isDemo) {
      const newIban: Iban = { ...ibanData, id: `demo-iban-${Date.now()}`};
      setIbans(prev => [...prev, newIban]);
      return;
    }
    try {
      await db.collection('ibans').add(ibanData);
    } catch (error) {
      console.error("Error adding IBAN: ", error);
    }
  }, [isDemo]);

  const updateIban = useCallback(async (id: string, updates: Partial<Omit<Iban, 'id'>>) => {
    if (isDemo) {
        setIbans(prev => prev.map(iban => iban.id === id ? { ...iban, ...updates } as Iban : iban));
        return;
    }
    try {
      await db.collection('ibans').doc(id).update(updates);
    } catch (error) {
      console.error("Error updating IBAN: ", error);
    }
  }, [isDemo]);

  const deleteIban = useCallback(async (id: string) => {
    if (isDemo) {
        setIbans(prev => prev.filter(iban => iban.id !== id));
        return;
    }
    try {
      await db.collection('ibans').doc(id).delete();
    } catch (error) {
      console.error("Error deleting IBAN: ", error);
    }
  }, [isDemo]);

  return (
    <IbanContext.Provider value={{ ibans, loading, addIban, updateIban, deleteIban }}>
      {children}
    </IbanContext.Provider>
  );
};
