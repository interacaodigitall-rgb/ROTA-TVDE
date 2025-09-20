import React, { createContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { Calculation, CalculationStatus, UserRole } from '../types';
import { useAuth } from '../hooks/useAuth';
import { MOCK_CALCULATIONS } from '../constants';

interface CalculationContextType {
  calculations: Calculation[];
  loading: boolean;
  error: string | null;
  addCalculation: (calculation: Omit<Calculation, 'id' | 'date'>) => Promise<void>;
  updateCalculationStatus: (id: string, status: CalculationStatus) => Promise<void>;
  updateCalculation: (id: string, updates: Partial<Omit<Calculation, 'id'>>) => Promise<void>;
}

export const CalculationContext = createContext<CalculationContextType | undefined>(undefined);

// Helper to parse YYYY-MM-DD string as local date to avoid timezone issues.
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
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setCalculations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    // Simulate fetching calculations from a local source
    setTimeout(() => {
        let userCalculations = MOCK_CALCULATIONS;
        if (user.role !== UserRole.ADMIN) {
            // In a real app, this filtering would be done by the backend query.
            userCalculations = MOCK_CALCULATIONS.filter(c => c.driverId === user.id);
        }
        // Make a copy to avoid mutating the constant
        setCalculations([...userCalculations].sort((a, b) => b.date.getTime() - a.date.getTime()));
        setLoading(false);
    }, 500); // Simulate network delay
  }, [user]);

  const addCalculation = useCallback(async (calculation: Omit<Calculation, 'id' | 'date'>) => {
    const newCalculation: Calculation = {
        ...calculation,
        id: `calc-demo-${Date.now()}`, // Create a unique ID for the demo session
        date: new Date(),
        // The form provides dates as strings, so we must parse them into Date objects
        periodStart: parseLocalDate(calculation.periodStart as unknown as string),
        periodEnd: parseLocalDate(calculation.periodEnd as unknown as string),
    };
    setCalculations(prev => [newCalculation, ...prev]);
  }, []);

  const updateCalculationStatus = useCallback(async (id: string, status: CalculationStatus) => {
    setCalculations(prev => 
        prev.map(calc => calc.id === id ? { ...calc, status, revisionNotes: status !== CalculationStatus.REVISION_REQUESTED ? '' : calc.revisionNotes } : calc)
    );
  }, []);

  const updateCalculation = useCallback(async (id: string, updates: Partial<Omit<Calculation, 'id'>>) => {
    const safeUpdates: any = { ...updates };
    // The form provides dates as strings, ensure they are Date objects before updating state
    if (updates.periodStart && typeof updates.periodStart === 'string') {
        safeUpdates.periodStart = parseLocalDate(updates.periodStart);
    }
    if (updates.periodEnd && typeof updates.periodEnd === 'string') {
        safeUpdates.periodEnd = parseLocalDate(updates.periodEnd);
    }

    setCalculations(prev => 
        prev.map(calc => calc.id === id ? { ...calc, ...safeUpdates } : calc)
    );
  }, []);

  return (
    <CalculationContext.Provider value={{ calculations, loading, error, addCalculation, updateCalculationStatus, updateCalculation }}>
      {children}
    </CalculationContext.Provider>
  );
};
