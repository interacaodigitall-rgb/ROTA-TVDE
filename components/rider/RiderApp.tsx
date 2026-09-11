import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Navigation, 
  Clock, 
  CreditCard, 
  Phone, 
  MessageSquare, 
  ShieldCheck, 
  Star, 
  Car, 
  Calendar, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Send, 
  Sparkles,
  ChevronDown,
  RefreshCw,
  Zap,
  Award,
  DollarSign,
  Smartphone
} from 'lucide-react';
import { BRAND_LOGOS } from '../../constants';
import { 
  VehicleCategory, 
  PaymentMethod, 
  PrivateRide, 
  DriverLiveLocation, 
  ChatMessage 
} from '../../types';
import { 
  dispatchService, 
  INITIAL_DEMO_DRIVERS, 
  playDispatchAlertSound 
} from '../../services/dispatchService';

interface PresetDestination {
  name: string;
  address: string;
  lat: number;
  lng: number;
  distanceKm: number;
  durationMin: number;
  icon?: string;
}

const POPULAR_DESTINATIONS: PresetDestination[] = [
  {
    name: 'Aeroporto Humberto Delgado (LIS)',
    address: 'Alameda das Comunidades Portuguesas, Lisboa',
    lat: 38.7756,
    lng: -9.1354,
    distanceKm: 9.5,
    durationMin: 14
  },
  {
    name: 'Cascais Marina & Centro',
    address: 'Passeio D. Luís I, Cascais',
    lat: 38.6979,
    lng: -9.4215,
    distanceKm: 31.0,
    durationMin: 32
  },
  {
    name: 'Sintra Vila Histórica',
    address: 'Praça da República, Sintra',
    lat: 38.7990,
    lng: -9.3916,
    distanceKm: 28.5,
    durationMin: 30
  },
  {
    name: 'Gare do Oriente / Parque das Nações',
    address: 'Av. Dom João II, Lisboa',
    lat: 38.7678,
    lng: -9.0991,
    distanceKm: 11.2,
    durationMin: 16
  },
  {
    name: 'Marquês de Pombal / Av. Liberdade',
    address: 'Praça Marquês de Pombal, Lisboa',
    lat: 38.7253,
    lng: -9.1500,
    distanceKm: 4.8,
    durationMin: 10
  },
  {
    name: 'Torre de Belém / CCB',
    address: 'Av. Brasília, Lisboa',
    lat: 38.6916,
    lng: -9.2160,
    distanceKm: 8.2,
    durationMin: 15
  }
];

