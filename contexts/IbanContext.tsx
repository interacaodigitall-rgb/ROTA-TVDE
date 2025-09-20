
import React, { createContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Iban } from '../types';
import { db } from '../firebase';
import { useAuth } from '../hooks/useAuth';

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
  }, [user]);

  const addIban = useCallback(async (ibanData: Omit<Iban, 'id'>) => {
    try {
      await db.collection('ibans').add(ibanData);
    } catch (error) {
      console.error("Error adding IBAN: ", error);
    }
  }, []);

  const updateIban = useCallback(async (id: string, updates: Partial<Omit<Iban, 'id'>>) => {
    try {
      await db.collection('ibans').doc(id).update(updates);
    } catch (error) {
      console.error("Error updating IBAN: ", error);
    }
  }, []);

  const deleteIban = useCallback(async (id: string) => {
    try {
      await db.collection('ibans').doc(id).delete();
    } catch (error) {
      console.error("Error deleting IBAN: ", error);
    }
  }, []);

  return (
    <IbanContext.Provider value={{ ibans, loading, addIban, updateIban, deleteIban }}>
      {children}
    </IbanContext.Provider>
  );
};
