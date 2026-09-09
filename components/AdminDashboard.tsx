

import React, { useState, useMemo } from 'react';
import { useCalculations } from '../hooks/useCalculations';
import { useUsers } from '../hooks/useUsers';
import { useAuth } from '../hooks/useAuth';
import { useCompany } from '../hooks/useCompany';
import CalculationForm from './CalculationForm';
import CalculationView from './CalculationView';
import ReportsView from './ReportsView';
import { Calculation, CalculationStatus, UserRole } from '../types';
import Button from './ui/Button';
import Card from './ui/Card';
import { calculateSummary } from '../utils/calculationUtils';
import IbanManagement from './IbanManagement';
import VehicleManagement from './VehicleManagement';
import { db, firestore } from '../firebase';
import ReceiptManagement from './ReceiptManagement';
import AdjustmentManagement from './AdjustmentManagement';
import AdTechManagement from './adtech/AdTechManagement';
import PassengerTabletPlayer from './adtech/PassengerTabletPlayer';
import ExtratoImportView from './finance/ExtratoImportView';
import SaasSettingsView from './saas/SaasSettingsView';
import { 
  LayoutDashboard, 
  Calculator, 
  FileSpreadsheet, 
  Clock, 
  History, 
  FileBarChart2, 
  CreditCard, 
  Receipt, 
  Users, 
  Tv, 
  Tablet, 
  Building2, 
  LogOut,
  Sparkles
} from 'lucide-react';

type AdminView = 
  | 'dashboard' 
  | 'form' 
  | 'reports' 
  | 'details' 
  | 'history' 
  | 'iban' 
  | 'vehicles' 
  | 'receipts' 
  | 'adjustments'
  | 'extratos'
  | 'adtech'
  | 'tablet_sim'
  | 'saas_settings';

/**
 * Converts a Firestore Timestamp or JS Date into a JS Date object.
 * @param timestamp The value to convert.
 * @returns A JS Date object.
 */
const toDate = (timestamp: any): Date => {
    if (!timestamp) return new Date(NaN);
    if (typeof timestamp.toDate === 'function') return timestamp.toDate();
    return new Date(timestamp);
};

// FIX: Changed JSX.Element to React.ReactNode to resolve "Cannot find namespace 'JSX'" error.
const NavLink: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  badge?: string;
}> = ({ icon, label, isActive, onClick, badge }) => (
  <a
    href="#"
    onClick={(e) => { e.preventDefault(); onClick(); }}
    className={`flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
      isActive
        ? 'text-white bg-blue-600 shadow-md shadow-blue-600/20'
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`}
  >
    <div className="flex items-center min-w-0">
      <span className="flex-shrink-0">{icon}</span>
      <span className="ml-2.5 truncate">{label}</span>
    </div>
    {badge && (
      <span className="ml-2 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
        {badge}
      </span>
    )}
  </a>
);

