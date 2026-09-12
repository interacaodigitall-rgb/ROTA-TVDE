import React, { useState, useEffect } from 'react';
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
  ArrowLeft,
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
  Smartphone,
  ChevronLeft
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
import InteractiveMap, { LatLngLiteral } from '../map/InteractiveMap';
import DestinationSelectScreen, { RECENT_DESTINATIONS } from './DestinationSelectScreen';
import TripConfirmationScreen from './TripConfirmationScreen';

type RiderFlowStep = 'SELECT_DESTINATION' | 'CONFIRM_TRIP' | 'ACTIVE_RIDE';

export const RiderApp: React.FC<{ onBackToMain?: () => void }> = ({ onBackToMain }) => {
  // 1. Step in booking flow
  const [step, setStep] = useState<RiderFlowStep>('SELECT_DESTINATION');
  
  // 2. Locations & GPS Coordinates (Defaulting to Lisboa / Santa Maria)
  const [userLocation, setUserLocation] = useState<LatLngLiteral>({ lat: 38.7450, lng: -9.1550 });
  const [originAddress, setOriginAddress] = useState<string>('Rua da Quinta de Santa Maria 29, Lisboa');
  const [destinationCoords, setDestinationCoords] = useState<LatLngLiteral | null>({ lat: 38.7678, lng: -9.0991 }); // Oriente default
  const [destinationAddress, setDestinationAddress] = useState<string>('Oriente / Parque das Nações, Lisboa');
  const [stops, setStops] = useState<string[]>([]);
  const [customDistanceKm, setCustomDistanceKm] = useState<number>(3.4);
  const [customDurationMin, setCustomDurationMin] = useState<number>(7);
  
  // 3. Timing & Passenger Configuration
  const [rideTiming, setRideTiming] = useState<'imediato' | 'agendado'>('imediato');
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState<boolean>(false);
  const [passengerOption, setPassengerOption] = useState<'mim' | 'outro'>('mim');
  const [otherPassengerName, setOtherPassengerName] = useState<string>('');
  const [otherPassengerPhone, setOtherPassengerPhone] = useState<string>('');

  // 4. Category & Pricing (Supports all 4 official Uber-style options)
  const [selectedCategory, setSelectedCategory] = useState<VehicleCategory>('STANDARD');
  const [estimates, setEstimates] = useState<Record<VehicleCategory, { valorTotal: number; valorLiquido: number; comissao: number }>>({
    STANDARD: { valorTotal: 8.90, valorLiquido: 7.57, comissao: 1.33 },
    ELECTRIC: { valorTotal: 11.20, valorLiquido: 9.52, comissao: 1.68 },
    BLACK_TESLA: { valorTotal: 14.50, valorLiquido: 12.33, comissao: 2.17 },
    XL_VAN: { valorTotal: 17.50, valorLiquido: 14.88, comissao: 2.62 },
    PRIORIDADE: { valorTotal: 14.50, valorLiquido: 12.33, comissao: 2.17 }
  });
  const [estimatesMeta, setEstimatesMeta] = useState<{ isFixedAirportRate?: boolean; airportZoneLabel?: string; isNightRate?: boolean }>({});

  // 5. Payment Configuration
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MBWAY');
  const [mbwayPhone, setMbwayPhone] = useState<string>('912 345 678');

  // 6. Active Ride & Live Fleet
  const [activeRide, setActiveRide] = useState<PrivateRide | null>(null);
  const [liveDrivers, setLiveDrivers] = useState<DriverLiveLocation[]>(INITIAL_DEMO_DRIVERS);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState<string>('');
  const [stars, setStars] = useState<number>(5);

  // Request browser geolocation on mount
  const handleRecenterGps = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(userPos);
          setOriginAddress('Localização Atual (GPS)');
        },
        (err) => {
          console.debug('Geolocation notice:', err.message);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  useEffect(() => {
    handleRecenterGps();
  }, []);

  // Recalculate estimates when distance/destination changes (with Airport Geofencing)
  useEffect(() => {
    const calc = dispatchService.calculateEstimates(customDistanceKm, customDurationMin, originAddress, destinationAddress);
    setEstimates(calc);
    setEstimatesMeta({
      isFixedAirportRate: calc.isFixedAirportRate,
      airportZoneLabel: calc.airportZoneLabel,
      isNightRate: calc.isNightRate
    });
  }, [customDistanceKm, customDurationMin, destinationAddress, originAddress]);

  // Subscribe to live drivers and smooth vehicle motion
  useEffect(() => {
    setLiveDrivers(dispatchService.getLiveDrivers());
    const interval = setInterval(() => {
      setLiveDrivers(prev => prev.map(d => ({
        ...d,
        lat: d.lat + (Math.random() - 0.5) * 0.0004,
        lng: d.lng + (Math.random() - 0.5) * 0.0004
      })));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Listen to active ride status updates
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

  // Destination selected in Screen 1 -> moves to Screen 2
  const handleDestinationSelected = (dest: { address: string; coords: LatLngLiteral; distanceKm: number; durationMin: number }) => {
    setDestinationAddress(dest.address);
    setDestinationCoords(dest.coords);
    setCustomDistanceKm(dest.distanceKm);
    setCustomDurationMin(dest.durationMin);
    setStep('CONFIRM_TRIP');
  };

  // Create Ride from Screen 2
  const handleConfirmRide = async () => {
    const isAirport = destinationAddress.toLowerCase().includes('aeroporto') || originAddress.toLowerCase().includes('aeroporto');
    const selectedEstimate = estimates[selectedCategory] || estimates.STANDARD;

    const passengerName = passengerOption === 'mim' ? 'Passageiro Asfalto' : (otherPassengerName || 'Convidado');
    const passengerPhone = passengerOption === 'mim' ? '+351 912 345 678' : (otherPassengerPhone || '+351 912 999 888');

    const newRide = await dispatchService.createRide({
      clienteNome: passengerName,
      clienteTelefone: passengerPhone,
      origem: {
        lat: userLocation.lat,
        lng: userLocation.lng,
        endereco: originAddress
      },
      destino: {
        lat: destinationCoords?.lat || 38.7678,
        lng: destinationCoords?.lng || -9.0991,
        endereco: destinationAddress || 'Gare do Oriente / Parque das Nações'
      },
      distanciaKm: customDistanceKm,
      duracaoMin: customDurationMin,
      categoria: selectedCategory,
      valorTotal: selectedEstimate.valorTotal,
      valorLiquidoMotorista: selectedEstimate.valorLiquido,
      comissaoFrota: selectedEstimate.comissao,
      tipoViagem: rideTiming === 'imediato' ? 'imediato' : 'reserva',
      dataHoraAgendamento: rideTiming === 'agendado' ? scheduledTime : undefined,
      metodoPagamento: paymentMethod,
      companyId: 'asfalto_cativante'
    });

    setActiveRide(newRide);
    setStep('ACTIVE_RIDE');

    // Auto-dispatch simulation for instant preview response
    setTimeout(() => {
      const active = dispatchService.getAllRides().find(r => r.id === newRide.id);
      if (active && active.status === 'pendente') {
        const matchingDriver = INITIAL_DEMO_DRIVERS.find(d => d.categoria === selectedCategory) || INITIAL_DEMO_DRIVERS[0];
        dispatchService.acceptRide(newRide.id, {
          id: matchingDriver.driverId,
          name: matchingDriver.driverName,
          phone: matchingDriver.phone,
          matricula: matchingDriver.matricula,
          vehicleModel: matchingDriver.vehicleModel,
          rating: matchingDriver.rating
        });
      }
    }, 3500);
  };

  const handleSendMessage = () => {
    if (!chatInput.trim() || !activeRide) return;
    dispatchService.sendChatMessage(activeRide.id, 'client', chatInput.trim());
    setChatInput('');
  };

  return (
    <div className="relative min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans overflow-hidden select-none">
      {/* 1. Header Flutuante (Estilo Uber) */}
      <header className="absolute top-0 left-0 right-0 z-30 p-3 sm:p-4 flex items-center justify-between pointer-events-none">
        {/* Left Side: Brand Identity or Back Button */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {step === 'CONFIRM_TRIP' ? (
            <button
              onClick={() => setStep('SELECT_DESTINATION')}
              className="p-2.5 rounded-full bg-slate-900/90 backdrop-blur-md hover:bg-slate-800 border border-slate-700 text-white shadow-xl transition flex items-center gap-1.5 text-xs font-black"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Voltar</span>
            </button>
          ) : (
            <div className="flex items-center gap-2.5 bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-full border border-slate-700/80 shadow-2xl">
              <img 
                src={BRAND_LOGOS.MOBILE} 
                alt="Asfalto Cativante" 
                referrerPolicy="no-referrer"
                className="h-6 w-6 rounded-full object-cover border border-slate-600"
              />
              <div className="border-l border-slate-700 pl-2">
                <span className="text-[11px] font-black text-white uppercase tracking-wider block leading-tight">
                  Uber Rider TVDE
                </span>
                <span className="text-[9px] text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {liveDrivers.filter(d => d.isOnline).length} Carros Disponíveis
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Back to Platform */}
        {onBackToMain && (
          <div className="pointer-events-auto">
            <button
              onClick={onBackToMain}
              className="px-3.5 py-2 rounded-full bg-slate-900/80 hover:bg-slate-800 backdrop-blur-md border border-slate-700 text-xs font-bold text-slate-300 hover:text-white transition shadow-lg"
            >
              Portal Principal &rarr;
            </button>
          </div>
        )}
      </header>

      {/* 2. Visualização de Rota no Mapa Interativo com Polyline & Viaturas Ativas */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <InteractiveMap 
          center={step === 'CONFIRM_TRIP' && destinationCoords ? {
            lat: (userLocation.lat + destinationCoords.lat) / 2,
            lng: (userLocation.lng + destinationCoords.lng) / 2
          } : userLocation}
          zoom={step === 'CONFIRM_TRIP' ? 14 : 15}
          drivers={liveDrivers}
          routeOrigin={userLocation}
          routeDestination={step === 'CONFIRM_TRIP' && destinationCoords ? destinationCoords : undefined}
          routeColor="#10B981"
          pickupEtaBadge="4 MIN"
          fitAllMarkers={step === 'CONFIRM_TRIP'}
          className="w-full h-full"
        />
      </div>

      {/* 3. Painel Principal Flutuante / Bottom Sheet */}
      <div className="relative z-10 mt-auto w-full max-w-lg mx-auto sm:p-4">
        {/* ECRÃ 1: SELEÇÃO DE DESTINO & AUTOCOMPLETE */}
        {step === 'SELECT_DESTINATION' && (
          <DestinationSelectScreen
            originAddress={originAddress}
            setOriginAddress={setOriginAddress}
            destinationAddress={destinationAddress}
            setDestinationAddress={setDestinationAddress}
            onDestinationSelected={handleDestinationSelected}
            onRecenterGps={handleRecenterGps}
            rideTiming={rideTiming}
            setRideTiming={setRideTiming}
            scheduledTime={scheduledTime}
            setScheduledTime={setScheduledTime}
            passengerOption={passengerOption}
            setPassengerOption={setPassengerOption}
            otherPassengerName={otherPassengerName}
            setOtherPassengerName={setOtherPassengerName}
            otherPassengerPhone={otherPassengerPhone}
            setOtherPassengerPhone={setOtherPassengerPhone}
            stops={stops}
            setStops={setStops}
          />
        )}

        {/* ECRÃ 2: CONFIRMAÇÃO DE VIAGEM & CATEGORIAS */}
        {step === 'CONFIRM_TRIP' && (
          <TripConfirmationScreen
            originAddress={originAddress}
            destinationAddress={destinationAddress}
            distanceKm={customDistanceKm}
            durationMin={customDurationMin}
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => setSelectedCategory(cat)}
            paymentMethod={paymentMethod}
            onSelectPaymentMethod={(pm) => setPaymentMethod(pm)}
            mbwayPhone={mbwayPhone}
            setMbwayPhone={setMbwayPhone}
            rideTiming={rideTiming}
            scheduledTime={scheduledTime}
            onOpenScheduleModal={() => setIsScheduleModalOpen(true)}
            onBackToRouteEdit={() => setStep('SELECT_DESTINATION')}
            onConfirmRide={handleConfirmRide}
            estimates={estimates}
            isAirportFixedRate={estimatesMeta.isFixedAirportRate}
            airportZoneLabel={estimatesMeta.airportZoneLabel}
            isNightRate={estimatesMeta.isNightRate}
          />
        )}

        {/* ECRÃ 3: VIAGEM ATIVA & SELEÇÃO DE MOTORISTA EM TEMPO REAL */}
        {step === 'ACTIVE_RIDE' && activeRide && (
          <div className="bg-slate-900/95 backdrop-blur-2xl rounded-t-[32px] sm:rounded-3xl border border-slate-700/80 shadow-2xl p-5 space-y-4 animate-fadeIn">
            {/* Ride Status Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {activeRide.status === 'pendente' && 'A Procurar Viatura Mais Próxima...'}
                  {activeRide.status === 'aceito' && 'Motorista Atribuído a Caminho'}
                  {activeRide.status === 'a_caminho' && 'Motorista a 2 minutos'}
                  {activeRide.status === 'no_local' && 'Motorista no Ponto de Recolha!'}
                  {activeRide.status === 'em_viagem' && 'Em Viagem para o Destino'}
                  {activeRide.status === 'concluido' && 'Viagem Concluída com Sucesso!'}
                </span>
                <h3 className="text-base font-black text-white mt-1">
                  {activeRide.status === 'pendente' 
                    ? 'A contactar viaturas na sua zona...' 
                    : `Chegada prevista: ~${activeRide.etaMinutos || 3} min`}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-white">€{activeRide.valorTotal.toFixed(2)}</span>
                <span className="text-[10px] text-slate-400 block font-semibold">{activeRide.metodoPagamento}</span>
              </div>
            </div>

            {/* Assigned Driver Card */}
            {activeRide.motoristaNome ? (
              <div className="flex items-center justify-between p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800">
                <div className="flex items-center gap-3">
                  <img 
                    src={activeRide.motoristaFoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                    alt={activeRide.motoristaNome} 
                    className="w-12 h-12 rounded-full object-cover border-2 border-emerald-400 shadow-md"
                  />
                  <div>
                    <div className="text-sm font-black text-white">{activeRide.motoristaNome}</div>
                    <div className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono text-[11px] font-black border border-slate-700">
                        {activeRide.viaturaMatricula}
                      </span>
                      <span>• {activeRide.viaturaModelo}</span>
                    </div>
                    <div className="text-[10px] text-amber-400 flex items-center gap-1 mt-0.5 font-bold">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {activeRide.motoristaRating || 4.98} • Motorista Oficial Certificado
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a 
                    href={`tel:${activeRide.motoristaTelefone || '+351912345678'}`}
                    className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 transition shadow-md"
                    title="Ligar para o motorista"
                  >
                    <Phone className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => setIsChatOpen(true)}
                    className="p-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition shadow-md relative"
                    title="Abrir chat direto"
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
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-200">A conectar à viatura mais próxima...</p>
                <p className="text-[10px] text-slate-500">Um dos nossos motoristas certificados irá aceitar o chamado em segundos.</p>
              </div>
            )}

            {/* Route Details */}
            <div className="space-y-1.5 text-xs bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
              <div className="flex items-center gap-2 text-slate-300">
                <div className="w-2 h-2 rounded-full bg-slate-300 flex-shrink-0" />
                <span className="truncate">{activeRide.origem.endereco}</span>
              </div>
              <div className="flex items-center gap-2 text-white font-bold">
                <div className="w-2 h-2 rounded-sm bg-emerald-400 flex-shrink-0" />
                <span className="truncate">{activeRide.destino.endereco}</span>
              </div>
            </div>

            {/* If completed, show rating & reset */}
            {activeRide.status === 'concluido' && (
              <div className="p-4 bg-emerald-950/80 border border-emerald-500/60 rounded-2xl text-center space-y-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-black text-white">Chegou ao seu destino!</h4>
                <p className="text-xs text-slate-300">Como avalia a sua viagem com {activeRide.motoristaNome}?</p>
                
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
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs transition"
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
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-md rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[460px] animate-fadeIn">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img 
                  src={activeRide.motoristaFoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} 
                  alt={activeRide.motoristaNome} 
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div>
                  <span className="text-xs font-black text-white block">{activeRide.motoristaNome}</span>
                  <span className="text-[10px] text-emerald-400 font-bold">Em direto com o motorista</span>
                </div>
              </div>
              <button 
                onClick={() => setIsChatOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-2">
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
