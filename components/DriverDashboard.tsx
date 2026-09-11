
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCalculations } from '../hooks/useCalculations';
import CalculationView from './CalculationView';
import { Calculation, CalculationStatus, PrivateRide } from '../types';
import Card from './ui/Card';
import ReportsView from './ReportsView';
import Button from './ui/Button';
import DriverInfoView from './DriverInfoView';
import { BRAND_LOGOS } from '../constants';
import DriverDispatchOverlay from './driver/DriverDispatchOverlay';
import { dispatchService } from '../services/dispatchService';
import { 
  Power, 
  Navigation, 
  Car, 
  Zap, 
  Sparkles, 
  Tv, 
  DollarSign, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck 
} from 'lucide-react';

type DriverView = 'info' | 'list' | 'details' | 'reports';

const DriverCalculationsList: React.FC<{
  onSelectCalculation: (calc: Calculation) => void;
  onShowReports: () => void;
  onBack: () => void;
}> = ({ onSelectCalculation, onShowReports, onBack }) => {
  const { calculations, loading, error } = useCalculations();

  const toDate = (timestamp: any) => timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);

  const getStatusColor = (status: CalculationStatus) => {
    switch (status) {
      case CalculationStatus.ACCEPTED: return 'text-green-400';
      case CalculationStatus.REVISION_REQUESTED: return 'text-red-400';
      case CalculationStatus.PENDING: return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };
  
  return (
      <div className="w-full p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
           <div className="flex items-center justify-between mb-6">
             <Button onClick={onBack}>
               &larr; Voltar às Informações
             </Button>
             <div className="flex items-center gap-2">
               <img 
                 src={BRAND_LOGOS.MOBILE} 
                 alt="ROTA TVDE" 
                 referrerPolicy="no-referrer"
                 className="w-8 h-8 rounded-lg object-cover border border-slate-700 shadow-sm"
               />
               <span className="text-xs font-bold text-slate-300 hidden sm:inline">ROTA TVDE 5.0</span>
             </div>
           </div>
            <Card>
              <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <h3 className="text-xl font-semibold">Meus Resumos Semanais</h3>
                <Button onClick={onShowReports} variant="secondary">Ver Relatórios</Button>
              </div>
              {error && <p className="text-red-400">{error}</p>}
              {loading ? (
                <p className="text-gray-400 text-center py-4">A carregar...</p>
              ) : calculations.length > 0 ? (
                <ul className="space-y-4">
                  {calculations.map(calc => (
                    <li 
                      key={calc.id} 
                      className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 flex justify-between items-center hover:bg-gray-700/50 transition-colors cursor-pointer"
                      onClick={() => onSelectCalculation(calc)}
                    >
                      <div>
                        <p className="font-semibold text-white">Período: {toDate(calc.periodStart).toLocaleDateString('pt-PT')} - {toDate(calc.periodEnd).toLocaleDateString('pt-PT')}</p>
                        <p className="text-sm text-gray-400">Tipo: {calc.type}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${getStatusColor(calc.status)}`}>{calc.status}</p>
                        <p className="text-xs text-gray-500">Clique para ver detalhes</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 text-center py-4">Nenhum cálculo encontrado.</p>
              )}
            </Card>
        </div>
      </div>
  );
};


const DriverDashboard: React.FC = () => {
  const { user } = useAuth();
  const [view, setView] = useState<DriverView>('info');
  const [selectedCalculation, setSelectedCalculation] = useState<Calculation | null>(null);

  // Online / Offline state & GPS
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return localStorage.getItem('asfalto_driver_online') === 'true';
  });
  const [todayCompletedRides, setTodayCompletedRides] = useState<PrivateRide[]>([]);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Toggle Online/Offline
  const handleToggleOnline = () => {
    const newState = !isOnline;
    setIsOnline(newState);
    localStorage.setItem('asfalto_driver_online', String(newState));

    if (user) {
      dispatchService.updateDriverLocation({
        driverId: user.id,
        driverName: user.name || 'Motorista Asfalto',
        matricula: user.matricula || '45-TX-90',
        vehicleModel: user.vehicleModel || 'Tesla Model 3',
        categoria: 'BLACK_TESLA',
        lat: 38.7369,
        lng: -9.1426,
        isOnline: newState,
        status: newState ? 'LIVRE' : 'OFFLINE',
        lastUpdate: new Date()
      });
    }
  };

  // Watch GPS if online
  useEffect(() => {
    if (!isOnline || !user) return;

    let watchId: number | null = null;
    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          dispatchService.updateDriverLocation({
            driverId: user.id,
            driverName: user.name || 'Motorista Asfalto',
            matricula: user.matricula || '45-TX-90',
            vehicleModel: user.vehicleModel || 'Tesla Model 3',
            categoria: 'BLACK_TESLA',
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            heading: pos.coords.heading || undefined,
            isOnline: true,
            status: 'LIVRE',
            lastUpdate: new Date()
          });
        },
        (err) => {
          console.warn('GPS watch error, using simulated Lisbon coordinate:', err);
        },
        { enableHighAccuracy: true }
      );
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
  }, [isOnline, user]);

  const handleRideCompleted = (ride: PrivateRide) => {
    setTodayCompletedRides(prev => [ride, ...prev]);
    setSuccessToast(`Corrida privada concluída com sucesso! +€${ride.valorLiquidoMotorista.toFixed(2)} adicionado aos seus ganhos.`);
    setTimeout(() => setSuccessToast(null), 6000);
  };

  const handleSelectCalculation = (calc: Calculation) => {
    setSelectedCalculation(calc);
    setView('details');
  };

  const todayEarnings = todayCompletedRides.reduce((acc, r) => acc + r.valorLiquidoMotorista, 0);

  const renderContent = () => {
    switch (view) {
      case 'info':
        return <DriverInfoView onNavigateToCalculations={() => setView('list')} />;

      case 'list':
        return <DriverCalculationsList 
                  onSelectCalculation={handleSelectCalculation} 
                  onShowReports={() => setView('reports')}
                  onBack={() => setView('info')}
               />;
      
      case 'details':
        if (!selectedCalculation) return null;
        return (
            <div className="w-full p-4 sm:p-6 lg:p-8">
                 <div className="max-w-md mx-auto">
                    <Button onClick={() => setView('list')} className="mb-4">
                        &larr; Voltar aos Meus Cálculos
                    </Button>
                    <CalculationView 
                        calculation={selectedCalculation} 
                        onAccept={() => setView('list')}
                    />
                 </div>
            </div>
        );

      case 'reports':
        return (
            <div className="w-full p-4 sm:p-6 lg:p-8">
                 <ReportsView onBack={() => setView('list')} driverId={user?.id} />
            </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-24">
      {/* Driver Top Control Bar: Online/Offline Toggle & Live Dispatch Bar */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-30 shadow-xl">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Driver identity */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <img 
              src={BRAND_LOGOS.MOBILE} 
              alt="Asfalto Cativante" 
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-xl object-cover border border-slate-700 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white">{user?.name || 'Motorista'}</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[10px] font-mono font-bold text-slate-300">
                  {user?.matricula || '45-TX-90'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400">Portal Unificado ROTA TVDE 5.0</span>
            </div>
          </div>

          {/* Quick Metrics & Online/Offline Dispatch Switcher */}
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            {todayEarnings > 0 && (
              <div className="px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-right">
                <span className="text-[9px] font-bold text-emerald-400 uppercase block">Transfers Hoje</span>
                <span className="text-xs font-black text-emerald-300">+€{todayEarnings.toFixed(2)}</span>
              </div>
            )}

            {/* Toggle Button */}
            <button
              onClick={handleToggleOnline}
              className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-lg ${
                isOnline 
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 ring-2 ring-emerald-400/50' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
              }`}
            >
              <Power className={`w-4 h-4 ${isOnline ? 'text-white animate-pulse' : 'text-slate-500'}`} />
              {isOnline ? 'ONLINE (DISPONÍVEL TRANSFERS)' : 'OFFLINE (SEM DISPATCH)'}
            </button>
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="max-w-md mx-auto mt-4 px-4">
          <div className="p-4 bg-emerald-900/90 border border-emerald-500 rounded-2xl text-emerald-200 text-xs font-bold flex items-center gap-3 shadow-xl animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>{successToast}</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1">
        {renderContent()}
      </div>

      {/* Overlay for Uber Driver high-priority calls & active navigation */}
      {user && isOnline && (
        <DriverDispatchOverlay 
          user={user} 
          onRideCompleted={handleRideCompleted}
        />
      )}
    </div>
  );
};

export default DriverDashboard;

