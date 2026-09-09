
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { CompanyProvider } from './contexts/CompanyContext';
import { CalculationProvider } from './contexts/CalculationContext';
import { UserProvider } from './contexts/UserContext';
import { IbanProvider } from './contexts/IbanContext';
import { ReceiptProvider } from './contexts/ReceiptContext';
import { AdjustmentProvider } from './contexts/AdjustmentContext';
import { AdTechProvider } from './contexts/AdTechContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <CompanyProvider>
        <UserProvider>
          <IbanProvider>
            <ReceiptProvider>
              <AdjustmentProvider>
                <CalculationProvider>
                  <AdTechProvider>
                    <App />
                  </AdTechProvider>
                </CalculationProvider>
              </AdjustmentProvider>
            </ReceiptProvider>
          </IbanProvider>
        </UserProvider>
      </CompanyProvider>
    </AuthProvider>
  </React.StrictMode>
);
