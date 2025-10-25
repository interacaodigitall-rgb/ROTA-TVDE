import { useContext } from 'react';
import { ReceiptContext } from '../contexts/ReceiptContext';

export const useReceipts = () => {
  const context = useContext(ReceiptContext);
  if (context === undefined) {
    throw new Error('useReceipts must be used within a ReceiptProvider');
  }
  return context;
};
