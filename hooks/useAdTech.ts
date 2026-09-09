import { useContext } from 'react';
import { AdTechContext } from '../contexts/AdTechContext';

export const useAdTech = () => {
  const context = useContext(AdTechContext);
  if (!context) {
    throw new Error('useAdTech must be used within an AdTechProvider');
  }
  return context;
};
