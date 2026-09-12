import React, { useState } from 'react';
import { 
  Users, 
  Calendar, 
  CreditCard, 
  Smartphone, 
  DollarSign, 
  ArrowLeft, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  Check, 
  ChevronRight,
  Info,
  MapPin,
  Car
} from 'lucide-react';
import { VehicleCategory, PaymentMethod } from '../../types';
import { 
  StandardCarSvg, 
  ElectricCarSvg, 
  VanXlSvg, 
  PrioridadeCarSvg 
} from './VehicleGraphics';

export interface CategoryOption {
  id: VehicleCategory;
  name: string;
  badge?: string;
  badgeType?: 'fastest' | 'eco' | 'vip' | 'xl';
  capacity: string;
  description: string;
  etaMin: number;
  multiplier: number;
  fixedPrice: number;
  renderGraphic: () => React.ReactNode;
}

interface TripConfirmationScreenProps {
  originAddress: string;
  destinationAddress: string;
  distanceKm: number;
  durationMin: number;
  selectedCategory: VehicleCategory;
  onSelectCategory: (cat: VehicleCategory) => void;
  paymentMethod: PaymentMethod;
  onSelectPaymentMethod: (pm: PaymentMethod) => void;
  mbwayPhone: string;
  setMbwayPhone: (phone: string) => void;
  rideTiming: 'imediato' | 'agendado';
  scheduledTime?: string;
  onOpenScheduleModal: () => void;
  onBackToRouteEdit: () => void;
  onConfirmRide: () => void;
  estimates: Record<VehicleCategory, { valorTotal: number; valorLiquido: number; comissao: number }>;
  isAirportFixedRate?: boolean;
  airportZoneLabel?: string;
  isNightRate?: boolean;
}

