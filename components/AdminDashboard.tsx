import React, { useState, useMemo, useRef, useEffect } from 'react';
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
import TabletDisplayRoute from './adtech/TabletDisplayRoute';
import ExtratoImportView from './finance/ExtratoImportView';
import SaasSettingsView from './saas/SaasSettingsView';
import IvaManagementView from './iva/IvaManagementView';
import FleetDispatchAdmin from './dispatch/FleetDispatchAdmin';
import RiderApp from './rider/RiderApp';
import { aggregateAnnualIva } from '../utils/ivaUtils';
import { BRAND_LOGOS } from '../constants';
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
  Sparkles,
  Search,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  TrendingUp,
  Car,
  Bell,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  ChevronDown,
  ExternalLink,
  ShieldCheck,
  Database,
  Navigation,
  Smartphone
} from 'lucide-react';

export type AdminView = 
  | 'dashboard' 
  | 'form' 
  | 'reports' 
  | 'details' 
  | 'history' 
  | 'iban' 
  | 'vehicles' 
  | 'dispatch'
  | 'rider_sim'
  | 'receipts' 
  | 'adjustments'
  | 'extratos'
  | 'adtech'
  | 'tablet_sim'
  | 'saas_settings'
  | 'iva';

const toDate = (timestamp: any): Date => {
  if (!timestamp) return new Date(NaN);
  if (typeof timestamp.toDate === 'function') return timestamp.toDate();
  return new Date(timestamp);
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  badge?: string | number;
  badgeColor?: string;
  isCollapsed?: boolean;
}

