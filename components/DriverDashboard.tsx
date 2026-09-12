import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCalculations } from '../hooks/useCalculations';
import CalculationView from './CalculationView';
import { Calculation, CalculationStatus, PrivateRide, VehicleCategory } from '../types';
import Card from './ui/Card';
import ReportsView from './ReportsView';
import Button from './ui/Button';
import { BRAND_LOGOS } from '../constants';
import DriverDispatchOverlay from './driver/DriverDispatchOverlay';
import DriverLiveMapScreen from './driver/DriverLiveMapScreen';
import DriverRequirementsView from './driver/DriverRequirementsView';
import DriverProfileView from './driver/DriverProfileView';
import DriverDrawerNavigation from './driver/DriverDrawerNavigation';
import { 
  DriverRideHistoryModal, 
  DriverCampaignsModal, 
  DriverScheduledRidesModal 
} from './driver/DriverDrawerModals';
import { dispatchService } from '../services/dispatchService';
import { db, firestore } from '../firebase';
import { 
  Navigation, 
  Calculator, 
  ClipboardList, 
  User as UserIcon,
  CheckCircle2, 
  FileText, 
  BarChart3,
  Calendar,
  ChevronRight,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowLeft,
  Menu
} from 'lucide-react';

export type DriverTab = 'rides' | 'calculations' | 'requirements' | 'profile';
type CalcSubView = 'list' | 'details' | 'reports';

