import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCalculations } from '../hooks/useCalculations';
import CalculationView from './CalculationView';
import { Calculation, CalculationStatus, PrivateRide, VehicleCategory } from '../types';
import Card from './ui/Card';
import ReportsView from './ReportsView';
import Button from './ui/Button';
import DriverInfoView from './DriverInfoView';
import { BRAND_LOGOS } from '../constants';
import DriverDispatchOverlay from './driver/DriverDispatchOverlay';
import DriverLiveMapScreen from './driver/DriverLiveMapScreen';
import { dispatchService } from '../services/dispatchService';
import { db, firestore } from '../firebase';
import { 
  Power, 
  Navigation, 
  Car, 
  Zap, 
  DollarSign, 
  CheckCircle2, 
  Map as MapIcon, 
  Info, 
  FileText, 
  Sliders 
} from 'lucide-react';

type DriverMainTab = 'live_map' | 'info' | 'list' | 'details' | 'reports';

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
  // Default tab is 'live_map' for the Uber Driver Live Map experience
  const [currentTab, setCurrentTab] = useState<DriverMainTab>('live_map');
  const [selectedCalculation, setSelectedCalculation] = useState<Calculation | null>(null);

  // Online / Offline state
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return localStorage.getItem('asfalto_driver_online') === 'true';
  });
  const [todayCompletedRides, setTodayCompletedRides] = useState<PrivateRide[]>([]);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Helper to push location to Firestore and dispatchService
  // Helper to push location to Firestore and dispatchService
  const pushLocationUpdate = (
    online: boolean, 
    lat: number = 38.7369, 
    lng: number = -9.1426, 
    heading: number = 45,
    speed: number = 0,
    accuracy: number = 10
  ) => {
    if (!user) return;

    // 1. Dispatch Service
    dispatchService.updateDriverLocation({
      driverId: user.id,
      driverName: user.name || 'Motorista Asfalto',
      matricula: user.matricula || '45-TX-90',
      vehicleModel: user.vehicleModel || 'Tesla Model 3',
      categoria: (user.type?.includes('XL') ? 'XL_VAN' : 'BLACK_TESLA') as VehicleCategory,
      lat,
      lng,
      heading,
      isOnline: online,
      status: online ? 'LIVRE' : 'OFFLINE',
      lastUpdate: new Date()
    });

    // 2. Direct Firestore update: viaturas/{id}/localizacao
    const viaturaDocId = user.matricula ? user.matricula.replace(/[^a-zA-Z0-9]/g, '_') : (user.id || 'default_car');
    try {
      db.collection('viaturas').doc(viaturaDocId).set({
        matricula: user.matricula || '45-TX-90',
        motoristaId: user.id,
        motoristaNome: user.name || 'Motorista TVDE',
        modelo: user.vehicleModel || 'Tesla Model 3',
        isOnline: online,
        status: online ? 'EM_SERVICO' : 'OFFLINE',
        localizacao: {
          lat,
          lng,
          bearing: heading,
          heading,
          velocidade: speed,
          accuracy,
          timestamp: new Date().toISOString()
        },
        ultimaAtualizacao: firestore.FieldValue?.serverTimestamp ? firestore.FieldValue.serverTimestamp() : new Date()
      }, { merge: true }).catch(() => {});
    } catch (e) {
      console.debug('Firestore sync note:', e);
    }
  };

  // Toggle Online/Offline
  const handleToggleOnline = () => {
    const newState = !isOnline;
    setIsOnline(newState);
    localStorage.setItem('asfalto_driver_online', String(newState));
    pushLocationUpdate(newState);
  };

  // Ativar rastreio contínuo e de alta precisão no app do motorista
  useEffect(() => {
    if (!isOnline || !user) return;

    let watchId: number | null = null;
    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, heading, speed, accuracy } = position.coords;
          
          // Filtra sinais fracos para evitar imprecisões no mapa
          if (accuracy <= 20) {
            pushLocationUpdate(
              true, 
              latitude, 
              longitude, 
              heading || 0,
              speed || 0,
              accuracy
            );
          }
        },
        (error) => console.error("Erro ao obter GPS:", error),
        {
          enableHighAccuracy: true, // Força uso do chip GPS do telemóvel
          timeout: 5000,           // Tenta obter posição a cada 5s no máximo
          maximumAge: 0            // Não aceita posições em cache
        }
      );
    } else {
      pushLocationUpdate(true);
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
    setCurrentTab('details');
  };

  const todayEarnings = todayCompletedRides.reduce((acc, r) => acc + r.valorLiquidoMotorista, 0);

  const renderContent = () => {
    switch (currentTab) {
      case 'live_map':
        if (!user) return null;
        return (
          <DriverLiveMapScreen
            user={user}
            isOnline={isOnline}
            onToggleOnline={handleToggleOnline}
            onOpenProfile={() => setCurrentTab('info')}
            onOpenCalculations={() => setCurrentTab('list')}
            onRideCompleted={handleRideCompleted}
          />
        );

      case 'info':
        return <DriverInfoView onNavigateToCalculations={() => setCurrentTab('list')} />;

      case 'list':
        return (
          <DriverCalculationsList 
            onSelectCalculation={handleSelectCalculation} 
            onShowReports={() => setCurrentTab('reports')}
            onBack={() => setCurrentTab('live_map')}
          />
        );
      
      case 'details':
        if (!selectedCalculation) return null;
        return (
          <div className="w-full p-4 sm:p-6 lg:p-8">
            <div className="max-w-md mx-auto">
              <Button onClick={() => setCurrentTab('list')} className="mb-4">
                &larr; Voltar aos Meus Cálculos
              </Button>
              <CalculationView 
                calculation={selectedCalculation} 
                onAccept={() => setCurrentTab('list')}
              />
            </div>
          </div>
        );

      case 'reports':
        return (
          <div className="w-full p-4 sm:p-6 lg:p-8">
            <ReportsView onBack={() => setCurrentTab('list')} driverId={user?.id} />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col pb-16">
      {/* Top Bar for Sub-views (kept clean and compact when on Live Map) */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 sticky top-0 z-30 shadow-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Brand & Driver Info */}
          <div className="flex items-center gap-3">
            <img 
              src={BRAND_LOGOS.MOBILE} 
              alt="ROTA TVDE" 
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-xl object-cover border border-slate-700 shadow-md cursor-pointer"
              onClick={() => setCurrentTab('live_map')}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-black text-white">{user?.name || 'Motorista'}</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[10px] font-mono font-bold text-emerald-400">
                  {user?.matricula || '45-TX-90'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 hidden sm:inline">ROTA TVDE 5.0 • Modo Em Serviço</span>
            </div>
          </div>

          {/* Navigation Bar between Uber Driver Live Map, Informações, and Cálculos */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              id="tab-driver-livemap"
              onClick={() => setCurrentTab('live_map')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition ${
                currentTab === 'live_map'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mapa / Em Serviço</span>
              <span className="sm:hidden">Mapa</span>
            </button>

            <button
              id="tab-driver-info"
              onClick={() => setCurrentTab('info')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition ${
                currentTab === 'info'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Informações</span>
              <span className="sm:hidden">Info</span>
            </button>

            <button
              id="tab-driver-calculations"
              onClick={() => setCurrentTab('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1.5 transition ${
                currentTab === 'list' || currentTab === 'details' || currentTab === 'reports'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-850'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cálculos</span>
              <span className="sm:hidden">Cálculos</span>
            </button>
          </div>

          {/* Quick Online Status Badge on Top Bar */}
          <div className="flex items-center gap-2">
            {todayEarnings > 0 && (
              <span className="text-xs font-black text-emerald-400 px-2 py-1 rounded-lg bg-emerald-950/60 border border-emerald-500/30 hidden md:inline">
                +€{todayEarnings.toFixed(2)}
              </span>
            )}
            <button
              onClick={handleToggleOnline}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                isOnline 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
              title={isOnline ? 'Clique para ficar offline' : 'Clique para ficar online'}
            >
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span className="text-[11px] font-black">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {successToast && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 px-4 w-full max-w-md">
          <div className="p-3.5 bg-emerald-900/95 backdrop-blur-md border border-emerald-500 rounded-2xl text-emerald-200 text-xs font-bold flex items-center gap-3 shadow-2xl animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>{successToast}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {renderContent()}
      </div>

      {/* Overlay for Uber Driver incoming high-priority ride offers and step-by-step navigation */}
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
