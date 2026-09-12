import React from 'react';
import { 
  X, 
  Clock, 
  Gem, 
  Calendar, 
  MapPin, 
  CheckCircle2, 
  Sparkles, 
  Car, 
  TrendingUp, 
  Tv, 
  ArrowUpRight,
  User,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { PrivateRide } from '../../types';

// 1. MODAL: HISTÓRICO DE VIAGENS
export const DriverRideHistoryModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  completedRides: PrivateRide[];
}> = ({ isOpen, onClose, completedRides }) => {
  if (!isOpen) return null;

  const mockHistoricalRides = [
    {
      id: 'ride-h-1',
      date: 'Hoje, 14:25',
      origem: 'Aeroporto Humberto Delgado (T1)',
      destino: 'Avenida da Liberdade 180, Lisboa',
      distanciaKm: 8.4,
      duracaoMin: 22,
      valorTotal: 18.50,
      valorLiquido: 15.72,
      categoria: 'BLACK_TESLA',
      gorjeta: 2.00
    },
    {
      id: 'ride-h-2',
      date: 'Hoje, 12:10',
      origem: 'Gare do Oriente, Parque das Nações',
      destino: 'Cais do Sodré, Lisboa',
      distanciaKm: 11.2,
      duracaoMin: 28,
      valorTotal: 14.80,
      valorLiquido: 12.58,
      categoria: 'BLACK_TESLA',
      gorjeta: 0
    },
    {
      id: 'ride-h-3',
      date: 'Hoje, 09:40',
      origem: 'Saldanha (Atrium Saldanha)',
      destino: 'Torre Vasco da Gama, Expo',
      distanciaKm: 7.9,
      duracaoMin: 19,
      valorTotal: 12.30,
      valorLiquido: 10.45,
      categoria: 'BLACK_TESLA',
      gorjeta: 1.50
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-blue-950/80 border border-blue-500/40 text-blue-400">
              <Clock className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-black text-white">Histórico de Viagens</h3>
              <p className="text-xs text-slate-400">Serviços efetuados e ganhos detalhados</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 no-scrollbar">
          {/* Recent Live Completed Rides (if any in session) */}
          {completedRides.map(ride => (
            <div key={ride.id} className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Concluída agora
                </span>
                <span className="font-mono font-black text-white text-sm">
                  +€{ride.valorLiquidoMotorista.toFixed(2)}
                </span>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1 flex-shrink-0" />
                  <span className="text-slate-300 font-medium truncate">{ride.origem}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 mt-1 flex-shrink-0" />
                  <span className="text-slate-300 font-medium truncate">{ride.destino}</span>
                </div>
              </div>
            </div>
          ))}

          {/* Historical Trips */}
          {mockHistoricalRides.map(trip => (
            <div key={trip.id} className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-semibold">{trip.date}</span>
                <div className="text-right">
                  <span className="font-mono font-black text-emerald-400 text-sm">
                    €{trip.valorLiquido.toFixed(2)}
                  </span>
                  {trip.gorjeta > 0 && (
                    <span className="text-[10px] text-amber-400 font-bold block">
                      +€{trip.gorjeta.toFixed(2)} gorjeta
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1 flex-shrink-0" />
                  <span className="text-slate-200 font-medium">{trip.origem}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 mt-1 flex-shrink-0" />
                  <span className="text-slate-200 font-medium">{trip.destino}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                <span>{trip.distanciaKm} km • {trip.duracaoMin} min</span>
                <span className="px-2 py-0.5 rounded bg-slate-850 font-mono text-[10px] text-slate-300">
                  Total Bruto: €{trip.valorTotal.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
        >
          Fechar Histórico
        </button>
      </div>
    </div>
  );
};

// 2. MODAL: CAMPANHAS & BÓNUS ADTECH
export const DriverCampaignsModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-400">
              <Gem className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-black text-white">Campanhas & Metas de Bónus</h3>
              <p className="text-xs text-slate-400">Incentivos ativos e monetização da viatura</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1 no-scrollbar text-xs">
          {/* Campanha 1: Meta Semanal */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 to-slate-900 border border-amber-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-md bg-amber-950 border border-amber-500/40 text-amber-400 text-[10px] font-bold">
                META SEMANAL
              </span>
              <span className="font-mono font-black text-amber-400 text-base">+€85.00 Bónus</span>
            </div>

            <div>
              <h4 className="font-bold text-white text-sm">60 Viagens no Turno</h4>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Complete 60 viagens até domingo às 23:59 para desbloquear o bónus de assiduidade.
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-300 font-semibold">
                <span>Progresso: 44 / 60 viagens</span>
                <span className="text-amber-400">73%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500 to-amber-300 h-full rounded-full w-[73%]" />
              </div>
            </div>
          </div>

          {/* Campanha 2: Tablet AdTech */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-md bg-emerald-950 border border-emerald-500/40 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                <Tv className="w-3 h-3" /> ADTECH TABLET
              </span>
              <span className="font-mono font-black text-emerald-400 text-base">+€35.00</span>
            </div>

            <div>
              <h4 className="font-bold text-white text-sm">Horas Ativas com Ecrã Ligado</h4>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Mantenha o tablet de publicidade ativo durante os serviços para acumular ganhos passivos.
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-300 font-semibold">
                <span>Tempo ativo esta semana: 28.5h / 35h</span>
                <span className="text-emerald-400">81%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-300 h-full rounded-full w-[81%]" />
              </div>
            </div>
          </div>

          {/* Campanha 3: Surge Lisboa */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-md bg-purple-950 border border-purple-500/40 text-purple-300 text-[10px] font-bold">
                MULTIPLICADOR DE PICO
              </span>
              <span className="font-mono font-bold text-purple-300">+€3.50 / viagem</span>
            </div>
            <h4 className="font-bold text-white">Zonas Quentes: Aeroporto & Baixa</h4>
            <p className="text-slate-400 text-[11px]">
              Viagens iniciadas nos períodos de ponta (07:00-10:00 e 17:30-20:30) recebem acréscimo dinâmico imediato.
            </p>
          </div>
        </div>

        {/* Footer */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
        >
          Fechar Campanhas
        </button>
      </div>
    </div>
  );
};

// 3. MODAL: VIAGENS AGENDADAS
export const DriverScheduledRidesModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const scheduledTrips = [
    {
      id: 'sch-1',
      datetime: 'Amanhã, 06:30',
      cliente: 'Henrique Vasconcelos',
      tipo: 'Transfer Aeroporto (Executivo)',
      origem: 'Hotel Corinthia, Sete Rios',
      destino: 'Aeroporto Humberto Delgado (T1)',
      veiculo: 'Tesla Model 3 / Black',
      tarifaEstimada: '€28.00',
      status: 'CONFIRMADO'
    },
    {
      id: 'sch-2',
      datetime: 'Amanhã, 19:45',
      cliente: 'Dra. Carolina M.',
      tipo: 'Transfer Noturno Particular',
      origem: 'Hospital da Luz, Benfica',
      destino: 'Cascais Shopping, Cascais',
      veiculo: 'Tesla Model 3 / Black',
      tarifaEstimada: '€42.50',
      status: 'CONFIRMADO'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-teal-950/80 border border-teal-500/40 text-teal-400">
              <Calendar className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-black text-white">Viagens Agendadas & Transfers</h3>
              <p className="text-xs text-slate-400">Reservas antecipadas e serviços programados</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1 no-scrollbar text-xs">
          {scheduledTrips.map(trip => (
            <div key={trip.id} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-md bg-teal-950 text-teal-400 border border-teal-500/40 text-[10px] font-bold">
                  {trip.datetime}
                </span>
                <span className="font-mono font-black text-emerald-400 text-sm">
                  {trip.tarifaEstimada}
                </span>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-white font-bold text-sm">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{trip.cliente}</span>
                </div>
                <span className="text-[11px] text-slate-400">{trip.tipo}</span>
              </div>

              <div className="space-y-1.5 text-xs bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/80">
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1 flex-shrink-0" />
                  <span className="text-slate-200 font-medium">{trip.origem}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 mt-1 flex-shrink-0" />
                  <span className="text-slate-200 font-medium">{trip.destino}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Viatura: {trip.veiculo}</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Confirmado
                </span>
              </div>
            </div>
          ))}

          <div className="p-3 rounded-xl bg-slate-850/50 border border-dashed border-slate-700 text-center text-slate-400">
            <p className="text-[11px]">
              Novos agendamentos prioritários da central de despacho serão atribuídos automaticamente com antecedência mínima de 2 horas.
            </p>
          </div>
        </div>

        {/* Footer */}
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
        >
          Fechar Agendamentos
        </button>
      </div>
    </div>
  );
};
