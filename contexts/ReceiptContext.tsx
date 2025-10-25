import React, { createContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Receipt } from '../types';
import { db, firestore } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { MOCK_RECEIPTS } from '../demoData';

interface ReceiptContextType {
  receipts: Receipt[];
  loading: boolean;
  addReceipt: (receipt: Omit<Receipt, 'id'>) => Promise<void>;
  updateReceipt: (id: string, updates: Partial<Omit<Receipt, 'id'>>) => Promise<void>;
  deleteReceipt: (id: string) => Promise<void>;
}

export const ReceiptContext = createContext<ReceiptContextType | undefined>(undefined);

const parseLocalDate = (dateString: string): Date => {
    if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return new Date(NaN);
    }
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
};


export const ReceiptProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isDemo } = useAuth();

  useEffect(() => {
    if (isDemo) {
      setReceipts(MOCK_RECEIPTS);
      setLoading(false);
      return;
    }

    if (!user) {
      setReceipts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = db.collection('receipts').orderBy('date', 'desc').onSnapshot(
      (snapshot: any) => {
        const receiptList = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data(),
        })) as Receipt[];
        setReceipts(receiptList);
        setLoading(false);
      },
      (error: any) => {
        console.error("Error fetching receipts:", error);
        setReceipts([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, isDemo]);

  const addReceipt = useCallback(async (receiptData: Omit<Receipt, 'id'>) => {
    if (isDemo) {
      const newReceipt: Receipt = { ...receiptData, id: `demo-receipt-${Date.now()}`, date: parseLocalDate(receiptData.date as string) };
      setReceipts(prev => [newReceipt, ...prev]);
      return;
    }
    try {
      await db.collection('receipts').add({
          ...receiptData,
          date: parseLocalDate(receiptData.date as string),
      });
    } catch (error) {
      console.error("Error adding receipt: ", error);
    }
  }, [isDemo]);

  const updateReceipt = useCallback(async (id: string, updates: Partial<Omit<Receipt, 'id'>>) => {
    if (isDemo) {
        const safeUpdates = { ...updates };
        if (updates.date && typeof updates.date === 'string') {
            safeUpdates.date = parseLocalDate(updates.date);
        }
        setReceipts(prev => prev.map(receipt => receipt.id === id ? { ...receipt, ...safeUpdates } as Receipt : receipt));
        return;
    }
    try {
      const safeUpdates: any = { ...updates };
      if (updates.date && typeof updates.date === 'string') {
          safeUpdates.date = parseLocalDate(updates.date);
      }
      await db.collection('receipts').doc(id).update(safeUpdates);
    } catch (error) {
      console.error("Error updating receipt: ", error);
    }
  }, [isDemo]);

  const deleteReceipt = useCallback(async (id: string) => {
    if (isDemo) {
        setReceipts(prev => prev.filter(receipt => receipt.id !== id));
        return;
    }
    try {
      await db.collection('receipts').doc(id).delete();
    } catch (error) {
      console.error("Error deleting receipt: ", error);
    }
  }, [isDemo]);

  return (
    <ReceiptContext.Provider value={{ receipts, loading, addReceipt, updateReceipt, deleteReceipt }}>
      {children}
    </ReceiptContext.Provider>
  );
};
