import React, { useState, useEffect, useRef } from 'react';
import { useAdTech } from '../../hooks/useAdTech';
import { AdCampaign } from '../../types';
import { BRAND_LOGOS } from '../../constants';
import { 
  Tv, 
  Wifi, 
  WifiOff,
  Battery, 
  BatteryCharging, 
  QrCode, 
  ExternalLink, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  X, 
  Sparkles, 
  ShieldCheck, 
  Sun,
  CheckCircle2,
  Lock,
  RefreshCw,
  LogOut,
  Car,
  UserCheck,
  AlertTriangle
} from 'lucide-react';

interface PassengerTabletPlayerProps {
  onClose?: () => void;
  matricula?: string;
  driverName?: string;
  driverPhoto?: string;
  tabletId?: string;
  driverId?: string;
  companyName?: string;
  onUnpairTablet?: () => void;
  isStandaloneKiosk?: boolean;
}

export const PassengerTabletPlayer: React.FC<PassengerTabletPlayerProps> = ({ 
  onClose, 
  matricula = 'FROTA-001', 
  driverName = 'Motorista Parceiro',
  driverPhoto,
  tabletId,
  driverId,
  companyName = 'Asfalto Cativante',
  onUnpairTablet,
  isStandaloneKiosk = false
}) => {
  const { activeCampaigns, recordImpression, recordScan, devices } = useAdTech();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scanSuccessFeedback, setScanSuccessFeedback] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }));
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [adminPinError, setAdminPinError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Network listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const campaignsList: AdCampaign[] = activeCampaigns.length > 0 ? activeCampaigns : [
    {
      id: 'default-camp-1',
      title: 'Descontos Exclusivos em Lisboa & Porto',
      advertiser: 'ROTA TVDE Partners',
      category: 'Mobilidade',
      mediaUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1600&auto=format&fit=crop&q=80',
      mediaType: 'image',
      targetUrl: 'https://asfaltocativante.pt',
      qrCodeData: 'https://asfaltocativante.pt/promo',
      status: 'ACTIVE',
      impressions: 120,
      scans: 15,
      revenue: 7.5,
      cpm: 18,
      scanReward: 0.6,
      startDate: new Date(),
      endDate: new Date(),
      callToAction: 'Aponte a câmara do telemóvel para obter até 25% de desconto',
      driverBonusRate: 30
    },
    {
      id: 'default-camp-2',
      title: 'Prio Go: Carregamentos Elétricos e Combustível',
      advertiser: 'PRIO Energy',
      category: 'Energia',
      mediaUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=1600&auto=format&fit=crop&q=80',
      mediaType: 'image',
      targetUrl: 'https://prio.pt',
      qrCodeData: 'https://prio.pt/app',
      status: 'ACTIVE',
      impressions: 240,
      scans: 32,
      revenue: 16.0,
      cpm: 20,
      scanReward: 0.5,
      startDate: new Date(),
      endDate: new Date(),
      callToAction: 'Instale a app e ganhe 5€ no primeiro abastecimento',
      driverBonusRate: 30
    }
  ];

  const currentCampaign = campaignsList[currentIdx % campaignsList.length];

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Impression tracking & auto-looping
  useEffect(() => {
    if (!currentCampaign) return;
    
    // Register impression in Firestore
    recordImpression(currentCampaign.id, tabletId, matricula, driverId);
    setProgress(0);

    const stepInterval = 100;
    const totalDuration = currentCampaign.mediaType === 'video' ? 15000 : 10000;

    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          setCurrentIdx(curr => (curr + 1) % campaignsList.length);
          return 0;
        }
        return prev + (stepInterval / totalDuration) * 100;
      });
    }, stepInterval);

    return () => clearInterval(progressTimer);
  }, [currentCampaign?.id, tabletId, matricula, driverId, campaignsList.length, recordImpression]);

  // Handle Interactive Scan
  const handleSimulateScan = () => {
    if (!currentCampaign) return;
    recordScan(currentCampaign.id, tabletId, matricula, driverId);
    const bonusEarned = (currentCampaign.scanReward * ((currentCampaign.driverBonusRate || 30) / 100)).toFixed(2);
    setScanSuccessFeedback(`QR Code lido com sucesso! Bónus de +${bonusEarned}€ creditado a ${driverName}.`);
    setTimeout(() => {
      setScanSuccessFeedback(null);
    }, 4500);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleAdminUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPinInput === '2026' || adminPinInput === '1234') {
      setAdminUnlocked(true);
      setAdminPinError(false);
    } else {
      setAdminPinError(true);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 bg-black flex flex-col justify-between select-none overflow-hidden font-sans ${
      isStandaloneKiosk ? 'p-0' : 'p-2 sm:p-4 bg-black/95'
    }`}>
      {/* Simulation preview bar if NOT standalone */}
      {!isStandaloneKiosk && (
        <div className="w-full max-w-6xl mx-auto flex items-center justify-between px-4 py-2 bg-slate-900/90 border border-slate-700/80 rounded-t-xl text-slate-300 text-xs sm:text-sm backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Tablet de Encosto em Transmissão
            </span>
            <span className="hidden sm:inline text-slate-400">
              Viatura: <strong className="text-white font-mono">{matricula}</strong> | Condutor: <strong className="text-white">{driverName}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentIdx(prev => (prev - 1 + campaignsList.length) % campaignsList.length)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-600 text-xs"
              title="Anúncio Anterior"
            >
              &larr; Anterior
            </button>
            <button
              onClick={() => setCurrentIdx(prev => (prev + 1) % campaignsList.length)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-600 text-xs"
              title="Próximo Anúncio"
            >
              Próximo &rarr;
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-600"
              title="Ecrã Completo"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 bg-rose-600/90 hover:bg-rose-500 text-white rounded font-bold"
                title="Sair do Modo Tablet"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Tablet Display Area */}
      <div className={`relative w-full ${
        isStandaloneKiosk ? 'h-full flex-1' : 'max-w-6xl mx-auto h-[85vh] max-h-[760px] rounded-b-xl border-x border-b border-slate-800'
      } bg-slate-950 shadow-2xl overflow-hidden flex flex-col justify-between`}>

        {/* Top Kiosk Status & Driver Sync Bar */}
        <div className="h-14 bg-gradient-to-b from-black/95 via-black/80 to-transparent px-6 flex items-center justify-between text-white text-xs z-30">
          
          {/* Left: Fleet Logo & Dynamic Driver Badge */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800/80 backdrop-blur-md">
              <img 
                src={BRAND_LOGOS.MOBILE} 
                alt="ROTA TVDE" 
                referrerPolicy="no-referrer"
                className="w-6 h-6 rounded-md object-cover border border-slate-700"
              />
              <span className="font-extrabold text-blue-400 tracking-wider text-xs uppercase hidden sm:inline">
                {companyName}
              </span>
            </div>

            {/* Dynamic Active Driver Synchronized from Fleet Database */}
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl backdrop-blur-md">
              {driverPhoto ? (
                <img 
                  src={driverPhoto} 
                  alt={driverName} 
                  referrerPolicy="no-referrer"
                  className="w-6 h-6 rounded-full object-cover border border-emerald-400"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                  <UserCheck className="w-3.5 h-3.5" />
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-300 font-medium">Ao seu dispor</span>
                <span className="text-xs font-bold text-white leading-none truncate max-w-[140px] sm:max-w-[180px]">
                  {driverName}
                </span>
              </div>
              <span className="ml-1 text-[11px] font-mono bg-slate-900/90 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                {matricula}
              </span>
            </div>
          </div>

          {/* Right: Weather, Realtime Clock, Network, Battery & Kiosk Menu */}
          <div className="flex items-center gap-4 text-slate-300">
            <span className="hidden md:flex items-center gap-1.5 text-slate-300">
              <Sun className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-white">22°C</span> Lisboa
            </span>

            <span className="font-mono font-bold text-base tracking-wider text-white">
              {currentTime}
            </span>

            <span className={`flex items-center gap-1 text-xs font-semibold ${isOnline ? 'text-emerald-400' : 'text-rose-400'}`}>
              {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span className="hidden sm:inline">{isOnline ? '5G' : 'Offline'}</span>
            </span>

            <span className="flex items-center gap-1 text-slate-300 text-xs">
              <BatteryCharging className="w-4 h-4 text-emerald-400" /> 98%
            </span>

            {/* Secret Kiosk Admin Trigger */}
            <button
              onClick={() => setShowAdminMenu(true)}
              className="p-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white transition border border-slate-800"
              title="Menu do Instalador / Kiosk"
            >
              <Lock className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Media Background Layer (Video or Image) */}
        <div className="absolute inset-0 z-0 bg-black">
          {currentCampaign?.mediaType === 'video' ? (
            <video
              ref={videoRef}
              src={currentCampaign.mediaUrl}
              autoPlay
              loop
              muted={isMuted}
              playsInline
              className="w-full h-full object-cover brightness-75 contrast-105"
            />
          ) : (
            <img 
              src={currentCampaign?.mediaUrl} 
              alt={currentCampaign?.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover brightness-75 contrast-105 transition-all duration-1000 scale-100 hover:scale-105"
            />
          )}
          {/* Subtle gradient vignette to guarantee readability of overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/60 pointer-events-none" />
        </div>

        {/* Scan Success Overlay Toast */}
        {scanSuccessFeedback && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-emerald-600 text-white px-6 py-3.5 rounded-full shadow-2xl flex items-center gap-3 border border-emerald-400 backdrop-blur-lg animate-bounce">
            <CheckCircle2 className="w-6 h-6 text-white flex-shrink-0" />
            <span className="text-sm font-bold tracking-wide">{scanSuccessFeedback}</span>
          </div>
        )}

        {/* Middle Interactive Zone */}
        <div className="relative z-10 p-6 sm:p-10 flex flex-col justify-end h-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            
            {/* Left 2 Columns: Ad Info & Sponsor Brand */}
            <div className="md:col-span-2 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/90 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-md shadow-lg border border-blue-400/40">
                <Sparkles className="w-3.5 h-3.5" />
                {currentCampaign?.category || 'Destaque'} • {currentCampaign?.advertiser}
              </div>

              <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight drop-shadow-lg tracking-tight">
                {currentCampaign?.title}
              </h2>

              <p className="text-slate-200 text-sm sm:text-base line-clamp-2 max-w-xl drop-shadow font-medium">
                {currentCampaign?.description || 'Aproveite benefícios e descontos exclusivos negociados para os passageiros da frota ROTA TVDE.'}
              </p>

              <div className="flex items-center gap-3 pt-2">
                <span className="px-3 py-1.5 rounded-xl bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-xl flex items-center gap-1.5 border border-emerald-400/40">
                  <ShieldCheck className="w-4 h-4" /> Oferta Exclusiva TVDE
                </span>
                <span className="text-xs text-slate-300 font-medium drop-shadow">
                  {currentCampaign?.callToAction || 'Aponte a câmara do seu smartphone'}
                </span>
              </div>
            </div>

            {/* Right Column: High-Contrast Dynamic QR Code */}
            <div className="bg-slate-900/95 border-2 border-blue-500/80 rounded-2xl p-5 text-center shadow-2xl backdrop-blur-2xl flex flex-col items-center justify-center space-y-3">
              <div className="relative group cursor-pointer" onClick={handleSimulateScan}>
                {/* Physical-style QR card */}
                <div className="w-36 h-36 sm:w-40 sm:h-40 bg-white rounded-2xl p-3 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden transition-transform group-hover:scale-105">
                  <svg className="w-full h-full text-slate-950" viewBox="0 0 100 100" fill="currentColor">
                    <rect x="5" y="5" width="28" height="28" fill="black" />
                    <rect x="9" y="9" width="20" height="20" fill="white" />
                    <rect x="13" y="13" width="12" height="12" fill="black" />

                    <rect x="67" y="5" width="28" height="28" fill="black" />
                    <rect x="71" y="9" width="20" height="20" fill="white" />
                    <rect x="75" y="13" width="12" height="12" fill="black" />

                    <rect x="5" y="67" width="28" height="28" fill="black" />
                    <rect x="9" y="71" width="20" height="20" fill="white" />
                    <rect x="13" y="75" width="12" height="12" fill="black" />

                    {/* Data dots */}
                    <rect x="40" y="8" width="6" height="6" />
                    <rect x="52" y="8" width="6" height="6" />
                    <rect x="40" y="20" width="6" height="6" />
                    <rect x="46" y="26" width="6" height="6" />
                    <rect x="8" y="40" width="6" height="6" />
                    <rect x="20" y="46" width="6" height="6" />
                    <rect x="26" y="52" width="6" height="6" />
                    <rect x="40" y="40" width="8" height="8" fill="#2563EB" />
                    <rect x="54" y="46" width="6" height="6" />
                    <rect x="68" y="40" width="6" height="6" />
                    <rect x="80" y="46" width="6" height="6" />
                    <rect x="40" y="68" width="6" height="6" />
                    <rect x="52" y="74" width="6" height="6" />
                    <rect x="64" y="68" width="6" height="6" />
                    <rect x="76" y="80" width="6" height="6" />
                    <rect x="86" y="68" width="6" height="6" />
                    <rect x="46" y="86" width="6" height="6" />
                    <rect x="60" y="86" width="6" height="6" />
                  </svg>
                  
                  <div className="absolute inset-0 bg-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-blue-600 text-white text-[11px] font-bold px-2 py-1 rounded shadow">
                      Simular Leitura
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-white font-extrabold text-sm flex items-center justify-center gap-1.5">
                  <QrCode className="w-4 h-4 text-blue-400" /> Aponte a Câmara
                </p>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Toque no código ou use o telemóvel
                </p>
              </div>

              <button
                onClick={handleSimulateScan}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 active:scale-95 border border-blue-400/30"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Simular Scan do Passageiro
              </button>
            </div>

          </div>
        </div>

        {/* Bottom Progress & Continuous Looping Bar */}
        <div className="relative z-20 bg-slate-950/95 border-t border-slate-800/80 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-200">
              Campanha {currentIdx + 1} de {campaignsList.length}
            </span>
            <span>•</span>
            <span>
              Bónus Motorista por Scan: <strong className="text-emerald-400 font-bold">+{(currentCampaign?.scanReward * ((currentCampaign?.driverBonusRate || 30) / 100)).toFixed(2)}€</strong>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsMuted(!isMuted)} 
              className="p-1.5 text-slate-400 hover:text-white transition-colors"
              title={isMuted ? "Som desligado" : "Som ativo"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 hidden sm:inline">Próximo anúncio em:</span>
              <div className="w-28 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div 
                  className="h-full bg-blue-500 transition-all duration-100 ease-linear rounded-full" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Secret / Kiosk Settings Modal */}
      {showAdminMenu && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl text-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-white text-base">Menu Kiosk do Tablet</h3>
              </div>
              <button 
                onClick={() => { setShowAdminMenu(false); setAdminUnlocked(false); setAdminPinInput(''); }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!adminUnlocked ? (
              <form onSubmit={handleAdminUnlock} className="space-y-4">
                <p className="text-xs text-slate-400">
                  Insira o PIN de administrador (padrão: <strong>2026</strong>) para aceder às configurações de rede e desvinculação.
                </p>
                <input
                  type="password"
                  value={adminPinInput}
                  onChange={(e) => setAdminPinInput(e.target.value)}
                  placeholder="PIN Kiosk (ex: 2026)"
                  maxLength={4}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-center text-xl font-mono tracking-widest text-white focus:outline-none focus:border-blue-500"
                  autoFocus
                />
                {adminPinError && (
                  <p className="text-xs text-rose-400 font-semibold">PIN incorreto. Tente 2026.</p>
                )}
                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow transition"
                >
                  Desbloquear Menu
                </button>
              </form>
            ) : (
              <div className="space-y-3 pt-2">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
                  <div>Viatura: <strong className="text-white font-mono">{matricula}</strong></div>
                  <div>Condutor: <strong className="text-white">{driverName}</strong></div>
                  <div>ID Dispositivo: <span className="font-mono text-slate-500">{tabletId || matricula}</span></div>
                </div>

                <button
                  onClick={() => {
                    setCurrentIdx(0);
                    setProgress(0);
                    setShowAdminMenu(false);
                  }}
                  className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 border border-slate-700"
                >
                  <RefreshCw className="w-4 h-4 text-blue-400" />
                  Recarregar Mídia e Campanhas
                </button>

                <button
                  onClick={toggleFullscreen}
                  className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 border border-slate-700"
                >
                  <Maximize2 className="w-4 h-4 text-emerald-400" />
                  Alternar Ecrã Completo (Kiosk)
                </button>

                {onUnpairTablet && (
                  <button
                    onClick={() => {
                      if (window.confirm('Tem a certeza que deseja desvincular este tablet da viatura? O tablet regressará ao ecrã de ativação inicial.')) {
                        onUnpairTablet();
                        setShowAdminMenu(false);
                      }
                    }}
                    className="w-full py-2.5 px-3 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-bold rounded-xl flex items-center justify-center gap-2 border border-rose-500/40 transition"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
                    Desvincular Tablet (Reset)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PassengerTabletPlayer;
