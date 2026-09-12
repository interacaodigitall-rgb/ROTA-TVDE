import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  User, 
  PrivateRide, 
  DriverLiveLocation, 
  VehicleCategory 
} from '../../types';
import InteractiveMap, { LatLngLiteral } from '../map/InteractiveMap';
import { dispatchService, playDispatchAlertSound } from '../../services/dispatchService';
import { db, firestore } from '../../firebase';
import { 
  Power, 
  ShieldCheck, 
  SlidersHorizontal, 
  DollarSign, 
  Search, 
  User as UserIcon, 
  ChevronUp, 
  ChevronDown, 
  MapPin, 
  Navigation, 
  Flame, 
  Clock, 
  Zap, 
  TrendingUp, 
  Layers, 
  Car, 
  CheckCircle2, 
  X, 
  Crosshair, 
  Compass, 
  Award, 
  BatteryCharging, 
  Volume2, 
  VolumeX, 
  Eye, 
  EyeOff,
  Briefcase
} from 'lucide-react';

interface DriverLiveMapScreenProps {
  user: User;
  isOnline: boolean;
  onToggleOnline: () => void;
  onOpenProfile?: () => void;
  onOpenCalculations?: () => void;
  onRideCompleted?: (ride: PrivateRide) => void;
}

// Hotspots / High Demand Surge Zones around Lisbon & Metropolitan Area
interface SurgeZone {
  id: string;
  name: string;
  category: string;
  coords: LatLngLiteral;
  surgeMultiplier: number;
  surgeBonus: string;
  eta: string;
  demandLevel: 'ALTA' | 'MUITO ALTA' | 'EXTREMA';
  color: string;
}

const SURGE_ZONES: SurgeZone[] = [
  {
    id: 'lisbon_airport',
    name: 'Aeroporto Humberto Delgado (LIS)',
    category: 'Terminais 1 & 2',
    coords: { lat: 38.7742, lng: -9.1342 },
    surgeMultiplier: 1.8,
    surgeBonus: '+€4.50',
    eta: '1-2 min',
    demandLevel: 'EXTREMA',
    color: '#EF4444' // Red hot
  },
  {
    id: 'lisbon_center',
    name: 'Centro & Baixa / Chiado',
    category: 'Turismo & Restauração',
    coords: { lat: 38.7115, lng: -9.1390 },
    surgeMultiplier: 1.5,
    surgeBonus: '+€3.00',
    eta: '1-3 min',
    demandLevel: 'MUITO ALTA',
    color: '#F59E0B' // Amber
  },
  {
    id: 'oriente_nacoes',
    name: 'Parque das Nações / Gare do Oriente',
    category: 'Hub Empresarial & Eventos',
    coords: { lat: 38.7678, lng: -9.0980 },
    surgeMultiplier: 1.4,
    surgeBonus: '+€2.50',
    eta: '2-4 min',
    demandLevel: 'ALTA',
    color: '#10B981' // Emerald
  },
  {
    id: 'cascais_estoril',
    name: 'Cascais & Estoril',
    category: 'Residencial / Litoral',
    coords: { lat: 38.6979, lng: -9.4215 },
    surgeMultiplier: 1.6,
    surgeBonus: '+€3.50',
    eta: '1-5 min',
    demandLevel: 'MUITO ALTA',
    color: '#F97316' // Orange
  }
];

