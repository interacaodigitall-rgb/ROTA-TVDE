
import { useContext } from 'react';
import { CalculationContext } from '../contexts/CalculationContext';

export const useCalculations = () => {
  const context = useContext(CalculationContext);
  if (context === undefined) {
    throw new Error('useCalculations must be used within a CalculationProvider');
  }
  return context;
};