const DriverCalculationsList: React.FC<{
  onSelectCalculation: (calc: Calculation) => void;
  onShowReports: () => void;
}> = ({ onSelectCalculation, onShowReports }) => {
  const { calculations, loading, error } = useCalculations();

  const toDate = (timestamp: any) => timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);

  const getStatusColor = (status: CalculationStatus) => {
    switch (status) {
      case CalculationStatus.ACCEPTED: return 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40';
      case CalculationStatus.REVISION_REQUESTED: return 'text-rose-400 bg-rose-950/60 border-rose-500/40';
      case CalculationStatus.PENDING: return 'text-amber-400 bg-amber-950/60 border-amber-500/40';
      default: return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };
  
  return (
    <div className="w-full text-slate-100 font-sans p-4 sm:p-6 lg:p-8 space-y-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-purple-950/80 border border-purple-500/40 text-purple-400">
                  <Calculator className="w-5 h-5" />
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Resumos Semanais & Acertos
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Histórico de faturas, rendimentos Uber/Bolt, combustível, portagens e bónus AdTech.
              </p>
            </div>

            <Button onClick={onShowReports} variant="secondary" className="text-xs flex items-center gap-1.5 self-stretch sm:self-auto justify-center">
              <BarChart3 className="w-4 h-4 text-purple-400" />
              <span>Ver Relatórios & Gráficos</span>
            </Button>
          </div>
        </div>

        {/* Calculations List */}
        <Card className="border-slate-800 bg-slate-900/90 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>Extratos Emitidos</span>
            </h3>
            <span className="text-xs text-slate-400">{calculations.length} registos</span>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-10 space-y-2">
              <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400">A carregar extratos semanais...</p>
            </div>
          ) : calculations.length > 0 ? (
            <div className="space-y-3">
              {calculations.map(calc => {
                const startStr = toDate(calc.periodStart).toLocaleDateString('pt-PT');
                const endStr = toDate(calc.periodEnd).toLocaleDateString('pt-PT');
                return (
                  <div 
                    key={calc.id} 
                    className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 flex justify-between items-center hover:bg-slate-850 hover:border-slate-700 transition cursor-pointer group"
                    onClick={() => onSelectCalculation(calc)}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white group-hover:text-purple-300 transition">
                          Semana: {startStr} a {endStr}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="px-2 py-0.5 rounded bg-slate-850 border border-slate-700 text-[10px] font-mono text-slate-300">
                          {calc.type}
                        </span>
                        <span>•</span>
                        <span>Clique para ver detalhe</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getStatusColor(calc.status)} block mb-1`}>
                          {calc.status}
                        </span>
                        <span className="text-[11px] text-slate-400">Ver Extrato</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <FileText className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-bold text-slate-300">Nenhum cálculo semanal encontrado.</p>
              <p className="text-xs text-slate-500">Os acertos da administração da frota serão apresentados aqui semanalmente.</p>
            </div>
          )}
        </Card>

      </div>
    </div>
  );
};

export const DriverDashboard: React.FC = () => {
  const { user } = useAuth();
  // 4 Primary Native Tabs: 'rides' | 'calculations' | 'requirements' | 'profile'
  const [currentTab, setCurrentTab] = useState<DriverTab>('rides');
  const [calcSubView, setCalcSubView] = useState<CalcSubView>('list');
  const [selectedCalculation, setSelectedCalculation] = useState<Calculation | null>(null);

  // Online / Offline state
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return localStorage.getItem('asfalto_driver_online') === 'true';
  });
  const [todayCompletedRides, setTodayCompletedRides] = useState<PrivateRide[]>([]);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);

  // Drawer & Modals state (Uber Driver style)
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isRideHistoryOpen, setIsRideHistoryOpen] = useState<boolean>(false);
  const [isCampaignsOpen, setIsCampaignsOpen] = useState<boolean>(false);
  const [isScheduledRidesOpen, setIsScheduledRidesOpen] = useState<boolean>(false);

  // Push location to dispatchService and Firestore
  const pushLocationUpdate = (
    online: boolean, 
    lat: number = 38.7369, 
    lng: number = -9.1426, 
    heading: number = 45,
    speed: number = 0,
    accuracy: number = 10
  ) => {
    if (!user) return;
    setGpsAccuracy(accuracy);

    // 1. Dispatch Service
    dispatchService.updateDriverLocation({
      driverId: user.id,
      driverName: user.name || 'Motorista Asfalto',
      matricula: user.matricula || 'FROTA-001',
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
        matricula: user.matricula || 'FROTA-001',
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

  // GPS Watcher
  useEffect(() => {
    if (!isOnline || !user) return;

    let watchId: number | null = null;
    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, heading, speed, accuracy } = position.coords;
          if (accuracy <= 30) {
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
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
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
    setSuccessToast(`Corrida privada concluída com sucesso! +€${ride.valorLiquidoMotorista.toFixed(2)} adicionado.`);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  const handleSelectCalculation = (calc: Calculation) => {
    setSelectedCalculation(calc);
    setCalcSubView('details');
  };

  const navItems = [
    { id: 'rides' as DriverTab, label: 'Corridas', icon: Navigation },
    { id: 'calculations' as DriverTab, label: 'Cálculos', icon: Calculator },
    { id: 'requirements' as DriverTab, label: 'Requisitos', icon: ClipboardList },
    { id: 'profile' as DriverTab, label: 'Perfil', icon: UserIcon },
  ];

  return (
    <div className="h-[100dvh] w-full overflow-hidden flex flex-col bg-slate-950 text-slate-100 select-none relative">
      
      {/* 1. HEADER COMPACTO E FIXO (h-14): Hamburger + Logo + Nome/Matrícula + Indicador de Sinal GPS */}
      <header className="h-14 flex-shrink-0 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3 sm:px-4 flex items-center justify-between z-40 select-none shadow-md">
        {/* Left: Hamburger Menu Icon + Brand Logo + Driver Name & License Plate */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <button
            id="btn-driver-menu-hamburger"
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="w-9 h-9 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 hover:text-white border border-slate-700/70 shadow-sm flex items-center justify-center transition active:scale-95 cursor-pointer flex-shrink-0"
            title="Abrir Menu Lateral Uber Driver"
          >
            <Menu className="w-5 h-5 text-white" />
          </button>

          <img 
            src={BRAND_LOGOS.MOBILE} 
            alt="ROTA TVDE" 
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-xl object-cover border border-slate-700 shadow-sm flex-shrink-0 cursor-pointer hidden sm:block"
            onClick={() => setCurrentTab('rides')}
          />
          <div className="min-w-0 flex items-center gap-1.5 sm:gap-2">
            <span className="text-xs sm:text-sm font-black text-white truncate max-w-[100px] sm:max-w-[180px]">
              {user?.name || 'Motorista'}
            </span>
            <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-[10px] font-mono font-black text-emerald-400 flex-shrink-0 shadow-sm">
              {user?.matricula || 'FROTA-001'}
            </span>
          </div>
        </div>

        {/* Right: Indicador de Sinal GPS / Botão Online */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            id="btn-driver-gps-header"
            onClick={handleToggleOnline}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border cursor-pointer ${
              isOnline 
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.2)]' 
                : 'bg-slate-800/80 text-slate-400 border-slate-700'
            }`}
            title={isOnline ? 'GPS Ativo (Clique para pausar)' : 'GPS Desligado (Clique para ficar online)'}
          >
            <span className="relative flex h-2 w-2">
              {isOnline && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnline ? 'bg-emerald-400' : 'bg-slate-500'}`} />
            </span>
            <span className="text-[10px] font-black uppercase tracking-wider">
              {isOnline ? (gpsAccuracy ? `GPS ±${Math.round(gpsAccuracy)}m` : 'GPS ATIVO') : 'GPS OFFLINE'}
            </span>
          </button>
        </div>
      </header>

      {/* Success Toast */}
      {successToast && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 px-4 w-full max-w-md">
          <div className="p-3.5 bg-emerald-900/95 backdrop-blur-md border border-emerald-500 rounded-2xl text-emerald-200 text-xs font-bold flex items-center gap-3 shadow-2xl animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span>{successToast}</span>
          </div>
        </div>
      )}

      {/* 2. CONTAINER DE CONTEÚDO PRINCIPAL (COM pb-20 PARA NÃO TAPAR PELO RODAPÉ) */}
      <main className="flex-1 w-full relative overflow-hidden">
        {/* TAB 1: CORRIDAS (MAPA EM TEMPO REAL) */}
        {currentTab === 'rides' && user && (
          <DriverLiveMapScreen
            user={user}
            isOnline={isOnline}
            onToggleOnline={handleToggleOnline}
            onOpenDrawer={() => setIsDrawerOpen(true)}
            onOpenProfile={() => setCurrentTab('profile')}
            onOpenCalculations={() => setCurrentTab('calculations')}
            onRideCompleted={handleRideCompleted}
          />
        )}

        {/* TAB 2: CÁLCULOS (ECRÃS DE EXTRATOS, DETALHE E RELATÓRIOS) */}
        {currentTab === 'calculations' && (
          <div className="w-full h-full overflow-y-auto pb-20">
            {calcSubView === 'list' && (
              <DriverCalculationsList 
                onSelectCalculation={handleSelectCalculation}
                onShowReports={() => setCalcSubView('reports')}
              />
            )}

            {calcSubView === 'details' && selectedCalculation && (
              <div className="w-full p-4 sm:p-6 lg:p-8 space-y-4 max-w-4xl mx-auto pb-24">
                <Button 
                  onClick={() => setCalcSubView('list')} 
                  variant="secondary"
                  className="text-xs flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar aos Extratos</span>
                </Button>
                <CalculationView 
                  calculation={selectedCalculation} 
                  onAccept={() => setCalcSubView('list')}
                />
              </div>
            )}

            {calcSubView === 'reports' && (
              <div className="w-full p-4 sm:p-6 lg:p-8 space-y-4 max-w-4xl mx-auto pb-24">
                <Button 
                  onClick={() => setCalcSubView('list')} 
                  variant="secondary"
                  className="text-xs flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar aos Extratos</span>
                </Button>
                <ReportsView onBack={() => setCalcSubView('list')} driverId={user?.id} />
              </div>
            )}
          </div>
        )}

        {/* TAB 3: REQUISITOS (CHECKLIST DE EQUIPAMENTOS E AVISOS DA FROTA) */}
        {currentTab === 'requirements' && (
          <div className="w-full h-full overflow-y-auto pb-20">
            <DriverRequirementsView />
          </div>
        )}

        {/* TAB 4: PERFIL (DADOS DA VIATURA & LOGOUT) */}
        {currentTab === 'profile' && (
          <div className="w-full h-full overflow-y-auto pb-20">
            <DriverProfileView />
          </div>
        )}
      </main>

      {/* 3. BOTTOM NAVIGATION BAR (RODAPÉ FIXO NATIVO) */}
      <nav 
        id="driver-bottom-navigation"
        className="fixed bottom-0 left-0 right-0 h-16 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 z-50 flex items-center justify-around px-2 select-none shadow-[0_-4px_20px_rgba(0,0,0,0.5)]"
      >
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => {
                setCurrentTab(item.id);
                if (item.id === 'calculations') {
                  setCalcSubView('list');
                }
              }}
              className={`flex-1 h-full flex flex-col items-center justify-center gap-1 transition-all duration-150 active:scale-95 cursor-pointer relative py-1 ${
                isActive ? 'text-[#10B981]' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {/* Active Tab Neon Indicator Dot */}
              {isActive && (
                <span className="absolute top-1 w-8 h-1 bg-[#10B981] rounded-full shadow-[0_0_10px_#10B981]" />
              )}
              
              <IconComponent className={`w-5 h-5 transition-transform duration-200 ${isActive ? 'scale-110 text-[#10B981]' : 'text-slate-400'}`} />
              
              <span className={`text-[10px] sm:text-[11px] font-bold tracking-tight leading-none ${isActive ? 'text-[#10B981]' : 'text-slate-400'}`}>
                {item.label}
              </span>

              {/* Dot under label */}
              <span 
                className={`w-1 h-1 rounded-full transition-all duration-200 ${
                  isActive ? 'bg-[#10B981] shadow-[0_0_6px_#10B981] opacity-100' : 'bg-transparent opacity-0'
                }`} 
              />
            </button>
          );
        })}
      </nav>

      {/* Overlay para ofertas de corridas privadas prioritárias e navegação */}
      {user && isOnline && (
        <DriverDispatchOverlay 
          user={user} 
          onRideCompleted={handleRideCompleted}
        />
      )}

      {/* Menu Lateral Deslizante Estilo Uber Driver (Drawer Navigation) */}
      <DriverDrawerNavigation
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          if (tab === 'calculations') {
            setCalcSubView('list');
          }
        }}
        onOpenRideHistory={() => setIsRideHistoryOpen(true)}
        onOpenCampaigns={() => setIsCampaignsOpen(true)}
        onOpenScheduledRides={() => setIsScheduledRidesOpen(true)}
      />

      {/* Modal 1: Histórico de Viagens */}
      <DriverRideHistoryModal
        isOpen={isRideHistoryOpen}
        onClose={() => setIsRideHistoryOpen(false)}
        completedRides={todayCompletedRides}
      />

      {/* Modal 2: Campanhas & Bónus AdTech */}
      <DriverCampaignsModal
        isOpen={isCampaignsOpen}
        onClose={() => setIsCampaignsOpen(false)}
      />

      {/* Modal 3: Viagens Agendadas & Transfers */}
      <DriverScheduledRidesModal
        isOpen={isScheduledRidesOpen}
        onClose={() => setIsScheduledRidesOpen(false)}
      />
    </div>
  );
};

export default DriverDashboard;
