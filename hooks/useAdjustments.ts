import { useContext } from 'react';
import { AdjustmentContext } from '../contexts/AdjustmentContext';

export const useAdjustments = () => {
  const context = useContext(AdjustmentContext);
  if (context === undefined) {
    throw new Error('useAdjustments must be used within an AdjustmentProvider');
  }
  return context;
};