export const RiderApp: React.FC<{ onBackToMain?: () => void }> = ({ onBackToMain }) => {
  // Step in booking flow
  const [step, setStep] = useState<'SELECT_DESTINATION' | 'SELECT_CATEGORY' | 'CONFIRM_PAYMENT' | 'ACTIVE_RIDE'>('SELECT_DESTINATION');
  
  // Locations
  const [originAddress, setOriginAddress] = useState<string>('Minha Localização (Lisboa Centro)');
  const [destinationAddress, setDestinationAddress] = useState<string>('');
  const [selectedPreset, setSelectedPreset] = useState<PresetDestination | null>(null);
  const [customDistanceKm, setCustomDistanceKm] = useState<number>(8.5);
  const [customDurationMin, setCustomDurationMin] = useState<number>(15);
  
  // Category & Pricing
  const [selectedCategory, setSelectedCategory] = useState<VehicleCategory>('BLACK_TESLA');
  const [estimates, setEstimates] = useState<Record<VehicleCategory, { valorTotal: number; valorLiquido: number; comissao: number }>>({
    STANDARD: { valorTotal: 12.50, valorLiquido: 10.63, comissao: 1.87 },
    BLACK_TESLA: { valorTotal: 18.50, valorLiquido: 15.73, comissao: 2.77 },
    XL_VAN: { valorTotal: 24.00, valorLiquido: 20.40, comissao: 3.60 }
  });

  // Scheduling & Options
  const [rideType, setRideType] = useState<'imediato' | 'reserva'>('imediato');
  const [scheduleDateTime, setScheduleDateTime] = useState<string>('');
  const [clientName, setClientName] = useState<string>('Passageiro Executivo');
  const [clientPhone, setClientPhone] = useState<string>('+351 912 999 888');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MBWAY');
  const [mbwayPhone, setMbwayPhone] = useState<string>('912999888');

  // Active Ride tracking
  const [activeRide, setActiveRide] = useState<PrivateRide | null>(null);
  const [liveDrivers, setLiveDrivers] = useState<DriverLiveLocation[]>(INITIAL_DEMO_DRIVERS);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState<string>('');
  const [ratingSubmitted, setRatingSubmitted] = useState<boolean>(false);
  const [stars, setStars] = useState<number>(5);

  // Recalculate estimates when distance/destination changes
  useEffect(() => {
    const isAirport = destinationAddress.toLowerCase().includes('aeroporto') || originAddress.toLowerCase().includes('aeroporto');
    const calc = dispatchService.calculateEstimates(customDistanceKm, customDurationMin, isAirport);
    setEstimates(calc);
  }, [customDistanceKm, customDurationMin, destinationAddress, originAddress]);

  // Subscribe to live drivers
  useEffect(() => {
    setLiveDrivers(dispatchService.getLiveDrivers());
    const interval = setInterval(() => {
      // Small simulated GPS jitter for realism
      setLiveDrivers(prev => prev.map(d => ({
        ...d,
        lat: d.lat + (Math.random() - 0.5) * 0.0008,
        lng: d.lng + (Math.random() - 0.5) * 0.0008
      })));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Listen to active ride updates
  useEffect(() => {
    if (!activeRide?.id) return;

    const unsubscribe = dispatchService.subscribeToRide(activeRide.id, (updated) => {
      if (updated) {
        setActiveRide(updated);
        if (updated.status === 'aceito' && activeRide.status === 'pendente') {
          playDispatchAlertSound();
        }
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [activeRide?.id]);

  const handleSelectPreset = (dest: PresetDestination) => {
    setSelectedPreset(dest);
    setDestinationAddress(dest.name);
    setCustomDistanceKm(dest.distanceKm);
    setCustomDurationMin(dest.durationMin);
    setStep('SELECT_CATEGORY');
  };

  const handleCreateRide = async () => {
    const isAirport = destinationAddress.toLowerCase().includes('aeroporto') || originAddress.toLowerCase().includes('aeroporto');
    const selectedEstimate = estimates[selectedCategory];

    const newRide = await dispatchService.createRide({
      clienteNome: clientName,
      clienteTelefone: clientPhone,
      origem: {
        lat: 38.736946,
        lng: -9.142685,
        endereco: originAddress
      },
      destino: {
        lat: selectedPreset?.lat || 38.7756,
        lng: selectedPreset?.lng || -9.1354,
        endereco: destinationAddress || 'Aeroporto de Lisboa Humberto Delgado'
      },
      distanciaKm: customDistanceKm,
      duracaoMin: customDurationMin,
      categoria: selectedCategory,
      valorTotal: selectedEstimate.valorTotal,
      valorLiquidoMotorista: selectedEstimate.valorLiquido,
      comissaoFrota: selectedEstimate.comissao,
      tipoViagem: rideType,
      dataHoraAgendamento: rideType === 'reserva' ? scheduleDateTime : undefined,
      metodoPagamento: paymentMethod,
      companyId: 'asfalto_cativante'
    });

    setActiveRide(newRide);
    setStep('ACTIVE_RIDE');

    // Simulate auto-dispatch acceptance if no driver acts within 4s (for seamless demo experience)
    setTimeout(() => {
      if (dispatchService.getAllRides().find(r => r.id === newRide.id)?.status === 'pendente') {
        const bestDriver = INITIAL_DEMO_DRIVERS.find(d => d.categoria === selectedCategory) || INITIAL_DEMO_DRIVERS[0];
        dispatchService.acceptRide(newRide.id, {
          id: bestDriver.driverId,
          name: bestDriver.driverName,
          phone: bestDriver.phone,
          matricula: bestDriver.matricula,
          vehicleModel: bestDriver.vehicleModel,
          rating: bestDriver.rating
        });
      }
    }, 3800);
  };

  const handleSendMessage = () => {
    if (!chatInput.trim() || !activeRide) return;
    dispatchService.sendChatMessage(activeRide.id, 'client', chatInput.trim());
    setChatInput('');
  };

  const getCategoryDetails = (cat: VehicleCategory) => {
    switch (cat) {
      case 'STANDARD':
        return {
          title: 'Asfalto Standard',
          subtitle: 'Económico & Eficiente (Peugeot / Corolla)',
          passengers: '4 lugares',
          icon: <Car className="w-6 h-6 text-blue-400" />,
          color: 'blue'
        };
      case 'BLACK_TESLA':
        return {
          title: 'Asfalto Black / Tesla',
          subtitle: 'Executivo 100% Elétrico (Model 3 / Model Y)',
          passengers: '4 lugares • Água • Wi-Fi',
          icon: <Zap className="w-6 h-6 text-emerald-400" />,
          color: 'emerald'
        };
      case 'XL_VAN':
        return {
          title: 'Asfalto XL (7 Lugares)',
          subtitle: 'Espaço & Bagagem Grande (Peugeot 5008 / Van)',
          passengers: '6-7 lugares • Malas XL',
          icon: <Award className="w-6 h-6 text-amber-400" />,
          color: 'amber'
        };
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden">
      {/* Top Floating App Bar (Uber Style) */}
      <header className="absolute top-0 left-0 right-0 z-30 p-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 bg-slate-900/80 backdrop-blur-md px-4 py-2.5 rounded-full border border-slate-700/60 shadow-2xl pointer-events-auto">
          <img 
            src={BRAND_LOGOS.MOBILE} 
            alt="Asfalto Cativante" 
            referrerPolicy="no-referrer"
            className="h-7 w-7 rounded-full object-cover border border-slate-600"
          />
          <div className="border-l border-slate-700/80 pl-2.5 pr-1">
            <span className="text-xs font-black text-white tracking-wider block leading-tight uppercase">Asfalto Cativante</span>
            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {liveDrivers.filter(d => d.isOnline).length} Viaturas Ativas
            </span>
          </div>
        </div>

        {/* Clean minimal floating actions */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {step !== 'SELECT_DESTINATION' && step !== 'ACTIVE_RIDE' && (
            <button
              onClick={() => setStep('SELECT_DESTINATION')}
              className="px-3.5 py-2 bg-slate-900/80 backdrop-blur-md hover:bg-slate-800 text-slate-200 hover:text-white rounded-full border border-slate-700/60 text-xs font-bold transition shadow-lg flex items-center gap-1"
            >
              &larr; Voltar
            </button>
          )}
        </div>
      </header>

      {/* Simulated Vector Fullscreen Map Layer */}
      <div className="absolute inset-0 z-0 bg-[#0c1322] overflow-hidden">
        {/* Subtle Map Grid lines */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px]" />
        
        {/* Animated Road Lines */}
        <svg className="absolute inset-0 w-full h-full stroke-slate-800/80 stroke-2" style={{ fill: 'none' }}>
          <path d="M -50 150 Q 300 120, 600 350 T 1200 400" className="stroke-blue-500/30 stroke-[3]" />
          <path d="M 200 -50 Q 350 400, 800 700" className="stroke-emerald-500/25 stroke-[2] stroke-dasharray-[6,6]" />
          <path d="M 100 800 Q 500 500, 900 200" className="stroke-slate-700/50 stroke-[4]" />
        </svg>

        {/* Live Cars moving on Map */}
        {liveDrivers.map((driver) => (
          <div 
            key={driver.driverId}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ease-out cursor-pointer group"
            style={{ 
              top: `${((driver.lat - 38.68) / 0.14) * 100}%`, 
              left: `${((driver.lng + 9.45) / 0.40) * 100}%` 
            }}
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-slate-900/90 border-2 border-emerald-500 shadow-xl flex items-center justify-center text-emerald-400 group-hover:scale-110 transition">
                <Car className="w-5 h-5" />
              </div>
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-md bg-slate-950/90 border border-slate-800 text-[10px] font-bold text-slate-200 opacity-0 group-hover:opacity-100 transition shadow-lg">
                {driver.driverName} • {driver.vehicleModel}
              </div>
            </div>
          </div>
        ))}

        {/* Client Origin Marker */}
        <div className="absolute top-[52%] left-[48%] transform -translate-x-1/2 -translate-y-1/2">
          <div className="relative flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-blue-400 opacity-40" />
            <div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-white shadow-lg flex items-center justify-center text-[10px] font-black">
              P
            </div>
          </div>
        </div>

        {/* Destination Marker if selected */}
        {selectedPreset && (
          <div className="absolute top-[35%] left-[65%] transform -translate-x-1/2 -translate-y-1/2">
            <div className="relative flex items-center justify-center">
              <div className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-black shadow-xl flex items-center gap-1 border border-emerald-400/50 animate-bounce">
                <MapPin className="w-3.5 h-3.5" /> {selectedPreset.name}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Bottom Sheet & Floating Interaction Panel (Uber Pixel-Perfect) */}
      <div className="relative z-10 mt-auto w-full max-w-lg mx-auto p-3 sm:p-4">
        {step === 'SELECT_DESTINATION' && (
          <div className="bg-slate-900/95 backdrop-blur-2xl rounded-t-[28px] rounded-b-3xl sm:rounded-3xl border border-slate-700/60 shadow-2xl p-5 space-y-4 animate-fadeIn">
            {/* Uber-Style Subtle Top Drag Handle */}
            <div className="w-12 h-1.5 bg-slate-600 rounded-full mx-auto mb-1" />

            <div>
              <span className="text-[10px] font-extrabold uppercase text-emerald-400 tracking-wider">Transfers & Despacho Privado</span>
              <h1 className="text-2xl font-black text-white tracking-tight">Para onde vamos hoje?</h1>
            </div>

            {/* Inputs Box */}
            <div className="space-y-2.5 bg-slate-950/90 p-3.5 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-blue-200 flex-shrink-0" />
                <input 
                  type="text"
                  value={originAddress}
                  onChange={(e) => setOriginAddress(e.target.value)}
                  placeholder="Local de recolha"
                  className="w-full bg-transparent text-xs text-slate-200 font-medium focus:outline-none placeholder-slate-500"
                />
              </div>
              <div className="border-t border-slate-800/80 my-1 ml-6" />
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-emerald-200 flex-shrink-0" />
                <input 
                  type="text"
                  value={destinationAddress}
                  onChange={(e) => {
                    setDestinationAddress(e.target.value);
                    if (e.target.value) {
                      setCustomDistanceKm(12);
                      setCustomDurationMin(18);
                    }
                  }}
                  placeholder="Introduza o destino ou selecione abaixo..."
                  className="w-full bg-transparent text-sm text-white font-bold focus:outline-none placeholder-slate-400"
                />
              </div>
            </div>

            {/* Quick Popular Destinations in compact circular icon format */}
            <div>
              <span className="text-xs font-bold text-slate-400 block mb-2">Destinos Frequentes</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {POPULAR_DESTINATIONS.map((dest, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectPreset(dest)}
                    className="p-2.5 rounded-2xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-emerald-500/50 text-left transition flex items-center gap-3 group"
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0 group-hover:bg-slate-700 transition">
                      <MapPin className="w-4 h-4 text-slate-300 group-hover:text-emerald-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white truncate">{dest.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{dest.distanceKm} km • ~{dest.durationMin} min</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {destinationAddress && (
              <button
                onClick={() => setStep('SELECT_CATEGORY')}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl transition shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 text-sm"
              >
                Ver Categorias & Tarifas <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {step === 'SELECT_CATEGORY' && (
          <div className="bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-2xl p-5 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <button 
                  onClick={() => setStep('SELECT_DESTINATION')}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold mb-1"
                >
                  &larr; Alterar Destino
                </button>
                <h2 className="text-lg font-black text-white">Escolha a Categoria do Veículo</h2>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-emerald-400 block">{customDistanceKm} km</span>
                <span className="text-[10px] text-slate-400">~{customDurationMin} min de viagem</span>
              </div>
            </div>

            {/* Category Cards */}
            <div className="space-y-2.5">
              {(['STANDARD', 'BLACK_TESLA', 'XL_VAN'] as VehicleCategory[]).map((cat) => {
                const details = getCategoryDetails(cat);
                const isSelected = selectedCategory === cat;
                const est = estimates[cat];

                return (
                  <div
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected 
                        ? 'bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/10' 
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`p-2.5 rounded-xl bg-slate-900 border border-slate-800 ${isSelected ? 'border-blue-500/40' : ''}`}>
                        {details.icon}
                      </div>
                      <div>
                        <div className="text-sm font-black text-white flex items-center gap-1.5">
                          {details.title}
                          {cat === 'BLACK_TESLA' && (
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">Top Executivo</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">{details.subtitle}</div>
                        <div className="text-[10px] text-slate-500">{details.passengers}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-black text-white">€{est.valorTotal.toFixed(2)}</div>
                      <div className="text-[10px] text-slate-400">Chegada ~3 min</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Immediate vs Schedule Toggle */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setRideType('imediato')}
                className={`py-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 ${
                  rideType === 'imediato'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <Zap className="w-3.5 h-3.5" /> Chamar Agora
              </button>
              <button
                type="button"
                onClick={() => {
                  setRideType('reserva');
                  if (!scheduleDateTime) {
                    const d = new Date();
                    d.setHours(d.getHours() + 2);
                    setScheduleDateTime(d.toISOString().slice(0, 16));
                  }
                }}
                className={`py-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 ${
                  rideType === 'reserva'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                    : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" /> Agendar Reserva
              </button>
            </div>

            {rideType === 'reserva' && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Data e Hora do Transfer</label>
                <input 
                  type="datetime-local"
                  value={scheduleDateTime}
                  onChange={(e) => setScheduleDateTime(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>
            )}

            <button
              onClick={() => setStep('CONFIRM_PAYMENT')}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl transition shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 text-sm"
            >
              Continuar para Pagamento (€{estimates[selectedCategory].valorTotal.toFixed(2)}) <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 'CONFIRM_PAYMENT' && (
          <div className="bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-2xl p-5 space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <button 
                  onClick={() => setStep('SELECT_CATEGORY')}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-semibold mb-1"
                >
                  &larr; Voltar
                </button>
                <h2 className="text-lg font-black text-white">Confirmação & Pagamento</h2>
              </div>
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-right">
                <span className="text-sm font-black text-emerald-400">€{estimates[selectedCategory].valorTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Client Info */}
            <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Nome</label>
                <input 
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-transparent text-xs text-white font-bold focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Telemóvel</label>
                <input 
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full bg-transparent text-xs text-white font-bold focus:outline-none"
                />
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300">Método de Pagamento</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'MBWAY', label: 'MB WAY', icon: <Smartphone className="w-4 h-4 text-rose-400" /> },
                  { id: 'CARD', label: 'Cartão / Apple Pay', icon: <CreditCard className="w-4 h-4 text-blue-400" /> },
                  { id: 'CASH', label: 'Dinheiro', icon: <DollarSign className="w-4 h-4 text-emerald-400" /> },
                  { id: 'TPA', label: 'TPA no Carro', icon: <CreditCard className="w-4 h-4 text-amber-400" /> }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPaymentMethod(item.id as PaymentMethod)}
                    className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition ${
                      paymentMethod === item.id
                        ? 'bg-blue-600/20 border-blue-500 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.icon} {item.label}
                  </button>
                ))}
              </div>
            </div>

            {paymentMethod === 'MBWAY' && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Número MB WAY para Notificação</label>
                <input 
                  type="tel"
                  value={mbwayPhone}
                  onChange={(e) => setMbwayPhone(e.target.value)}
                  placeholder="912 345 678"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>
            )}

            <button
              onClick={handleCreateRide}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl transition shadow-xl shadow-emerald-600/40 flex items-center justify-center gap-2 text-base"
            >
              <Sparkles className="w-5 h-5 text-amber-300" />
              {rideType === 'imediato' ? 'Confirmar & Chamar Agora' : 'Confirmar Agendamento'}
            </button>
          </div>
        )}

        {step === 'ACTIVE_RIDE' && activeRide && (
          <div className="bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-slate-800 shadow-2xl p-5 space-y-4 animate-fadeIn">
            {/* Ride Status Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {activeRide.status === 'pendente' && 'A Procurar Viatura...'}
                  {activeRide.status === 'aceito' && 'Motorista a Caminho'}
                  {activeRide.status === 'a_caminho' && 'Motorista Quase a Chegar'}
                  {activeRide.status === 'no_local' && 'Motorista no Local de Recolha'}
                  {activeRide.status === 'em_viagem' && 'Em Viagem para o Destino'}
                  {activeRide.status === 'concluido' && 'Viagem Concluída!'}
                </span>
                <h3 className="text-base font-black text-white mt-1">
                  {activeRide.status === 'pendente' ? 'A contactar a frota Asfalto Cativante' : `ETA: ~${activeRide.etaMinutos || 2} min`}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-lg font-black text-emerald-400">€{activeRide.valorTotal.toFixed(2)}</span>
                <span className="text-[10px] text-slate-400 block">{activeRide.metodoPagamento}</span>
              </div>
            </div>

            {/* Assigned Driver Card */}
            {activeRide.motoristaNome ? (
              <div className="flex items-center justify-between p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-3">
                  <img 
                    src={activeRide.motoristaFoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                    alt={activeRide.motoristaNome}
                    className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 shadow-md"
                  />
                  <div>
                    <div className="text-sm font-black text-white">{activeRide.motoristaNome}</div>
                    <div className="text-xs text-slate-300 font-bold flex items-center gap-1">
                      <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-100 font-mono text-[11px]">{activeRide.viaturaMatricula}</span>
                      <span>• {activeRide.viaturaModelo}</span>
                    </div>
                    <div className="text-[10px] text-amber-400 flex items-center gap-1 mt-0.5">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {activeRide.motoristaRating || 4.95} • Motorista Oficial Asfalto
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a 
                    href={`tel:${activeRide.motoristaTelefone || '+351912345678'}`}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 transition shadow-md"
                    title="Ligar para o motorista"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => setIsChatOpen(true)}
                    className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition shadow-md relative"
                    title="Abrir chat"
                  >
                    <MessageSquare className="w-4 h-4" />
                    {(activeRide.chatMensagens?.length || 0) > 1 && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-slate-950/80 rounded-2xl border border-slate-800 text-center space-y-2">
                <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-300">A selecionar a melhor viatura da frota...</p>
                <p className="text-[10px] text-slate-500">Um motorista executivo irá aceitar o seu chamado em instantes.</p>
              </div>
            )}

            {/* Route Details */}
            <div className="space-y-1.5 text-xs bg-slate-950/50 p-3 rounded-xl border border-slate-800/80">
              <div className="flex items-center gap-2 text-slate-300">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="truncate">{activeRide.origem.endereco}</span>
              </div>
              <div className="flex items-center gap-2 text-white font-bold">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="truncate">{activeRide.destino.endereco}</span>
              </div>
            </div>

            {/* If completed, show rating & reset */}
            {activeRide.status === 'concluido' && (
              <div className="p-4 bg-emerald-950/80 border border-emerald-500/60 rounded-2xl text-center space-y-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-black text-white">Chegou ao seu destino com sucesso!</h4>
                <p className="text-xs text-slate-300">Como foi a sua experiência com {activeRide.motoristaNome}?</p>
                
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      onClick={() => setStars(s)}
                      className="p-1 text-amber-400 transition hover:scale-125"
                    >
                      <Star className={`w-6 h-6 ${s <= stars ? 'fill-amber-400' : 'text-slate-600'}`} />
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => {
                    setActiveRide(null);
                    setStep('SELECT_DESTINATION');
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition"
                >
                  Concluir & Fazer Novo Pedido
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Chat Modal */}
      {isChatOpen && activeRide && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-md rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[480px] animate-fadeIn">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img 
                  src={activeRide.motoristaFoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                  alt={activeRide.motoristaNome} 
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div>
                  <span className="text-xs font-black text-white block">{activeRide.motoristaNome}</span>
                  <span className="text-[10px] text-emerald-400 font-bold">Em direto</span>
                </div>
              </div>
              <button 
                onClick={() => setIsChatOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-2.5">
              {activeRide.chatMensagens?.map((msg) => (
                <div 
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'client' ? 'items-end' : msg.sender === 'system' ? 'items-center' : 'items-start'}`}
                >
                  <div className={`p-2.5 rounded-2xl text-xs max-w-[80%] ${
                    msg.sender === 'client' 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : msg.sender === 'system'
                      ? 'bg-slate-800 text-slate-300 text-center text-[10px]'
                      : 'bg-slate-800 text-slate-100 rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-slate-500 mt-0.5 px-1">{msg.time}</span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
              <input 
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Escreva uma mensagem..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleSendMessage}
                className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiderApp;
