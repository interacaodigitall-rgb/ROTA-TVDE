
import React from 'react';
import { useAuth } from './hooks/useAuth';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import DriverDashboard from './components/DriverDashboard';
import { UserRole } from './types';
import OwnerDashboard from './components/OwnerDashboard';
import { useServiceWorkerUpdater } from './hooks/useServiceWorkerUpdater';
import UpdateNotification from './components/UpdateNotification';
import TabletDisplayRoute from './components/adtech/TabletDisplayRoute';
import RiderApp from './components/rider/RiderApp';

const App: React.FC = () => {
  const { user, loading } = useAuth();
  const { isUpdateAvailable, updateServiceWorker } = useServiceWorkerUpdater();

  // Check if current path or query/hash indicates tablet mode
  const currentPath = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);
  
  const isTabletMode = 
    currentPath === '/tablet' || 
    currentPath === '/display' || 
    currentPath === '/kiosk' ||
    searchParams.get('tablet') === 'true' ||
    searchParams.get('mode') === 'tablet' ||
    window.location.hash.includes('tablet');

  const isRiderMode = 
    currentPath === '/rider' || 
    currentPath === '/chamar' || 
    currentPath === '/pedir' ||
    searchParams.get('rider') === 'true' ||
    searchParams.get('chamar') === 'true' ||
    searchParams.get('mode') === 'rider' ||
    window.location.hash.includes('rider') ||
    window.location.hash.includes('chamar');

  if (isTabletMode) {
    return <TabletDisplayRoute onClose={() => { window.location.href = '/'; }} />;
  }

  if (isRiderMode) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col">
        <RiderApp onBackToMain={() => { window.location.href = '/'; }} />
      </div>
    );
  }

  const renderDashboard = () => {
    if (!user) {
      return <Login />;
    }
    
    // Each dashboard component is now responsible for its own full-page layout
    if (user.role === UserRole.ADMIN || user.role === UserRole.MANAGER) {
      return <AdminDashboard />;
    }
    if (user.role === UserRole.OWNER) {
      return <OwnerDashboard />;
    }
    return <DriverDashboard />;
  };

  return (
    <div className="antialiased flex flex-col min-h-screen bg-gray-900 text-white">
      {isUpdateAvailable && <UpdateNotification onUpdate={updateServiceWorker} />}
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