export const TripConfirmationScreen: React.FC<TripConfirmationScreenProps> = ({
  originAddress,
  destinationAddress,
  distanceKm,
  durationMin,
  selectedCategory,
  onSelectCategory,
  paymentMethod,
  onSelectPaymentMethod,
  mbwayPhone,
  setMbwayPhone,
  rideTiming,
  scheduledTime,
  onOpenScheduleModal,
  onBackToRouteEdit,
  onConfirmRide,
  estimates,
  isAirportFixedRate,
  airportZoneLabel,
  isNightRate
}) => {
  const [isPaymentSelectorOpen, setIsPaymentSelectorOpen] = useState(false);
  const [showMbwayInput, setShowMbwayInput] = useState(paymentMethod === 'MBWAY');

  // Compute realistic arrival time
  const getArrivalClock = (minutesAhead: number) => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + minutesAhead);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const categories: CategoryOption[] = [
    {
      id: 'STANDARD',
      name: 'Asfalto Standard',
      badge: 'Mais rápido',
      badgeType: 'fastest',
      capacity: '4',
      description: 'Económico & Moderno • Peugeot / Corolla',
      etaMin: 3,
      multiplier: 1.0,
      fixedPrice: estimates.STANDARD?.valorTotal || 8.90,
      renderGraphic: () => <StandardCarSvg className="w-20 h-11" />
    },
    {
      id: 'ELECTRIC',
      name: 'Asfalto Electric',
      badge: '100% Elétrico',
      badgeType: 'eco',
      capacity: '4',
      description: 'Zero Emissões • Silencioso & Ecológico',
      etaMin: 5,
      multiplier: 1.18,
      fixedPrice: estimates.ELECTRIC?.valorTotal || 11.20,
      renderGraphic: () => <ElectricCarSvg className="w-20 h-11" />
    },
    {
      id: 'XL_VAN',
      name: 'Asfalto XL',
      badge: 'Grupos & Malas',
      badgeType: 'xl',
      capacity: '6-7',
      description: 'Espaço & Bagagem Grande • Minivan / 7 Lugares',
      etaMin: 7,
      multiplier: 1.5,
      fixedPrice: estimates.XL_VAN?.valorTotal || 17.50,
      renderGraphic: () => <VanXlSvg className="w-20 h-11" />
    },
    {
      id: 'PRIORIDADE',
      name: 'Asfalto Prioridade',
      badge: 'Executivo VIP',
      badgeType: 'vip',
      capacity: '4',
      description: 'Tesla Model 3 / Model Y • Wi-Fi • Água • Top Rating',
      etaMin: 4,
      multiplier: 1.35,
      fixedPrice: estimates.PRIORIDADE?.valorTotal || 14.50,
      renderGraphic: () => <PrioridadeCarSvg className="w-20 h-11" />
    }
  ];

  const currentSelectedCategory = categories.find(c => c.id === selectedCategory) || categories[0];

  const getBadgeStyle = (badgeType?: string) => {
    switch (badgeType) {
      case 'fastest':
        return 'bg-emerald-500 text-white font-extrabold';
      case 'eco':
        return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
      case 'vip':
        return 'bg-amber-400 text-slate-950 font-black';
      case 'xl':
        return 'bg-blue-500/20 text-blue-300 border border-blue-500/40';
      default:
        return 'bg-slate-700 text-slate-200';
    }
  };

  const getPaymentLabel = (pm: PaymentMethod) => {
    switch (pm) {
      case 'MBWAY': return 'MB WAY';
      case 'CARD': return 'Cartão de Crédito';
      case 'CASH': return 'Dinheiro ao Motorista';
      case 'TPA': return 'TPA no Carro';
    }
  };

  const getPaymentIcon = (pm: PaymentMethod) => {
    switch (pm) {
      case 'MBWAY': return <Smartphone className="w-4 h-4 text-rose-400" />;
      case 'CARD': return <CreditCard className="w-4 h-4 text-blue-400" />;
      case 'CASH': return <DollarSign className="w-4 h-4 text-emerald-400" />;
      case 'TPA': return <CreditCard className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="w-full bg-[#0F172A] border-t sm:border border-slate-800/90 rounded-t-[32px] sm:rounded-3xl shadow-[0_-12px_45px_rgba(0,0,0,0.85)] p-4 sm:p-5 text-slate-100 flex flex-col space-y-3.5 animate-fadeIn">
      {/* 1. Header Drag Handle & Summary Pill */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToRouteEdit}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition py-1 px-2 rounded-xl hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Alterar rota</span>
        </button>

        <div className="w-10 h-1 bg-slate-700 rounded-full" />

        <div className="text-right">
          <span className="text-[11px] font-black text-emerald-400">
            {distanceKm} km • ~{durationMin} min
          </span>
        </div>
      </div>

      {/* 2. Route Mini-Summary Banner */}
      <div className="bg-slate-950/80 rounded-xl px-3 py-2 border border-slate-800/70 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 min-w-0 pr-2">
          <div className="w-2 h-2 rounded-full bg-slate-300 flex-shrink-0" />
          <span className="truncate text-slate-300 text-[11px] font-medium">{originAddress}</span>
        </div>
        <span className="text-slate-600 px-1">→</span>
        <div className="flex items-center gap-2 min-w-0 pl-1">
          <div className="w-2 h-2 rounded-sm bg-emerald-400 flex-shrink-0" />
          <span className="truncate text-white text-[11px] font-bold">{destinationAddress}</span>
        </div>
      </div>

      {/* Airport Fixed Fare Notice Badge */}
      {isAirportFixedRate && (
        <div className="flex items-center justify-between px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl animate-fadeIn">
          <div className="flex items-center gap-2 min-w-0">
            <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black uppercase tracking-wider whitespace-nowrap">
              Preço Fixo Aeroporto
            </span>
            <span className="text-xs font-bold text-emerald-300 truncate">
              {airportZoneLabel || 'Tarifa Fixa Georreferenciada'}
            </span>
          </div>
          <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap pl-2">
            {isNightRate ? '🌙 Noturno' : '☀️ Diurno'}
          </span>
        </div>
      )}

      {/* 3. Gaveta Inferior de Categorias (Bottom Sheet Vehicle Options) */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;

          return (
            <div
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between select-none relative ${
                isSelected 
                  ? 'bg-slate-900 border-white/80 shadow-[0_4px_20px_rgba(255,255,255,0.08)] ring-1 ring-white/40' 
                  : 'bg-slate-950/60 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900/40'
              }`}
            >
              {/* Left Side: Vehicle Render Graphic */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-20 h-12 flex items-center justify-center flex-shrink-0">
                  {cat.renderGraphic()}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-black text-white tracking-tight">
                      {cat.name}
                    </span>
                    <span className="flex items-center gap-0.5 text-[11px] text-slate-400">
                      <Users className="w-3 h-3 text-slate-400" />
                      {cat.capacity}
                    </span>
                    {cat.badge && (
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase tracking-wider ${getBadgeStyle(cat.badgeType)}`}>
                        {cat.badge}
                      </span>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-400 truncate mt-0.5">
                    {cat.description}
                  </div>

                  <div className="text-[11px] text-slate-300 font-bold flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{getArrivalClock(cat.etaMin)}</span>
                    <span className="text-slate-500">•</span>
                    <span className="text-emerald-400">{cat.etaMin} min de espera</span>
                  </div>
                </div>
              </div>

              {/* Right Side: Fixed Price & Selection Circle */}
              <div className="text-right flex-shrink-0 pl-3">
                <div className="text-base sm:text-lg font-black text-white">
                  €{cat.fixedPrice.toFixed(2)}
                </div>
                {isSelected && (
                  <div className="text-[10px] text-emerald-400 font-bold">
                    Selecionado
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Barra de Confirmação e Pagamento */}
      <div className="pt-1 space-y-2">
        {/* Payment Method Selector Row */}
        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={() => setIsPaymentSelectorOpen(!isPaymentSelectorOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-bold text-slate-200 transition"
          >
            {getPaymentIcon(paymentMethod)}
            <span>{getPaymentLabel(paymentMethod)}</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
          </button>

          {rideTiming === 'agendado' && (
            <button
              type="button"
              onClick={onOpenScheduleModal}
              className="flex items-center gap-1.5 text-xs text-blue-400 font-bold hover:underline"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{scheduledTime ? new Date(scheduledTime).toLocaleString('pt-PT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Agendado'}</span>
            </button>
          )}
        </div>

        {/* Dropdown Modal for Payment Options */}
        {isPaymentSelectorOpen && (
          <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 animate-fadeIn">
            <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
              Escolha a forma de pagamento
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  onSelectPaymentMethod('MBWAY');
                  setShowMbwayInput(true);
                  setIsPaymentSelectorOpen(false);
                }}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition ${
                  paymentMethod === 'MBWAY'
                    ? 'bg-rose-950/40 border-rose-500 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-rose-400" /> MB WAY
                </span>
                {paymentMethod === 'MBWAY' && <Check className="w-3.5 h-3.5 text-rose-400" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectPaymentMethod('CARD');
                  setShowMbwayInput(false);
                  setIsPaymentSelectorOpen(false);
                }}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition ${
                  paymentMethod === 'CARD'
                    ? 'bg-blue-950/40 border-blue-500 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                }`}
              >
                <span className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-400" /> Cartão de Crédito
                </span>
                {paymentMethod === 'CARD' && <Check className="w-3.5 h-3.5 text-blue-400" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectPaymentMethod('CASH');
                  setShowMbwayInput(false);
                  setIsPaymentSelectorOpen(false);
                }}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-between transition ${
                  paymentMethod === 'CASH'
                    ? 'bg-emerald-950/40 border-emerald-500 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850'
                }`}
              >
                <span className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" /> Dinheiro ao Motorista
                </span>
                {paymentMethod === 'CASH' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
              </button>
            </div>
          </div>
        )}

        {/* MB WAY phone input if active */}
        {paymentMethod === 'MBWAY' && showMbwayInput && (
          <div className="p-2.5 bg-slate-950/90 rounded-xl border border-slate-800 flex items-center gap-2 animate-fadeIn">
            <span className="text-xs font-bold text-rose-400 whitespace-nowrap">MB WAY:</span>
            <input
              type="tel"
              value={mbwayPhone}
              onChange={(e) => setMbwayPhone(e.target.value)}
              placeholder="912 345 678"
              className="w-full bg-transparent text-xs text-white font-bold focus:outline-none placeholder-slate-500"
            />
          </div>
        )}

        {/* Botão Principal Preto de Largura Total & Ícone Lateral para Agendamento */}
        <div className="flex items-center gap-2 pt-1">
          {/* Botão Principal Preto no Estilo Uber Oficial */}
          <button
            type="button"
            onClick={onConfirmRide}
            className="flex-1 py-4 px-6 rounded-2xl bg-black hover:bg-zinc-900 active:scale-[0.99] text-white font-black text-base transition shadow-2xl border border-zinc-700/60 flex items-center justify-center gap-2 tracking-tight group cursor-pointer"
          >
            <span>Escolha {currentSelectedCategory.name}</span>
            <span className="text-sm font-bold text-zinc-400 group-hover:text-white">
              (€{currentSelectedCategory.fixedPrice.toFixed(2)})
            </span>
          </button>

          {/* Ícone Lateral para Agendamento de Data/Hora */}
          <button
            type="button"
            onClick={onOpenScheduleModal}
            className={`p-4 rounded-2xl border transition shadow-lg flex items-center justify-center flex-shrink-0 cursor-pointer ${
              rideTiming === 'agendado'
                ? 'bg-blue-600 text-white border-blue-400 shadow-blue-600/30'
                : 'bg-black hover:bg-zinc-900 text-zinc-300 hover:text-white border-zinc-700/60'
            }`}
            title="Agendar viagem para data ou hora futura"
          >
            <Calendar className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TripConfirmationScreen;
