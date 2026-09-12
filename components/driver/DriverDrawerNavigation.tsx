import React, { useState, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useCompany } from '../../hooks/useCompany';
import { MOCK_COMPANY_INFO } from '../../demoData';
import { 
  X, 
  ChevronRight, 
  Star, 
  Banknote, 
  Clock, 
  Gem, 
  Calendar, 
  Settings, 
  LogOut, 
  ShieldCheck, 
  FileText, 
  Tv, 
  Car, 
  Award,
  Sparkles,
  ExternalLink,
  Phone,
  CheckCircle2,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { DriverTab } from '../DriverDashboard';

interface DriverDrawerNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: DriverTab) => void;
  onOpenCampaigns?: () => void;
  onOpenScheduledRides?: () => void;
  onOpenRideHistory?: () => void;
}

export const DriverDrawerNavigation: React.FC<DriverDrawerNavigationProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onOpenCampaigns,
  onOpenScheduledRides,
  onOpenRideHistory,
}) => {
  const { user, logout, isDemo } = useAuth();
  const { currentCompany } = useCompany();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Swipe-to-close handling
  const touchStartX = useRef<number | null>(null);
  const touchDeltaX = useRef<number>(0);

  const companyName = currentCompany.tradeName || currentCompany.name || (isDemo ? MOCK_COMPANY_INFO.name : "ASFALTO CATIVANTE - UNIPESSOAL LDA");

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const currentX = e.touches[0].clientX;
    touchDeltaX.current = currentX - touchStartX.current;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current !== null && touchDeltaX.current < -50) {
      onClose();
    }
    touchStartX.current = null;
    touchDeltaX.current = 0;
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  // Avatar URL with high-contrast fallback
  const avatarUrl = (user as any)?.avatar_url || (user as any)?.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256";

  return (
    <>
      {/* 1. Backdrop Overlay */}
      <div 
        id="driver-drawer-overlay"
        onClick={onClose}
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* 2. Lateral Drawer Sheet */}
      <aside
        id="driver-drawer-sheet"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`fixed top-0 bottom-0 left-0 z-50 w-[85vw] max-w-sm bg-[#0B0F17] border-r border-slate-800 text-slate-100 flex flex-col shadow-2xl transition-transform duration-300 ease-out transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Close Button at the top right of the drawer */}
        <button
          id="btn-close-driver-drawer"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60 transition z-10 cursor-pointer"
          title="Fechar menu"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 no-scrollbar">
          
          {/* 1. CABEÇALHO DO PERFIL DO MOTORISTA */}
          <div className="space-y-4 pt-1">
            {/* Tag da Empresa no Topo (Pill transparente) */}
            <div>
              <button
                type="button"
                onClick={() => {
                  onSelectTab('profile');
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-850/80 hover:bg-slate-800 border border-slate-700/70 text-[11px] font-bold text-slate-300 hover:text-white transition tracking-tight group cursor-pointer max-w-full truncate"
              >
                <span className="truncate">{companyName}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 transition flex-shrink-0" />
              </button>
            </div>

            {/* Avatar + Informação Pessoal */}
            <div className="flex items-center gap-3.5">
              <div className="relative flex-shrink-0">
                <img 
                  src={avatarUrl} 
                  alt={user?.name || 'Motorista'} 
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    // Fallback to stylized initials if image fails
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                  className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500/60 shadow-lg"
                />
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 hidden items-center justify-center text-white font-black text-xl border-2 border-emerald-500 shadow-lg">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : 'TV'}
                </div>
                <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#0B0F17] shadow-sm" />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-base font-black text-white truncate tracking-tight">
                  {user?.name || 'Motorista TVDE'}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {user?.matricula || '45-TX-90'}
                  </span>
                  <span className="text-slate-600">•</span>
                  <button 
                    type="button"
                    onClick={() => {
                      onSelectTab('profile');
                      onClose();
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-md hover:bg-amber-900/60 transition cursor-pointer"
                  >
                    <Award className="w-3 h-3 text-amber-400" />
                    <span>Prata</span>
                    <ChevronRight className="w-2.5 h-2.5 text-amber-300" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 2. CARDS DE MÉTRICAS E DESEMPENHO (ESTILO UBER DRIVER) */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* Card 1: Pontuação */}
            <div className="bg-slate-850/70 border border-slate-800 rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-md">
              <span className="text-base font-black text-white tracking-tight">100%</span>
              <span className="text-[10px] font-semibold text-slate-400 mt-0.5 leading-tight">
                Pontuação
              </span>
            </div>

            {/* Card 2: Classificação em Estrelas */}
            <div className="bg-slate-850/70 border border-slate-800 rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-md">
              <div className="flex items-center gap-1 text-white font-black text-base">
                <span>4.80</span>
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              </div>
              <span className="text-[10px] font-semibold text-slate-400 mt-0.5 leading-tight">
                Classificação
              </span>
            </div>

            {/* Card 3: Taxa de Aceitação */}
            <div className="bg-slate-850/70 border border-slate-800 rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-md">
              <span className="text-base font-black text-emerald-400 tracking-tight">96%</span>
              <span className="text-[10px] font-semibold text-slate-400 mt-0.5 leading-tight">
                Aceitação
              </span>
            </div>
          </div>

          {/* 3. LISTA VERTICAL DE NAVEGAÇÃO E OPÇÕES */}
          <nav className="space-y-1 pt-1 border-t border-slate-800/80">
            {/* Ganhos */}
            <button
              id="drawer-item-earnings"
              type="button"
              onClick={() => {
                onSelectTab('calculations');
                onClose();
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-850 text-slate-200 hover:text-white transition group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-950/80 border border-purple-500/40 text-purple-400 flex items-center justify-center group-hover:scale-105 transition">
                  <Banknote className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-bold text-white block">Ganhos & Extratos</span>
                  <span className="text-[11px] text-slate-400">Calculadora 5.0 e acertos semanais</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 transition" />
            </button>

            {/* Histórico de viagens */}
            <button
              id="drawer-item-history"
              type="button"
              onClick={() => {
                if (onOpenRideHistory) {
                  onOpenRideHistory();
                } else {
                  onSelectTab('rides');
                }
                onClose();
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-850 text-slate-200 hover:text-white transition group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-950/80 border border-blue-500/40 text-blue-400 flex items-center justify-center group-hover:scale-105 transition">
                  <Clock className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-bold text-white block">Histórico de viagens</span>
                  <span className="text-[11px] text-slate-400">Serviços concluídos e detalhes</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition" />
            </button>

            {/* Campanhas */}
            <button
              id="drawer-item-campaigns"
              type="button"
              onClick={() => {
                if (onOpenCampaigns) {
                  onOpenCampaigns();
                } else {
                  onSelectTab('requirements');
                }
                onClose();
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-850 text-slate-200 hover:text-white transition group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-400 flex items-center justify-center group-hover:scale-105 transition">
                  <Gem className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-bold text-white block">Campanhas & Bónus</span>
                  <span className="text-[11px] text-slate-400">Metas ativas e monetização AdTech</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 transition" />
            </button>

            {/* Viagens agendadas */}
            <button
              id="drawer-item-scheduled"
              type="button"
              onClick={() => {
                if (onOpenScheduledRides) {
                  onOpenScheduledRides();
                } else {
                  onSelectTab('rides');
                }
                onClose();
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-850 text-slate-200 hover:text-white transition group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-950/80 border border-teal-500/40 text-teal-400 flex items-center justify-center group-hover:scale-105 transition">
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-bold text-white block">Viagens agendadas</span>
                  <span className="text-[11px] text-slate-400">Transfers de aeroporto e reservas</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-teal-400 transition" />
            </button>

            {/* Requisitos TVDE */}
            <button
              id="drawer-item-requirements"
              type="button"
              onClick={() => {
                onSelectTab('requirements');
                onClose();
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-850 text-slate-200 hover:text-white transition group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-bold text-white block">Requisitos & Viatura</span>
                  <span className="text-[11px] text-slate-400">Checklist legal e inspeção diária</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition" />
            </button>

            {/* Definições */}
            <button
              id="drawer-item-settings"
              type="button"
              onClick={() => {
                onSelectTab('profile');
                onClose();
              }}
              className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-850 text-slate-200 hover:text-white transition group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center group-hover:scale-105 transition">
                  <Settings className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-bold text-white block">Definições</span>
                  <span className="text-[11px] text-slate-400">Conta, IBAN e dados fiscais</span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition" />
            </button>
          </nav>

          {/* 4. LINKS ADICIONAIS & SUPORTE */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 px-3">
              <button 
                type="button"
                onClick={() => {
                  window.location.href = '/driver';
                  onClose();
                }}
                className="hover:text-slate-300 transition cursor-pointer"
              >
                Portal do motorista
              </button>
              <span>•</span>
              <a 
                href="#privacidade"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Política de Privacidade e Proteção de Dados TVDE em conformidade com o RGPD.");
                }}
                className="hover:text-slate-300 transition"
              >
                Privacidade
              </a>
              <span>•</span>
              <span className="text-slate-600 font-mono text-[10px]">v5.0</span>
            </div>

            {/* Terminar Sessão */}
            <button
              id="drawer-logout-btn"
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full py-3 px-3 rounded-2xl bg-red-950/30 hover:bg-red-950/60 border border-red-500/30 hover:border-red-500/50 text-red-400 hover:text-red-300 text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Terminar Sessão</span>
            </button>
          </div>

        </div>
      </aside>

      {/* Modal de Confirmação de Logout */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-500/40 text-red-400 mx-auto flex items-center justify-center">
              <LogOut className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-white">Terminar Sessão?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Deseja sair da sua conta de motorista? A sua localização ficará offline.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition cursor-pointer"
              >
                Sim, Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DriverDrawerNavigation;
