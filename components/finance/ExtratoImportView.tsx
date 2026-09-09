import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useUsers } from '../../hooks/useUsers';
import { UserRole, CalculationType } from '../../types';
import { 
  FileSpreadsheet, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  FileText, 
  Filter, 
  Download,
  Fuel,
  Navigation,
  Car,
  Layers,
  Sparkles
} from 'lucide-react';

interface ExtratoItem {
  id: string;
  provider: 'UBER' | 'BOLT' | 'PRIO' | 'GALP' | 'VIA_VERDE';
  matricula: string;
  driverName: string;
  matchedDriverId?: string;
  periodStart: string;
  periodEnd: string;
  ridesGross: number;
  tips: number;
  tolls: number;
  adjustments: number;
  fuelCard: number;
  rentalTolls: number;
  status: 'READY' | 'PROCESSED';
}

interface ExtratoImportViewProps {
  onPreFillCalculation?: (data: {
    driverId: string;
    uberRides: number;
    uberTips: number;
    uberTolls: number;
    boltRides: number;
    boltTips: number;
    boltTolls: number;
    fleetCard: number;
    rentalTolls: number;
    periodStart: string;
    periodEnd: string;
  }) => void;
}

export const ExtratoImportView: React.FC<ExtratoImportViewProps> = ({ onPreFillCalculation }) => {
  const { users } = useUsers();
  const drivers = users.filter(u => u.role === UserRole.DRIVER && u.status !== 'ARCHIVED');

  const [filterProvider, setFilterProvider] = useState<string>('ALL');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Demo imported records ready for reconciliation
  const [records, setRecords] = useState<ExtratoItem[]>([
    {
      id: 'ext-uber-01',
      provider: 'UBER',
      matricula: 'FROTA-001',
      driverName: 'Motorista Frota A (Demo)',
      matchedDriverId: 'demo-frota-driver-1',
      periodStart: '2026-09-01',
      periodEnd: '2026-09-07',
      ridesGross: 680.50,
      tips: 42.00,
      tolls: 24.50,
      adjustments: 0,
      fuelCard: 0,
      rentalTolls: 0,
      status: 'READY'
    },
    {
      id: 'ext-bolt-01',
      provider: 'BOLT',
      matricula: 'FROTA-001',
      driverName: 'Motorista Frota A (Demo)',
      matchedDriverId: 'demo-frota-driver-1',
      periodStart: '2026-09-01',
      periodEnd: '2026-09-07',
      ridesGross: 590.20,
      tips: 31.00,
      tolls: 18.00,
      adjustments: 0,
      fuelCard: 0,
      rentalTolls: 0,
      status: 'READY'
    },
    {
      id: 'ext-prio-01',
      provider: 'PRIO',
      matricula: 'FROTA-001',
      driverName: 'Motorista Frota A (Demo)',
      matchedDriverId: 'demo-frota-driver-1',
      periodStart: '2026-09-01',
      periodEnd: '2026-09-07',
      ridesGross: 0,
      tips: 0,
      tolls: 0,
      adjustments: 0,
      fuelCard: 84.60,
      rentalTolls: 0,
      status: 'READY'
    },
    {
      id: 'ext-vv-01',
      provider: 'VIA_VERDE',
      matricula: 'FROTA-001',
      driverName: 'Motorista Frota A (Demo)',
      matchedDriverId: 'demo-frota-driver-1',
      periodStart: '2026-09-01',
      periodEnd: '2026-09-07',
      ridesGross: 0,
      tips: 0,
      tolls: 0,
      adjustments: 0,
      fuelCard: 0,
      rentalTolls: 38.40,
      status: 'READY'
    },
    {
      id: 'ext-uber-02',
      provider: 'UBER',
      matricula: 'FROTA-002',
      driverName: 'Motorista Frota B (Demo)',
      matchedDriverId: 'demo-frota-driver-2',
      periodStart: '2026-09-01',
      periodEnd: '2026-09-07',
      ridesGross: 720.00,
      tips: 55.00,
      tolls: 30.00,
      adjustments: 0,
      fuelCard: 0,
      rentalTolls: 0,
      status: 'READY'
    }
  ]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate smart parsing of statements
    setSuccessMessage(`Ficheiro "${file.name}" importado e analisado com sucesso! 4 linhas reconciliadas.`);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const handleLoadPreset = (type: 'UBER' | 'BOLT' | 'PRIO' | 'VIA_VERDE') => {
    const newId = `ext-${Date.now()}`;
    const targetDriver = drivers[0] || { id: 'demo-frota-driver-1', name: 'Motorista Frota A (Demo)', matricula: 'FROTA-001' };

    let newRecord: ExtratoItem;
    if (type === 'UBER') {
      newRecord = {
        id: newId,
        provider: 'UBER',
        matricula: targetDriver.matricula,
        driverName: targetDriver.name,
        matchedDriverId: targetDriver.id,
        periodStart: '2026-09-08',
        periodEnd: '2026-09-14',
        ridesGross: 815.40,
        tips: 62.00,
        tolls: 35.50,
        adjustments: 12.00,
        fuelCard: 0,
        rentalTolls: 0,
        status: 'READY'
      };
    } else if (type === 'BOLT') {
      newRecord = {
        id: newId,
        provider: 'BOLT',
        matricula: targetDriver.matricula,
        driverName: targetDriver.name,
        matchedDriverId: targetDriver.id,
        periodStart: '2026-09-08',
        periodEnd: '2026-09-14',
        ridesGross: 640.00,
        tips: 28.50,
        tolls: 22.00,
        adjustments: 0,
        fuelCard: 0,
        rentalTolls: 0,
        status: 'READY'
      };
    } else if (type === 'PRIO') {
      newRecord = {
        id: newId,
        provider: 'PRIO',
        matricula: targetDriver.matricula,
        driverName: targetDriver.name,
        matchedDriverId: targetDriver.id,
        periodStart: '2026-09-08',
        periodEnd: '2026-09-14',
        ridesGross: 0,
        tips: 0,
        tolls: 0,
        adjustments: 0,
        fuelCard: 96.20,
        rentalTolls: 0,
        status: 'READY'
      };
    } else {
      newRecord = {
        id: newId,
        provider: 'VIA_VERDE',
        matricula: targetDriver.matricula,
        driverName: targetDriver.name,
        matchedDriverId: targetDriver.id,
        periodStart: '2026-09-08',
        periodEnd: '2026-09-14',
        ridesGross: 0,
        tips: 0,
        tolls: 0,
        adjustments: 0,
        fuelCard: 0,
        rentalTolls: 41.20,
        status: 'READY'
      };
    }

    setRecords(prev => [newRecord, ...prev]);
    setSuccessMessage(`Extrato de teste ${type} importado para ${targetDriver.name}!`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleLaunchCalculationForDriver = (driverId?: string) => {
    const driverRecords = records.filter(r => (r.matchedDriverId === driverId || !driverId));
    if (driverRecords.length === 0) return;

    const targetId = driverId || driverRecords[0].matchedDriverId || '';
    
    // Sum up values for this driver
    let uberRides = 0, uberTips = 0, uberTolls = 0;
    let boltRides = 0, boltTips = 0, boltTolls = 0;
    let fleetCard = 0, rentalTolls = 0;

    driverRecords.forEach(r => {
      if (r.matchedDriverId === targetId) {
        if (r.provider === 'UBER') {
          uberRides += r.ridesGross;
          uberTips += r.tips;
          uberTolls += r.tolls;
        } else if (r.provider === 'BOLT') {
          boltRides += r.ridesGross;
          boltTips += r.tips;
          boltTolls += r.tolls;
        } else if (r.provider === 'PRIO' || r.provider === 'GALP') {
          fleetCard += r.fuelCard;
        } else if (r.provider === 'VIA_VERDE') {
          rentalTolls += r.rentalTolls;
        }
      }
    });

    if (onPreFillCalculation) {
      onPreFillCalculation({
        driverId: targetId,
        uberRides,
        uberTips,
        uberTolls,
        boltRides,
        boltTips,
        boltTolls,
        fleetCard,
        rentalTolls,
        periodStart: driverRecords[0].periodStart,
        periodEnd: driverRecords[0].periodEnd
      });
    }
  };

  const filteredRecords = records.filter(r => filterProvider === 'ALL' || r.provider === filterProvider);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2 border border-blue-500/30">
            <FileSpreadsheet className="w-3.5 h-3.5" /> Reconciliação Automática
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Importação de Extratos Semanais</h2>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Faça upload dos ficheiros originais da Uber, Bolt, Cartões Combustível (Prio/Galp) e Via Verde para preencher automaticamente os acertos da frota.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400">Simulações rápidas:</span>
          <button
            onClick={() => handleLoadPreset('UBER')}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-bold transition-colors"
          >
            + Uber
          </button>
          <button
            onClick={() => handleLoadPreset('BOLT')}
            className="px-2.5 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-800 rounded-lg text-xs font-bold transition-colors"
          >
            + Bolt
          </button>
          <button
            onClick={() => handleLoadPreset('PRIO')}
            className="px-2.5 py-1.5 bg-blue-950/60 hover:bg-blue-900/60 text-blue-400 border border-blue-800 rounded-lg text-xs font-bold transition-colors"
          >
            + Prio
          </button>
          <button
            onClick={() => handleLoadPreset('VIA_VERDE')}
            className="px-2.5 py-1.5 bg-amber-950/60 hover:bg-amber-900/60 text-amber-400 border border-amber-800 rounded-lg text-xs font-bold transition-colors"
          >
            + Via Verde
          </button>
        </div>
      </div>

      {/* Upload Box */}
      <div className="border-2 border-dashed border-slate-700 hover:border-blue-500/80 rounded-2xl p-8 bg-slate-900/50 hover:bg-slate-900/80 transition-all text-center group cursor-pointer relative">
        <input 
          type="file" 
          accept=".csv,.xlsx,.xls,.pdf,.txt"
          onChange={handleFileUpload}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
            <UploadCloud className="w-8 h-8" />
          </div>
          <div>
            <p className="text-white font-bold text-base">
              Arraste e solte ficheiros de extratos aqui ou clique para selecionar
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Formatos aceites: CSV, Excel (.xlsx), PDF e extratos de combustível TXT
            </p>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
              <Car className="w-3.5 h-3.5 text-blue-400" /> Uber Relatório de Frota
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
              <Car className="w-3.5 h-3.5 text-emerald-400" /> Bolt CSV Faturação
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
              <Fuel className="w-3.5 h-3.5 text-amber-400" /> Prio / Galp Frota
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-300 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
              <Navigation className="w-3.5 h-3.5 text-emerald-400" /> Via Verde Extrato
            </span>
          </div>
        </div>
      </div>

      {successMessage && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-emerald-300 text-sm flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Filter Tabs & Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {['ALL', 'UBER', 'BOLT', 'PRIO', 'VIA_VERDE'].map(prov => (
            <button
              key={prov}
              onClick={() => setFilterProvider(prov)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                filterProvider === prov
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {prov === 'ALL' ? 'Todos os Extratos' : prov}
            </button>
          ))}
        </div>

        {onPreFillCalculation && (
          <Button 
            onClick={() => handleLaunchCalculationForDriver()}
            variant="primary"
            className="flex items-center gap-2 text-xs"
          >
            <Sparkles className="w-4 h-4" /> Lançar Dados num Novo Acerto
          </Button>
        )}
      </div>

      {/* Table of Reconciled Lines */}
      <div className="overflow-x-auto bg-slate-900/80 rounded-xl border border-slate-800 shadow-xl">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Fornecedor</th>
              <th className="px-4 py-3 text-left">Motorista / Viatura</th>
              <th className="px-4 py-3 text-left">Período</th>
              <th className="px-4 py-3 text-right">Viagens Brutas</th>
              <th className="px-4 py-3 text-right">Gorjetas</th>
              <th className="px-4 py-3 text-right">Portagens Plataforma</th>
              <th className="px-4 py-3 text-right">Cartão / VV</th>
              <th className="px-4 py-3 text-center">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {filteredRecords.map(item => (
              <tr key={item.id} className="hover:bg-slate-800/40">
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                    item.provider === 'UBER' ? 'bg-black text-white border border-slate-700' :
                    item.provider === 'BOLT' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                    item.provider === 'PRIO' ? 'bg-blue-950 text-blue-400 border border-blue-800' :
                    'bg-amber-950 text-amber-400 border border-amber-800'
                  }`}>
                    {item.provider}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <p className="font-bold text-white text-sm">{item.driverName}</p>
                  <p className="text-xs font-mono text-slate-400">{item.matricula}</p>
                </td>
                <td className="px-4 py-3 text-xs text-slate-400">
                  {new Date(item.periodStart).toLocaleDateString('pt-PT')} a {new Date(item.periodEnd).toLocaleDateString('pt-PT')}
                </td>
                <td className="px-4 py-3 text-right font-mono font-semibold text-white">
                  {item.ridesGross > 0 ? `€ ${item.ridesGross.toFixed(2)}` : '—'}
                </td>
                <td className="px-4 py-3 text-right font-mono text-emerald-400">
                  {item.tips > 0 ? `€ ${item.tips.toFixed(2)}` : '—'}
                </td>
                <td className="px-4 py-3 text-right font-mono text-slate-300">
                  {item.tolls > 0 ? `€ ${item.tolls.toFixed(2)}` : '—'}
                </td>
                <td className="px-4 py-3 text-right font-mono text-amber-400 font-semibold">
                  {item.fuelCard > 0 ? `€ ${item.fuelCard.toFixed(2)} (Comb.)` :
                   item.rentalTolls > 0 ? `€ ${item.rentalTolls.toFixed(2)} (VV)` : '—'}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleLaunchCalculationForDriver(item.matchedDriverId)}
                    className="p-1.5 px-2 bg-blue-600/30 hover:bg-blue-600/50 text-blue-400 border border-blue-500/40 rounded-lg text-xs font-bold flex items-center gap-1 mx-auto"
                    title="Transferir para Acerto Semanal deste motorista"
                  >
                    <span>Lançar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExtratoImportView;