const NavLink: React.FC<NavItemProps> = ({ 
  icon, 
  label, 
  isActive, 
  onClick, 
  badge, 
  badgeColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  isCollapsed 
}) => (
  <a
    href="#"
    onClick={(e) => { e.preventDefault(); onClick(); }}
    title={isCollapsed ? label : undefined}
    className={`group flex items-center ${isCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2'} text-xs font-semibold rounded-xl transition-all ${
      isActive
        ? 'text-white bg-blue-600 shadow-md shadow-blue-600/30 font-bold'
        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
    }`}
  >
    <div className={`flex items-center min-w-0 ${isCollapsed ? 'justify-center' : ''}`}>
      <span className={`flex-shrink-0 transition-transform group-hover:scale-105 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
        {icon}
      </span>
      {!isCollapsed && <span className="ml-2.5 truncate">{label}</span>}
    </div>
    {!isCollapsed && badge !== undefined && badge !== null && (
      <span className={`ml-2 text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md border ${badgeColor}`}>
        {badge}
      </span>
    )}
  </a>
);

const AdminDashboard: React.FC = () => {
  const { calculations, loading, error } = useCalculations();
  const { user, logout, isDemo } = useAuth();
  const { users } = useUsers();
  const { currentCompany } = useCompany();
  
  const [view, setView] = useState<AdminView>('dashboard');
  const [fromView, setFromView] = useState<AdminView>('dashboard');
  const [selectedCalculation, setSelectedCalculation] = useState<Calculation | null>(null);
  const [calculationToEdit, setCalculationToEdit] = useState<Calculation | null>(null);
  const [preFillData, setPreFillData] = useState<any>(null);
  
  // Layout states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile drawer
  const [isCollapsed, setIsCollapsed] = useState(false); // Desktop icon-only toggle
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false); // Expandable mobile search bar
  const [globalSearch, setGlobalSearch] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isFleetMenuOpen, setIsFleetMenuOpen] = useState(false);
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'ALL' | CalculationStatus>('ALL');

  const userMenuRef = useRef<HTMLDivElement>(null);
  const fleetMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (fleetMenuRef.current && !fleetMenuRef.current.contains(event.target as Node)) {
        setIsFleetMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePreFillCalculation = (data: any) => {
    setPreFillData(data);
    setCalculationToEdit(null);
    setView('form');
  };

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const filteredCalculations = useMemo(() => {
    let result = calculations;
    if (startDate && endDate) {
      const parseInputDate = (dateString: string): Date => {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day);
      };

      const start = parseInputDate(startDate);
      start.setHours(0, 0, 0, 0);
      const end = parseInputDate(endDate);
      end.setHours(23, 59, 59, 999);

      result = result.filter(c => {
        const calcStart = toDate(c.periodStart);
        const calcEnd = toDate(c.periodEnd);
        if (isNaN(calcStart.getTime()) || isNaN(calcEnd.getTime())) return false;
        return calcStart <= end && calcEnd >= start;
      });
    }

    if (globalSearch.trim()) {
      const q = globalSearch.toLowerCase().trim();
      result = result.filter(c => 
        (c.driverName && c.driverName.toLowerCase().includes(q)) ||
        (c.matricula && c.matricula.toLowerCase().includes(q))
      );
    }

    return result;
  }, [calculations, startDate, endDate, globalSearch]);

  const pendingCalculations = useMemo(() => {
    return calculations
      .filter(c => c.status === CalculationStatus.PENDING)
      .sort((a, b) => toDate(a.periodStart).getTime() - toDate(b.periodStart).getTime());
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

    const totalGrossTurnover = filteredCalculations
      .filter(c => c.status === CalculationStatus.ACCEPTED)
      .reduce((sum, c) => sum + (c.uberRides || 0) + (c.boltRides || 0), 0);

    return {
      periodCompanyBilling,
      totalGrossTurnover,
      pendingCount: calculations.filter(c => c.status === CalculationStatus.PENDING).length,
      activeDrivers: users.filter(u => u.role === UserRole.DRIVER).length,
    };
  }, [filteredCalculations, calculations, users]);

  const annualIvaSummary = useMemo(() => {
    return aggregateAnnualIva(calculations, new Date().getFullYear());
  }, [calculations]);

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
        const calculationRef = db.collection('calculations').doc(calc.id);
        batch.delete(calculationRef);

        if (calc.debtDeduction && calc.debtDeduction > 0) {
          const driverRef = db.collection('users').doc(calc.driverId);
          batch.update(driverRef, { 
            outstandingDebt: firestore.FieldValue.increment(calc.debtDeduction) 
          });
        }

        await batch.commit();
        alert('Cálculo apagado com sucesso!');

        if (selectedCalculation && selectedCalculation.id === calc.id) {
          setSelectedCalculation(null);
          setView(fromView);
        }
      } catch (err) {
        console.error("Falha ao apagar o cálculo:", err);
        alert("Ocorreu um erro ao tentar apagar o cálculo. A operação foi revertida.");
      }
    }
  };
  
  const handleSetView = (newView: AdminView) => {
    setView(newView);
    if (newView === 'form') {
      setCalculationToEdit(null);
    }
  };

  const getStatusColor = (status: CalculationStatus) => {
    switch (status) {
      case CalculationStatus.ACCEPTED: 
        return {
          badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50',
          dot: 'bg-emerald-400 animate-pulse'
        };
      case CalculationStatus.REVISION_REQUESTED: 
        return {
          badge: 'bg-rose-950/80 text-rose-300 border-rose-600/50',
          dot: 'bg-rose-400'
        };
      case CalculationStatus.PENDING: 
        return {
          badge: 'bg-amber-950/80 text-amber-300 border-amber-600/50',
          dot: 'bg-amber-400 animate-pulse'
        };
      default: 
        return {
          badge: 'bg-slate-800 text-slate-300 border-slate-700',
          dot: 'bg-slate-400'
        };
    }
  };

  // Quick preset dates
  const setQuickDate = (type: 'all' | '7days' | 'thisMonth') => {
    const today = new Date();
    if (type === 'all') {
      setStartDate('');
      setEndDate('');
    } else if (type === '7days') {
      const past = new Date();
      past.setDate(today.getDate() - 7);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    } else if (type === 'thisMonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    }
  };

  // Render Sidebar Content
  const renderSidebar = (collapsed: boolean, onLinkClick: () => void) => (
    <div className="flex flex-col h-full">
      {/* Brand Header */}
      <div className={`flex flex-col mb-4 flex-shrink-0 ${collapsed ? 'items-center' : ''}`}>
        {!collapsed ? (
          <div className="space-y-2">
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-center shadow-inner min-h-[40px]">
              <img 
                src={BRAND_LOGOS.DESKTOP} 
                alt="Asfalto Cativante - ROTA TVDE 5.0" 
                referrerPolicy="no-referrer"
                className="h-10 w-auto object-contain max-w-full"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent && !parent.querySelector('.logo-fallback')) {
                    const fallback = document.createElement('div');
                    fallback.className = 'logo-fallback flex items-center gap-2 text-blue-400 font-black text-xs uppercase';
                    fallback.innerHTML = '<span class="px-2 py-1 rounded bg-blue-500/20 text-blue-300">AC</span> Asfalto Cativante';
                    parent.appendChild(fallback);
                  }
                }}
              />
            </div>
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-black text-white tracking-tight">ROTA TVDE 5.0</span>
              <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-emerald-400" /> SaaS + AdTech
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <img 
              src={BRAND_LOGOS.MOBILE} 
              alt="ROTA TVDE" 
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-xl object-cover border border-slate-700 shadow-md"
            />
          </div>
        )}

        {!collapsed && (
          <>
            {/* Active Fleet pill */}
            <div className="mt-3 px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 text-[11px] font-semibold text-slate-300 flex items-center justify-between shadow-inner">
              <span className="truncate">{currentCompany?.tradeName || currentCompany?.name || 'Asfalto Cativante'}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0 ml-1.5" title="Frota Ativa"></span>
            </div>

            {/* Database Mode Status Badge */}
            <div className="mt-2">
              {!isDemo ? (
                <div className="px-2 py-1 rounded-md bg-emerald-950/70 border border-emerald-800/80 text-emerald-300 text-[10px] font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"></span>
                  <span>Modo Real (Firestore)</span>
                </div>
              ) : (
                <div className="px-2 py-1 rounded-md bg-amber-950/70 border border-amber-800/80 text-amber-300 text-[10px] font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0"></span>
                  <span>Modo Demonstração</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* 5 Main Navigation Groups */}
      <nav className="flex-1 space-y-5 overflow-y-auto pr-1">
        {/* GROUP 1: PAINEL PRINCIPAL */}
        <div>
          {!collapsed && (
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <span>📊 Painel Principal</span>
            </p>
          )}
          <div className="space-y-0.5">
            <NavLink 
              icon={<LayoutDashboard className="h-4 w-4" />} 
              label="Dashboard Geral" 
              isActive={view === 'dashboard'} 
              onClick={() => { setView('dashboard'); onLinkClick(); }}
              isCollapsed={collapsed}
            />
          </div>
        </div>

        {/* GROUP 2: FROTA & LOGÍSTICA */}
        <div>
          {!collapsed && (
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <span>🚗 Frota & Logística</span>
            </p>
          )}
          <div className="space-y-0.5">
            <NavLink 
              icon={<Navigation className="h-4 w-4 text-emerald-400" />} 
              label="Central Dispatch & GPS" 
              isActive={view === 'dispatch'} 
              onClick={() => { setView('dispatch'); onLinkClick(); }}
              badge="Live"
              badgeColor="bg-emerald-950 text-emerald-300 border-emerald-700"
              isCollapsed={collapsed}
            />
            <NavLink 
              icon={<Smartphone className="h-4 w-4 text-blue-400" />} 
              label="App Passageiro (Rider)" 
              isActive={view === 'rider_sim'} 
              onClick={() => { setView('rider_sim'); onLinkClick(); }}
              isCollapsed={collapsed}
            />
            <NavLink 
              icon={<Users className="h-4 w-4" />} 
              label="Veículos & Motoristas" 
              isActive={view === 'vehicles'} 
              onClick={() => { setView('vehicles'); onLinkClick(); }}
              badge={users.filter(u => u.role === UserRole.DRIVER).length}
              isCollapsed={collapsed}
            />
            <NavLink 
              icon={<Clock className="h-4 w-4" />} 
              label="Cartões Frota & Ajustes" 
              isActive={view === 'adjustments'} 
              onClick={() => { setView('adjustments'); onLinkClick(); }}
              isCollapsed={collapsed}
            />
          </div>
        </div>

        {/* GROUP 3: FINANCEIRO & ACERTOS */}
        <div>
          {!collapsed && (
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <span>💰 Financeiro & Acertos</span>
            </p>
          )}
          <div className="space-y-0.5">
            <NavLink 
              icon={<FileSpreadsheet className="h-4 w-4 text-blue-400" />} 
              label="Extratos & Reconciliação" 
              isActive={view === 'extratos'} 
              onClick={() => { setView('extratos'); onLinkClick(); }} 
              badge="CSV/PDF"
              badgeColor="bg-blue-950 text-blue-300 border-blue-700"
              isCollapsed={collapsed}
            />
            <NavLink 
              icon={<Calculator className="h-4 w-4" />} 
              label="Calculadora 5.0" 
              isActive={view === 'form'} 
              onClick={() => { setView('form'); onLinkClick(); }}
              isCollapsed={collapsed}
            />
            <NavLink 
              icon={<History className="h-4 w-4" />} 
              label="Histórico de Acertos" 
              isActive={view === 'history'} 
              onClick={() => { setView('history'); onLinkClick(); }}
              badge={stats.pendingCount > 0 ? stats.pendingCount : undefined}
              badgeColor="bg-amber-950 text-amber-300 border-amber-800"
              isCollapsed={collapsed}
            />
            <NavLink 
              icon={<Receipt className="h-4 w-4" />} 
              label="Recibos Verdes" 
              isActive={view === 'receipts'} 
              onClick={() => { setView('receipts'); onLinkClick(); }}
              isCollapsed={collapsed}
            />
            <NavLink 
              icon={<CreditCard className="h-4 w-4" />} 
              label="Gestão de IBANs" 
              isActive={view === 'iban'} 
              onClick={() => { setView('iban'); onLinkClick(); }}
              isCollapsed={collapsed}
            />
            <NavLink 
              icon={<Receipt className="h-4 w-4 text-emerald-400" />} 
              label="Gestão Fiscal & IVA" 
              isActive={view === 'iva'} 
              onClick={() => { setView('iva'); onLinkClick(); }}
              badge="AT"
              badgeColor="bg-emerald-950 text-emerald-300 border-emerald-700"
              isCollapsed={collapsed}
            />
            <NavLink 
              icon={<FileBarChart2 className="h-4 w-4" />} 
              label="Relatórios Consolidados" 
              isActive={view === 'reports'} 
              onClick={() => { setView('reports'); onLinkClick(); }}
              isCollapsed={collapsed}
            />
          </div>
        </div>

        {/* GROUP 4: ADTECH & MÍDIA EMBARCADA */}
        <div>
          {!collapsed && (
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1.5 flex items-center gap-1.5">
              <span>📢 AdTech & Mídia Embarcada</span>
            </p>
          )}
          <div className="space-y-0.5">
            <NavLink 
              icon={<Tv className="h-4 w-4 text-emerald-400" />} 
              label="Campanhas & Displays" 
              isActive={view === 'adtech'} 
              onClick={() => { setView('adtech'); onLinkClick(); }} 
              badge="€ Mídia"
              badgeColor="bg-emerald-950 text-emerald-300 border-emerald-700"
              isCollapsed={collapsed}
            />
            <NavLink 
              icon={<Tablet className="h-4 w-4 text-blue-400" />} 
              label="Simulador Tablet" 
              isActive={view === 'tablet_sim'} 
              onClick={() => { setView('tablet_sim'); onLinkClick(); }}
              isCollapsed={collapsed}
            />
          </div>
        </div>

        {/* GROUP 5: CONFIGURAÇÕES & EQUIPA */}
        <div>
          {!collapsed && (
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
              <span>⚙️ Configurações & Equipa</span>
            </p>
          )}
          <div className="space-y-0.5">
            <NavLink 
              icon={<Building2 className="h-4 w-4 text-purple-400" />} 
              label="Definições SaaS & Minutas" 
              isActive={view === 'saas_settings'} 
              onClick={() => { setView('saas_settings'); onLinkClick(); }}
              isCollapsed={collapsed}
            />
          </div>
        </div>
      </nav>

      {/* Sidebar Footer */}
      <div className="mt-auto pt-3 border-t border-slate-800">
        {!collapsed ? (
          <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="truncate pr-2">
              <p className="text-xs font-bold text-white truncate">{user?.name}</p>
              <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mt-0.5 ${
                user?.role === UserRole.ADMIN 
                  ? 'bg-rose-950 text-rose-300 border border-rose-800' 
                  : user?.role === UserRole.MANAGER 
                    ? 'bg-indigo-950 text-indigo-300 border border-indigo-800' 
                    : 'bg-slate-800 text-slate-300'
              }`}>
                {user?.role === UserRole.ADMIN ? 'Administrador' : user?.role === UserRole.MANAGER ? 'Gerente' : user?.role}
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
        ) : (
          <div className="flex justify-center">
            <button 
              onClick={(e) => { e.preventDefault(); logout(); }}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
              title="Terminar Sessão"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderDashboardHome = () => (
    <div className="space-y-8">
      {/* Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {user?.role === UserRole.MANAGER ? 'Painel de Gestão Operacional (Gerente)' : 'Painel de Controlo Enterprise'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {user?.role === UserRole.MANAGER 
              ? 'Gestão operacional de viaturas, motoristas, cálculos e acertos semanais.' 
              : 'Visão executiva da faturação da frota, reconciliação e AdTech em tempo real.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Button onClick={() => handleSetView('form')} variant="primary" className="text-xs sm:text-sm shadow-lg shadow-blue-600/30">
            + Novo Cálculo Semanal
          </Button>
          <Button onClick={() => handleSetView('extratos')} variant="secondary" className="text-xs sm:text-sm">
            Importar Ficheiros
          </Button>
        </div>
      </div>

      {/* Modern KPI Cards with Trend Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Faturação da Empresa */}
        <div className="h-full p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-750 shadow-sm backdrop-blur-sm relative overflow-hidden flex flex-col justify-between transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Faturação Empresa</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">€{stats.periodCompanyBilling.toFixed(2)}</p>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+14.2% vs semana anterior</span>
            </div>
          </div>
        </div>

        {/* Card 2: Volume Bruto Total (Uber + Bolt) */}
        <div className="h-full p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-750 shadow-sm backdrop-blur-sm relative overflow-hidden flex flex-col justify-between transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Turnover Bruto TVDE</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Car className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">€{stats.totalGrossTurnover.toFixed(2)}</p>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <span>Uber & Bolt auditados</span>
            </div>
          </div>
        </div>

        {/* Card 3: Crédito de IVA Acumulado (Finanças) - CORE FISCAL KPI */}
        <div 
          onClick={() => handleSetView('iva')}
          className="h-full p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 shadow-sm backdrop-blur-sm relative overflow-hidden flex flex-col justify-between cursor-pointer group transition-colors"
        >
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Crédito de IVA (Finanças)</span>
            <div className={`p-2 rounded-xl border ${annualIvaSummary.isReembolso ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              €{Math.abs(annualIvaSummary.saldoIvaAnual).toFixed(2)}
            </p>
            <div className="mt-2">
              {annualIvaSummary.isReembolso ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  A Recuperar pela Frota
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  A Pagar às Finanças
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card 4: Cálculos Pendentes */}
        <div className="h-full p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-750 shadow-sm backdrop-blur-sm relative overflow-hidden flex flex-col justify-between transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Acertos Pendentes</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{stats.pendingCount}</p>
              <span className="text-xs text-slate-400">a validar</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs font-medium">
              {stats.pendingCount > 0 ? (
                <span className="text-amber-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Ação necessária
                </span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Tudo em dia
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card 5: Motoristas Ativos & AdTech */}
        <div className="h-full p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-750 shadow-sm backdrop-blur-sm relative overflow-hidden flex flex-col justify-between transition-colors">
          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Frota & Mídia</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Tv className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-baseline gap-2">
              <p className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{stats.activeDrivers}</p>
              <span className="text-xs text-slate-400">condutores ativos</span>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tablets AdTech ativos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Date Filter Quick Bar */}
      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Período:</span>
          <button 
            type="button"
            onClick={() => setQuickDate('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              !startDate && !endDate ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Todo o Período
          </button>
          <button 
            type="button"
            onClick={() => setQuickDate('7days')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Últimos 7 dias
          </button>
          <button 
            type="button"
            onClick={() => setQuickDate('thisMonth')}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            Este Mês
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <input 
            type="date" 
            value={startDate} 
            onChange={(e) => setStartDate(e.target.value)} 
            className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs" 
          />
          <span className="text-slate-500">&rarr;</span>
          <input 
            type="date" 
            value={endDate} 
            onChange={(e) => setEndDate(e.target.value)} 
            className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs" 
          />
        </div>
      </div>

      {/* Main Grid: Pending Approvals + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Pending Approvals Card */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Clock className="w-4 h-4" />
                </span>
                <span>Acertos Pendentes de Validação</span>
              </h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800">
                {pendingCalculations.length} pendentes
              </span>
            </div>

            {loading ? (
              <p className="text-center py-6 text-slate-400 text-xs">A carregar acertos...</p>
            ) : pendingCalculations.length === 0 ? (
              <div className="text-center py-8 px-4 rounded-xl bg-slate-950/40 border border-slate-800/80">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-white">Todos os cálculos foram processados!</p>
                <p className="text-xs text-slate-400 mt-0.5">Não há acertos semanais a necessitar de aprovação no momento.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingCalculations.map(calc => (
                  <div 
                    key={calc.id} 
                    className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:border-slate-700 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{calc.driverName}</span>
                        {calc.matricula && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {calc.matricula}
                          </span>
                        )}
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                          {calc.type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Período: {toDate(calc.periodStart).toLocaleDateString('pt-PT')} a {toDate(calc.periodEnd).toLocaleDateString('pt-PT')}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      <Button onClick={() => handleShowDetails(calc)} variant="primary" className="text-xs py-1.5 px-3">
                        Rever & Aprovar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Table View */}
          {renderHistoryList(true, dashboardHistoryCalculations)}
        </div>

        {/* Right Column: Quick Operations & Recent Global Activity */}
        <div className="lg:col-span-1 space-y-6">
          {/* Quick Operations */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
            <h3 className="text-base font-bold text-white mb-3">Operações Rápidas</h3>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleSetView('extratos')}
                className="w-full p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-left flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Importar Extratos</p>
                    <p className="text-[11px] text-slate-400">CSV/PDF Uber, Bolt, Via Verde</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
              </button>

              <button
                type="button"
                onClick={() => handleSetView('adtech')}
                className="w-full p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-left flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-600/20 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Tv className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Mídia & Tablets</p>
                    <p className="text-[11px] text-slate-400">Campanhas ativas nos carros</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
              </button>

              <button
                type="button"
                onClick={() => handleSetView('iva')}
                className="w-full p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-left flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-600/20 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Gestão Fiscal & IVA</p>
                    <p className="text-[11px] text-slate-400">Reembolso anual e declaração AT</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
              </button>

              <button
                type="button"
                onClick={() => handleSetView('receipts')}
                className="w-full p-3 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 text-left flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-600/20 text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Recibos Verdes</p>
                    <p className="text-[11px] text-slate-400">Conformidade e NIF dos motoristas</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white" />
              </button>
            </div>
          </div>

          {/* Activity Log */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
            <h3 className="text-base font-bold text-white mb-4">Atividade Recente da Frota</h3>
            <ul className="space-y-3.5">
              {recentActivity.map(calc => {
                let activityText = `Cálculo registado para ${calc.driverName}.`;
                if (calc.status === CalculationStatus.ACCEPTED) activityText = `Acerto aceite para ${calc.driverName}.`;
                if (calc.status === CalculationStatus.REVISION_REQUESTED) activityText = `Revisão solicitada para ${calc.driverName}.`;
                
                const statusStyle = getStatusColor(calc.status);

                return (
                  <li key={calc.id} className="flex items-start gap-2.5 text-xs">
                    <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${statusStyle.dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">{activityText}</p>
                      <p className="text-[10px] text-slate-400">{toDate(calc.date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  // History List with Search, Filter & Mobile Cards
  const renderHistoryList = (isDashboardView = false, calcsToRender: Calculation[]) => {
    const listToDisplay = calcsToRender.filter(c => {
      if (historyStatusFilter === 'ALL') return true;
      return c.status === historyStatusFilter;
    });

    return (
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">
              {isDashboardView ? 'Histórico Recente de Cálculos' : 'Todos os Acertos Semanais'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {listToDisplay.length} registo(s) encontrado(s)
            </p>
          </div>

          {/* Filter Pills */}
          {!isDashboardView && (
            <div className="flex p-0.5 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-bold">
              <button 
                type="button"
                onClick={() => setHistoryStatusFilter('ALL')}
                className={`px-2 py-1 rounded-md transition-colors ${historyStatusFilter === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Todos
              </button>
              <button 
                type="button"
                onClick={() => setHistoryStatusFilter(CalculationStatus.ACCEPTED)}
                className={`px-2 py-1 rounded-md transition-colors ${historyStatusFilter === CalculationStatus.ACCEPTED ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Aceites
              </button>
              <button 
                type="button"
                onClick={() => setHistoryStatusFilter(CalculationStatus.PENDING)}
                className={`px-2 py-1 rounded-md transition-colors ${historyStatusFilter === CalculationStatus.PENDING ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Pendentes
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 mb-4 text-xs text-rose-300 bg-rose-950/80 border border-rose-800 rounded-xl">
            <p className="font-bold">Erro: {error.split('Link:')[0]}</p>
          </div>
        )}

        {/* MOBILE VIEW: Cards empilhados de condutor */}
        <div className="md:hidden space-y-3">
          {loading ? (
            <p className="text-center py-6 text-slate-400 text-xs">A carregar registos...</p>
          ) : listToDisplay.length === 0 ? (
            <p className="text-center py-6 text-slate-400 text-xs">Nenhum cálculo encontrado.</p>
          ) : (
            listToDisplay.slice(0, isDashboardView ? 5 : undefined).map(calc => {
              const summary = calculateSummary(calc);
              const statusStyle = getStatusColor(calc.status);

              return (
                <div key={calc.id} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/30 flex items-center justify-center font-bold text-xs">
                        {calc.driverName.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-white text-xs">{calc.driverName}</p>
                        <p className="text-[10px] text-slate-400">
                          {toDate(calc.periodStart).toLocaleDateString('pt-PT')} a {toDate(calc.periodEnd).toLocaleDateString('pt-PT')}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border flex items-center gap-1.5 ${statusStyle.badge}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                      {calc.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400">Líquido a Pagar:</span>
                      <p className="font-black text-white">€{(summary.valorFinal || 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400">Tipo:</span>
                      <p className="font-bold text-slate-300">{calc.type}</p>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-3 text-xs border-t border-slate-800/80">
                    <button 
                      onClick={() => handleShowDetails(calc)} 
                      className="text-blue-400 hover:text-blue-300 font-bold"
                    >
                      Ver Detalhes
                    </button>
                    <button 
                      onClick={() => handleDelete(calc)} 
                      className="text-rose-400 hover:text-rose-300 font-medium"
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* DESKTOP VIEW: High-Craft Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-xs">
            <thead>
              <tr className="border-b border-slate-800">
                <th scope="col" className="py-3 px-4 text-left font-semibold text-slate-400 uppercase tracking-wider">Condutor</th>
                <th scope="col" className="py-3 px-4 text-left font-semibold text-slate-400 uppercase tracking-wider">Período</th>
                <th scope="col" className="py-3 px-4 text-left font-semibold text-slate-400 uppercase tracking-wider">Tipo</th>
                <th scope="col" className="py-3 px-4 text-right font-semibold text-slate-400 uppercase tracking-wider">Líquido</th>
                <th scope="col" className="py-3 px-4 text-left font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th scope="col" className="py-3 px-4 text-right font-semibold text-slate-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-400">A carregar acertos semanais...</td></tr>
              ) : listToDisplay.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-slate-400">Nenhum cálculo encontrado.</td></tr>
              ) : (
                listToDisplay.slice(0, isDashboardView ? 6 : undefined).map(calc => {
                  const summary = calculateSummary(calc);
                  const statusStyle = getStatusColor(calc.status);

                  return (
                    <tr key={calc.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/30 flex items-center justify-center font-bold text-[11px]">
                            {calc.driverName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-white">{calc.driverName}</p>
                            {calc.matricula && <p className="text-[10px] font-mono text-slate-400">{calc.matricula}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-300">
                        {toDate(calc.periodStart).toLocaleDateString('pt-PT')} a {toDate(calc.periodEnd).toLocaleDateString('pt-PT')}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-bold border border-slate-700">
                          {calc.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-right font-black text-white">
                        €{(summary.valorFinal || 0).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border inline-flex items-center gap-1.5 ${statusStyle.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                          {calc.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-right font-medium space-x-3">
                        <button 
                          onClick={() => handleShowDetails(calc)} 
                          className="text-blue-400 hover:text-blue-300 font-bold"
                        >
                          Ver Detalhes
                        </button>
                        <button 
                          onClick={() => handleDelete(calc)} 
                          className="text-rose-400 hover:text-rose-300 font-medium"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (view) {
      case 'dashboard': 
        return renderDashboardHome();
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
              <div className="flex items-center gap-2">
                <a 
                  href="/display" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/40 text-xs font-semibold flex items-center gap-1.5 hover:bg-blue-600/30 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Abrir /display no Tablet
                </a>
                <span className="text-xs text-slate-400 hidden sm:inline">Simulador Kiosk & Ativação de Encosto</span>
              </div>
            </div>
            <TabletDisplayRoute isStandaloneKiosk={false} onClose={() => setView('adtech')} />
          </div>
        );
      case 'saas_settings':
        return <SaasSettingsView />;
      case 'history': 
        return renderHistoryList(false, filteredCalculations);
      case 'reports': 
        return <ReportsView onBack={() => setView('dashboard')} />;
      case 'details':
        if (!selectedCalculation) return renderDashboardHome();
        return (
          <div>
            <Button onClick={() => { setView(fromView); setSelectedCalculation(null); }} className="mb-4">
              &larr; Voltar
            </Button>
            <CalculationView calculation={selectedCalculation} />
            <div className="mt-6 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex justify-center items-center gap-4 flex-wrap">
              <Button onClick={() => handleEdit(selectedCalculation)} variant="primary">
                Editar Cálculo
              </Button>
              <Button onClick={() => handleDelete(selectedCalculation)} variant="danger">
                Excluir Cálculo
              </Button>
            </div>
          </div>
        );
      case 'dispatch':
        return <FleetDispatchAdmin />;
      case 'rider_sim':
        return <RiderApp onBackToMain={() => setView('dispatch')} />;
      case 'iban': 
        return <IbanManagement />;
      case 'receipts': 
        return <ReceiptManagement />;
      case 'vehicles': 
        return <VehicleManagement />;
      case 'adjustments': 
        return <AdjustmentManagement />;
      case 'iva':
        return <IvaManagementView />;
      default: 
        return renderDashboardHome();
    }
  };

  const userInitials = user?.name ? user.name.substring(0, 2).toUpperCase() : 'AD';

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans pb-16 md:pb-0">
      
      {/* MOBILE DRAWER OVERLAY */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden transition-opacity" 
          onClick={() => setIsSidebarOpen(false)} 
        />
      )}

      {/* MOBILE SIDEBAR DRAWER */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 border-r border-slate-800 p-5 flex flex-col transform transition-transform duration-300 ease-in-out md:hidden ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <img 
              src={BRAND_LOGOS.MOBILE} 
              alt="ROTA TVDE" 
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-lg object-cover border border-slate-700 shadow-sm"
            />
            <div>
              <span className="text-xs font-black text-white tracking-tight block">ROTA TVDE 5.0</span>
              <span className="text-[9px] font-bold text-slate-400">Asfalto Cativante</span>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {renderSidebar(false, () => setIsSidebarOpen(false))}
      </aside>

      {/* DESKTOP COLLAPSIBLE SIDEBAR */}
      <aside 
        className={`hidden md:flex flex-col flex-shrink-0 bg-slate-900 border-r border-slate-800 p-4 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {renderSidebar(isCollapsed, () => {})}
      </aside>

      {/* MAIN VIEWPORT */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* DESKTOP & MOBILE TOP HEADER (VERCEL / STRIPE STANDARD) */}
        <header className="sticky top-0 z-30 h-16 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3">
          
          {isMobileSearchOpen ? (
            /* FULL-WIDTH MOBILE EXPANDABLE SEARCH BAR */
            <div className="flex-1 flex items-center gap-2 sm:hidden py-1 w-full animate-fadeIn">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  autoFocus
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder="Pesquisar condutor, matrícula..."
                  className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                />
                {globalSearch && (
                  <button
                    type="button"
                    onClick={() => setGlobalSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold p-1"
                  >
                    &times;
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setIsMobileSearchOpen(false)}
                className="px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 rounded-xl border border-slate-700 flex-shrink-0"
              >
                Fechar
              </button>
            </div>
          ) : (
            <>
              {/* Left: Mobile hamburger & Logo / Desktop collapse toggle */}
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <button 
                  type="button"
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white md:hidden focus:outline-none flex-shrink-0"
                  aria-label="Abrir menu lateral"
                >
                  <Menu className="w-5 h-5" />
                </button>

                {/* Mobile Header Logo */}
                <div className="flex md:hidden items-center gap-2 min-w-0">
                  <img 
                    src={BRAND_LOGOS.MOBILE} 
                    alt="ROTA TVDE 5.0" 
                    referrerPolicy="no-referrer"
                    className="w-7 h-7 rounded-lg object-cover border border-slate-700 shadow-sm flex-shrink-0"
                  />
                  <span className="text-sm font-bold text-white tracking-tight truncate">ROTA TVDE</span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex-shrink-0"
                  title={isCollapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
                >
                  {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>

                {/* Desktop & Tablet Search Bar */}
                <div className="hidden sm:block relative w-52 md:w-80">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    placeholder="Pesquisar condutor, matrícula... (⌘K)"
                    className="w-full pl-9 pr-7 py-1.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                  {globalSearch && (
                    <button
                      type="button"
                      onClick={() => setGlobalSearch('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
                    >
                      &times;
                    </button>
                  )}
                </div>
              </div>

              {/* Right Controls: Mobile Search Trigger, Fleet Selector, Firestore Indicator & User Avatar */}
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                {/* Mobile Search Button */}
                <button
                  type="button"
                  onClick={() => setIsMobileSearchOpen(true)}
                  className="sm:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white focus:outline-none"
                  aria-label="Pesquisar"
                  title="Pesquisar"
                >
                  <Search className="w-4 h-4" />
                </button>

                {/* Live Firestore Sync Status Indicator */}
                <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-950 border border-slate-800">
                  {!isDemo ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-bold text-emerald-300">Firestore Ativo</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span className="text-[10px] font-bold text-amber-300">Modo Demo</span>
                    </>
                  )}
                </div>

            {/* Fleet / Company Dropdown with Mobile Logo Icon */}
            <div className="relative" ref={fleetMenuRef}>
              <button
                type="button"
                onClick={() => setIsFleetMenuOpen(!isFleetMenuOpen)}
                className="hidden lg:flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors"
              >
                <img 
                  src={BRAND_LOGOS.MOBILE} 
                  alt="Frota" 
                  referrerPolicy="no-referrer"
                  className="w-5 h-5 rounded-md object-cover border border-slate-600 flex-shrink-0"
                />
                <span className="truncate max-w-[130px]">
                  {currentCompany?.tradeName || currentCompany?.name || 'Asfalto Cativante'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isFleetMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50">
                  <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Frota Ativa</p>
                  <div className="p-2 rounded-lg bg-blue-950/60 border border-blue-800/80 text-xs text-white flex items-center justify-between">
                    <span className="font-bold truncate">{currentCompany?.name || 'Asfalto Cativante'}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => { setView('saas_settings'); setIsFleetMenuOpen(false); }}
                      className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs text-slate-300 hover:bg-slate-800 flex items-center justify-between"
                    >
                      <span>Gerir Frotas SaaS</span>
                      <ExternalLink className="w-3 h-3 text-slate-500" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Avatar with Dropdown */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-slate-800 transition-colors focus:outline-none"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-md shadow-blue-600/30 border border-blue-400/30">
                  {userInitials}
                </div>
                <div className="hidden xl:block text-left">
                  <p className="text-xs font-bold text-white truncate max-w-[120px]">{user?.name}</p>
                  <p className="text-[10px] text-slate-400 leading-none">
                    {user?.role === UserRole.ADMIN ? 'Administrador' : user?.role === UserRole.MANAGER ? 'Gerente' : user?.role}
                  </p>
                </div>
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50">
                  <div className="px-3 py-2 border-b border-slate-800">
                    <p className="text-xs font-bold text-white">{user?.name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                    <span className="inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                      {user?.role === UserRole.ADMIN ? 'Administrador do Sistema' : 'Gerente Operacional'}
                    </span>
                  </div>

                  <div className="py-1">
                    <button
                      type="button"
                      onClick={() => { setView('saas_settings'); setIsUserMenuOpen(false); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      Definições da Conta
                    </button>
                    <button
                      type="button"
                      onClick={() => { setView('history'); setIsUserMenuOpen(false); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      Histórico Geral
                    </button>
                  </div>

                  <div className="pt-1 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => { setIsUserMenuOpen(false); logout(); }}
                      className="w-full text-left px-3 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors flex items-center justify-between"
                    >
                      <span>Terminar Sessão</span>
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
            </>
          )}
        </header>

        {/* MAIN BODY VIEW */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {renderContent()}
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR (PWA COMPLIANT) */}
      <div className="fixed bottom-0 inset-x-0 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 z-40 md:hidden flex justify-around items-center px-2 py-1 pb-safe">
        <button
          type="button"
          onClick={() => setView('dashboard')}
          className={`flex flex-col items-center justify-center min-h-[48px] py-1 px-2 rounded-xl flex-1 transition-all ${
            view === 'dashboard' ? 'text-blue-400 font-semibold bg-blue-500/10' : 'text-slate-400 hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] font-medium leading-tight">Início</span>
        </button>

        <button
          type="button"
          onClick={() => setView('history')}
          className={`flex flex-col items-center justify-center min-h-[48px] py-1 px-2 rounded-xl flex-1 relative transition-all ${
            view === 'history' ? 'text-blue-400 font-semibold bg-blue-500/10' : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileSpreadsheet className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] font-medium leading-tight">Acertos</span>
          {stats.pendingCount > 0 && (
            <span className="absolute top-1 right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px] flex items-center justify-center shadow-sm">
              {stats.pendingCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setView('driver_info')}
          className={`flex flex-col items-center justify-center min-h-[48px] py-1 px-2 rounded-xl flex-1 transition-all ${
            view === 'driver_info' || view === 'vehicles' ? 'text-blue-400 font-semibold bg-blue-500/10' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] font-medium leading-tight">Motoristas</span>
        </button>

        <button
          type="button"
          onClick={() => setView('saas_settings')}
          className={`flex flex-col items-center justify-center min-h-[48px] py-1 px-2 rounded-xl flex-1 transition-all ${
            view === 'saas_settings' ? 'text-blue-400 font-semibold bg-blue-500/10' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building2 className="w-5 h-5 mb-0.5" />
          <span className="text-[11px] font-medium leading-tight">Perfil</span>
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;
