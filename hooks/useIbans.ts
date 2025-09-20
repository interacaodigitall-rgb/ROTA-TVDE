
import { useContext } from 'react';
import { IbanContext } from '../contexts/IbanContext';

export const useIbans = () => {
  const context = useContext(IbanContext);
  if (context === undefined) {
    throw new Error('useIbans must be used within an IbanProvider');
  }
  return context;
};