const SidebarContent: React.FC<{
    user: ReturnType<typeof useAuth>['user'];
    logout: ReturnType<typeof useAuth>['logout'];
    isDemo: boolean;
    view: AdminView;
    setView: (view: AdminView) => void;
    onLinkClick: () => void;
    currentCompanyName?: string;
}> = ({ user, logout, isDemo, view, setView, onLinkClick, currentCompanyName }) => (
    <>
        <div className="flex flex-col mb-6 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-blue-500/30">
              R
            </div>
            <div>
              <h1 className="text-base font-black text-white tracking-tight leading-none">ROTA TVDE 5.0</h1>
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1 mt-0.5">
                <Sparkles className="w-3 h-3 text-emerald-400" /> SaaS + AdTech
              </span>
            </div>
          </div>
          {currentCompanyName && (
            <div className="mt-3 px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 text-[11px] font-semibold text-slate-300 flex items-center justify-between shadow-inner">
              <span className="truncate">{currentCompanyName}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0 ml-1.5" title="Frota Ativa"></span>
            </div>
          )}

          {/* Database Mode Status */}
          <div className="mt-2.5">
            {!isDemo ? (
              <div className="px-2 py-1 rounded bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-[10px] font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"></span>
                <span>Modo Real (Firestore)</span>
              </div>
            ) : (
              <div className="px-2 py-1 rounded bg-amber-950/60 border border-amber-800/80 text-amber-300 text-[10px] font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0"></span>
                <span>Modo Demonstração</span>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto pr-1">
          <div>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Operação & Cálculos</p>
            <div className="space-y-0.5">
              <NavLink icon={<LayoutDashboard className="h-4 w-4" />} label="Dashboard" isActive={view === 'dashboard'} onClick={() => { setView('dashboard'); onLinkClick(); }} />
              <NavLink icon={<Calculator className="h-4 w-4" />} label="Calculadora 5.0" isActive={view === 'form'} onClick={() => { setView('form'); onLinkClick(); }} />
              <NavLink icon={<FileSpreadsheet className="h-4 w-4 text-blue-400" />} label="Extratos & Reconciliação" isActive={view === 'extratos'} onClick={() => { setView('extratos'); onLinkClick(); }} badge="Novo" />
              <NavLink icon={<Clock className="h-4 w-4" />} label="Ajustes Pendentes" isActive={view === 'adjustments'} onClick={() => { setView('adjustments'); onLinkClick(); }} />
              <NavLink icon={<History className="h-4 w-4" />} label="Histórico" isActive={view === 'history'} onClick={() => { setView('history'); onLinkClick(); }} />
              <NavLink icon={<FileBarChart2 className="h-4 w-4" />} label="Relatórios" isActive={view === 'reports'} onClick={() => { setView('reports'); onLinkClick(); }} />
            </div>
          </div>

          <div>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">Monetização AdTech</p>
            <div className="space-y-0.5">
              <NavLink icon={<Tv className="h-4 w-4 text-emerald-400" />} label="Mídia & Campanhas" isActive={view === 'adtech'} onClick={() => { setView('adtech'); onLinkClick(); }} badge="€ Mídia" />
              <NavLink icon={<Tablet className="h-4 w-4 text-blue-400" />} label="Simulador Tablet" isActive={view === 'tablet_sim'} onClick={() => { setView('tablet_sim'); onLinkClick(); }} />
            </div>
          </div>

          <div>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Gestão & Frota SaaS</p>
            <div className="space-y-0.5">
              <NavLink icon={<Users className="h-4 w-4" />} label="Utilizadores & Motoristas" isActive={view === 'vehicles'} onClick={() => { setView('vehicles'); onLinkClick(); }} />
              <NavLink icon={<Receipt className="h-4 w-4" />} label="Recibos Verdes" isActive={view === 'receipts'} onClick={() => { setView('receipts'); onLinkClick(); }} />
              <NavLink icon={<CreditCard className="h-4 w-4" />} label="Gestão de IBANs" isActive={view === 'iban'} onClick={() => { setView('iban'); onLinkClick(); }} />
              <NavLink icon={<Building2 className="h-4 w-4 text-purple-400" />} label="Definições SaaS & Minutas" isActive={view === 'saas_settings'} onClick={() => { setView('saas_settings'); onLinkClick(); }} />
            </div>
          </div>
        </nav>

        <div className="mt-auto pt-3 border-t border-slate-700/80">
            <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-700/60 flex items-center justify-between">
                <div className="truncate pr-2">
                  <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                  <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mt-0.5 ${
                    user?.role === UserRole.ADMIN 
                      ? 'bg-rose-950 text-rose-300 border border-rose-800' 
                      : user?.role === UserRole.MANAGER 
                        ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' 
                        : 'bg-slate-800 text-slate-300'
                  }`}>
                    {user?.role === UserRole.ADMIN ? 'Administrador' : user?.role === UserRole.MANAGER ? 'Gerente da Frota' : user?.role}
                  </span>
                </div>
                <button 
                  onClick={(e) => { e.preventDefault(); logout(); }}
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors flex-shrink-0"
                  title="Terminar Sessão"
                >
                  <LogOut className="w-4 h-4" />
                </button>
            </div>
            <div className="mt-2 text-center">
                <span className="inline-block bg-blue-600/20 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-500/30">
                  ROTA TVDE 5.0 • SaaS + AdTech
                </span>
            </div>
        </div>
    </>
);

// FIX: Changed JSX.Element to React.ReactNode to resolve "Cannot find namespace 'JSX'" error.
const StatCard: React.FC<{ title: string; value: string; subtext: string; icon: React.ReactNode }> = ({ title, value, subtext, icon }) => (
    <Card className="flex flex-col justify-between">
        <div className="flex justify-between items-start">
            <h4 className="text-sm font-medium text-gray-400">{title}</h4>
            <div className="text-gray-500">{icon}</div>
        </div>
        <div>
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-gray-500">{subtext}</p>
        </div>
    </Card>
);

const AdminDashboard: React.FC = () => {
  const { calculations, loading, error } = useCalculations();
  const { user, logout, isDemo } = useAuth();
  const { users } = useUsers();
  const { currentCompany } = useCompany();
  
  const [view, setView] = useState<AdminView>('dashboard');
  // FIX: Added state to track the view from which details are opened. This is used to fix a navigation bug where the "Back" button would always return to the dashboard, even if coming from the history view. This also resolves the associated TypeScript error.
  const [fromView, setFromView] = useState<AdminView>('dashboard');
  const [selectedCalculation, setSelectedCalculation] = useState<Calculation | null>(null);
  const [calculationToEdit, setCalculationToEdit] = useState<Calculation | null>(null);
  const [preFillData, setPreFillData] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handlePreFillCalculation = (data: any) => {
    setPreFillData(data);
    setCalculationToEdit(null);
    setView('form');
  };

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const filteredCalculations = useMemo(() => {
    if (!startDate || !endDate) return calculations;
    
    const parseInputDate = (dateString: string): Date => {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    const start = parseInputDate(startDate);
    start.setHours(0, 0, 0, 0);
    const end = parseInputDate(endDate);
    end.setHours(23, 59, 59, 999);

    return calculations.filter(c => {
        const calcStart = toDate(c.periodStart);
        const calcEnd = toDate(c.periodEnd);

        if (isNaN(calcStart.getTime()) || isNaN(calcEnd.getTime())) {
            return false;
        }
        
        // An overlap occurs if (StartA <= EndB) and (EndA >= StartB)
        const hasOverlap = calcStart <= end && calcEnd >= start;
        return hasOverlap;
    });
  }, [calculations, startDate, endDate]);

  const pendingCalculations = useMemo(() => {
    return calculations
      .filter(c => c.status === CalculationStatus.PENDING)
      .sort((a, b) => toDate(a.periodStart).getTime() - toDate(b.periodStart).getTime()); // Oldest first
  }, [calculations]);

  const stats = useMemo(() => {
    const periodCompanyBilling = filteredCalculations
      .filter(c => c.status === CalculationStatus.ACCEPTED)
      .reduce((sum, c) => {
        const summary = calculateSummary(c);
        const companyEarnings =
          (c.vehicleRental || 0) +
          (c.rentalTolls || 0) +
          (c.fleetCard || 0) +
          (c.otherExpenses || 0) +
          (c.debtDeduction || 0) +
          summary.iva +
          summary.slotFee;
        return sum + companyEarnings;
      }, 0);

    return {
      periodCompanyBilling,
      pendingCount: calculations.filter(c => c.status === CalculationStatus.PENDING).length, // Global pending count
      activeDrivers: users.filter(u => u.role === UserRole.DRIVER).length,
    };
  }, [filteredCalculations, calculations, users]);

  const recentActivity = useMemo(() => {
    return [...calculations]
      .sort((a, b) => toDate(b.date).getTime() - toDate(a.date).getTime())
      .slice(0, 5);
  }, [calculations]);

  const dashboardHistoryCalculations = useMemo(() => {
    return [...calculations]
      .sort((a, b) => toDate(b.periodStart).getTime() - toDate(a.periodStart).getTime());
  }, [calculations]);

  const handleShowDetails = (calc: Calculation) => {
    // FIX: Store the current view before navigating to details so the "Back" button works correctly.
    setFromView(view);
    setSelectedCalculation(calc);
    setView('details');
  };

  const handleEdit = (calc: Calculation) => {
    setCalculationToEdit(calc);
    setView('form');
  };

  const handleDelete = async (calc: Calculation) => {
    if (window.confirm(`Tem a certeza que deseja apagar o cálculo para ${calc.driverName} do período ${toDate(calc.periodStart).toLocaleDateString('pt-PT')} - ${toDate(calc.periodEnd).toLocaleDateString('pt-PT')}? Esta ação é irreversível e irá reverter qualquer dedução de dívida associada.`)) {
        
        try {
            const batch = db.batch();

            // 1. Set up the calculation deletion
            const calculationRef = db.collection('calculations').doc(calc.id);
            batch.delete(calculationRef);

            // 2. Set up the debt reversal if needed
            if (calc.debtDeduction && calc.debtDeduction > 0) {
                const driverRef = db.collection('users').doc(calc.driverId);
                // FieldValue.increment is the safest way to update counters.
                // We add back the deducted amount.
                batch.update(driverRef, { 
                    outstandingDebt: firestore.FieldValue.increment(calc.debtDeduction) 
                });
            }

            // 3. Commit the atomic operation
            await batch.commit();

            alert('Cálculo apagado com sucesso!');

            // If the deleted calculation was the one being viewed in 'details', go back
            if (selectedCalculation && selectedCalculation.id === calc.id) {
                setSelectedCalculation(null);
                setView(fromView);
            }

        } catch (err) {
            console.error("Falha ao apagar o cálculo:", err);
            alert("Ocorreu um erro ao tentar apagar o cálculo. A operação foi revertida. Verifique a consola para mais detalhes.");
        }
    }
  };
  
  const handleSetView = (newView: AdminView) => {
    setView(newView);
    if (newView === 'form') {
        setCalculationToEdit(null);
    }
  }

  const renderDashboardHome = () => (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">
            {user?.role === UserRole.MANAGER ? 'Painel de Gestão Operacional (Gerente)' : 'Dashboard do Administrador'}
          </h2>
          <p className="text-gray-400">
            {user?.role === UserRole.MANAGER 
              ? 'Gestão operacional de viaturas, motoristas, cálculos e acertos semanais.' 
              : 'Visão geral e gestão integrada da frota TVDE.'}
          </p>
        </div>
        <div>
          {!isDemo ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold shadow-lg shadow-emerald-950/40">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Base de Dados Real (Firestore Ativo)
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-950/80 border border-amber-500/50 text-amber-300 text-xs font-bold shadow-lg shadow-amber-950/40">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              Modo Demonstração (Dados Estáticos)
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Faturado (Empresa)" value={`€${stats.periodCompanyBilling.toFixed(2)}`} subtext={startDate && endDate ? "Faturação no período selecionado" : "Faturação de todo o período"} icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
          } />
          <StatCard title="Cálculos Pendentes" value={String(stats.pendingCount)} subtext="Total a necessitar de ação" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} />
          <StatCard title="Motoristas Ativos" value={String(stats.activeDrivers)} subtext="Total de motoristas" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.122-1.274-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.122-1.274.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} />
          <Card className="flex flex-col justify-between">
              <h4 className="text-sm font-medium text-gray-400 mb-2">Período de Análise</h4>
              <div className="space-y-2">
                  <div>
                      <label htmlFor="startDate" className="block text-xs text-gray-500">De</label>
                      <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 py-1 px-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-white" />
                  </div>
                  <div>
                      <label htmlFor="endDate" className="block text-xs text-gray-500">Até</label>
                      <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 py-1 px-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-white" />
                  </div>
              </div>
          </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2 text-yellow-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>Cálculos Pendentes de Aprovação</span>
                </h3>
                {loading ? (
                  <p className="text-center py-5 text-gray-400">A carregar...</p>
                ) : pendingCalculations.length === 0 ? (
                    <p className="text-center py-5 text-gray-400">Não há cálculos pendentes.</p>
                ) : (
                    <div className="space-y-3">
                        {pendingCalculations.map(calc => (
                            <div key={calc.id} className="bg-gray-800 p-3 rounded-lg border border-gray-700 flex justify-between items-center gap-4 flex-wrap">
                                <div>
                                    <p className="font-semibold text-white">{calc.driverName}</p>
                                    <p className="text-sm text-gray-300">{`${toDate(calc.periodStart).toLocaleDateString('pt-PT')} - ${toDate(calc.periodEnd).toLocaleDateString('pt-PT')}`}</p>
                                </div>
                                <Button onClick={() => handleShowDetails(calc)} variant="secondary" className="flex-shrink-0">
                                    Ver e Aprovar
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </Card>

            {renderHistoryList(true, dashboardHistoryCalculations)}
        </div>
        <div className="lg:col-span-1 space-y-6">
            <Card>
              <h3 className="text-lg font-semibold mb-4">Ações Rápidas</h3>
              <div className="flex gap-4">
                  <Button onClick={() => handleSetView('form')} variant="primary">Novo Cálculo</Button>
                  <Button onClick={() => handleSetView('reports')} variant="secondary">Ver Relatórios</Button>
              </div>
            </Card>
            <Card>
                <h3 className="text-lg font-semibold mb-4">Atividade Recente (Global)</h3>
                <ul className="space-y-4">
                    {recentActivity.map(calc => {
                        let activityText = `Novo cálculo para ${calc.driverName}.`;
                        if (calc.status === CalculationStatus.ACCEPTED) activityText = `Cálculo para ${calc.driverName} aceite.`;
                        if (calc.status === CalculationStatus.REVISION_REQUESTED) activityText = `Revisão pedida para ${calc.driverName}.`;
                        
                        return (
                            <li key={calc.id} className="flex items-start">
                                <div className={`mt-1 flex-shrink-0 flex items-center justify-center h-5 w-5 rounded-full ${
                                    calc.status === CalculationStatus.ACCEPTED ? 'bg-green-500' : 
                                    calc.status === CalculationStatus.REVISION_REQUESTED ? 'bg-red-500' : 'bg-yellow-500'
                                }`}>
                                    {calc.status === CalculationStatus.ACCEPTED ? <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> : null}
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-white">{activityText}</p>
                                    <p className="text-xs text-gray-400">{toDate(calc.date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </Card>
        </div>
      </div>
    </div>
  );

  const getStatusColor = (status: CalculationStatus) => {
    switch (status) {
      case CalculationStatus.ACCEPTED: return 'bg-green-600/20 text-green-400 border-green-500';
      case CalculationStatus.REVISION_REQUESTED: return 'bg-red-600/20 text-red-400 border-red-500';
      case CalculationStatus.PENDING: return 'bg-yellow-600/20 text-yellow-400 border-yellow-500';
      default: return 'bg-gray-600/20 text-gray-400 border-gray-500';
    }
  };

  const renderHistoryList = (isDashboardView = false, calcsToRender: Calculation[]) => (
    <Card>
        <h3 className="text-xl font-semibold mb-4">{isDashboardView ? 'Histórico de Cálculos (Global)' : (startDate && endDate ? 'Histórico de Cálculos (Período Selecionado)' : 'Histórico de Cálculos (Todo o Período)')}</h3>
        {error && (
          <div className="p-4 mb-4 text-sm text-red-400 bg-red-900/50 border border-red-600 rounded-lg" role="alert">
            <p className="font-bold">Erro: {error.split('Link:')[0]}</p>
          </div>
        )}

        {/* Mobile View (Cards) */}
        <div className="md:hidden">
            {loading ? (
                <p className="text-center py-10 text-gray-400">A carregar...</p>
            ) : calcsToRender.length === 0 ? (
                <p className="text-center py-10 text-gray-400">Nenhum cálculo encontrado para o período selecionado.</p>
            ) : (
                <div className="space-y-4">
                    {calcsToRender.slice(0, isDashboardView ? 5 : undefined).map(calc => (
                        <div key={calc.id} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <p className="font-semibold text-white">{calc.driverName}</p>
                                    <p className="text-sm text-gray-300">{`${toDate(calc.periodStart).toLocaleDateString('pt-PT')} - ${toDate(calc.periodEnd).toLocaleDateString('pt-PT')}`}</p>
                                </div>
                                <span className={`flex-shrink-0 px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(calc.status)}`}>{calc.status}</span>
                            </div>
                            <div className="mt-4 flex justify-end gap-4">
                                <button onClick={() => handleShowDetails(calc)} className="text-blue-400 hover:text-blue-300 font-medium text-sm">Ver Detalhes</button>
                                <button onClick={() => handleDelete(calc)} className="text-red-400 hover:text-red-300 font-medium text-sm">Excluir</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {/* Desktop View (Table) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Motorista</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Período</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-gray-900 divide-y divide-gray-800">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-10 text-gray-400">A carregar...</td></tr>
              ) : calcsToRender.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-10 text-gray-400">Nenhum cálculo encontrado para o período selecionado.</td></tr>
              ) : (calcsToRender.slice(0, isDashboardView ? 5 : undefined).map(calc => (
                <tr key={calc.id} className="hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{calc.driverName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{`${toDate(calc.periodStart).toLocaleDateString('pt-PT')} - ${toDate(calc.periodEnd).toLocaleDateString('pt-PT')}`}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(calc.status)}`}>{calc.status}</span></td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-4">
                    <button onClick={() => handleShowDetails(calc)} className="text-blue-400 hover:text-blue-300">Ver Detalhes</button>
                    <button onClick={() => handleDelete(calc)} className="text-red-400 hover:text-red-300">Excluir</button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
        
        {isDashboardView && calculations.length > 5 && <div className="text-center mt-4"><Button variant="secondary" onClick={() => setView('history')}>Ver todo o histórico</Button></div>}
    </Card>
  );

  const renderContent = () => {
    switch (view) {
      case 'dashboard': return renderDashboardHome();
      case 'form': 
        return (
          <CalculationForm 
            calculationToEdit={calculationToEdit} 
            initialValues={preFillData}
            onClose={() => { 
              setView('dashboard'); 
              setCalculationToEdit(null); 
              setPreFillData(null); 
            }} 
          />
        );
      case 'extratos':
        return <ExtratoImportView onPreFillCalculation={handlePreFillCalculation} />;
      case 'adtech':
        return <AdTechManagement onOpenSimulator={() => setView('tablet_sim')} />;
      case 'tablet_sim':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Button onClick={() => setView('adtech')} variant="secondary" className="text-xs">
                &larr; Voltar ao Painel AdTech
              </Button>
              <span className="text-xs text-slate-400">Simulação Interativa do Ecrã do Passageiro</span>
            </div>
            <PassengerTabletPlayer />
          </div>
        );
      case 'saas_settings':
        return <SaasSettingsView />;
      case 'history': return renderHistoryList(false, filteredCalculations);
      case 'reports': return <ReportsView onBack={() => setView('dashboard')} />;
      case 'details':
        if (!selectedCalculation) return renderDashboardHome();
        return (
          <div>
            {/* FIX: The original comparison `view === 'history'` was always false inside the 'details' view case, causing a type error and a logic bug. This now correctly navigates back to the previous view using the `fromView` state. */}
            <Button onClick={() => { setView(fromView); setSelectedCalculation(null); }} className="mb-4">&larr; Voltar</Button>
            <CalculationView calculation={selectedCalculation} />
             <div className="mt-6 bg-gray-800 border border-gray-700 rounded-lg p-4 flex justify-center items-center gap-4 flex-wrap">
                 <Button onClick={() => handleEdit(selectedCalculation)} variant="primary">Editar Cálculo</Button>
                 <Button onClick={() => handleDelete(selectedCalculation)} variant="danger">Excluir Cálculo</Button>
             </div>
          </div>
        );
      case 'iban': return <IbanManagement />;
      case 'receipts': return <ReceiptManagement />;
      case 'vehicles': return <VehicleManagement />;
      case 'adjustments': return <AdjustmentManagement />;
      default: return <h2>Bem-vindo</h2>;
    }
  };

  return (
    <div className="flex flex-1 text-gray-100 font-sans">
      {/* Mobile Sidebar (Overlay) */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-800 p-4 flex flex-col transform transition-transform duration-300 ease-in-out md:hidden ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <SidebarContent 
          user={user} 
          logout={logout} 
          isDemo={isDemo}
          view={view} 
          setView={handleSetView} 
          onLinkClick={() => setIsSidebarOpen(false)} 
          currentCompanyName={currentCompany?.name}
        />
      </aside>
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}

      {/* Desktop Sidebar */}
      <aside className="hidden w-64 bg-gray-800 p-4 md:flex flex-col flex-shrink-0">
          <SidebarContent 
            user={user} 
            logout={logout} 
            isDemo={isDemo}
            view={view} 
            setView={handleSetView} 
            onLinkClick={() => {}} 
            currentCompanyName={currentCompany?.name}
          />
      </aside>

      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="md:hidden bg-gray-800 shadow-md p-4 flex justify-between items-center sticky top-0 z-10">
            <div className="flex items-center">
                <h1 className="text-lg font-bold">ROTA TVDE 5.0</h1>
            </div>
            <button onClick={() => setIsSidebarOpen(true)} aria-label="Abrir menu">
                <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-10 overflow-y-auto">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;