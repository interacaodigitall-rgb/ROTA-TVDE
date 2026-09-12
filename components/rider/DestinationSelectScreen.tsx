import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  User as UserIcon, 
  Plus, 
  MapPin, 
  Home, 
  Bookmark, 
  X, 
  Crosshair, 
  ChevronDown, 
  Calendar, 
  Check, 
  ArrowRight,
  Sparkles,
  Phone,
  Navigation
} from 'lucide-react';
import PlaceAutocompleteInput from '../map/PlaceAutocompleteInput';
import { LatLngLiteral } from '../map/InteractiveMap';

export interface RecentDestinationItem {
  id: string;
  name: string;
  address: string;
  distanceKm: number;
  durationMin: number;
  coords: LatLngLiteral;
}

export const RECENT_DESTINATIONS: RecentDestinationItem[] = [
  {
    id: 'oriente',
    name: 'Oriente / Parque das Nações',
    address: 'Av. Dom João II, Lisboa',
    distanceKm: 3.4,
    durationMin: 7,
    coords: { lat: 38.7678, lng: -9.0991 }
  },
  {
    id: 'odivelas',
    name: 'Odivelas',
    address: 'Estação de Metro de Odivelas, Odivelas',
    distanceKm: 8.1,
    durationMin: 12,
    coords: { lat: 38.7932, lng: -9.1731 }
  },
  {
    id: 'lisboa_centro',
    name: 'Lisboa',
    address: 'Rossio / Baixa-Chiado, Praça D. Pedro IV, Lisboa',
    distanceKm: 9.2,
    durationMin: 15,
    coords: { lat: 38.7138, lng: -9.1394 }
  },
  {
    id: 'aeroporto_lis',
    name: 'Aeroporto Humberto Delgado (LIS)',
    address: 'Alameda das Comunidades Portuguesas, Lisboa',
    distanceKm: 9.5,
    durationMin: 14,
    coords: { lat: 38.7756, lng: -9.1354 }
  },
  {
    id: 'sintra',
    name: 'Sintra Vila Histórica',
    address: 'Praça da República, Sintra',
    distanceKm: 22.1,
    durationMin: 26,
    coords: { lat: 38.7990, lng: -9.3916 }
  },
  {
    id: 'cascais',
    name: 'Cascais Marina & Centro',
    address: 'Passeio D. Luís I, Cascais',
    distanceKm: 26.5,
    durationMin: 28,
    coords: { lat: 38.6979, lng: -9.4215 }
  }
];

interface DestinationSelectScreenProps {
  originAddress: string;
  setOriginAddress: (address: string) => void;
  destinationAddress: string;
  setDestinationAddress: (address: string) => void;
  onDestinationSelected: (dest: { address: string; coords: LatLngLiteral; distanceKm: number; durationMin: number }) => void;
  onRecenterGps?: () => void;
  rideTiming: 'imediato' | 'agendado';
  setRideTiming: (timing: 'imediato' | 'agendado') => void;
  scheduledTime?: string;
  setScheduledTime?: (time: string) => void;
  passengerOption: 'mim' | 'outro';
  setPassengerOption: (opt: 'mim' | 'outro') => void;
  otherPassengerName: string;
  setOtherPassengerName: (name: string) => void;
  otherPassengerPhone: string;
  setOtherPassengerPhone: (phone: string) => void;
  stops: string[];
  setStops: React.Dispatch<React.SetStateAction<string[]>>;
}