export const DriverLiveMapScreen: React.FC<DriverLiveMapScreenProps> = ({
  user,
  isOnline,
  onToggleOnline,
  onOpenProfile,
  onOpenCalculations,
  onRideCompleted
}) => {
  // Drawer expansion state: 'collapsed' | 'half' | 'expanded'
  const [drawerState, setDrawerState] = useState<'collapsed' | 'half' | 'expanded'>('half');
  const [activeTab, setActiveTab] = useState<'map' | 'activity' | 'surge' | 'fleet'>('map');

  // Floating Modals
  const [isSafetyModalOpen, setIsSafetyModalOpen] = useState<boolean>(false);
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState<boolean>(false);
  const [isEarningsModalOpen, setIsEarningsModalOpen] = useState<boolean>(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState<boolean>(false);
  const [searchDestination, setSearchDestination] = useState<string>('');

  // Preference Filters
  const [acceptXl, setAcceptXl] = useState<boolean>(true);
  const [acceptBlackTesla, setAcceptBlackTesla] = useState<boolean>(true);
  const [acceptStandard, setAcceptStandard] = useState<boolean>(true);
  const [autoAccept, setAutoAccept] = useState<boolean>(false);
  const [audioAlerts, setAudioAlerts] = useState<boolean>(true);

  // Live Location & Fleet
  const [currentCoords, setCurrentCoords] = useState<LatLngLiteral>({
    lat: 38.7369,
    lng: -9.1426
  });
  const [currentHeading, setCurrentHeading] = useState<number>(45);
  const [currentSpeed, setCurrentSpeed] = useState<number | null>(null);
  const [currentAccuracy, setCurrentAccuracy] = useState<number | null>(null);
  const [liveDrivers, setLiveDrivers] = useState<DriverLiveLocation[]>([]);
  const [selectedSurgeZone, setSelectedSurgeZone] = useState<SurgeZone | null>(null);

  // Driver metrics
  const [todayCompletedCount, setTodayCompletedCount] = useState<number>(3);
  const [todayGrossEarnings, setTodayGrossEarnings] = useState<number>(78.50);
  const [todayOnlineMinutes, setTodayOnlineMinutes] = useState<number>(142);

  // Ativar rastreio contínuo e de alta precisão no app do motorista
  const atualizarPosicaoFirebase = (data: {
    lat: number;
    lng: number;
    bearing: number | null; // Direção do veículo em graus (0-360)
    velocidade: number | null;
    timestamp: string;
    accuracy?: number;
  }) => {
    if (!user) return;

    // 1. Dispatch Service local and general updates
    dispatchService.updateDriverLocation({
      driverId: user.id,
      driverName: user.name || 'Motorista Asfalto',
      matricula: user.matricula || '45-TX-90',
      vehicleModel: user.vehicleModel || 'Tesla Model 3 Long Range',
      categoria: (user.type?.includes('XL') ? 'XL_VAN' : 'BLACK_TESLA') as VehicleCategory,
      lat: data.lat,
      lng: data.lng,
      heading: data.bearing ?? 0,
      isOnline: isOnline,
      status: isOnline ? 'LIVRE' : 'OFFLINE',
      lastUpdate: new Date()
    });

    // 2. Direct required write to viaturas/{id}/localizacao in Firestore
    const viaturaId = user.matricula ? user.matricula.replace(/[^a-zA-Z0-9]/g, '_') : (user.id || 'default_car');
    try {
      db.collection('viaturas').doc(viaturaId).set({
        matricula: user.matricula || '45-TX-90',
        motoristaId: user.id,
        motoristaNome: user.name || 'Motorista TVDE',
        modelo: user.vehicleModel || 'Tesla Model 3',
        isOnline: isOnline,
        status: isOnline ? 'EM_SERVICO' : 'OFFLINE',
        localizacao: {
          lat: data.lat,
          lng: data.lng,
          bearing: data.bearing ?? 0,
          heading: data.bearing ?? 0,
          velocidade: data.velocidade ?? 0,
          accuracy: data.accuracy ?? null,
          timestamp: data.timestamp
        },
        ultimaAtualizacao: firestore.FieldValue?.serverTimestamp ? firestore.FieldValue.serverTimestamp() : new Date()
      }, { merge: true }).catch((err) => {
        // Silently log
        console.debug('Firestore viaturas update sync:', err);
      });
    } catch (err) {
      console.debug('Firestore sync exception:', err);
    }
  };

  // Ativar rastreio contínuo e de alta precisão no app do motorista
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      console.warn('Geolocalização não disponível no dispositivo.');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, heading, speed, accuracy } = position.coords;
        
        setCurrentCoords({ lat: latitude, lng: longitude });
        if (heading !== null && !isNaN(heading)) setCurrentHeading(heading);
        setCurrentSpeed(speed);
        setCurrentAccuracy(accuracy);

        // Filtra sinais fracos para evitar imprecisões no mapa
        if (accuracy <= 20) {
          atualizarPosicaoFirebase({
            lat: latitude,
            lng: longitude,
            bearing: heading, // Direção do veículo em graus (0-360)
            velocidade: speed,
            timestamp: new Date().toISOString(),
            accuracy
          });
        }
      },
      (error) => console.error("Erro ao obter GPS:", error),
      {
        enableHighAccuracy: true, // Força uso do chip GPS do telemóvel
        timeout: 5000,           // Tenta obter posição a cada 5s no máximo
        maximumAge: 0            // Não aceita posições em cache
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isOnline, user]);

  // Push immediate update when online status changes
  useEffect(() => {
    atualizarPosicaoFirebase({
      lat: currentCoords.lat,
      lng: currentCoords.lng,
      bearing: currentHeading,
      velocidade: currentSpeed || 0,
      accuracy: currentAccuracy ?? undefined,
      timestamp: new Date().toISOString()
    });
  }, [isOnline]);

  // Live driver fleet updates
  useEffect(() => {
    setLiveDrivers(dispatchService.getLiveDrivers());
    const interval = setInterval(() => {
      setLiveDrivers([...dispatchService.getLiveDrivers()]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Center on driver
  const handleRecenter = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCurrentCoords(coords);
      });
    }
  };

  const formattedHours = Math.floor(todayOnlineMinutes / 60);
  const formattedMinutes = todayOnlineMinutes % 60;

  return (
    <div className="relative w-full h-full bg-[#0B0F17] overflow-hidden select-none font-sans text-slate-100">
      {/* 1. Full Screen Base Map */}
      <div className="absolute inset-0 z-0">
        <InteractiveMap
          center={currentCoords}
          zoom={14}
          drivers={liveDrivers.map(d => d.driverId === user.id ? { ...d, lat: currentCoords.lat, lng: currentCoords.lng, isOnline } : d)}
          className="w-full h-full rounded-none"
        />

        {/* Dynamic Lisbon Heatmap / Surge Rings Visual Overlay on Vector Map */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {SURGE_ZONES.map((zone) => (
            <div
              key={zone.id}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedSurgeZone(zone);
              }}
              style={{
                // Approximate visual positioning around Lisbon region
                top: zone.id === 'lisbon_airport' ? '22%' : zone.id === 'lisbon_center' ? '54%' : zone.id === 'oriente_nacoes' ? '30%' : '65%',
                left: zone.id === 'lisbon_airport' ? '62%' : zone.id === 'lisbon_center' ? '50%' : zone.id === 'oriente_nacoes' ? '74%' : '20%'
              }}
              className="absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
            >
              <div className="relative flex items-center justify-center">
                {/* Heatmap pulse rings */}
                <span 
                  className="absolute w-24 h-24 rounded-full opacity-35 animate-ping"
                  style={{ backgroundColor: zone.color }}
                />
                <span 
                  className="absolute w-16 h-16 rounded-full opacity-50 blur-sm"
                  style={{ backgroundColor: zone.color }}
                />
                
                {/* Center Surge Badge */}
                <div 
                  className="relative px-2.5 py-1 rounded-full text-white text-[11px] font-black shadow-2xl flex items-center gap-1 border border-white/30 backdrop-blur-md group-hover:scale-110 transition-transform duration-200"
                  style={{ backgroundColor: `${zone.color}E6` }}
                >
                  <Flame className="w-3.5 h-3.5 text-amber-200 fill-amber-200 animate-pulse" />
                  <span>{zone.surgeBonus}</span>
                  <span className="text-[9px] opacity-80 font-normal ml-0.5">({zone.eta})</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Top Floating Controls: Profile/Home & Quick Destination Search */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        {/* Left: Driver Profile / Back to Management */}
        <button
          id="btn-driver-profile"
          onClick={onOpenProfile}
          className="pointer-events-auto w-12 h-12 rounded-2xl bg-[#0F172A]/90 backdrop-blur-xl border border-slate-700/80 shadow-2xl flex items-center justify-center text-slate-200 hover:text-white hover:border-emerald-400/60 hover:scale-105 active:scale-95 transition"
          title="Ver Informações e Dados da Frota"
        >
          <UserIcon className="w-5 h-5 text-emerald-400" />
        </button>

        {/* Center: Live Status Pill */}
        <div className="pointer-events-auto px-4 py-2 rounded-full bg-[#0F172A]/90 backdrop-blur-xl border border-slate-700/80 shadow-2xl flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse ring-4 ring-emerald-500/20' : 'bg-slate-500'}`} />
          <span className="text-xs font-black tracking-wider text-slate-100">
            {isOnline ? 'EM SERVIÇO' : 'OFFLINE'}
          </span>
          {isOnline && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono font-bold text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {currentAccuracy ? `±${Math.round(currentAccuracy)}m` : 'GPS ATIVO'}
              </span>
              {currentSpeed !== null && currentSpeed > 0.5 && (
                <span className="text-[10px] font-mono font-bold text-sky-400 px-1.5 py-0.5 rounded bg-sky-950/60 border border-sky-500/30">
                  {Math.round(currentSpeed * 3.6)} km/h
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right: Search / Set Destination filter */}
        <button
          id="btn-driver-search"
          onClick={() => setIsSearchModalOpen(true)}
          className="pointer-events-auto w-12 h-12 rounded-2xl bg-[#0F172A]/90 backdrop-blur-xl border border-slate-700/80 shadow-2xl flex items-center justify-center text-slate-200 hover:text-white hover:border-sky-400/60 hover:scale-105 active:scale-95 transition"
          title="Definir Destino / Filtrar Corridas a Caminho de Casa"
        >
          <Search className="w-5 h-5 text-sky-400" />
        </button>
      </div>

      {/* 3. Right Column Floating Action Buttons (Uber Driver Style) */}
      <div className="absolute right-4 top-20 z-20 flex flex-col gap-3 pointer-events-none">
        {/* Recenter GPS */}
        <button
          onClick={handleRecenter}
          className="pointer-events-auto w-11 h-11 rounded-2xl bg-[#0F172A]/90 backdrop-blur-xl border border-slate-700/80 shadow-2xl flex items-center justify-center text-slate-300 hover:text-white hover:border-slate-500 hover:scale-105 active:scale-95 transition"
          title="Centrar na Minha Localização"
        >
          <Crosshair className="w-5 h-5 text-slate-300" />
        </button>

        {/* Escudo / Segurança (SOS & Assistência) */}
        <button
          id="btn-driver-safety"
          onClick={() => setIsSafetyModalOpen(true)}
          className="pointer-events-auto w-11 h-11 rounded-2xl bg-[#0F172A]/90 backdrop-blur-xl border border-slate-700/80 shadow-2xl flex items-center justify-center text-blue-400 hover:text-blue-300 hover:border-blue-400/60 hover:scale-105 active:scale-95 transition"
          title="Segurança & Apoio 24/7"
        >
          <ShieldCheck className="w-5 h-5" />
        </button>

        {/* Filtros / Preferências de Corrida */}
        <button
          id="btn-driver-filters"
          onClick={() => setIsFiltersModalOpen(true)}
          className="pointer-events-auto w-11 h-11 rounded-2xl bg-[#0F172A]/90 backdrop-blur-xl border border-slate-700/80 shadow-2xl flex items-center justify-center text-amber-400 hover:text-amber-300 hover:border-amber-400/60 hover:scale-105 active:scale-95 transition"
          title="Preferências de Corridas & Categorias"
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>

        {/* Ganhos do Dia / Resumo Rápido */}
        <button
          id="btn-driver-earnings"
          onClick={() => setIsEarningsModalOpen(true)}
          className="pointer-events-auto w-11 h-11 rounded-2xl bg-[#0F172A]/90 backdrop-blur-xl border border-slate-700/80 shadow-2xl flex items-center justify-center text-emerald-400 hover:text-emerald-300 hover:border-emerald-400/60 hover:scale-105 active:scale-95 transition"
          title="Ver Ganhos e Métricas de Hoje"
        >
          <DollarSign className="w-5 h-5" />
        </button>
      </div>

      {/* 4. Retractable Bottom Drawer (Painel Inferior Uber Driver) */}
      <div 
        className={`absolute bottom-16 left-0 right-0 z-30 transition-all duration-300 ease-in-out ${
          drawerState === 'collapsed' 
            ? 'translate-y-[calc(100%-80px)]' 
            : drawerState === 'half' 
            ? 'translate-y-0 max-h-[380px]' 
            : 'translate-y-0 max-h-[85vh]'
        }`}
      >
        <div className="bg-[#0B0F17]/95 backdrop-blur-2xl border-t border-slate-800/90 rounded-t-[32px] shadow-[0_-12px_40px_rgba(0,0,0,0.8)] px-5 pt-3 pb-6 flex flex-col space-y-4">
          
          {/* Drawer Handle for Swipe/Click */}
          <div 
            onClick={() => setDrawerState(prev => prev === 'collapsed' ? 'half' : prev === 'half' ? 'expanded' : 'half')}
            className="w-full flex flex-col items-center justify-center cursor-pointer py-1 group"
          >
            <div className="w-12 h-1.5 bg-slate-700 rounded-full group-hover:bg-emerald-400 transition" />
            <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              <span>{drawerState === 'expanded' ? 'Reduzir Painel' : drawerState === 'collapsed' ? 'Expandir Painel' : 'Painel de Serviço'}</span>
              {drawerState === 'expanded' ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            </div>
          </div>

          {/* Quick Metrics Bar (Earnings, Online Time, Trips) */}
          <div className="grid grid-cols-3 gap-2 bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
            <div className="text-center border-r border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Ganhos Hoje</span>
              <span className="text-base font-black text-emerald-400">€{todayGrossEarnings.toFixed(2)}</span>
            </div>
            <div className="text-center border-r border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Viagens</span>
              <span className="text-base font-black text-white">{todayCompletedCount}</span>
            </div>
            <div className="text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Horas Online</span>
              <span className="text-base font-black text-slate-200">{formattedHours}h {formattedMinutes}m</span>
            </div>
          </div>

          {/* Primary Online/Offline Action Switch (Uber Style Slider/Large Button) */}
          <div className="w-full">
            <button
              id="btn-toggle-online-driver"
              onClick={onToggleOnline}
              className={`w-full py-4 px-6 rounded-2xl font-black text-sm tracking-wider flex items-center justify-center gap-3 transition-all duration-300 shadow-xl ${
                isOnline
                  ? 'bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white shadow-red-600/30'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/30'
              }`}
            >
              <Power className={`w-5 h-5 ${isOnline ? 'text-white' : 'text-white animate-pulse'}`} />
              <span>{isOnline ? 'FICAR OFFLINE (PAUSA)' : 'ENTRAR EM SERVIÇO (FICAR ONLINE)'}</span>
            </button>
          </div>

          {/* High-Demand Zones Suggestions (Scrollable Cards) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-orange-400" />
                Zonas de Alta Procura Recomendadas
              </span>
              <span className="text-[11px] text-emerald-400 font-bold">Tempo Real</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {SURGE_ZONES.map((zone) => (
                <div
                  key={zone.id}
                  onClick={() => {
                    setCurrentCoords(zone.coords);
                    setSelectedSurgeZone(zone);
                  }}
                  className="bg-slate-900/80 hover:bg-slate-850 p-3 rounded-xl border border-slate-800 hover:border-slate-700 flex items-center justify-between cursor-pointer transition"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span 
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: zone.color }}
                      />
                      <h4 className="text-xs font-bold text-white truncate">{zone.name}</h4>
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate">{zone.category}</span>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span 
                      className="text-xs font-black px-2 py-0.5 rounded-md text-white shadow-sm inline-block"
                      style={{ backgroundColor: `${zone.color}E6` }}
                    >
                      {zone.surgeBonus}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                      {zone.eta}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Access to Calculations & Reports */}
          {onOpenCalculations && (
            <div className="pt-1">
              <button
                onClick={onOpenCalculations}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-xs font-bold text-slate-300 hover:text-white border border-slate-700/80 flex items-center justify-center gap-2 transition"
              >
                <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                <span>Aceder ao Resumo Semanal & Cálculos TVDE 5.0</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Segurança & Suporte SOS 24/7 */}
      {isSafetyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-400">
                <ShieldCheck className="w-6 h-6" />
                <h3 className="text-base font-black text-white">Segurança & Assistência 24/7</h3>
              </div>
              <button onClick={() => setIsSafetyModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl space-y-1">
                <span className="text-[10px] font-black uppercase text-red-400 block">Número de Emergência Nacional</span>
                <p className="text-lg font-black text-white font-mono">112</p>
                <p className="text-[11px] text-slate-400">Polícia / INEM / Bombeiros</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-black uppercase text-emerald-400 block">Central de Operações TVDE Asfalto</span>
                <p className="text-sm font-bold text-white font-mono">+351 912 345 678</p>
                <p className="text-[11px] text-slate-400">Apoio a motoristas e gestão de frota ativa.</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-black uppercase text-blue-400 block">Assistência em Viagem Seguro Fidelidade</span>
                <p className="text-sm font-bold text-white font-mono">808 29 39 49</p>
                <p className="text-[11px] text-slate-400">Reboque, avaria mecânica ou sinistro TVDE.</p>
              </div>
            </div>

            <button
              onClick={() => setIsSafetyModalOpen(false)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: Preferências & Filtros de Viagem */}
      {isFiltersModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400">
                <SlidersHorizontal className="w-5 h-5" />
                <h3 className="text-base font-black text-white">Preferências de Serviço</h3>
              </div>
              <button onClick={() => setIsFiltersModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div>
                  <h4 className="text-xs font-bold text-white">Categoria Standard</h4>
                  <p className="text-[10px] text-slate-400">Sedan e carrinhas compactas</p>
                </div>
                <input
                  type="checkbox"
                  checked={acceptStandard}
                  onChange={(e) => setAcceptStandard(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 bg-slate-800 border-slate-700"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div>
                  <h4 className="text-xs font-bold text-white">Black & Tesla Executivo</h4>
                  <p className="text-[10px] text-slate-400">Tarifas premium (x1.50)</p>
                </div>
                <input
                  type="checkbox"
                  checked={acceptBlackTesla}
                  onChange={(e) => setAcceptBlackTesla(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 bg-slate-800 border-slate-700"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div>
                  <h4 className="text-xs font-bold text-white">XL Van 7 Lugares</h4>
                  <p className="text-[10px] text-slate-400">Grupos e bagagens aeroporto (x1.85)</p>
                </div>
                <input
                  type="checkbox"
                  checked={acceptXl}
                  onChange={(e) => setAcceptXl(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 bg-slate-800 border-slate-700"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div>
                  <h4 className="text-xs font-bold text-white">Alerta Sonoro de Despacho</h4>
                  <p className="text-[10px] text-slate-400">Bip de chamada prioritária</p>
                </div>
                <button
                  onClick={() => setAudioAlerts(!audioAlerts)}
                  className="p-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                >
                  {audioAlerts ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                </button>
              </div>
            </div>

            <button
              onClick={() => setIsFiltersModalOpen(false)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition"
            >
              Guardar Preferências
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: Ganhos Detalhados de Hoje */}
      {isEarningsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400">
                <DollarSign className="w-5 h-5" />
                <h3 className="text-base font-black text-white">Ganhos de Hoje</h3>
              </div>
              <button onClick={() => setIsEarningsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl text-center space-y-1">
              <span className="text-xs font-bold text-emerald-400 uppercase">Total Bruto Estimado</span>
              <div className="text-3xl font-black text-white">€{todayGrossEarnings.toFixed(2)}</div>
              <span className="text-[11px] text-slate-400">{todayCompletedCount} viagens realizadas hoje</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400">Tempo em Turno:</span>
                <span className="font-bold text-white">{formattedHours} horas e {formattedMinutes} min</span>
              </div>
              <div className="flex justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400">Média por Viagem:</span>
                <span className="font-bold text-emerald-400">€{(todayGrossEarnings / (todayCompletedCount || 1)).toFixed(2)}</span>
              </div>
              <div className="flex justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400">Bónus AdTech Estimado:</span>
                <span className="font-bold text-emerald-300">+€4.50</span>
              </div>
            </div>

            <button
              onClick={() => setIsEarningsModalOpen(false)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* MODAL 4: Pesquisa de Destino (Viagens no Caminho) */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sky-400">
                <Search className="w-5 h-5" />
                <h3 className="text-base font-black text-white">Definir Destino (A Caminho de Casa)</h3>
              </div>
              <button onClick={() => setIsSearchModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Defina o seu ponto de paragem final para receber apenas chamados e viagens que sigam na sua direção.
            </p>

            <div className="space-y-2">
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Ex: Cascais, Sintra, Odivelas..."
                  value={searchDestination}
                  onChange={(e) => setSearchDestination(e.target.value)}
                  className="w-full pl-9 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400"
                />
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {['Lisboa Centro', 'Cascais', 'Sintra', 'Amadora', 'Aeroporto'].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setSearchDestination(preset)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-medium border border-slate-700"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                setIsSearchModalOpen(false);
              }}
              className="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs transition"
            >
              Ativar Filtro de Direção
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverLiveMapScreen;
