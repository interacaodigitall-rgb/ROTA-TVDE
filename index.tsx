
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { CalculationProvider } from './contexts/CalculationContext';
import { UserProvider } from './contexts/UserContext';
import { IbanProvider } from './contexts/IbanContext';
import { ReceiptProvider } from './contexts/ReceiptContext';
import { AdjustmentProvider } from './contexts/AdjustmentContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <UserProvider>
        <IbanProvider>
          <ReceiptProvider>
            <AdjustmentProvider>
              <CalculationProvider>
                <App />
              </CalculationProvider>
            </AdjustmentProvider>
          </ReceiptProvider>
        </IbanProvider>
      </UserProvider>
    </AuthProvider>
  </React.StrictMode>
);