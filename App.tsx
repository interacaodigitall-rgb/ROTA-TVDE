
import React from 'react';
import { useAuth } from './hooks/useAuth';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import DriverDashboard from './components/DriverDashboard';
import { UserRole } from './types';

const App: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">A carregar aplicação...</div>
      </div>
    );
  }

  const renderDashboard = () => {
    if (!user) {
      return <Login />;
    }
    
    // Each dashboard component is now responsible for its own full-page layout
    return user.role === UserRole.ADMIN ? <AdminDashboard /> : <DriverDashboard />;
  };

  return (
    <div className="antialiased">
      {renderDashboard()}
    </div>
  );
};

export default App;