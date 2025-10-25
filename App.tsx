
import React from 'react';
import { useAuth } from './hooks/useAuth';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import DriverDashboard from './components/DriverDashboard';
import { UserRole } from './types';

const App: React.FC = () => {
  const { user, loading } = useAuth();

  const renderDashboard = () => {
    if (!user) {
      return <Login />;
    }
    
    // Each dashboard component is now responsible for its own full-page layout
    return user.role === UserRole.ADMIN ? <AdminDashboard /> : <DriverDashboard />;
  };

  return (
    <div className="antialiased flex flex-col min-h-screen bg-gray-900 text-white">
      <main className="flex-1 flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-white text-xl">A carregar aplicação...</div>
          </div>
        ) : (
          renderDashboard()
        )}
      </main>
      <footer className="flex-shrink-0 text-center text-xs text-gray-500 py-4">
        Copyright © 2025 <a href="https://www.instagram.com/naldo_dicouto/" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-300">Dicouto</a>. Todos os direitos reservados.
      </footer>
    </div>
  );
};

export default App;
