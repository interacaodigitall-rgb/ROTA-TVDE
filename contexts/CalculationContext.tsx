


import React, { createContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Calculation, CalculationStatus, UserRole } from '../types';
import { db, firestore } from '../firebase';
import { useAuth } from '../hooks/useAuth';
import { MOCK_CALCULATIONS } from '../demoData';

interface CalculationContextType {
  calculations: Calculation[];
  loading: boolean;
  error: string | null;
  addCalculation: (calculation: Omit<Calculation, 'id'>, adjustmentIdsToResolve?: string[]) => Promise<void>;
  updateCalculationStatus: (id: string, status: CalculationStatus) => Promise<void>;
  updateCalculation: (id: string, updates: Partial<Omit<Calculation, 'id'>>) => Promise<void>;
  deleteCalculation: (id: string) => Promise<void>;
}

export const CalculationContext = createContext<CalculationContextType | undefined>(undefined);

// Helper to parse YYYY-MM-DD string as local date to avoid timezone issues.
// new Date('YYYY-MM-DD') creates a date at UTC midnight, which can cause off-by-one day errors.
const parseLocalDate = (dateString: string): Date => {
    if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return new Date(NaN); // Return an invalid date for bad input
    }
    const [year, month, day] = dateString.split('-').map(Number);
    // Month is 0-indexed in JavaScript Date constructor (0=Jan, 11=Dec)
    return new Date(year, month - 1, day);
};

export const CalculationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isDemo } = useAuth();

  useEffect(() => {
    if (isDemo) {
        setCalculations(MOCK_CALCULATIONS);
        setLoading(false);
        setError(null);
        return;
    }

    if (!user) {
      setCalculations([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    let query: any;
    const collectionRef = db.collection('calculations');

    if (user.role === UserRole.ADMIN || user.role === UserRole.OWNER) {
        query = collectionRef.orderBy('date', 'desc');
    } else {
        query = collectionRef.where('driverId', '==', user.id).orderBy('date', 'desc');
    }

    const unsubscribe = query.onSnapshot((snapshot: any) => {
        const calcs = snapshot.docs.map((doc: any) => ({
            id: doc.id,
            ...doc.data(),
        } as Calculation));
        setCalculations(calcs);
        setLoading(false);
        setError(null);
    }, (err: any) => {
        console.error("Error fetching calculations: ", err);
        // Check for specific Firestore missing index error
        if (err.code === 'failed-precondition') {
            const indexCreationUrl = `https://console.firebase.google.com/v1/r/project/meus-calculosv1/firestore/indexes?create_composite=ClRwcm9qZWN0cy9tZXVzLWNhbGN1bG9zdjEvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL2NhbGN1bGF0aW9ucy9pbmRleGVzL18QARoMCghkcml2ZXJJZBABGggKBGRhdGUQAhoMCghfX25hbWVfXxAC`;
            setError(`A base de dados necessita de uma configuração (índice) para carregar os seus cálculos. Por favor, aceda ao seguinte link, clique em 'Criar', e aguarde alguns minutos pela criação do índice. Depois, recarregue esta página. Link: ${indexCreationUrl}`);
        } else {
            setError("Ocorreu um erro ao carregar os cálculos. Verifique a sua ligação ou tente mais tarde.");
        }
        setCalculations([]);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user, isDemo]);

  const addCalculation = useCallback(async (calculation: Omit<Calculation, 'id'>, adjustmentIdsToResolve: string[] = []) => {
    if (isDemo) {
        const newCalc: Calculation = {
            ...calculation,
            id: `demo-calc-${Date.now()}`,
            date: new Date(),
            periodStart: parseLocalDate(calculation.periodStart as string),
            periodEnd: parseLocalDate(calculation.periodEnd as string),
        };
        setCalculations(prev => [newCalc, ...prev]);
        return;
    }
    try {
        const batch = db.batch();
        
        const newCalcRef = db.collection('calculations').doc();
        const newCalculation = {
            ...calculation,
            date: firestore.FieldValue.serverTimestamp(),
            periodStart: parseLocalDate(calculation.periodStart as string),
            periodEnd: parseLocalDate(calculation.periodEnd as string),
        };
        batch.set(newCalcRef, newCalculation);

        if (adjustmentIdsToResolve && adjustmentIdsToResolve.length > 0) {
            adjustmentIdsToResolve.forEach(adjId => {
                const adjRef = db.collection('pendingAdjustments').doc(adjId);
                batch.update(adjRef, {
                    status: 'RESOLVED',
                    resolvedInCalculationId: newCalcRef.id,
                });
            });
        }
        
        await batch.commit();

    } catch (error) {
      console.error("Error adding calculation: ", error);
    }
  }, [isDemo]);

  const updateCalculationStatus = useCallback(async (id: string, status: CalculationStatus) => {
    if (isDemo) {
        setCalculations(prev => prev.map(c => c.id === id ? { ...c, status, revisionNotes: status === CalculationStatus.REVISION_REQUESTED ? c.revisionNotes : '' } : c));
        return;
    }
    try {
      await db.collection('calculations').doc(id).update({ status });
    } catch (error) {
      console.error("Error updating calculation status: ", error);
    }
  }, [isDemo]);

  const updateCalculation = useCallback(async (id: string, updates: Partial<Omit<Calculation, 'id'>>) => {
    if (isDemo) {
        setCalculations(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
        return;
    }
    try {
        const safeUpdates: any = { ...updates };
        if (updates.periodStart && typeof updates.periodStart === 'string') {
            safeUpdates.periodStart = parseLocalDate(updates.periodStart);
        }
        if (updates.periodEnd && typeof updates.periodEnd === 'string') {
            safeUpdates.periodEnd = parseLocalDate(updates.periodEnd);
        }
        await db.collection('calculations').doc(id).update(safeUpdates);
    } catch (error) {
        console.error("Error updating calculation: ", error);
    }
  }, [isDemo]);

  const deleteCalculation = useCallback(async (id: string) => {
    if (isDemo) {
        setCalculations(prev => prev.filter(c => c.id !== id));
        return;
    }
    try {
      await db.collection('calculations').doc(id).delete();
    } catch (error) {
      console.error("Error deleting calculation: ", error);
    }
  }, [isDemo]);

  return (
    <CalculationContext.Provider value={{ calculations, loading, error, addCalculation, updateCalculationStatus, updateCalculation, deleteCalculation }}>
      {children}
    </CalculationContext.Provider>
  );
};