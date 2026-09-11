import React, { useState, useEffect } from 'react';
import { 
  Navigation, 
  MapPin, 
  Car, 
  Clock, 
  DollarSign, 
  ShieldCheck, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  Sliders, 
  RefreshCw, 
  Phone, 
  Users, 
  ExternalLink,
  Calendar,
  Sparkles
} from 'lucide-react';
import { 
  PrivateRide, 
  DriverLiveLocation, 
  FleetFareRules, 
  VehicleCategory, 
  PaymentMethod 
} from '../../types';
import { 
  dispatchService, 
  DEFAULT_FARE_RULES, 
  INITIAL_DEMO_DRIVERS 
} from '../../services/dispatchService';
import InteractiveMap from '../map/InteractiveMap';
import PlaceAutocompleteInput from '../map/PlaceAutocompleteInput';

export const FleetDispatchAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'LIVE_MAP' | 'RIDES_LIST' | 'CREATE_TRANSFER' | 'FARE_CONFIG'>('LIVE_MAP');
  const [drivers, setDrivers] = useState<DriverLiveLocation[]>(INITIAL_DEMO_DRIVERS);
  const [rides, setRides] = useState<PrivateRide[]>([]);
  const [fareRules, setFareRules] = useState<FleetFareRules>(dispatchService.getFareRules());
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Manual Transfer Form State
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [origin, setOrigin] = useState('Aeroporto de Lisboa Terminal 1');
  const [destination, setDestination] = useState('Hotel Epic Sana, Av. da Liberdade');
  const [originCoords, setOriginCoords] = useState<{ lat: number; lng: number }>({ lat: 38.7756, lng: -9.1354 });
  const [destCoords, setDestCoords] = useState<{ lat: number; lng: number }>({ lat: 38.7253, lng: -9.1500 });
  const [distanceKm, setDistanceKm] = useState(9.8);
  const [durationMin, setDurationMin] = useState(16);
  const [category, setCategory] = useState<VehicleCategory>('BLACK_TESLA');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MBWAY');
  const [assignedDriverId, setAssignedDriverId] = useState<string>('');

  useEffect(() => {
    setDrivers(dispatchService.getLiveDrivers());
    setRides(dispatchService.getAllRides());

    const interval = setInterval(() => {
      setDrivers([...dispatchService.getLiveDrivers()]);
      setRides([...dispatchService.getAllRides()]);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const handleSaveFareRules = (e: React.FormEvent) => {
    e.preventDefault();
    dispatchService.saveFareRules(fareRules);
    setToastMessage('Regras de tarifas e comissões da frota atualizadas com sucesso!');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleCreateManualTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !clientPhone || !origin || !destination) {
      alert('Por favor preencha os campos obrigatórios do transfer.');
      return;
    }

    const calc = dispatchService.calculateEstimates(distanceKm, durationMin);
    const selectedEstimate = calc[category];

    const newRide = await dispatchService.createRide({
      clienteNome: clientName,
      clienteTelefone: clientPhone,
      origem: { lat: originCoords.lat, lng: originCoords.lng, endereco: origin },
      destino: { lat: destCoords.lat, lng: destCoords.lng, endereco: destination },
      distanciaKm: distanceKm,
      duracaoMin: durationMin,
      categoria: category,
      valorTotal: selectedEstimate.valorTotal,
      valorLiquidoMotorista: selectedEstimate.valorLiquido,
      comissaoFrota: selectedEstimate.comissao,
      tipoViagem: 'imediato',
      metodoPagamento: paymentMethod,
      motoristaId: assignedDriverId || undefined,
      companyId: 'asfalto_cativante'
    });

    if (assignedDriverId) {
      const driver = drivers.find(d => d.driverId === assignedDriverId);
      if (driver) {
        await dispatchService.acceptRide(newRide.id, {
          id: driver.driverId,
          name: driver.driverName,
          phone: driver.phone,
          matricula: driver.matricula,
          vehicleModel: driver.vehicleModel,
          rating: driver.rating
        });
      }
    }

    setToastMessage(`Transfer #${newRide.id.slice(-6)} criado com sucesso e despachado!`);
    setTimeout(() => setToastMessage(null), 4000);
    setRides([...dispatchService.getAllRides()]);
    setActiveTab('RIDES_LIST');
  };

  const filteredRides = rides.filter(r => {
    if (statusFilter === 'ALL') return true;
    return r.status === statusFilter;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-xs uppercase tracking-wider border border-emerald-500/40">
              Despacho Privado & Transfers
            </span>
            <span className="text-xs text-slate-400 font-mono">Asfalto Cativante</span>
          </div>
          <h1 className="text-2xl font-black text-white mt-1">Torre de Controlo de Frotas (Dispatch)</h1>
        </div>

        {/* Action Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 self-start sm:self-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('LIVE_MAP')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
              activeTab === 'LIVE_MAP' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" /> Mapa em Tempo Real
          </button>
          <button
            onClick={() => setActiveTab('RIDES_LIST')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
              activeTab === 'RIDES_LIST' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Car className="w-3.5 h-3.5" /> Corridas ({rides.length})
          </button>
          <button
            onClick={() => setActiveTab('CREATE_TRANSFER')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
              activeTab === 'CREATE_TRANSFER' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Plus className="w-3.5 h-3.5" /> Novo Transfer
          </button>
          <button
            onClick={() => setActiveTab('FARE_CONFIG')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
              activeTab === 'FARE_CONFIG' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" /> Tarifas & Regras
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/60 rounded-2xl text-emerald-300 text-xs font-bold flex items-center gap-3 shadow-xl animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Tab 1: Live GPS Map */}
      {activeTab === 'LIVE_MAP' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Visual Interactive Fleet Map with fitBounds */}
          <div className="lg:col-span-2 bg-slate-900 rounded-3xl border border-slate-800 p-5 shadow-xl relative overflow-hidden min-h-[460px] flex flex-col">
            <div className="flex items-center justify-between mb-4 z-10 relative">
              <span className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                GPS Tempo Real • Grande Lisboa & Aeroporto
              </span>
              <span className="text-[10px] text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                Sincronização em Tempo Real ({drivers.filter(d => d.isOnline).length} Carros Ativos)
              </span>
            </div>

            {/* Google Maps SDK / Vector Engine */}
            <div className="flex-1 rounded-2xl overflow-hidden min-h-[380px]">
              <InteractiveMap 
                center={{ lat: 38.7369, lng: -9.1426 }}
                zoom={12}
                drivers={drivers}
                fitAllMarkers={true}
                className="w-full h-full min-h-[380px]"
              />
            </div>
          </div>

          {/* Fleet Status List */}
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider">Viaturas & Motoristas Conectados</h3>
            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {drivers.map((d) => (
                <div key={d.driverId} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${d.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                      <span className="text-xs font-black text-white">{d.driverName}</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                      {d.matricula}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{d.vehicleModel}</span>
                    <span className="text-emerald-400 font-bold">{d.categoria}</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-900">
                    <span>GPS: {d.lat.toFixed(4)}, {d.lng.toFixed(4)}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 font-semibold">{d.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Rides List */}
      {activeTab === 'RIDES_LIST' && (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-black text-white">Histórico e Fila de Corridas Privadas</h2>
            <div className="flex items-center gap-2">
              {['ALL', 'pendente', 'aceito', 'a_caminho', 'em_viagem', 'concluido'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    statusFilter === st ? 'bg-emerald-600 text-white' : 'bg-slate-950 text-slate-400 border border-slate-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {filteredRides.length === 0 ? (
              <div className="p-8 text-center text-slate-400 bg-slate-950/50 rounded-2xl border border-slate-800">
                Nenhuma corrida encontrada para este filtro.
              </div>
            ) : (
              filteredRides.map((ride) => (
                <div key={ride.id} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-500">#{ride.id.slice(-6)}</span>
                      <span className="text-xs font-black text-white">{ride.clienteNome}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                        {ride.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 flex items-center gap-2">
                      <span className="text-blue-400">Origem:</span> {ride.origem.endereco} &rarr; <span className="text-emerald-400">Destino:</span> {ride.destino.endereco}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <div className="text-sm font-black text-emerald-400">€{ride.valorTotal.toFixed(2)}</div>
                      <div className="text-[10px] text-slate-400">Motorista: €{ride.valorLiquidoMotorista.toFixed(2)} | Frota: €{ride.comissaoFrota.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Create Manual Transfer */}
      {activeTab === 'CREATE_TRANSFER' && (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl max-w-2xl mx-auto space-y-5">
          <div>
            <h2 className="text-lg font-black text-white">Criar Transfer Manual (Despacho Central)</h2>
            <p className="text-xs text-slate-400">Lançamento de reservas VIP, transfers de hotel e pedidos de parceiros.</p>
          </div>

          <form onSubmit={handleCreateManualTransfer} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Nome do Passageiro *</label>
                <input 
                  type="text" 
                  value={clientName} 
                  onChange={(e) => setClientName(e.target.value)} 
                  placeholder="Ex: Pedro Almodóvar"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Contacto Telefónico *</label>
                <input 
                  type="tel" 
                  value={clientPhone} 
                  onChange={(e) => setClientPhone(e.target.value)} 
                  placeholder="+351 912 345 678"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-3 bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Local de Recolha (Origem) *</label>
                <PlaceAutocompleteInput
                  value={origin}
                  onChange={setOrigin}
                  onPlaceSelect={(p) => setOriginCoords({ lat: p.lat, lng: p.lng })}
                  placeholder="Endereço ou local de partida..."
                  inputClassName="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-normal"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Destino Final *</label>
                <PlaceAutocompleteInput
                  value={destination}
                  onChange={setDestination}
                  onPlaceSelect={(p) => setDestCoords({ lat: p.lat, lng: p.lng })}
                  placeholder="Endereço ou destino..."
                  inputClassName="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-normal"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Distância Estimada (km)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  value={distanceKm} 
                  onChange={(e) => setDistanceKm(Number(e.target.value))} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Duração Estimada (min)</label>
                <input 
                  type="number" 
                  value={durationMin} 
                  onChange={(e) => setDurationMin(Number(e.target.value))} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Categoria</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value as VehicleCategory)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none"
                >
                  <option value="STANDARD">Asfalto Standard</option>
                  <option value="BLACK_TESLA">Asfalto Black / Tesla</option>
                  <option value="XL_VAN">Asfalto XL (7 Lugares)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Atribuir Motorista Específico</label>
                <select 
                  value={assignedDriverId} 
                  onChange={(e) => setAssignedDriverId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none"
                >
                  <option value="">Fila Geral de Despacho (Automático)</option>
                  {drivers.map(d => (
                    <option key={d.driverId} value={d.driverId}>
                      {d.driverName} ({d.matricula} - {d.vehicleModel})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl transition shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" /> Despachar Transfer Imediato
            </button>
          </form>
        </div>
      )}

      {/* Tab 4: Fare Config */}
      {activeTab === 'FARE_CONFIG' && (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl max-w-3xl mx-auto space-y-6">
          <div>
            <h2 className="text-lg font-black text-white">Configuração de Tarifas e Split de Comissões</h2>
            <p className="text-xs text-slate-400">Defina os parâmetros de pricing dinâmico da frota Asfalto Cativante.</p>
          </div>

          <form onSubmit={handleSaveFareRules} className="space-y-5">
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-emerald-400 uppercase">Comissão da Frota (Gestor / Empresa)</h3>
              <div className="flex items-center gap-3">
                <input 
                  type="number" 
                  step="1" 
                  value={fareRules.comissaoFrotaPercentagem} 
                  onChange={(e) => setFareRules({ ...fareRules, comissaoFrotaPercentagem: Number(e.target.value) })}
                  className="w-28 bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white font-black text-center focus:outline-none"
                />
                <span className="text-xs text-slate-400">% de retenção para a empresa sobre o valor bruto do transfer</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(['STANDARD', 'BLACK_TESLA', 'XL_VAN'] as VehicleCategory[]).map((cat) => (
                <div key={cat} className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3">
                  <span className="text-xs font-black text-white block">{cat}</span>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Bandeirada Base (€)</label>
                    <input 
                      type="number" 
                      step="0.5" 
                      value={fareRules.baseFare[cat]} 
                      onChange={(e) => setFareRules({
                        ...fareRules,
                        baseFare: { ...fareRules.baseFare, [cat]: Number(e.target.value) }
                      })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Preço / km (€)</label>
                    <input 
                      type="number" 
                      step="0.05" 
                      value={fareRules.perKm[cat]} 
                      onChange={(e) => setFareRules({
                        ...fareRules,
                        perKm: { ...fareRules.perKm, [cat]: Number(e.target.value) }
                      })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Tarifa Mínima (€)</label>
                    <input 
                      type="number" 
                      step="0.5" 
                      value={fareRules.minFare[cat]} 
                      onChange={(e) => setFareRules({
                        ...fareRules,
                        minFare: { ...fareRules.minFare, [cat]: Number(e.target.value) }
                      })}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-bold"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-black rounded-2xl transition shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 text-sm"
            >
              <Sliders className="w-4 h-4" /> Guardar Regras de Tarifação
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default FleetDispatchAdmin;
