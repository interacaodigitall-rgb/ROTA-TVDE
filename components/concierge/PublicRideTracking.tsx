import React, { useState, useEffect } from 'react';
import { 
  Car, 
  MapPin, 
  Phone, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  Navigation, 
  Sparkles,
  ArrowRight,
  RefreshCw,
  Building2,
  ExternalLink,
  ChevronRight,
  Share2,
  AlertCircle
} from 'lucide-react';
import { PrivateRide, RideStatus } from '../../types';
import { dispatchService } from '../../services/dispatchService';

interface PublicRideTrackingProps {
  rideId: string;
  onClose?: () => void;
}

export const PublicRideTracking: React.FC<PublicRideTrackingProps> = ({ rideId, onClose }) => {
  const [ride, setRide] = useState<PrivateRide | null>(null);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<'PT' | 'EN' | 'FR' | 'ES'>('PT');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Initial fetch or lookup
    const initialRide = dispatchService.getRideByIdOrToken(rideId);
    if (initialRide) {
      setRide(initialRide);
      setLoading(false);
    }

    // Subscribe to live updates
    const unsub = dispatchService.subscribeToRide(rideId, (updated) => {
      if (updated) {
        setRide(updated);
      }
      setLoading(false);
    });

    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [rideId]);

  const copyTrackingLink = () => {
    const url = `${window.location.origin}/track/${ride?.trackingToken || ride?.id || rideId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Translations
  const t = {
    PT: {
      requestedBy: 'Transfer Solicitado por',
      conciergeService: 'Serviço Oficial de Concierge & Transfer Executivo',
      etaLabel: 'Tempo Estimado de Chegada',
      min: 'min',
      statusPendente: 'A Procurar Motorista Próximo',
      statusACaminho: 'Motorista a Caminho do Hotel',
      statusNoLocal: 'Viatura no Ponto de Recolha',
      statusEmViagem: 'Em Viagem para o Destino',
      statusConcluido: 'Viagem Concluída com Sucesso',
      statusCancelado: 'Viagem Cancelada',
      driverInfo: 'Motorista Designado',
      vehicle: 'Viatura',
      plate: 'Matrícula',
      callDriver: 'Ligar ao Motorista',
      pickupPoint: 'Ponto de Partida',
      destination: 'Destino',
      guest: 'Passageiro',
      room: 'Quarto / Reserva',
      share: 'Partilhar Link',
      copied: 'Link Copiado!',
      category: 'Categoria',
      payment: 'Pagamento',
      managedBy: 'Operado por Asfalto Cativante - TVDE 5.0 Frota Executiva',
      tip: 'Apresente-se na receção ou no pórtico principal assim que a viatura chegar.'
    },
    EN: {
      requestedBy: 'Ride Requested by',
      conciergeService: 'Official Concierge & Executive Chauffeur Service',
      etaLabel: 'Estimated Arrival Time',
      min: 'min',
      statusPendente: 'Assigning Nearby Driver',
      statusACaminho: 'Driver Heading to Your Location',
      statusNoLocal: 'Vehicle Arrived at Entrance',
      statusEmViagem: 'En Route to Destination',
      statusConcluido: 'Trip Completed',
      statusCancelado: 'Trip Cancelled',
      driverInfo: 'Your Chauffeur',
      vehicle: 'Vehicle',
      plate: 'Plate',
      callDriver: 'Call Driver',
      pickupPoint: 'Pickup Point',
      destination: 'Destination',
      guest: 'Passenger',
      room: 'Room / Table',
      share: 'Share Link',
      copied: 'Link Copied!',
      category: 'Category',
      payment: 'Payment',
      managedBy: 'Operated by Asfalto Cativante - Luxury Executive Fleet',
      tip: 'Please proceed to the lobby or main entrance when the vehicle arrives.'
    },
    FR: {
      requestedBy: 'Transfert Demandé par',
      conciergeService: 'Service Officiel de Conciergerie & Chauffeur Privé',
      etaLabel: 'Temps Estimé d’Arrivée',
      min: 'min',
      statusPendente: 'Recherche de Chauffeur',
      statusACaminho: 'Chauffeur en Route vers l’Hôtel',
      statusNoLocal: 'Véhicule Arrivé au Hall',
      statusEmViagem: 'En Route vers la Destination',
      statusConcluido: 'Voyage Terminé',
      statusCancelado: 'Voyage Annulé',
      driverInfo: 'Votre Chauffeur',
      vehicle: 'Véhicule',
      plate: 'Immatriculation',
      callDriver: 'Appeler le Chauffeur',
      pickupPoint: 'Point de Prise en Charge',
      destination: 'Destination',
      guest: 'Passager',
      room: 'Chambre',
      share: 'Partager le Lien',
      copied: 'Lien Copié !',
      category: 'Catégorie',
      payment: 'Paiement',
      managedBy: 'Opéré par Asfalto Cativante - Flotte Privée VIP',
      tip: 'Veuillez vous présenter à la réception à l’arrivée du véhicule.'
    },
    ES: {
      requestedBy: 'Servicio Solicitado por',
      conciergeService: 'Servicio Oficial de Conserjería y Chófer Ejecutivo',
      etaLabel: 'Tiempo Estimado de Llegada',
      min: 'min',
      statusPendente: 'Buscando Conductor Cercano',
      statusACaminho: 'Conductor en Camino al Hotel',
      statusNoLocal: 'Vehículo en el Punto de Recogida',
      statusEmViagem: 'En Viaje hacia el Destino',
      statusConcluido: 'Viaje Completado',
      statusCancelado: 'Viaje Cancelado',
      driverInfo: 'Conductor Asignado',
      vehicle: 'Vehículo',
      plate: 'Matrícula',
      callDriver: 'Llamar al Conductor',
      pickupPoint: 'Punto de Recogida',
      destination: 'Destino',
      guest: 'Pasajero',
      room: 'Habitación / Mesa',
      share: 'Compartir Enlace',
      copied: '¡Enlace Copiado!',
      category: 'Categoría',
      payment: 'Pago',
      managedBy: 'Operado por Asfalto Cativante - Flota Ejecutiva TVDE',
      tip: 'Por favor, acérquese a la entrada principal cuando el vehículo llegue.'
    }
  }[lang];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4" />
        <p className="text-slate-400 text-sm font-medium">A carregar o rastreio da viagem em tempo real...</p>
      </div>
    );
  }

  if (!ride) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold mb-2">Viagem Não Encontrada</h2>
        <p className="text-slate-400 text-sm mb-6">
          O código de rastreio fornecido não corresponde a nenhuma viagem ativa ou já concluída.
        </p>
        <button
          onClick={() => window.location.href = '/concierge'}
          className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold transition"
        >
          Voltar ao Portal Concierge
        </button>
      </div>
    );
  }

  // Pipeline stage index
  const getStageIndex = (status: RideStatus) => {
    switch (status) {
      case 'pendente': return 0;
      case 'a_caminho': return 1;
      case 'no_local': return 2;
      case 'em_viagem': return 3;
      case 'concluido': return 4;
      default: return 0;
    }
  };

  const currentStage = getStageIndex(ride.status);

  // Status title & color
  const getStatusDisplay = () => {
    switch (ride.status) {
      case 'pendente':
        return { text: t.statusPendente, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' };
      case 'a_caminho':
        return { text: t.statusACaminho, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' };
      case 'no_local':
        return { text: t.statusNoLocal, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };
      case 'em_viagem':
        return { text: t.statusEmViagem, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/30' };
      case 'concluido':
        return { text: t.statusConcluido, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' };
      case 'cancelado':
        return { text: t.statusCancelado, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30' };
      default:
        return { text: 'Em Processamento', color: 'text-slate-400', bg: 'bg-slate-800 border-slate-700' };
    }
  };

  const statusBadge = getStatusDisplay();

  // Simulation controls for testing/reviewing all pipeline stages effortlessly
  const handleSimulateStatus = (newStatus: RideStatus) => {
    dispatchService.updateRideStatus(ride.id, newStatus);
    setRide(prev => prev ? { ...prev, status: newStatus } : null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-black">
      {/* Top Bar with Language Selector & Share */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-xs">
              TVDE
            </div>
            <div>
              <p className="text-xs font-bold text-white leading-tight">ROTA TVDE 5.0</p>
              <p className="text-[10px] text-slate-400">Live Guest Tracking</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Picker */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 text-[11px] font-bold">
              {(['PT', 'EN', 'FR', 'ES'] as const).map(l => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2 py-0.5 rounded ${lang === l ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-sm' : 'text-slate-400 hover:text-white'}`}
                >
                  {l}
                </button>
              ))}
            </div>

            <button
              onClick={copyTrackingLink}
              title="Copiar Link de Rastreio"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition flex items-center gap-1 text-xs"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* Establishment Sponsor Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800/90 rounded-2xl p-4 shadow-xl flex items-center gap-3.5">
          <div className="w-13 h-13 rounded-xl bg-slate-800 overflow-hidden border border-slate-700 flex-shrink-0 flex items-center justify-center">
            {ride.establishmentLogo ? (
              <img 
                src={ride.establishmentLogo} 
                alt={ride.establishmentName || 'Hotel'} 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            ) : (
              <Building2 className="w-6 h-6 text-emerald-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {t.requestedBy}
            </span>
            <h1 className="text-base sm:text-lg font-bold text-white truncate">
              {ride.establishmentName || 'Hotel Tivoli Avenida Liberdade'}
            </h1>
            <p className="text-xs text-slate-400 truncate">
              {t.conciergeService}
            </p>
          </div>
        </div>

        {/* Live Status Hero Card */}
        <div className="bg-slate-900 border border-slate-800/90 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
          {/* Pulsing indicator for active rides */}
          {ride.status !== 'concluido' && ride.status !== 'cancelado' && (
            <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Em Tempo Real</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Status Badge & Title */}
            <div>
              <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full border mb-2 ${statusBadge.bg} ${statusBadge.color}`}>
                {statusBadge.text}
              </span>

              {ride.status === 'a_caminho' && (
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    {ride.etaMinutos || 3} {t.min}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {t.etaLabel}
                  </span>
                </div>
              )}

              {ride.status === 'no_local' && (
                <p className="text-emerald-300 text-sm font-semibold mt-1">
                  {t.tip}
                </p>
              )}
            </div>

            {/* Stepper Pipeline */}
            <div className="pt-2">
              <div className="grid grid-cols-5 gap-1.5 relative">
                {['Confirmado', 'A Caminho', 'No Local', 'Em Viagem', 'Concluído'].map((label, idx) => {
                  const isDone = currentStage > idx;
                  const isCurrent = currentStage === idx;
                  return (
                    <div key={label} className="flex flex-col items-center text-center">
                      <div 
                        className={`w-full h-1.5 rounded-full mb-2 transition-all ${
                          isDone 
                            ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50' 
                            : isCurrent 
                              ? 'bg-blue-500 animate-pulse' 
                              : 'bg-slate-800'
                        }`} 
                      />
                      <span className={`text-[10px] font-semibold leading-tight ${
                        isCurrent ? 'text-white font-bold' : isDone ? 'text-emerald-400' : 'text-slate-400'
                      }`}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Chauffeur / Driver Card */}
        {ride.motoristaNome && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3.5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-500/50 bg-slate-800 flex-shrink-0">
                  <img
                    src={ride.motoristaFoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'}
                    alt={ride.motoristaNome}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-white text-sm sm:text-base">{ride.motoristaNome}</h3>
                    <span className="text-xs text-amber-400 font-black flex items-center">
                      ★ {ride.motoristaRating || '4.95'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{t.driverInfo}</p>
                </div>
              </div>

              {ride.motoristaTelefone && (
                <a
                  href={`tel:${ride.motoristaTelefone}`}
                  className="px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 text-xs font-bold transition"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t.callDriver}</span>
                </a>
              )}
            </div>

            {/* Vehicle & Plate Specs */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-slate-850/80 rounded-xl p-3 border border-slate-800">
                <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider mb-0.5">
                  {t.vehicle}
                </span>
                <p className="text-xs font-bold text-white truncate">
                  {ride.viaturaModelo || 'Tesla Model 3 Black'}
                </p>
                <span className="text-[10px] text-emerald-400 font-semibold">
                  {ride.categoria === 'BLACK_TESLA' ? 'VIP Black Executive' : ride.categoria === 'XL_VAN' ? 'Executivo 7 Pax' : 'Conforto'}
                </span>
              </div>

              <div className="bg-slate-850/80 rounded-xl p-3 border border-slate-800 flex flex-col justify-center">
                <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider mb-1">
                  {t.plate}
                </span>
                {/* Authentic PT License Plate Display */}
                <div className="inline-flex items-center bg-white text-slate-900 border border-slate-400 font-black text-xs px-2.5 py-1 rounded shadow-sm tracking-wider font-mono">
                  <span className="text-blue-700 text-[10px] mr-1.5 font-sans font-black">P</span>
                  <span>{ride.viaturaMatricula || '45-TX-90'}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Route Details Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Detalhes do Itinerário
          </h4>

          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-700">
            {/* Origin (Hotel) */}
            <div className="relative">
              <span className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900 ring-4 ring-emerald-500/20" />
              <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                {t.pickupPoint}
              </div>
              <p className="text-xs sm:text-sm font-bold text-white">
                {ride.origem.endereco}
              </p>
              {ride.guestRoomNumber && (
                <span className="inline-block mt-1 text-[11px] font-medium text-amber-300/90 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded-md">
                  📍 {t.room}: <strong>{ride.guestRoomNumber}</strong>
                </span>
              )}
            </div>

            {/* Destination */}
            <div className="relative">
              <span className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-slate-900 ring-4 ring-blue-500/20" />
              <div className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">
                {t.destination}
              </div>
              <p className="text-xs sm:text-sm font-bold text-white">
                {ride.destino.endereco}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {ride.distanciaKm} km • ~{ride.duracaoMin} {t.min} de trajeto
              </p>
            </div>
          </div>

          {/* Passenger & Booking Info */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">{t.guest}</span>
              <span className="font-bold text-white">{ride.clienteNome}</span>
            </div>
            <div className="text-right">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">{t.payment}</span>
              <span className="font-bold text-emerald-400">
                {ride.statusPagamento === 'pago' ? 'Conta Corporativa (Pago)' : `€${ride.valorTotal.toFixed(2)} (${ride.metodoPagamento})`}
              </span>
            </div>
          </div>
        </div>

        {/* Demo/Preview Status Simulation Controls */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Controlo de Simulação (Demonstração):</span>
            <span className="text-[10px] text-emerald-400">Clique para testar estados</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
            <button
              onClick={() => handleSimulateStatus('a_caminho')}
              className={`px-2 py-1.5 rounded-lg border font-medium transition ${ride.status === 'a_caminho' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
            >
              1. A Caminho
            </button>
            <button
              onClick={() => handleSimulateStatus('no_local')}
              className={`px-2 py-1.5 rounded-lg border font-medium transition ${ride.status === 'no_local' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
            >
              2. No Hotel
            </button>
            <button
              onClick={() => handleSimulateStatus('em_viagem')}
              className={`px-2 py-1.5 rounded-lg border font-medium transition ${ride.status === 'em_viagem' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
            >
              3. Em Viagem
            </button>
            <button
              onClick={() => handleSimulateStatus('concluido')}
              className={`px-2 py-1.5 rounded-lg border font-medium transition ${ride.status === 'concluido' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
            >
              4. Concluído
            </button>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center pt-2 pb-6 text-slate-400 text-[11px] space-y-1">
          <p className="flex items-center justify-center gap-1.5 text-slate-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            {t.managedBy}
          </p>
          <p className="text-[10px] text-slate-400">
            ID da Viagem: <code className="font-mono text-slate-300">{ride.id}</code> • Token: <code className="font-mono text-slate-300">{ride.trackingToken || 'b2b'}</code>
          </p>
        </div>
      </main>
    </div>
  );
};