export const DestinationSelectScreen: React.FC<DestinationSelectScreenProps> = ({
  originAddress,
  setOriginAddress,
  destinationAddress,
  setDestinationAddress,
  onDestinationSelected,
  onRecenterGps,
  rideTiming,
  setRideTiming,
  scheduledTime,
  setScheduledTime,
  passengerOption,
  setPassengerOption,
  otherPassengerName,
  setOtherPassengerName,
  otherPassengerPhone,
  setOtherPassengerPhone,
  stops,
  setStops
}) => {
  // Dropdown states
  const [isTimingDropdownOpen, setIsTimingDropdownOpen] = useState(false);
  const [isPassengerDropdownOpen, setIsPassengerDropdownOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [tempScheduleDateTime, setTempScheduleDateTime] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 1);
    return d.toISOString().slice(0, 16);
  });

  // Saved addresses
  const savedHome = {
    name: 'Casa',
    address: 'Rua da Quinta de Santa Maria 29, Lisboa',
    distanceKm: 4.2,
    durationMin: 9,
    coords: { lat: 38.7450, lng: -9.1550 }
  };

  const savedWork = {
    name: 'Locais salvos (Trabalho)',
    address: 'Av. da Liberdade 180, Lisboa',
    distanceKm: 6.8,
    durationMin: 12,
    coords: { lat: 38.7210, lng: -9.1480 }
  };

  const handleAddStop = () => {
    if (stops.length < 2) {
      setStops(prev => [...prev, '']);
    }
  };

  const handleUpdateStop = (index: number, val: string) => {
    setStops(prev => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const handleRemoveStop = (index: number) => {
    setStops(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirmSchedule = () => {
    if (setScheduledTime) {
      setScheduledTime(tempScheduleDateTime);
    }
    setRideTiming('agendado');
    setIsScheduleModalOpen(false);
    setIsTimingDropdownOpen(false);
  };

  return (
    <div className="w-full bg-[#0F172A] border-t sm:border border-slate-800/90 rounded-t-[32px] sm:rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.8)] p-4 sm:p-5 text-slate-100 flex flex-col space-y-4 animate-fadeIn">
      {/* 1. Header Drag Handle */}
      <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto" />

      {/* 2. Top Options Header: Time Selector & Passenger Selector */}
      <div className="flex items-center gap-2 relative z-30">
        {/* Time Selector Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setIsTimingDropdownOpen(!isTimingDropdownOpen);
              setIsPassengerDropdownOpen(false);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-bold text-slate-200 transition shadow-sm"
          >
            <Clock className="w-3.5 h-3.5 text-slate-300" />
            <span>{rideTiming === 'imediato' ? 'Ir agora' : 'Agendado'}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isTimingDropdownOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-44 bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl overflow-hidden py-1.5 z-40">
              <button
                type="button"
                onClick={() => {
                  setRideTiming('imediato');
                  setIsTimingDropdownOpen(false);
                }}
                className={`w-full px-3.5 py-2 text-left text-xs font-bold flex items-center justify-between transition ${
                  rideTiming === 'imediato' ? 'text-emerald-400 bg-slate-800/80' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5" /> Ir agora
                </span>
                {rideTiming === 'imediato' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsTimingDropdownOpen(false);
                  setIsScheduleModalOpen(true);
                }}
                className={`w-full px-3.5 py-2 text-left text-xs font-bold flex items-center justify-between transition ${
                  rideTiming === 'agendado' ? 'text-blue-400 bg-slate-800/80' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" /> Agendar
                </span>
                {rideTiming === 'agendado' && <Check className="w-3.5 h-3.5 text-blue-400" />}
              </button>
            </div>
          )}
        </div>

        {/* Passenger Selector Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setIsPassengerDropdownOpen(!isPassengerDropdownOpen);
              setIsTimingDropdownOpen(false);
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-bold text-slate-200 transition shadow-sm"
          >
            <UserIcon className="w-3.5 h-3.5 text-slate-300" />
            <span>{passengerOption === 'mim' ? 'Para mim' : (otherPassengerName || 'Para outra pessoa')}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isPassengerDropdownOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-60 bg-slate-900 border border-slate-750 rounded-2xl shadow-2xl p-2 z-40 space-y-1">
              <button
                type="button"
                onClick={() => {
                  setPassengerOption('mim');
                  setIsPassengerDropdownOpen(false);
                }}
                className={`w-full px-3 py-2 rounded-xl text-left text-xs font-bold flex items-center justify-between transition ${
                  passengerOption === 'mim' ? 'text-emerald-400 bg-slate-800' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <UserIcon className="w-3.5 h-3.5" /> Para mim
                </span>
                {passengerOption === 'mim' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
              </button>

              <button
                type="button"
                onClick={() => {
                  setPassengerOption('outro');
                }}
                className={`w-full px-3 py-2 rounded-xl text-left text-xs font-bold flex items-center justify-between transition ${
                  passengerOption === 'outro' ? 'text-blue-400 bg-slate-800' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  <UserIcon className="w-3.5 h-3.5" /> Para outra pessoa
                </span>
                {passengerOption === 'outro' && <Check className="w-3.5 h-3.5 text-blue-400" />}
              </button>

              {passengerOption === 'outro' && (
                <div className="pt-2 border-t border-slate-800 space-y-1.5 px-1">
                  <input
                    type="text"
                    placeholder="Nome do passageiro"
                    value={otherPassengerName}
                    onChange={(e) => setOtherPassengerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="tel"
                    placeholder="Telemóvel (+351...)"
                    value={otherPassengerPhone}
                    onChange={(e) => setOtherPassengerPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setIsPassengerDropdownOpen(false)}
                    className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition mt-1"
                  >
                    Confirmar Passageiro
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. Caixa de Rota Interativa: Origem, Paragens e Destino com Conector */}
      <div className="relative bg-slate-950/90 rounded-2xl border border-slate-800/90 p-3.5 space-y-3">
        {/* Origin Row */}
        <div className="flex items-center gap-3">
          <div className="relative flex flex-col items-center">
            {/* Circular Pickup Icon (Uber Style Circle) */}
            <div className="w-3.5 h-3.5 rounded-full bg-slate-200 border-2 border-slate-400 flex-shrink-0" />
            {/* Connecting Vertical Line */}
            <div className="w-0.5 bg-slate-700 h-8 mt-1" />
          </div>

          <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
            <input
              type="text"
              value={originAddress}
              onChange={(e) => setOriginAddress(e.target.value)}
              placeholder="Local de recolha (ex: Rua da Quinta de Santa Maria 29)"
              className="w-full bg-transparent text-xs sm:text-sm text-slate-100 font-semibold focus:outline-none placeholder-slate-500"
            />
            {onRecenterGps && (
              <button
                type="button"
                onClick={onRecenterGps}
                title="Obter localização GPS atual"
                className="p-1 rounded-lg hover:bg-slate-850 text-slate-400 hover:text-emerald-400 transition flex-shrink-0"
              >
                <Crosshair className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Optional Intermediate Stops */}
        {stops.map((stop, idx) => (
          <div key={idx} className="flex items-center gap-3 animate-fadeIn">
            <div className="relative flex flex-col items-center">
              <div className="w-3 h-3 rounded-full bg-amber-400 border-2 border-amber-200 flex-shrink-0" />
              <div className="w-0.5 bg-slate-700 h-8 mt-1" />
            </div>
            <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
              <input
                type="text"
                value={stop}
                onChange={(e) => handleUpdateStop(idx, e.target.value)}
                placeholder={`Paragem ${idx + 1}`}
                className="w-full bg-transparent text-xs sm:text-sm text-slate-200 font-semibold focus:outline-none placeholder-slate-500"
              />
              <button
                type="button"
                onClick={() => handleRemoveStop(idx)}
                className="p-1 text-slate-500 hover:text-red-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {/* Destination Row */}
        <div className="flex items-center gap-3">
          {/* Destination Square Icon (Uber Style Black/Emerald Square) */}
          <div className="w-3.5 h-3.5 rounded-sm bg-emerald-400 border-2 border-emerald-200 flex-shrink-0" />

          <div className="flex-1 min-w-0">
            <PlaceAutocompleteInput
              value={destinationAddress}
              onChange={(val) => setDestinationAddress(val)}
              onPlaceSelect={(place) => {
                setDestinationAddress(place.address || place.name || '');
                onDestinationSelected({
                  address: place.address || place.name || 'Destino Selecionado',
                  coords: { lat: place.lat, lng: place.lng },
                  distanceKm: 8.5,
                  durationMin: 14
                });
              }}
              placeholder="Para onde vamos? (ex: Oriente)"
              className="w-full"
              inputClassName="w-full bg-transparent text-xs sm:text-sm text-white font-bold focus:outline-none placeholder-slate-500"
            />
          </div>

          {/* Botão '+' para Adicionar Paragem Adicional */}
          {stops.length < 2 && (
            <button
              type="button"
              onClick={handleAddStop}
              className="w-7 h-7 rounded-full bg-slate-850 hover:bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition flex-shrink-0"
              title="Adicionar paragem no percurso"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4. Atalhos Rápidos: "Casa" e "Locais Salvos" */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            setDestinationAddress(savedHome.address);
            onDestinationSelected({
              address: savedHome.address,
              coords: savedHome.coords,
              distanceKm: savedHome.distanceKm,
              durationMin: savedHome.durationMin
            });
          }}
          className="p-2.5 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition flex items-center gap-2.5 group"
        >
          <div className="w-8 h-8 rounded-full bg-slate-800 group-hover:bg-slate-700 flex items-center justify-center text-blue-400">
            <Home className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-white block truncate">Casa</span>
            <span className="text-[10px] text-slate-400 block truncate">Rua da Quinta Sta Maria</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setDestinationAddress(savedWork.address);
            onDestinationSelected({
              address: savedWork.address,
              coords: savedWork.coords,
              distanceKm: savedWork.distanceKm,
              durationMin: savedWork.durationMin
            });
          }}
          className="p-2.5 rounded-2xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-left transition flex items-center gap-2.5 group"
        >
          <div className="w-8 h-8 rounded-full bg-slate-800 group-hover:bg-slate-700 flex items-center justify-center text-amber-400">
            <Bookmark className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-white block truncate">Locais salvos</span>
            <span className="text-[10px] text-slate-400 block truncate">Av. da Liberdade</span>
          </div>
        </button>
      </div>

      {/* 5. Lista de Destinos Recentes Ordenados por Distância */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between px-1">
          <span className="text-[11px] font-black uppercase text-slate-400 tracking-wider">
            Destinos Recentes
          </span>
          <span className="text-[10px] text-slate-500">Ordenados por proximidade</span>
        </div>

        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
          {RECENT_DESTINATIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setDestinationAddress(item.name);
                onDestinationSelected({
                  address: item.address,
                  coords: item.coords,
                  distanceKm: item.distanceKm,
                  durationMin: item.durationMin
                });
              }}
              className="w-full p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-850 border border-slate-800/80 hover:border-slate-700 text-left transition flex items-center justify-between group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 transition flex-shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white block truncate group-hover:text-emerald-300 transition">
                    {item.name}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {item.address}
                  </span>
                </div>
              </div>

              <div className="text-right flex-shrink-0 pl-2">
                <span className="text-xs font-black text-slate-200 block">
                  {item.distanceKm} km
                </span>
                <span className="text-[10px] text-slate-500">
                  ~{item.durationMin} min
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Modal de Agendamento */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-750 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-400">
                <Calendar className="w-5 h-5" />
                <h3 className="text-sm font-black text-white">Agendar Viagem TVDE</h3>
              </div>
              <button 
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Escolha o dia e hora pretendidos para ter um motorista da frota no local exato.
            </p>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Data e Hora</label>
              <input
                type="datetime-local"
                value={tempScheduleDateTime}
                onChange={(e) => setTempScheduleDateTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 font-bold rounded-xl text-xs transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmSchedule}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition"
              >
                Definir Horário
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DestinationSelectScreen;
