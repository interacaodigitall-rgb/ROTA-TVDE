import React, { useState, useEffect } from 'react';
import { 
  Tv, 
  KeyRound, 
  QrCode, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Car, 
  Tablet, 
  ShieldCheck, 
  Wifi, 
  Battery, 
  Sparkles, 
  HelpCircle, 
  ArrowRight, 
  Smartphone,
  Info
} from 'lucide-react';
import { BRAND_LOGOS } from '../../constants';

interface TabletActivationProps {
  pendingPin: string;
  pinTimeLeft: number;
  loading: boolean;
  error: string | null;
  isOnline: boolean;
  onActivateByMasterKey: (data: { masterKey: string; matricula: string; tabletModel?: string }) => Promise<{ success: boolean; error?: string }>;
  onGenerateNewPin: () => void;
  fleetMatriculas?: string[];
  defaultMasterKey?: string;
  onExitPreview?: () => void;
}

export const TabletActivation: React.FC<TabletActivationProps> = ({
  pendingPin,
  pinTimeLeft,
  loading,
  error: initialError,
  isOnline,
  onActivateByMasterKey,
  onGenerateNewPin,
  fleetMatriculas = ['45-TX-90', '82-QA-14', '19-ZZ-03', '61-MR-77', '34-AB-12'],
  defaultMasterKey = 'ASFALTO2026',
  onExitPreview
}) => {
  const [activeTab, setActiveTab] = useState<'MASTER_KEY' | 'PIN_QR'>('MASTER_KEY');
  const [masterKey, setMasterKey] = useState<string>(defaultMasterKey);
  const [matricula, setMatricula] = useState<string>('45-TX-90');
  const [tabletModel, setTabletModel] = useState<string>(() => {
    if (/Android/i.test(navigator.userAgent)) return 'Samsung Galaxy Tab A9+ 11" 5G';
    if (/iPad/i.test(navigator.userAgent)) return 'Apple iPad 10.9" Encosto';
    return 'Tablet TVDE Kiosk AdTech 11"';
  });
  const [localError, setLocalError] = useState<string | null>(initialError);
  const [showKeyHint, setShowKeyHint] = useState<boolean>(false);

  // Generate PIN on mount if in PIN tab and none exists
  useEffect(() => {
    if (!pendingPin) {
      onGenerateNewPin();
    }
  }, [pendingPin, onGenerateNewPin]);

  const handleMatriculaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    // Auto-format XX-XX-XX
    const clean = val.replace(/-/g, '');
    if (clean.length > 2 && clean.length <= 4) {
      val = `${clean.slice(0, 2)}-${clean.slice(2)}`;
    } else if (clean.length > 4) {
      val = `${clean.slice(0, 2)}-${clean.slice(2, 4)}-${clean.slice(4, 6)}`;
    }
    setMatricula(val);
  };

  const handleMasterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (!masterKey.trim()) {
      setLocalError('Insira o Código Mestre da Frota.');
      return;
    }
    if (!matricula.trim() || matricula.length < 6) {
      setLocalError('Insira uma matrícula válida (ex: 00-AA-00).');
      return;
    }

    const res = await onActivateByMasterKey({
      masterKey: masterKey.trim().toUpperCase(),
      matricula: matricula.trim().toUpperCase(),
      tabletModel
    });

    if (!res.success && res.error) {
      setLocalError(res.error);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex flex-col justify-between overflow-y-auto font-sans select-none">
      {/* Top Brand Bar */}
      <header className="w-full px-6 py-4 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <img 
            src={BRAND_LOGOS.MOBILE} 
            alt="ROTA TVDE" 
            referrerPolicy="no-referrer"
            className="w-8 h-8 rounded-lg object-cover border border-slate-700 shadow-md"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-white tracking-wide">ROTA TVDE 5.0</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                AdTech Kiosk
              </span>
            </div>
            <p className="text-xs text-slate-400">Módulo de Ativação e Emparelhamento de Tablets</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-300">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
            isOnline ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
            {isOnline ? 'Conectado (Firestore Online)' : 'Sem Ligação à Internet'}
          </span>

          {onExitPreview && (
            <button
              onClick={onExitPreview}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 text-xs transition"
            >
              Fechar Ecrã
            </button>
          )}
        </div>
      </header>

      {/* Main Activation Container */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 max-w-4xl mx-auto w-full">
        <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-10 backdrop-blur-xl">
          
          {/* Header */}
          <div className="text-center max-w-xl mx-auto mb-8">
            <div className="inline-flex p-3 rounded-2xl bg-blue-500/10 text-blue-400 mb-3 border border-blue-500/20">
              <Tablet className="w-8 h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Ativação do Tablet de Encosto
            </h1>
            <p className="text-slate-400 text-sm mt-1.5">
              Vincule este dispositivo ao veículo da frota para iniciar a transmissão de publicidade e acumulação de bónus.
            </p>
          </div>

          {/* Dual Method Tabs */}
          <div className="flex p-1.5 bg-slate-950/80 rounded-xl border border-slate-800 max-w-lg mx-auto mb-8">
            <button
              type="button"
              onClick={() => { setActiveTab('MASTER_KEY'); setLocalError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs sm:text-sm font-semibold transition ${
                activeTab === 'MASTER_KEY'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              <span>Código Mestre (Instalador)</span>
            </button>

            <button
              type="button"
              onClick={() => { setActiveTab('PIN_QR'); setLocalError(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs sm:text-sm font-semibold transition ${
                activeTab === 'PIN_QR'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>PIN / QR Code (Painel PC)</span>
            </button>
          </div>

          {/* Feedback error banner */}
          {(localError || initialError) && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3 animate-fadeIn">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-400" />
              <div className="flex-1">
                <span className="font-semibold block">Erro de Ativação:</span>
                <span>{localError || initialError}</span>
              </div>
            </div>
          )}

          {/* TAB 1: Master Key + Matricula */}
          {activeTab === 'MASTER_KEY' && (
            <form onSubmit={handleMasterSubmit} className="space-y-6 max-w-lg mx-auto">
              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80 text-xs text-slate-400 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Modo Recomendado:</strong> Permite ao instalador ou gestor ativar o tablet no carro em menos de 10 segundos sem precisar de abrir o computador.
                </span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-blue-400" />
                    Código Mestre da Frota (Master Key)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowKeyHint(!showKeyHint)}
                    className="text-[11px] text-blue-400 hover:underline"
                  >
                    {showKeyHint ? 'Ocultar' : 'Ver Padrão'}
                  </button>
                </div>
                <input
                  type="text"
                  value={masterKey}
                  onChange={(e) => setMasterKey(e.target.value.toUpperCase())}
                  placeholder="ex: ASFALTO2026"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-base tracking-wider focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 uppercase"
                  required
                />
                {showKeyHint && (
                  <p className="mt-1.5 text-xs text-slate-400">
                    Código padrão da empresa: <strong className="text-white font-mono">{defaultMasterKey}</strong> (definido nas Configurações da Empresa).
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <Car className="w-3.5 h-3.5 text-emerald-400" />
                  Matrícula do Veículo TVDE
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={matricula}
                    onChange={handleMatriculaChange}
                    maxLength={8}
                    placeholder="00-AA-00"
                    className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-lg font-bold tracking-widest focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 uppercase"
                    required
                  />
                  <div className="absolute right-3 top-3 text-xs text-slate-500 font-mono">
                    PT-PT
                  </div>
                </div>

                {fleetMatriculas.length > 0 && (
                  <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-slate-400">Sugestões da Frota:</span>
                    {fleetMatriculas.slice(0, 4).map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMatricula(m)}
                        className={`text-xs px-2 py-0.5 rounded border transition font-mono ${
                          matricula === m
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                  <Tablet className="w-3.5 h-3.5 text-purple-400" />
                  Modelo do Tablet Detectado
                </label>
                <input
                  type="text"
                  value={tabletModel}
                  onChange={(e) => setTabletModel(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-300 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold text-base shadow-xl flex items-center justify-center gap-2 transition active:scale-[0.99]"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>A validar com o servidor...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    <span>Ativar e Iniciar Transmissão</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: Standby PIN / QR Code Mode */}
          {activeTab === 'PIN_QR' && (
            <div className="max-w-md mx-auto text-center space-y-6">
              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80 text-xs text-slate-400 flex items-start gap-2.5 text-left">
                <Smartphone className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <span>
                  Abra o <strong>Painel de Gestão (PC) &gt; AdTech &gt; Associar Tablet</strong> e insira o código PIN de 6 dígitos abaixo. A ativação ocorrerá automaticamente em tempo real!
                </span>
              </div>

              {/* Big PIN Box */}
              <div className="py-6 px-4 bg-slate-950 border-2 border-blue-500/50 rounded-2xl shadow-inner relative overflow-hidden">
                <div className="absolute top-2 right-3 flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                  <span>Expira em:</span>
                  <strong className="text-amber-400">{formatSeconds(pinTimeLeft)}</strong>
                </div>

                <p className="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-2">
                  Código de Emparelhamento
                </p>
                <div className="text-4xl sm:text-5xl font-extrabold text-white tracking-widest font-mono select-all">
                  {pendingPin || '--- ---'}
                </div>

                {/* Animated status indicator */}
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-blue-400 font-medium">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
                  </span>
                  <span>A aguardar validação no Painel do Gestor...</span>
                </div>
              </div>

              {/* QR Code Container */}
              <div className="bg-white p-4 rounded-2xl inline-block shadow-xl mx-auto">
                <div className="w-36 h-36 flex flex-col items-center justify-center text-slate-950">
                  <svg className="w-full h-full" viewBox="0 0 100 100" fill="currentColor">
                    <rect x="5" y="5" width="28" height="28" fill="black" />
                    <rect x="9" y="9" width="20" height="20" fill="white" />
                    <rect x="13" y="13" width="12" height="12" fill="black" />
                    
                    <rect x="67" y="5" width="28" height="28" fill="black" />
                    <rect x="71" y="9" width="20" height="20" fill="white" />
                    <rect x="75" y="13" width="12" height="12" fill="black" />
                    
                    <rect x="5" y="67" width="28" height="28" fill="black" />
                    <rect x="9" y="71" width="20" height="20" fill="white" />
                    <rect x="13" y="75" width="12" height="12" fill="black" />
                    
                    {/* Data modules */}
                    <rect x="40" y="8" width="6" height="6" fill="black" />
                    <rect x="50" y="8" width="6" height="6" fill="black" />
                    <rect x="40" y="20" width="6" height="6" fill="black" />
                    <rect x="52" y="22" width="6" height="6" fill="black" />
                    <rect x="40" y="40" width="8" height="8" fill="black" />
                    <rect x="52" y="40" width="8" height="8" fill="black" />
                    <rect x="40" y="52" width="8" height="8" fill="black" />
                    <rect x="52" y="52" width="8" height="8" fill="black" />
                    <rect x="8" y="40" width="6" height="6" fill="black" />
                    <rect x="20" y="40" width="6" height="6" fill="black" />
                    <rect x="72" y="40" width="6" height="6" fill="black" />
                    <rect x="84" y="40" width="6" height="6" fill="black" />
                    <rect x="40" y="72" width="6" height="6" fill="black" />
                    <rect x="52" y="72" width="6" height="6" fill="black" />
                    <rect x="68" y="68" width="8" height="8" fill="black" />
                    <rect x="80" y="80" width="12" height="12" fill="black" />
                  </svg>
                </div>
                <p className="text-[10px] text-slate-600 font-mono mt-1 font-semibold">
                  PIN: {pendingPin}
                </p>
              </div>

              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={onGenerateNewPin}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition border border-slate-700"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Gerar Novo PIN</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer Diagnostic Bar */}
      <footer className="w-full px-6 py-3 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span>Resolução: {window.innerWidth} &times; {window.innerHeight}</span>
          <span className="hidden sm:inline">Dispositivo: {tabletModel}</span>
        </div>
        <div className="flex items-center gap-4 font-mono">
          <span>Versão: ROTA-AD-5.0</span>
          <span className="flex items-center gap-1 text-slate-300">
            <Battery className="w-3.5 h-3.5 text-emerald-400" /> 98%
          </span>
        </div>
      </footer>
    </div>
  );
};
