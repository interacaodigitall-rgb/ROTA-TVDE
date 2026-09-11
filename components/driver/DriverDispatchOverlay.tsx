import React, { useState, useEffect } from 'react';
import { 
  Navigation, 
  MapPin, 
  Phone, 
  MessageSquare, 
  CheckCircle2, 
  X, 
  ExternalLink, 
  ShieldCheck, 
  Car, 
  Clock, 
  Send,
  Zap,
  Award,
  AlertCircle
} from 'lucide-react';
import { PrivateRide, RideStatus, User } from '../../types';
import { dispatchService, playDispatchAlertSound } from '../../services/dispatchService';

interface DriverDispatchOverlayProps {
  user: User;
  onRideCompleted?: (ride: PrivateRide) => void;
}

export const DriverDispatchOverlay: React.FC<DriverDispatchOverlayProps> = ({ user, onRideCompleted }) => {
  const [pendingRides, setPendingRides] = useState<PrivateRide[]>([]);
  const [activeRide, setActiveRide] = useState<PrivateRide | null>(null);
  const [countdown, setCountdown] = useState<number>(15);
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [chatText, setChatText] = useState<string>('');

  // Subscribe to driver dispatch queue
  useEffect(() => {
    const unsubscribe = dispatchService.subscribeToDriverRides(user.id, (rides) => {
      const pending = rides.filter(r => r.status === 'pendente');
      const active = rides.find(r => r.motoristaId === user.id && r.status !== 'concluido' && r.status !== 'cancelado');

      setPendingRides(pending);
      setActiveRide(active || null);

      if (pending.length > 0 && !active) {
        playDispatchAlertSound();
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [user.id]);

  // 15 seconds countdown timer for top pending ride
  useEffect(() => {
    if (pendingRides.length === 0 || activeRide) {
      setCountdown(15);
      return;
    }

    setCountdown(15);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Reject/dismiss current ride if timeout
          setPendingRides(old => old.slice(1));
          return 15;
        }
        if (prev % 3 === 0) {
          playDispatchAlertSound();
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [pendingRides.length, activeRide]);

  const currentOffer = pendingRides[0];

  const handleAcceptRide = async (ride: PrivateRide) => {
    await dispatchService.acceptRide(ride.id, {
      id: user.id,
      name: user.name || 'Motorista Asfalto',
      matricula: user.matricula || '45-TX-90',
      vehicleModel: user.vehicleModel || 'Tesla Model 3',
      phone: '+351 912 345 678'
    });
    setPendingRides([]);
  };

  const handleDeclineRide = () => {
    setPendingRides(prev => prev.slice(1));
  };

  const handleAdvanceStatus = async () => {
    if (!activeRide) return;

    let nextStatus: RideStatus = 'a_caminho';
    if (activeRide.status === 'aceito') nextStatus = 'a_caminho';
    else if (activeRide.status === 'a_caminho') nextStatus = 'no_local';
    else if (activeRide.status === 'no_local') nextStatus = 'em_viagem';
    else if (activeRide.status === 'em_viagem') {
      nextStatus = 'concluido';
      if (onRideCompleted) {
        onRideCompleted(activeRide);
      }
    }

    await dispatchService.advanceRideStatus(activeRide.id, nextStatus);
  };

  const handleSendMessage = () => {
    if (!chatText.trim() || !activeRide) return;
    dispatchService.sendChatMessage(activeRide.id, 'driver', chatText.trim());
    setChatText('');
  };

  const openWaze = (address: string) => {
    window.open(`https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`, '_blank');
  };

  const openGoogleMaps = (address: string) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`, '_blank');
  };

  // 1. High-Priority Uber-Driver Style Call Overlay
  if (currentOffer && !activeRide) {
    const progressPercent = (countdown / 15) * 100;

    return (
      <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
        <div className="bg-slate-900 border-2 border-emerald-500/80 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col p-6 space-y-5 text-white">
          {/* Header & Timer Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-wider border border-emerald-500/40 animate-pulse">
                <Zap className="w-3.5 h-3.5 text-amber-300" /> Novo Chamado Privado
              </div>
              <span className="text-2xl font-black text-amber-400 font-mono">{countdown}s</span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-1000 ease-linear rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Earnings Highlight */}
          <div className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Ganhos Líquidos Motorista</span>
              <div className="text-3xl font-black text-emerald-400">+ €{currentOffer.valorLiquidoMotorista.toFixed(2)}</div>
              <span className="text-[11px] text-slate-400">Total Viagem: €{currentOffer.valorTotal.toFixed(2)}</span>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-300 block">{currentOffer.distanciaKm} km</span>
              <span className="text-[11px] text-slate-400">~{currentOffer.duracaoMin} min</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30 mt-1 inline-block">
                {currentOffer.categoria}
              </span>
            </div>
          </div>

          {/* Route Overview */}
          <div className="space-y-3 bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800/80 text-xs">
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-full bg-blue-500/20 text-blue-400 mt-0.5">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Ponto de Recolha</span>
                <span className="font-bold text-slate-200">{currentOffer.origem.endereco}</span>
              </div>
            </div>
            <div className="border-t border-slate-800/80 my-1 ml-6" />
            <div className="flex items-start gap-3">
              <div className="p-1.5 rounded-full bg-emerald-500/20 text-emerald-400 mt-0.5">
                <Navigation className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Destino</span>
                <span className="font-bold text-white">{currentOffer.destino.endereco}</span>
              </div>
            </div>
          </div>

          {/* Passenger Info */}
          <div className="flex items-center justify-between text-xs text-slate-300 px-1">
            <span>Cliente: <strong className="text-white">{currentOffer.clienteNome}</strong></span>
            <span>Pagamento: <strong className="text-emerald-400">{currentOffer.metodoPagamento}</strong></span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <button
              onClick={handleDeclineRide}
              className="py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-2xl text-xs transition border border-slate-700"
            >
              Recusar
            </button>
            <button
              onClick={() => handleAcceptRide(currentOffer)}
              className="col-span-2 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl text-sm transition shadow-xl shadow-emerald-600/40 flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4 text-amber-300" /> ACEITAR VIAGEM
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Active Ride Dashboard Overlay (Driver Navigation Mode)
  if (activeRide) {
    const isHeadingToPickup = activeRide.status === 'aceito' || activeRide.status === 'a_caminho';
    const isAtPickup = activeRide.status === 'no_local';
    const isTripInProgress = activeRide.status === 'em_viagem';
    const currentTargetAddress = isHeadingToPickup || isAtPickup ? activeRide.origem.endereco : activeRide.destino.endereco;

    return (
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 max-w-xl mx-auto animate-fadeIn">
        <div className="bg-slate-900/95 backdrop-blur-xl border-2 border-blue-500/60 rounded-3xl p-5 shadow-2xl space-y-4 text-white">
          {/* Top Status & Client Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black">
                {activeRide.clienteNome.charAt(0)}
              </div>
              <div>
                <h3 className="text-sm font-black text-white">{activeRide.clienteNome}</h3>
                <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {isHeadingToPickup && 'A caminho do Passageiro'}
                  {isAtPickup && 'Chegou ao Ponto de Recolha'}
                  {isTripInProgress && 'Em Viagem até ao Destino'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a 
                href={`tel:${activeRide.clienteTelefone}`}
                className="p-2.5 rounded-xl bg-slate-800 text-emerald-400 hover:bg-slate-700 transition"
                title="Ligar para o cliente"
              >
                <Phone className="w-4 h-4" />
              </a>
              <button
                onClick={() => setIsChatOpen(!isChatOpen)}
                className="p-2.5 rounded-xl bg-slate-800 text-blue-400 hover:bg-slate-700 transition relative"
                title="Abrir Chat"
              >
                <MessageSquare className="w-4 h-4" />
                {(activeRide.chatMensagens?.length || 0) > 1 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-400 rounded-full animate-ping" />
                )}
              </button>
            </div>
          </div>

          {/* Target Address Card */}
          <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center justify-between">
            <div className="min-w-0 flex-1 pr-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">
                {isHeadingToPickup || isAtPickup ? 'Recolha' : 'Destino'}
              </span>
              <p className="text-xs font-bold text-white truncate">{currentTargetAddress}</p>
            </div>
            <div className="text-right whitespace-nowrap">
              <span className="text-xs font-black text-emerald-400 block">+ €{activeRide.valorLiquidoMotorista.toFixed(2)}</span>
              <span className="text-[10px] text-slate-500">{activeRide.metodoPagamento}</span>
            </div>
          </div>

          {/* 1-Tap Navigation Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => openWaze(currentTargetAddress)}
              className="py-2.5 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
            >
              <Navigation className="w-3.5 h-3.5" /> Abrir no Waze
            </button>
            <button
              onClick={() => openGoogleMaps(currentTargetAddress)}
              className="py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Abrir no Maps
            </button>
          </div>

          {/* Sequential Action Button */}
          <button
            onClick={handleAdvanceStatus}
            className={`w-full py-4 font-black rounded-2xl text-sm transition shadow-xl flex items-center justify-center gap-2 ${
              isHeadingToPickup 
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                : isAtPickup
                ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/40'
            }`}
          >
            {isHeadingToPickup && 'CHEGUEI AO LOCAL DE RECOLHA'}
            {isAtPickup && 'INICIAR VIAGEM COM PASSAGEIRO'}
            {isTripInProgress && 'FINALIZAR VIAGEM & RECEBER'}
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default DriverDispatchOverlay;
