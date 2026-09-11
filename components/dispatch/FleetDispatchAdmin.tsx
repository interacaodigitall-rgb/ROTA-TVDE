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
      origem: { lat: 38.7756, lng: -9.1354, endereco: origin },
      destino: { lat: 38.7253, lng: -9.1500, endereco: destination },
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

  const filteredRides = rides.filter(r => statusFilter === 'ALL' || r.status === statusFilter);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black uppercase tracking-wider mb-2 border border-emerald-500/30">
            <Navigation className="w-3.5 h-3.5" /> Central de Despacho & Frota ao Vivo
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Dispatch & Transfers Privados</h2>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Monitorize a posição GPS dos carros da frota "Asfalto Cativante", despache transfers executivos e configure tarifas por quilómetro e minuto.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 flex-wrap">
          <button
            onClick={() => setActiveTab('LIVE_MAP')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
              activeTab === 'LIVE_MAP' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" /> Mapa ao Vivo ({drivers.filter(d => d.isOnline).length})
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
          {/* Visual Interactive Fleet Map */}
          <div className="lg:col-span-2 bg-slate-900 rounded-3xl border border-slate-800 p-5 shadow-xl relative overflow-hidden min-h-[460px] flex flex-col">
            <div className="flex items-center justify-between mb-4 z-10 relative">
              <span className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                GPS Tempo Real • Grande Lisboa & Aeroporto
              </span>
              <span className="text-[10px] text-slate-400 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                Atualização a cada 2s
              </span>
            </div>

            {/* Map Canvas Background (Strict #0B0F17 Uber-Admin Palette) */}
            <div className="flex-1 bg-[#0B0F17] rounded-2xl relative border border-slate-800 overflow-hidden min-h-[380px]">
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#38bdf8_1px,transparent_1px)] [background-size:24px_24px]" />
              
              {/* Roads Vector (#1E293B styled with subtle neon glow) */}
              <svg className="absolute inset-0 w-full h-full">
                <path d="M 0 120 Q 240 90, 480 240 T 900 290" className="stroke-[#1E293B] stroke-[6]" fill="none" />
                <path d="M 0 120 Q 240 90, 480 240 T 900 290" className="stroke-blue-500/30 stroke-[2]" fill="none" />
                <path d="M 160 0 Q 320 280, 580 500" className="stroke-[#1E293B] stroke-[5]" fill="none" />
                <path d="M 160 0 Q 320 280, 580 500" className="stroke-emerald-500/30 stroke-[2]" fill="none" />
                <path d="M 50 400 Q 350 350, 750 150" className="stroke-[#1E293B] stroke-[4]" fill="none" />
              </svg>

              {/* Cars Markers with Collision/Offset Clustering Logic */}
              {drivers.map((d, index) => {
                // Apply a deterministic micro-offset to prevent overlapping markers in close coordinates
                const baseTop = ((d.lat - 38.68) / 0.14) * 100;
                const baseLeft = ((d.lng + 9.45) / 0.40) * 100;
                const offsetAngle = (index * 60) * (Math.PI / 180);
                const offsetDistance = index > 0 ? (index % 2 === 0 ? 1.5 : 2.2) : 0;
                const topPct = Math.min(90, Math.max(10, baseTop + Math.sin(offsetAngle) * offsetDistance));
                const leftPct = Math.min(90, Math.max(10, baseLeft + Math.cos(offsetAngle) * offsetDistance));

                return (
                  <div 
                    key={d.driverId}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group transition-all duration-1000 z-20 hover:z-30"
                    style={{ 
                      top: `${topPct}%`, 
                      left: `${leftPct}%` 
                    }}
                  >
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full bg-slate-950 border-2 border-emerald-400 shadow-xl flex items-center justify-center text-emerald-400 group-hover:scale-125 transition">
                        <Car className="w-4 h-4" />
                      </div>
                      <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-md bg-slate-950/95 border border-slate-700 text-[10px] font-black text-white shadow-xl opacity-90 group-hover:opacity-100 transition">
                        {d.matricula}
                      </div>
                    </div>
                  </div>
                );
              })}
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
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-black text-white">{d.driverName}</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-slate-800 text-slate-200 px-2 py-0.5 rounded">
                      {d.matricula}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>{d.vehicleModel}</span>
                    <span className="text-emerald-400 font-bold">{d.categoria}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-900">
                    <span>Bateria: {d.batteryLevel}%</span>
                    <span>Status: <strong className="text-emerald-300">{d.status}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Rides List */}
      {activeTab === 'RIDES_LIST' && (
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-lg font-black text-white">Histórico de Corridas & Transfers</h3>
            <div className="flex items-center gap-2">
              {['ALL', 'pendente', 'aceito', 'em_viagem', 'concluido'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition ${
                    statusFilter === st ? 'bg-blue-600 text-white' : 'bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  {st === 'ALL' ? 'Todas' : st}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-black border-b border-slate-800">
                <tr>
                  <th className="p-3.5">ID / Data</th>
                  <th className="p-3.5">Cliente</th>
                  <th className="p-3.5">Percurso</th>
                  <th className="p-3.5">Categoria</th>
                  <th className="p-3.5">Motorista</th>
                  <th className="p-3.5 text-right">Valor Total</th>
                  <th className="p-3.5 text-right">Líq. Motorista</th>
                  <th className="p-3.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredRides.length > 0 ? (
                  filteredRides.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3.5 font-mono text-[11px] text-slate-400">
                        #{r.id.slice(-6)}
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-white">{r.clienteNome}</div>
                        <div className="text-[10px] text-slate-500">{r.clienteTelefone}</div>
                      </td>
                      <td className="p-3.5 max-w-[220px]">
                        <div className="truncate text-slate-300">{r.origem.endereco}</div>
                        <div className="truncate text-emerald-400 font-bold">&rarr; {r.destino.endereco}</div>
                      </td>
                      <td className="p-3.5 font-bold text-blue-300">{r.categoria}</td>
                      <td className="p-3.5">
                        {r.motoristaNome ? (
                          <div>
                            <span className="font-bold text-white">{r.motoristaNome}</span>
                            <span className="text-[10px] text-slate-500 block font-mono">{r.viaturaMatricula}</span>
                          </div>
                        ) : (
                          <span className="text-amber-400 font-bold text-[10px]">Aguardando Despacho</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right font-black text-white">€{r.valorTotal.toFixed(2)}</td>
                      <td className="p-3.5 text-right font-black text-emerald-400">+€{r.valorLiquidoMotorista.toFixed(2)}</td>
                      <td className="p-3.5 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${
                          r.status === 'concluido' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                          r.status === 'pendente' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                          'bg-blue-500/20 text-blue-300 border-blue-500/30'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-500">
                      Nenhuma corrida encontrada no filtro selecionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Create Manual Transfer */}
      {activeTab === 'CREATE_TRANSFER' && (
        <form onSubmit={handleCreateManualTransfer} className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl max-w-2xl mx-auto space-y-4">
          <h3 className="text-lg font-black text-white">Criar & Despachar Transfer Executivo</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Nome do Cliente</label>
              <input 
                type="text"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="ex: Dr. António Ferreira"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Telefone do Cliente</label>
              <input 
                type="tel"
                required
                value={clientPhone}
                onChange={(e) => setClientPhone(e.target.value)}
                placeholder="+351 912 345 678"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Origem (Recolha)</label>
              <input 
                type="text"
                required
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Destino</label>
              <input 
                type="text"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Distância Estimada (KM)</label>
              <input 
                type="number"
                step="0.1"
                value={distanceKm}
                onChange={(e) => setDistanceKm(parseFloat(e.target.value) || 1)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Duração Estimada (Min)</label>
              <input 
                type="number"
                value={durationMin}
                onChange={(e) => setDurationMin(parseInt(e.target.value) || 5)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Categoria de Viatura</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as VehicleCategory)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
              >
                <option value="STANDARD">Asfalto Standard (Económico)</option>
                <option value="BLACK_TESLA">Asfalto Black / Tesla (Executivo)</option>
                <option value="XL_VAN">Asfalto XL (7 Lugares)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Atribuir a Motorista (Opcional)</label>
              <select
                value={assignedDriverId}
                onChange={(e) => setAssignedDriverId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none"
              >
                <option value="">Broadcast (Todos Disponíveis)</option>
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
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl transition shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 text-sm mt-4"
          >
            <Sparkles className="w-4 h-4 text-amber-300" /> Confirmar & Despachar Transfer
          </button>
        </form>
      )}

      {/* Tab 4: Fare Configuration */}
      {activeTab === 'FARE_CONFIG' && (
        <form onSubmit={handleSaveFareRules} className="bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-xl max-w-2xl mx-auto space-y-4">
          <h3 className="text-lg font-black text-white">Configuração de Tarifas & Comissões da Frota</h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Base Standard (€)</label>
              <input 
                type="number" 
                step="0.10"
                value={fareRules.baseStandard}
                onChange={(e) => setFareRules({ ...fareRules, baseStandard: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Preço / KM (€)</label>
              <input 
                type="number" 
                step="0.05"
                value={fareRules.kmStandard}
                onChange={(e) => setFareRules({ ...fareRules, kmStandard: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Preço / Minuto (€)</label>
              <input 
                type="number" 
                step="0.05"
                value={fareRules.minStandard}
                onChange={(e) => setFareRules({ ...fareRules, minStandard: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Mínimo Viagem (€)</label>
              <input 
                type="number" 
                step="0.50"
                value={fareRules.minimoStandard}
                onChange={(e) => setFareRules({ ...fareRules, minimoStandard: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Mult. Black/Tesla</label>
              <input 
                type="number" 
                step="0.05"
                value={fareRules.multBlackTesla}
                onChange={(e) => setFareRules({ ...fareRules, multBlackTesla: parseFloat(e.target.value) || 1 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Mult. XL (7 Lugares)</label>
              <input 
                type="number" 
                step="0.05"
                value={fareRules.multXL}
                onChange={(e) => setFareRules({ ...fareRules, multXL: parseFloat(e.target.value) || 1 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Taxa Aeroporto (€)</label>
              <input 
                type="number" 
                step="0.50"
                value={fareRules.taxaAeroporto}
                onChange={(e) => setFareRules({ ...fareRules, taxaAeroporto: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Comissão Frota (%)</label>
              <input 
                type="number" 
                step="1"
                value={fareRules.comissaoFrotaPercent}
                onChange={(e) => setFareRules({ ...fareRules, comissaoFrotaPercent: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition shadow-xl shadow-blue-600/30 text-xs mt-4"
          >
            Gravar Alterações de Tarifas
          </button>
        </form>
      )}
    </div>
  );
};

export default FleetDispatchAdmin;
