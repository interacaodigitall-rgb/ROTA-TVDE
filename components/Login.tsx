import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { BRAND_LOGOS } from '../constants';
import { useTabletPairing } from '../hooks/useTabletPairing';
import TabletDisplayRoute from './adtech/TabletDisplayRoute';
import { 
  ShieldCheck, 
  Sparkles, 
  Car, 
  Tv, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Building2, 
  Database,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  ChevronDown,
  Zap,
  KeyRound,
  X,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isQuickAccessOpen, setIsQuickAccessOpen] = useState(false);
  const [selectedProfileLabel, setSelectedProfileLabel] = useState<string | null>(null);
  
  // Ads / Tablet Modal States
  const [showAdsModal, setShowAdsModal] = useState(false);
  const [adsMatricula, setAdsMatricula] = useState('45-TX-90');
  const [adsValidationCode, setAdsValidationCode] = useState('ASFALTO2026');
  const [adsError, setAdsError] = useState<string | null>(null);
  const [adsLoading, setAdsLoading] = useState(false);
  const [launchedTablet, setLaunchedTablet] = useState(false);

  const { activateByMasterKey } = useTabletPairing();
  
  const quickAccessRef = useRef<HTMLDivElement>(null);
  const { login, error: authError } = useAuth();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (quickAccessRef.current && !quickAccessRef.current.contains(e.target as Node)) {
        setIsQuickAccessOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await login(email, password);
    setIsLoading(false);
  };

  const setCredentials = (em: string, pass: string, label: string) => {
    setEmail(em);
    setPassword(pass);
    setSelectedProfileLabel(label);
    setIsQuickAccessOpen(false);
  };

  const handleAdsActivationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdsError(null);
    if (!adsMatricula.trim()) {
      setAdsError('Insira a matrícula da viatura.');
      return;
    }
    if (!adsValidationCode.trim()) {
      setAdsError('Insira o código de validação do motorista ou código mestre.');
      return;
    }

    setAdsLoading(true);
    const res = await activateByMasterKey({
      masterKey: adsValidationCode.trim().toUpperCase(),
      matricula: adsMatricula.trim().toUpperCase()
    });
    setAdsLoading(false);

    if (res.success) {
      setShowAdsModal(false);
      setLaunchedTablet(true);
    } else {
      setAdsError(res.error || 'Falha ao validar a matrícula ou código de validação.');
    }
  };

  if (launchedTablet) {
    return (
      <TabletDisplayRoute 
        onClose={() => setLaunchedTablet(false)} 
        isStandaloneKiosk={true}
      />
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col lg:grid lg:grid-cols-2 bg-slate-950 text-slate-100 font-sans">
      {/* LEFT PANE: Enterprise Hero & Branding (Logo Principal Desktop) */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 xl:p-16 overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 border-r border-slate-800/80">
        {/* Background glow meshes */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Top Branding with Official Desktop Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-xl backdrop-blur-md">
              <img 
                src={BRAND_LOGOS.DESKTOP} 
                alt="Asfalto Cativante - ROTA TVDE 5.0" 
                referrerPolicy="no-referrer"
                className="h-12 w-auto object-contain max-w-[200px]"
                onError={(e) => {
                  // Fallback to text badge if network error occurs
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-white">ROTA TVDE</span>
                <span className="px-2 py-0.5 rounded-md bg-blue-500/20 border border-blue-400/40 text-blue-300 text-xs font-bold">5.0</span>
              </div>
              <p className="text-xs text-slate-400 font-medium tracking-wide">Plataforma Integrada Operacional & AdTech TVDE</p>
            </div>
          </div>
        </div>

        {/* Center Highlights */}
        <div className="relative z-10 my-auto py-10 space-y-8 max-w-lg">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold mb-4 shadow-lg shadow-emerald-950/40">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Sincronização em Tempo Real Firestore
            </div>
            <h1 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight tracking-tight">
              Gestão Financeira, Frota & Monetização Inteligente para TVDE
            </h1>
            <p className="mt-3 text-slate-300 text-sm leading-relaxed">
              Solução completa para operadores de frotas TVDE em Portugal. Automatize acertos semanais da Uber e Bolt, controle combustíveis e portagens e gere receita adicional com tablets de publicidade embarcada.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <div className="flex items-center gap-2.5 text-blue-400 font-bold text-xs mb-1">
                <Car className="w-4 h-4" />
                <span>Cálculos Slot & %</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Algoritmos validados com deduções de combustível, Via Verde e caução com IVA 6%.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-xs mb-1">
                <Tv className="w-4 h-4" />
                <span>AdTech Embarcada</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Tablets nos veículos com distribuição de anúncios e bónus para motoristas e frota.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <div className="flex items-center gap-2.5 text-purple-400 font-bold text-xs mb-1">
                <FileCheck2 className="w-4 h-4" />
                <span>Importação CSV/PDF</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Reconciliação automática de extratos bancários, Prio, Galp e Via Verde.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
              <div className="flex items-center gap-2.5 text-amber-400 font-bold text-xs mb-1">
                <TrendingUp className="w-4 h-4" />
                <span>Multi-Tenant SaaS</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Gestão isolada de múltiplas empresas e frotas parceiras com minutas contratuais.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Trust Badges */}
        <div className="relative z-10 pt-6 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              SSL 256-bit Seguro
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <Database className="w-4 h-4 text-blue-400" />
              Firebase Cloud
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Frota Padrão: <strong className="text-slate-200">Asfalto Cativante</strong></span>
          </div>
        </div>
      </div>

      {/* RIGHT PANE: Modern Form & Fast Profile Selectors */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-12 xl:p-16 bg-slate-950 relative">
        <div className="w-full max-w-md space-y-6">
          
          {/* Mobile Header with Official Mobile Logo */}
          <div className="lg:hidden text-center space-y-2 mb-6">
            <div className="inline-block p-1 bg-slate-900 rounded-2xl border border-slate-800 shadow-xl mx-auto">
              <img 
                src={BRAND_LOGOS.MOBILE} 
                alt="ROTA TVDE 5.0" 
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-xl object-cover shadow-md"
              />
            </div>
            <h1 className="text-2xl font-extrabold text-white">ROTA TVDE 5.0</h1>
            <p className="text-xs text-slate-400">Plataforma Enterprise de Gestão de Frotas TVDE & AdTech</p>
          </div>

          {/* Login Card */}
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-7 sm:p-8 shadow-2xl relative overflow-visible">
            
            {/* Header with Title & Discreet Dropdown for Quick Access */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">Iniciar Sessão</h2>
                <p className="text-xs text-slate-400 mt-0.5">Introduza as credenciais para aceder ao sistema.</p>
              </div>

              {/* DISCREET QUICK ACCESS DROPDOWN MENU */}
              <div className="relative" ref={quickAccessRef}>
                <button
                  type="button"
                  onClick={() => setIsQuickAccessOpen(!isQuickAccessOpen)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700/80 hover:border-blue-500/50 text-slate-300 hover:text-white text-xs font-semibold shadow-sm transition-all focus:outline-none"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Acesso Rápido de Teste</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isQuickAccessOpen ? 'rotate-180' : ''}`} />
                </button>

                {isQuickAccessOpen && (
                  <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900 border border-slate-700/90 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-2 py-1 mb-2 border-b border-slate-800">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Selecionar Perfil de Teste</p>
                    </div>

                    {/* Modo Real */}
                    <div className="mb-3 space-y-1">
                      <div className="px-2 py-0.5 text-[9px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Modo Real (Firestore)
                      </div>
                      <button
                        type="button"
                        onClick={() => setCredentials('adm@tvdecheck.pt', '0123456789', 'Administrador Real')}
                        className="w-full px-2.5 py-1.5 rounded-xl hover:bg-slate-800/90 text-left transition-colors flex items-center justify-between group"
                      >
                        <div>
                          <p className="text-xs font-bold text-white group-hover:text-emerald-300">Administrador Real</p>
                          <p className="text-[10px] text-slate-400">adm@tvdecheck.pt</p>
                        </div>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">Admin</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCredentials('gerente@tvdecheck.pt', '0123456789', 'Gerente Operacional')}
                        className="w-full px-2.5 py-1.5 rounded-xl hover:bg-slate-800/90 text-left transition-colors flex items-center justify-between group"
                      >
                        <div>
                          <p className="text-xs font-bold text-white group-hover:text-indigo-300">Gerente Operacional</p>
                          <p className="text-[10px] text-slate-400">gerente@tvdecheck.pt</p>
                        </div>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">Frota</span>
                      </button>
                    </div>

                    {/* Modo Demonstração */}
                    <div className="pt-2 border-t border-slate-800 space-y-1">
                      <div className="px-2 py-0.5 text-[9px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                        Modo Demonstração
                      </div>
                      <button
                        type="button"
                        onClick={() => setCredentials('demoad@rotatvde.pt', 'Minharotatvde', 'Demo Admin')}
                        className="w-full px-2.5 py-1.5 rounded-xl hover:bg-slate-800/90 text-left transition-colors flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs font-bold text-white">Demo Admin Geral</p>
                          <p className="text-[10px] text-slate-400">demoad@rotatvde.pt</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCredentials('demofr@rotatvde.pt', '0123456', 'Demo Frota %')}
                        className="w-full px-2.5 py-1.5 rounded-xl hover:bg-slate-800/90 text-left transition-colors flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs font-bold text-white">Demo Frota (Percentagem)</p>
                          <p className="text-[10px] text-slate-400">demofr@rotatvde.pt</p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCredentials('demosl@rotatvde.pt', '0123456', 'Demo Slot')}
                        className="w-full px-2.5 py-1.5 rounded-xl hover:bg-slate-800/90 text-left transition-colors flex items-center justify-between"
                      >
                        <div>
                          <p className="text-xs font-bold text-white">Demo Slot (Aluguer Fixo)</p>
                          <p className="text-[10px] text-slate-400">demosl@rotatvde.pt</p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Selected Profile Notification Badge */}
            {selectedProfileLabel && (
              <div className="mb-4 px-3 py-1.5 rounded-xl bg-blue-950/60 border border-blue-800/80 text-blue-300 text-xs flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Perfil preenchido: <strong>{selectedProfileLabel}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedProfileLabel(null)}
                  className="text-slate-400 hover:text-white text-xs font-bold"
                >
                  &times;
                </button>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Email de Acesso
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="ex: utilizador@tvdecheck.pt"
                    className="w-full px-3.5 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label htmlFor="password" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Palavra-passe
                  </label>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••••••"
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-950/70 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/40 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 focus:outline-none cursor-pointer"
                    aria-label={showPassword ? "Ocultar palavra-passe" : "Mostrar palavra-passe"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs font-medium">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    A autenticar...
                  </span>
                ) : (
                  <>
                    <span>Entrar na Plataforma</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* SEPARATOR */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900 px-3 text-slate-400 font-semibold">Instalação na Viatura</span>
              </div>
            </div>

            {/* ANÚNCIOS / TABLET BUTTON REQUESTED BY USER */}
            <button
              type="button"
              onClick={() => setShowAdsModal(true)}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600/90 to-indigo-600/90 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2.5 transition-all border border-purple-400/30 cursor-pointer"
            >
              <Tv className="w-4 h-4 text-purple-200" />
              <span>🎬 Anúncios (Modo Tablet / Encosto)</span>
            </button>
          </div>

          <div className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-2">
            <span>ROTA TVDE 5.0 Enterprise</span>
            <span>•</span>
            <span className="text-slate-400">Conforme Legislação TVDE & IVA 6%</span>
          </div>
        </div>
      </div>

      {/* MODAL DE ATIVAÇÃO DE ANÚNCIOS NO TABLET (MATRÍCULA + CÓDIGO DE VALIDAÇÃO) */}
      {showAdsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl text-slate-100 relative animate-fadeIn space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-500/20 text-purple-400 rounded-xl border border-purple-500/30">
                  <Tv className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-lg">Ativação de Anúncios no Tablet</h3>
                  <p className="text-xs text-slate-400">Vincular ecrã de encosto à viatura e motorista</p>
                </div>
              </div>
              <button 
                onClick={() => { setShowAdsModal(false); setAdsError(null); }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Error Banner */}
            {adsError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <span>{adsError}</span>
              </div>
            )}

            {/* Modal Form */}
            <form onSubmit={handleAdsActivationSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-emerald-400" />
                  Matrícula da Viatura (ex: 45-TX-90)
                </label>
                <input
                  type="text"
                  value={adsMatricula}
                  onChange={(e) => setAdsMatricula(e.target.value.toUpperCase())}
                  placeholder="00-AA-00"
                  maxLength={8}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-base font-bold tracking-wider focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 uppercase"
                  required
                  autoFocus
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  O sistema identificará automaticamente o motorista atualmente afeto a esta viatura.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                  Código de Validação / PIN do Motorista
                </label>
                <input
                  type="password"
                  value={adsValidationCode}
                  onChange={(e) => setAdsValidationCode(e.target.value)}
                  placeholder="PIN pessoal ou Código Mestre (ex: ASFALTO2026)"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-sm tracking-wider focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Insira o seu código pessoal de motorista ou o código mestre fornecido pela frota.
                </p>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowAdsModal(false)}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition border border-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={adsLoading}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {adsLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>A validar...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Iniciar Anúncios</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
