import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  MapPin, 
  Car, 
  Clock, 
  Calendar, 
  Phone, 
  User as UserIcon, 
  CheckCircle2, 
  Share2, 
  Sparkles, 
  ChevronRight, 
  Search, 
  Filter, 
  ExternalLink, 
  Copy, 
  MessageSquare, 
  ShieldCheck, 
  Lock, 
  AlertCircle,
  RefreshCw,
  LogOut,
  Sliders,
  DollarSign,
  TrendingUp,
  FileText,
  Navigation,
  Send
} from 'lucide-react';
import { 
  Establishment, 
  PrivateRide, 
  VehicleCategory, 
  PaymentMethod, 
  UserRole 
} from '../../types';
import { establishmentService } from '../../services/establishmentService';
import { dispatchService } from '../../services/dispatchService';
import { PlaceAutocompleteInput } from '../map/PlaceAutocompleteInput';
import { useAuth } from '../../hooks/useAuth';

export const ConciergeDashboard: React.FC = () => {
  const { user, logout } = useAuth();

  // Active Establishment (from logged in user or establishmentService)
  const [establishments, setEstablishments] = useState<Establishment[]>(establishmentService.getAll());
  const [currentEstablishment, setCurrentEstablishment] = useState<Establishment>(() => {
    if (user?.establishment) return user.establishment;
    if (user?.establishmentId) {
      const found = establishmentService.getById(user.establishmentId);
      if (found) return found;
    }
    return establishmentService.getActive();
  });

  // Active View Tab: 'REQUEST' | 'MONITOR' | 'BILLING'
  const [activeTab, setActiveTab] = useState<'REQUEST' | 'MONITOR' | 'BILLING'>('REQUEST');

  // Rides for this establishment
  const [establishmentRides, setEstablishmentRides] = useState<PrivateRide[]>([]);
  const [ridesFilter, setRidesFilter] = useState<'ALL' | 'ACTIVE' | 'SCHEDULED' | 'COMPLETED'>('ALL');

  // Form State
  const [subPickupNote, setSubPickupNote] = useState('Porta Principal / Valet Parking');
  const [destinationAddress, setDestinationAddress] = useState('Aeroporto Humberto Delgado (LIS) - Terminal 1');
  const [destCoords, setDestCoords] = useState<{ lat: number; lng: number }>({ lat: 38.7756, lng: -9.1354 });
  const [guestName, setGuestName] = useState('');
  const [guestPhoneDDI, setGuestPhoneDDI] = useState('+351');
  const [guestPhoneLocal, setGuestPhoneLocal] = useState('');
  const [guestRoom, setGuestRoom] = useState('');
  const [conciergeNotes, setConciergeNotes] = useState('');
  
  // Timing
  const [rideType, setRideType] = useState<'imediato' | 'reserva'>('imediato');
  const [scheduledDate, setScheduledDate] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2);
    return d.toISOString().slice(0, 16);
  });

  // Category & Payment
  const [category, setCategory] = useState<VehicleCategory>('BLACK_TESLA');
  const [billingType, setBillingType] = useState<'HOTEL_ACCOUNT' | 'GUEST_PAYS'>('HOTEL_ACCOUNT');
  const [distanceKm, setDistanceKm] = useState(8.5);
  const [durationMin, setDurationMin] = useState(18);

  // Status & Alerts
  const [submitting, setSubmitting] = useState(false);
  const [createdRide, setCreatedRide] = useState<PrivateRide | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Sync rides
  useEffect(() => {
    const unsub = dispatchService.subscribeToEstablishmentRides(currentEstablishment.id, (rides) => {
      setEstablishmentRides(rides);
    });

    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, [currentEstablishment.id]);

  // Handle switching partner establishment (for demo or multi-property managers)
  const handleSelectEstablishment = (estId: string) => {
    const found = establishmentService.getById(estId);
    if (found) {
      setCurrentEstablishment(found);
      establishmentService.setActiveId(estId);
      showToast(`Estabelecimento alterado para: ${found.name}`);
    }
  };

  // Calculations for current estimated route
  const fareEstimates = useMemo(() => {
    const isAirport = destinationAddress.toLowerCase().includes('aeroporto') || destinationAddress.toLowerCase().includes('lis');
    return dispatchService.calculateEstimates(distanceKm, durationMin, isAirport);
  }, [distanceKm, durationMin, destinationAddress]);

  const selectedCategoryFare = fareEstimates[category] || { valorTotal: 22.0, valorLiquido: 18.7, comissao: 3.3 };
  const estimatedPartnerCommission = Math.round((selectedCategoryFare.valorTotal * (currentEstablishment.commissionRatePercent / 100)) * 100) / 100;

  // Frequent destinations presets for concierges
  const POPULAR_DESTINATIONS = [
    { 
      title: 'Aeroporto LIS T1 / T2', 
      address: 'Aeroporto Humberto Delgado (LIS) - Terminal 1',
      coords: { lat: 38.7756, lng: -9.1354 },
      distKm: 8.5,
      durMin: 18,
      icon: '✈️'
    },
    { 
      title: 'Marina de Cascais', 
      address: 'Marina de Cascais, 2750-800 Cascais',
      coords: { lat: 38.6946, lng: -9.4222 },
      distKm: 29.0,
      durMin: 32,
      icon: '🌊'
    },
    { 
      title: 'Palácio da Pena (Sintra)', 
      address: 'Estrada da Pena, 2710-609 Sintra',
      coords: { lat: 38.7877, lng: -9.3906 },
      distKm: 31.5,
      durMin: 40,
      icon: '🏰'
    },
    { 
      title: 'Belém / Jerónimos', 
      address: 'Praça do Império, 1400-206 Lisboa (Belém)',
      coords: { lat: 38.6978, lng: -9.2064 },
      distKm: 7.8,
      durMin: 16,
      icon: '🏛️'
    },
    { 
      title: 'Gare do Oriente (Parque das Nações)', 
      address: 'Av. Dom João II, 1990-231 Lisboa',
      coords: { lat: 38.7678, lng: -9.0991 },
      distKm: 9.2,
      durMin: 19,
      icon: '🚆'
    }
  ];

  const handleSelectPreset = (preset: typeof POPULAR_DESTINATIONS[0]) => {
    setDestinationAddress(preset.address);
    setDestCoords(preset.coords);
    setDistanceKm(preset.distKm);
    setDurationMin(preset.durMin);
  };

  // Submit Ride Request
  const handleSubmitRide = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!guestName.trim()) {
      alert('Por favor insira o Nome do Hóspede.');
      return;
    }

    if (!guestPhoneLocal.trim()) {
      alert('Por favor insira o Telemóvel do Hóspede para envio do rastreio em tempo real.');
      return;
    }

    setSubmitting(true);

    try {
      const fullPhone = `${guestPhoneDDI} ${guestPhoneLocal.trim()}`;
      const trackingToken = Math.random().toString(36).substring(2, 10);
      const total = selectedCategoryFare.valorTotal;
      const b2bCommRate = currentEstablishment.commissionRatePercent;
      const b2bCommVal = Math.round((total * (b2bCommRate / 100)) * 100) / 100;
      const paymentMethod: PaymentMethod = billingType === 'HOTEL_ACCOUNT' ? 'STRIPE' : 'TPA';

      const fullOriginAddress = subPickupNote.trim() 
        ? `${currentEstablishment.fixedPickupAddress} (${subPickupNote.trim()})`
        : currentEstablishment.fixedPickupAddress;

      const newRide = await dispatchService.createRide({
        isB2B: true,
        establishmentId: currentEstablishment.id,
        establishmentName: currentEstablishment.name,
        establishmentLogo: currentEstablishment.logoUrl,
        guestRoomNumber: guestRoom.trim() || undefined,
        conciergeNotes: conciergeNotes.trim() || undefined,
        b2bCommissionRate: b2bCommRate,
        b2bCommissionValue: b2bCommVal,
        trackingToken,
        source: 'b2b_concierge',
        clienteNome: guestName.trim(),
        clienteTelefone: fullPhone,
        origem: {
          lat: currentEstablishment.fixedPickupCoords.lat,
          lng: currentEstablishment.fixedPickupCoords.lng,
          endereco: fullOriginAddress
        },
        destino: {
          lat: destCoords.lat,
          lng: destCoords.lng,
          endereco: destinationAddress
        },
        distanciaKm: distanceKm,
        duracaoMin: durationMin,
        categoria: category,
        valorTotal: total,
        valorLiquidoMotorista: selectedCategoryFare.valorLiquido,
        comissaoFrota: selectedCategoryFare.comissao,
        tipoViagem: rideType,
        dataHoraAgendamento: rideType === 'reserva' ? scheduledDate : undefined,
        metodoPagamento: paymentMethod,
        companyId: 'asfalto-cativante'
      });

      setCreatedRide(newRide);
      setShowSuccessModal(true);
      showToast('Pedido de transfer B2B despachado com sucesso!');

      // Reset guest fields
      setGuestName('');
      setGuestPhoneLocal('');
      setGuestRoom('');
      setConciergeNotes('');
    } catch (err) {
      console.error('Error creating B2B ride:', err);
      alert('Erro ao enviar pedido de viagem. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  // WhatsApp formatted share
  const generateWhatsAppMessage = (r: PrivateRide) => {
    const trackingUrl = `${window.location.origin}/track/${r.trackingToken || r.id}`;
    const text = `Olá ${r.clienteNome}! O seu transfer executivo solicitado pelo Concierge do *${r.establishmentName || currentEstablishment.name}* já se encontra confirmado.\n\n📍 *Origem:* ${r.origem.endereco}\n🏁 *Destino:* ${r.destino.endereco}\n🚕 *Acompanhe a viatura em tempo real no link:*\n${trackingUrl}`;
    return encodeURIComponent(text);
  };

  const handleOpenWhatsApp = (r: PrivateRide) => {
    const cleanPhone = r.clienteTelefone.replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${generateWhatsAppMessage(r)}`;
    window.open(url, '_blank');
  };

  const handleCopyLink = (r: PrivateRide) => {
    const trackingUrl = `${window.location.origin}/track/${r.trackingToken || r.id}`;
    navigator.clipboard.writeText(trackingUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
    showToast('Link de rastreio copiado para a área de transferência!');
  };

  // Filtered rides
  const filteredRides = establishmentRides.filter(r => {
    if (ridesFilter === 'ACTIVE') return ['pendente', 'a_caminho', 'no_local', 'em_viagem'].includes(r.status);
    if (ridesFilter === 'SCHEDULED') return r.tipoViagem === 'reserva' && r.status === 'pendente';
    if (ridesFilter === 'COMPLETED') return r.status === 'concluido';
    return true;
  });

  // Financial metrics for establishment
  const metrics = useMemo(() => {
    const totalRides = establishmentRides.length;
    const completedRides = establishmentRides.filter(r => r.status === 'concluido');
    const activeRides = establishmentRides.filter(r => ['pendente', 'a_caminho', 'no_local', 'em_viagem'].includes(r.status));
    const totalRevenue = completedRides.reduce((acc, r) => acc + (r.valorTotal || 0), 0);
    const totalCommission = completedRides.reduce((acc, r) => acc + (r.b2bCommissionValue || 0), 0);

    return {
      totalRides,
      completedCount: completedRides.length,
      activeCount: activeRides.length,
      totalRevenue,
      totalCommission,
      commissionRate: currentEstablishment.commissionRatePercent
    };
  }, [establishmentRides, currentEstablishment.commissionRatePercent]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-purple-600 selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs sm:text-sm font-bold border border-emerald-400 animate-bounce">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3.5 shadow-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Partner Brand Identity */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 overflow-hidden flex-shrink-0 flex items-center justify-center p-0.5">
              {currentEstablishment.logoUrl ? (
                <img 
                  src={currentEstablishment.logoUrl} 
                  alt={currentEstablishment.name} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                <Building2 className="w-6 h-6 text-purple-400" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-white text-base sm:text-lg tracking-tight">
                  {currentEstablishment.name}
                </h1>
                <span className="px-2 py-0.5 rounded-md bg-purple-950/80 border border-purple-800 text-purple-300 text-[10px] font-extrabold uppercase tracking-wider">
                  B2B Concierge
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                <span className="truncate">{currentEstablishment.fixedPickupAddress}</span>
              </p>
            </div>
          </div>

          {/* Right Header Actions & Stats */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Property Switcher (Demo / Group) */}
            <div className="flex items-center bg-slate-800/90 border border-slate-700/80 rounded-xl px-2.5 py-1 text-xs">
              <span className="text-slate-400 mr-2 text-[11px] hidden sm:inline">Parceiro:</span>
              <select
                value={currentEstablishment.id}
                onChange={(e) => handleSelectEstablishment(e.target.value)}
                className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
              >
                {establishments.map(est => (
                  <option key={est.id} value={est.id} className="bg-slate-900 text-white">
                    {est.name} ({est.category === 'HOTEL' ? 'Hotel' : 'Restaurante'})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Metrics Badges */}
            <div className="hidden lg:flex items-center gap-2">
              <div className="bg-slate-850 border border-slate-700/80 rounded-xl px-3 py-1 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Viagens</span>
                <span className="text-xs font-black text-white">{metrics.totalRides}</span>
              </div>
              <div className="bg-slate-850 border border-slate-700/80 rounded-xl px-3 py-1 text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-400 block">Comissão ({metrics.commissionRate}%)</span>
                <span className="text-xs font-black text-emerald-400">€{metrics.totalCommission.toFixed(2)}</span>
              </div>
            </div>

            {/* Nav Tabs */}
            <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700/80 text-xs font-bold">
              <button
                onClick={() => setActiveTab('REQUEST')}
                className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'REQUEST' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-300 hover:text-white'}`}
              >
                Novo Chamado
              </button>
              <button
                onClick={() => setActiveTab('MONITOR')}
                className={`px-3 py-1.5 rounded-lg transition flex items-center gap-1.5 ${activeTab === 'MONITOR' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-300 hover:text-white'}`}
              >
                <span>Viagens</span>
                {metrics.activeCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('BILLING')}
                className={`px-3 py-1.5 rounded-lg transition ${activeTab === 'BILLING' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-300 hover:text-white'}`}
              >
                Comissões
              </button>
            </div>

            {/* Logout / Switch User */}
            <button
              onClick={logout}
              title="Terminar Sessão"
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 transition border border-slate-700/80"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* TAB 1: NOVO PEDIDO CONCIERGE */}
        {activeTab === 'REQUEST' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Booking Form */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800/90 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Chamado Corporativo Imediato & Agendamento
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">
                    Comissão do Parceiro: <strong className="text-emerald-400">{currentEstablishment.commissionRatePercent}%</strong>
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Despacho de Transfer para Hóspede
                </h2>
              </div>

              <form onSubmit={handleSubmitRide} className="space-y-5">
                {/* 1. ORIGEM FIXA NO HOTEL */}
                <div className="bg-slate-850/80 border border-slate-700/80 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-400" />
                      Origem Fixa do Estabelecimento
                    </label>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Ponto Oficial Bloqueado
                    </span>
                  </div>

                  <div className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm font-semibold text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span className="truncate">{currentEstablishment.fixedPickupAddress}</span>
                  </div>

                  {/* Sub-pickup location */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                      Ponto Específico de Recolha no Estabelecimento:
                    </label>
                    <input
                      type="text"
                      value={subPickupNote}
                      onChange={(e) => setSubPickupNote(e.target.value)}
                      placeholder="ex: Porta Principal / Valet / Lobby / Esplanada"
                      className="w-full px-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                    />
                  </div>
                </div>

                {/* 2. DESTINO COM AUTOCOMPLETE & PRESETS */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Destino da Viagem *
                  </label>
                  
                  <div className="relative">
                    <PlaceAutocompleteInput
                      value={destinationAddress}
                      onChange={(val) => setDestinationAddress(val)}
                      onPlaceSelect={(place) => {
                        setDestinationAddress(place.address);
                        setDestCoords({ lat: place.lat, lng: place.lng });
                        // Estimate distance roughly based on coordinates difference
                        const dLat = Math.abs(place.lat - currentEstablishment.fixedPickupCoords.lat);
                        const dLng = Math.abs(place.lng - currentEstablishment.fixedPickupCoords.lng);
                        const approxKm = Math.max(3.0, Math.round((Math.sqrt(dLat * dLat + dLng * dLng) * 111) * 10) / 10);
                        setDistanceKm(approxKm);
                        setDurationMin(Math.round(approxKm * 2.1));
                      }}
                      placeholder="Pesquise morada, aeroporto, restaurante ou ponto turístico..."
                      className="w-full"
                      inputClassName="w-full px-3.5 py-3 bg-slate-850 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition"
                    />
                  </div>

                  {/* 1-Touch Popular VIP Presets */}
                  <div className="pt-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                      Destinos Frequentes (1-Toque):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {POPULAR_DESTINATIONS.map(preset => (
                        <button
                          key={preset.title}
                          type="button"
                          onClick={() => handleSelectPreset(preset)}
                          className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition flex items-center gap-1 ${
                            destinationAddress === preset.address
                              ? 'bg-purple-600/30 border-purple-500 text-white font-bold'
                              : 'bg-slate-850 hover:bg-slate-800 border-slate-700/80 text-slate-300'
                          }`}
                        >
                          <span>{preset.icon}</span>
                          <span>{preset.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. DADOS DO PASSAGEIRO & QUARTO */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
                  <div className="sm:col-span-7 space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Nome do Hóspede / Cliente *
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        required
                        placeholder="ex: Mr. Alexander Wright"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-850 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-5 space-y-1.5">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Nº Quarto / Mesa
                    </label>
                    <input
                      type="text"
                      value={guestRoom}
                      onChange={(e) => setGuestRoom(e.target.value)}
                      placeholder="ex: Suite 402 / Mesa 8"
                      className="w-full px-3.5 py-2.5 bg-slate-850 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition"
                    />
                  </div>
                </div>

                {/* TELEMÓVEL COM SELETOR DDI */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Telemóvel do Hóspede (Para Envio de Rastreio em Tempo Real) *
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={guestPhoneDDI}
                      onChange={(e) => setGuestPhoneDDI(e.target.value)}
                      className="px-2.5 py-2.5 bg-slate-850 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-purple-500"
                    >
                      <option value="+351">🇵🇹 +351 (PT)</option>
                      <option value="+44">🇬🇧 +44 (UK)</option>
                      <option value="+1">🇺🇸 +1 (US)</option>
                      <option value="+34">🇪🇸 +34 (ES)</option>
                      <option value="+33">🇫🇷 +33 (FR)</option>
                      <option value="+49">🇩🇪 +49 (DE)</option>
                      <option value="+55">🇧🇷 +55 (BR)</option>
                    </select>
                    <div className="relative flex-1">
                      <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="tel"
                        value={guestPhoneLocal}
                        onChange={(e) => setGuestPhoneLocal(e.target.value)}
                        required
                        placeholder="912 345 678"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-slate-850 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. SELEÇÃO DE HORÁRIO: IMEDIATO OU AGENDADO */}
                <div className="space-y-2 pt-1">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Horário do Serviço
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRideType('imediato')}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                        rideType === 'imediato'
                          ? 'bg-purple-600 border-purple-500 text-white shadow-md'
                          : 'bg-slate-850 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <span>⚡ Pedir Agora (Imediato)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRideType('reserva')}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 ${
                        rideType === 'reserva'
                          ? 'bg-purple-600 border-purple-500 text-white shadow-md'
                          : 'bg-slate-850 border-slate-700 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>📅 Agendar Futuro</span>
                    </button>
                  </div>

                  {rideType === 'reserva' && (
                    <div className="p-3 bg-purple-950/40 border border-purple-800/60 rounded-xl mt-2 animate-fadeIn space-y-1">
                      <label className="text-[11px] font-bold text-purple-300 block">
                        Data e Hora do Agendamento:
                      </label>
                      <input
                        type="datetime-local"
                        value={scheduledDate}
                        onChange={(e) => setScheduledDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-purple-700 rounded-lg text-xs text-white focus:outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* NOTAS CONCIERGE (BAGAGENS / PEDIDOS ESPECIAIS) */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Notas do Concierge & Bagagens (Opcional)
                  </label>
                  <input
                    type="text"
                    value={conciergeNotes}
                    onChange={(e) => setConciergeNotes(e.target.value)}
                    placeholder="ex: 4 malas de porão grandes, cadeirinha de bebé necessária"
                    className="w-full px-3 py-2 bg-slate-850 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                  />
                </div>

                {/* 5. SELEÇÃO DE CATEGORIA COM PRICING & COMISSÃO */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Escolha a Categoria da Viatura
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Distância: <strong>{distanceKm} km</strong> (~{durationMin} min)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* Standard */}
                    <button
                      type="button"
                      onClick={() => setCategory('STANDARD')}
                      className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                        category === 'STANDARD'
                          ? 'bg-purple-950/70 border-purple-500 ring-2 ring-purple-500/40'
                          : 'bg-slate-850/90 border-slate-700/80 hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-extrabold text-white block">Standard Conforto</span>
                        <span className="text-[10px] text-slate-400 block">Sedan / Hatchback 4L</span>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-baseline justify-between">
                        <span className="text-sm font-black text-white">€{(fareEstimates.STANDARD?.valorTotal || 14.5).toFixed(2)}</span>
                        <span className="text-[10px] font-bold text-emerald-400">
                          +€{(((fareEstimates.STANDARD?.valorTotal || 14.5) * currentEstablishment.commissionRatePercent) / 100).toFixed(2)}
                        </span>
                      </div>
                    </button>

                    {/* Black Tesla / Prioridade */}
                    <button
                      type="button"
                      onClick={() => setCategory('BLACK_TESLA')}
                      className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between relative ${
                        category === 'BLACK_TESLA'
                          ? 'bg-purple-950/70 border-purple-500 ring-2 ring-purple-500/40'
                          : 'bg-slate-850/90 border-slate-700/80 hover:bg-slate-800'
                      }`}
                    >
                      <span className="absolute -top-2 right-3 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 shadow">
                        VIP
                      </span>
                      <div>
                        <span className="text-xs font-extrabold text-white block">Black Executivo</span>
                        <span className="text-[10px] text-slate-400 block">Tesla / Mercedes Black</span>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-baseline justify-between">
                        <span className="text-sm font-black text-amber-400">€{(fareEstimates.BLACK_TESLA?.valorTotal || 22.0).toFixed(2)}</span>
                        <span className="text-[10px] font-bold text-emerald-400">
                          +€{(((fareEstimates.BLACK_TESLA?.valorTotal || 22.0) * currentEstablishment.commissionRatePercent) / 100).toFixed(2)}
                        </span>
                      </div>
                    </button>

                    {/* XL Van */}
                    <button
                      type="button"
                      onClick={() => setCategory('XL_VAN')}
                      className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                        category === 'XL_VAN'
                          ? 'bg-purple-950/70 border-purple-500 ring-2 ring-purple-500/40'
                          : 'bg-slate-850/90 border-slate-700/80 hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <span className="text-xs font-extrabold text-white block">Asfalto XL Van</span>
                        <span className="text-[10px] text-slate-400 block">7-8 Lugares + Bagagens</span>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-baseline justify-between">
                        <span className="text-sm font-black text-white">€{(fareEstimates.XL_VAN?.valorTotal || 60.0).toFixed(2)}</span>
                        <span className="text-[10px] font-bold text-emerald-400">
                          +€{(((fareEstimates.XL_VAN?.valorTotal || 60.0) * currentEstablishment.commissionRatePercent) / 100).toFixed(2)}
                        </span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* MODALIDADE DE FATURAÇÃO */}
                <div className="bg-slate-850/80 border border-slate-700/80 rounded-2xl p-3.5 space-y-2">
                  <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                    Modalidade de Faturação:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                      billingType === 'HOTEL_ACCOUNT' ? 'bg-purple-950/50 border-purple-500 text-white font-bold' : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}>
                      <input
                        type="radio"
                        name="billing"
                        checked={billingType === 'HOTEL_ACCOUNT'}
                        onChange={() => setBillingType('HOTEL_ACCOUNT')}
                        className="text-purple-600 focus:ring-0"
                      />
                      <span>Faturar ao Hotel (Mensal B2B)</span>
                    </label>

                    <label className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition ${
                      billingType === 'GUEST_PAYS' ? 'bg-purple-950/50 border-purple-500 text-white font-bold' : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}>
                      <input
                        type="radio"
                        name="billing"
                        checked={billingType === 'GUEST_PAYS'}
                        onChange={() => setBillingType('GUEST_PAYS')}
                        className="text-purple-600 focus:ring-0"
                      />
                      <span>Hóspede Paga a Bordo (TPA/MBWAY)</span>
                    </label>
                  </div>
                </div>

                {/* SUBMIT BUTTON */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-base shadow-xl shadow-purple-600/30 flex items-center justify-center gap-3 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      A Despachar Transfer Executivo...
                    </span>
                  ) : (
                    <>
                      <Car className="w-5 h-5" />
                      <span>Confirmar e Despachar Transfer B2B</span>
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Right Column: Live Status & Active Rides Widget */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Partner Card Summary */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-white text-base">Contrato do Estabelecimento</h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                    Ativo & Validado
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Responsável de Conta:</span>
                    <span className="font-bold text-white">{currentEstablishment.accountManager || 'Equipa Asfalto VIP'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Taxa de Comissão Acordada:</span>
                    <span className="font-black text-emerald-400">{currentEstablishment.commissionRatePercent}%</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">NIF de Faturação:</span>
                    <span className="font-mono text-slate-300">{currentEstablishment.billingNif || '502345678'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Contacto de Urgência:</span>
                    <span className="font-mono text-purple-300">{currentEstablishment.contactPhone}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-850 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                  <span className="font-bold text-slate-300 block">Procedimento de Chegada:</span>
                  <p>{currentEstablishment.notes || 'A viatura apresenta-se no pórtico principal com dísticos TVDE e identificação da frota.'}</p>
                </div>
              </div>

              {/* Active / Recent Rides for this partner */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-white text-base flex items-center gap-2">
                    <span>Viagens em Andamento</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800">
                      {establishmentRides.filter(r => ['pendente', 'a_caminho', 'no_local', 'em_viagem'].includes(r.status)).length}
                    </span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('MONITOR')}
                    className="text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    <span>Ver Todas</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3">
                  {establishmentRides.slice(0, 3).map(r => (
                    <div 
                      key={r.id} 
                      className="p-3.5 rounded-2xl bg-slate-850 border border-slate-800 hover:border-slate-700 transition space-y-2"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-white truncate max-w-[170px]">
                          {r.clienteNome}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                          r.status === 'a_caminho' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                          r.status === 'em_viagem' ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' :
                          r.status === 'no_local' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                          r.status === 'concluido' ? 'bg-emerald-950/60 text-emerald-400' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {r.status === 'a_caminho' ? `A Caminho (${r.etaMinutos || 3} min)` :
                           r.status === 'em_viagem' ? 'Em Viagem' :
                           r.status === 'no_local' ? 'No Ponto de Recolha' :
                           r.status === 'concluido' ? 'Concluída' : 'A Atribuir'}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 truncate">
                        🏁 {r.destino.endereco}
                      </p>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-xs">
                        <span className="font-bold text-emerald-400">
                          €{r.valorTotal.toFixed(2)}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenWhatsApp(r)}
                            title="Enviar WhatsApp ao Hóspede"
                            className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleCopyLink(r)}
                            title="Copiar Link de Rastreio"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href={`/track/${r.trackingToken || r.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 transition"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}

                  {establishmentRides.length === 0 && (
                    <div className="text-center py-6 text-slate-500 text-xs">
                      Nenhuma viagem registada ainda para este parceiro.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MONITORIZAÇÃO EM TEMPO REAL */}
        {activeTab === 'MONITOR' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white">
                  Monitor de Viagens B2B
                </h2>
                <p className="text-xs text-slate-400">
                  Acompanhamento em tempo real de todos os transfers solicitados pelo {currentEstablishment.name}.
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs font-bold">
                <button
                  onClick={() => setRidesFilter('ALL')}
                  className={`px-3 py-1.5 rounded-lg transition ${ridesFilter === 'ALL' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Todas ({establishmentRides.length})
                </button>
                <button
                  onClick={() => setRidesFilter('ACTIVE')}
                  className={`px-3 py-1.5 rounded-lg transition ${ridesFilter === 'ACTIVE' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Em Curso ({establishmentRides.filter(r => ['pendente', 'a_caminho', 'no_local', 'em_viagem'].includes(r.status)).length})
                </button>
                <button
                  onClick={() => setRidesFilter('SCHEDULED')}
                  className={`px-3 py-1.5 rounded-lg transition ${ridesFilter === 'SCHEDULED' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Agendadas
                </button>
                <button
                  onClick={() => setRidesFilter('COMPLETED')}
                  className={`px-3 py-1.5 rounded-lg transition ${ridesFilter === 'COMPLETED' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Concluídas
                </button>
              </div>
            </div>

            {/* Rides Grid / Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRides.map(r => (
                <div 
                  key={r.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 hover:border-purple-500/50 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Status & Timing */}
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                        r.status === 'a_caminho' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' :
                        r.status === 'em_viagem' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' :
                        r.status === 'no_local' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                        r.status === 'concluido' ? 'bg-slate-800 text-slate-300 border border-slate-700' :
                        'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}>
                        {r.status === 'a_caminho' ? `A Caminho • ETA ${r.etaMinutos || 3}m` :
                         r.status === 'em_viagem' ? 'Em Viagem' :
                         r.status === 'no_local' ? 'No Ponto de Recolha' :
                         r.status === 'concluido' ? 'Concluída' : 'A Procurar Viatura'}
                      </span>

                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(r.createdAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Passenger & Room */}
                    <div>
                      <h3 className="font-extrabold text-white text-base">{r.clienteNome}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-purple-400 font-mono">{r.clienteTelefone}</span>
                        {r.guestRoomNumber && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            {r.guestRoomNumber}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Route Details */}
                    <div className="space-y-1.5 text-xs text-slate-300 pt-1">
                      <div className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">De:</span>
                        <span className="truncate">{r.origem.endereco}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-blue-400 font-bold">Para:</span>
                        <span className="truncate">{r.destino.endereco}</span>
                      </div>
                    </div>

                    {/* Assigned Driver & Vehicle */}
                    {r.motoristaNome ? (
                      <div className="p-3 rounded-xl bg-slate-850 border border-slate-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-750 border border-slate-700">
                            <img
                              src={r.motoristaFoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'}
                              alt={r.motoristaNome}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <span className="font-bold text-white block">{r.motoristaNome}</span>
                            <span className="text-[10px] text-slate-400 block">{r.viaturaModelo || 'Tesla Model 3'}</span>
                          </div>
                        </div>

                        <span className="font-mono text-xs bg-slate-900 px-2 py-1 rounded border border-slate-700 text-slate-200">
                          {r.viaturaMatricula || '45-TX-90'}
                        </span>
                      </div>
                    ) : (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>A despachar viatura mais próxima...</span>
                      </div>
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Valor / Comissão</span>
                      <span className="font-black text-white text-sm">
                        €{r.valorTotal.toFixed(2)}{' '}
                        <span className="text-xs text-emerald-400">(+€{(r.b2bCommissionValue || 0).toFixed(2)})</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenWhatsApp(r)}
                        title="Enviar Rastreio por WhatsApp"
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition flex items-center gap-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </button>

                      <a
                        href={`/track/${r.trackingToken || r.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Rastrear</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))}

              {filteredRides.length === 0 && (
                <div className="col-span-full py-16 text-center text-slate-400 bg-slate-900 border border-slate-800 rounded-2xl">
                  <Car className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                  <p className="font-bold">Nenhuma viagem encontrada com este filtro.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: EXTRATO & FATURAÇÃO B2B */}
        {activeTab === 'BILLING' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Extrato Financeiro & Comissões B2B
              </h2>
              <p className="text-xs text-slate-400">
                Relatório de faturação e liquidação de comissões de concierge para o {currentEstablishment.name}.
              </p>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Volume Faturado Total
                </span>
                <span className="text-2xl sm:text-3xl font-black text-white block">
                  €{metrics.totalRevenue.toFixed(2)}
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  {metrics.completedCount} transfers concluídos
                </span>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                  Comissões Acumuladas ({metrics.commissionRate}%)
                </span>
                <span className="text-2xl sm:text-3xl font-black text-emerald-400 block">
                  €{metrics.totalCommission.toFixed(2)}
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Valor a creditar ao estabelecimento
                </span>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Ticket Médio por Transfer
                </span>
                <span className="text-2xl sm:text-3xl font-black text-white block">
                  €{metrics.completedCount > 0 ? (metrics.totalRevenue / metrics.completedCount).toFixed(2) : '0.00'}
                </span>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Tarifas executivas e aeroporto
                </span>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block mb-1">
                    Próxima Liquidação
                  </span>
                  <span className="text-base font-black text-white block">
                    Fim do Mês Corrente
                  </span>
                </div>
                <button
                  onClick={() => showToast('Extrato B2B emitido e pronto para download.')}
                  className="w-full mt-3 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Emitir Extrato em PDF/CSV</span>
                </button>
              </div>
            </div>

            {/* Detailed Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h3 className="font-extrabold text-white text-sm">Histórico de Transfers e Comissionamento</h3>
                <span className="text-xs text-slate-400">Total: {establishmentRides.length} registos</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-850/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Data / ID</th>
                      <th className="py-3 px-4">Hóspede</th>
                      <th className="py-3 px-4">Itinerário</th>
                      <th className="py-3 px-4">Categoria</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Valor Bruto</th>
                      <th className="py-3 px-4 text-right">Comissão Hotel</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {establishmentRides.map(r => (
                      <tr key={r.id} className="hover:bg-slate-850/50 transition">
                        <td className="py-3 px-4">
                          <span className="font-mono text-slate-300 block">{r.id.substring(0, 14)}</span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(r.createdAt).toLocaleDateString('pt-PT')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-white block">{r.clienteNome}</span>
                          {r.guestRoomNumber && (
                            <span className="text-[10px] text-slate-400">{r.guestRoomNumber}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate">
                          <span className="text-slate-300 block truncate">{r.destino.endereco}</span>
                          <span className="text-[10px] text-slate-500">{r.distanciaKm} km</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-purple-300">
                            {r.categoria === 'BLACK_TESLA' ? 'Black Tesla' : r.categoria === 'XL_VAN' ? 'Van XL' : 'Standard'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.status === 'concluido' ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-white">
                          €{r.valorTotal.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-emerald-400">
                          €{(r.b2bCommissionValue || (r.valorTotal * currentEstablishment.commissionRatePercent / 100)).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL DE SUCESSO & ENVIO DE RASTREIO */}
      {showSuccessModal && createdRide && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-fadeIn text-slate-100">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-white">
                Transfer B2B Despachado com Sucesso!
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                O chamado executivo já foi integrado no sistema de despacho da frota Asfalto Cativante.
              </p>
            </div>

            {/* Ride Details Summary */}
            <div className="p-4 rounded-2xl bg-slate-850 border border-slate-800 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Hóspede:</span>
                <span className="font-bold text-white">{createdRide.clienteNome}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Telemóvel:</span>
                <span className="font-mono text-purple-300">{createdRide.clienteTelefone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Destino:</span>
                <span className="font-bold text-white truncate max-w-[220px]">{createdRide.destino.endereco}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Tarifa Estimada:</span>
                <span className="font-bold text-white">€{createdRide.valorTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-700/60 pt-2">
                <span className="text-slate-400">Comissão do Parceiro ({createdRide.b2bCommissionRate}%):</span>
                <span className="font-black text-emerald-400">+€{(createdRide.b2bCommissionValue || 0).toFixed(2)}</span>
              </div>
            </div>

            {/* Tracking Link Box */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Link de Rastreio em Tempo Real para o Hóspede:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/track/${createdRide.trackingToken || createdRide.id}`}
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-300 truncate focus:outline-none"
                />
                <button
                  onClick={() => handleCopyLink(createdRide)}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Copy className="w-4 h-4" />
                  <span>{copiedLink ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={() => handleOpenWhatsApp(createdRide)}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Enviar Rastreio por WhatsApp ao Hóspede</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <a
                  href={`/track/${createdRide.trackingToken || createdRide.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition text-center"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir Tela de Rastreio</span>
                </a>

                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
