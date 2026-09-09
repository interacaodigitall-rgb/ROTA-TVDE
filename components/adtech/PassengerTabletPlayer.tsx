import React, { useState, useEffect } from 'react';
import { useAdTech } from '../../hooks/useAdTech';
import { useAuth } from '../../hooks/useAuth';
import { useUsers } from '../../hooks/useUsers';
import { AdCampaign } from '../../types';
import { BRAND_LOGOS } from '../../constants';
import Button from '../ui/Button';
import { 
  Tv, 
  Wifi, 
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
  Compass, 
  Sun,
  CheckCircle2,
  PhoneCall
} from 'lucide-react';

interface PassengerTabletPlayerProps {
  onClose: () => void;
  matricula?: string;
  driverName?: string;
}

export const PassengerTabletPlayer: React.FC<PassengerTabletPlayerProps> = ({ 
  onClose, 
  matricula = 'FROTA-001', 
  driverName = 'Motorista Parceiro' 
}) => {
  const { activeCampaigns, recordImpression, recordScan, devices } = useAdTech();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scanSuccessFeedback, setScanSuccessFeedback] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }));

  const currentDevice = devices.find(d => d.matricula === matricula) || devices[0];
  const campaignsList: AdCampaign[] = activeCampaigns.length > 0 ? activeCampaigns : [
    {
      id: 'default-camp',
      title: 'Bem-vindo a Bordo da Frota ROTA TVDE',
      advertiser: 'Asfalto Cativante',
      category: 'Mobilidade',
      mediaUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&auto=format&fit=crop&q=80',
      mediaType: 'image',
      targetUrl: 'https://asfaltocativante.pt',
      qrCodeData: 'https://asfaltocativante.pt/promo',
      status: 'ACTIVE',
      impressions: 100,
      scans: 10,
      revenue: 5.0,
      cpm: 15,
      scanReward: 0.5,
      startDate: new Date(),
      endDate: new Date(),
      callToAction: 'Faça scan e conheça as novidades!',
      driverBonusRate: 30
    }
  ];

  const currentCampaign = campaignsList[currentIdx % campaignsList.length];

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Impression tracking & auto-slide every 12 seconds
  useEffect(() => {
    if (!currentCampaign) return;
    recordImpression(currentCampaign.id, currentDevice?.id);
    setProgress(0);

    const stepInterval = 100;
    const totalDuration = 10000; // 10s per slide
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
  }, [currentCampaign?.id, currentDevice?.id, campaignsList.length]);

  const handleSimulateScan = () => {
    if (!currentCampaign) return;
    recordScan(currentCampaign.id, currentDevice?.id);
    setScanSuccessFeedback(`QR Code lido com sucesso! Bónus de +${(currentCampaign.scanReward * 0.3).toFixed(2)}€ creditado ao motorista.`);
    setTimeout(() => {
      setScanSuccessFeedback(null);
    }, 4000);
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

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-2 sm:p-6 select-none overflow-hidden font-sans">
      {/* Simulation Frame Header */}
      <div className="w-full max-w-5xl flex items-center justify-between px-4 py-2 bg-slate-900/80 border border-slate-700/80 rounded-t-xl text-slate-300 text-xs sm:text-sm backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            Tablet Interativo de Encosto
          </span>
          <span className="hidden sm:inline text-slate-400">
            Viatura: <strong className="text-white">{matricula}</strong> ({driverName})
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
          <button
            onClick={onClose}
            className="p-1.5 bg-rose-600/80 hover:bg-rose-500 text-white rounded font-bold"
            title="Sair do Modo Tablet"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Tablet Body (Emulated 16:10 / 16:9 Display) */}
      <div className="relative w-full max-w-5xl h-[70vh] sm:h-[75vh] max-h-[680px] bg-slate-950 rounded-b-xl border-x border-b border-slate-700 shadow-2xl overflow-hidden flex flex-col justify-between">
        
        {/* Top Tablet Status Bar */}
        <div className="h-10 bg-gradient-to-b from-black/90 to-transparent px-6 flex items-center justify-between text-white text-xs z-20">
          <div className="flex items-center gap-3">
            <img 
              src={BRAND_LOGOS.MOBILE} 
              alt="ROTA TVDE" 
              referrerPolicy="no-referrer"
              className="w-5 h-5 rounded-md object-cover border border-slate-700 shadow-sm"
            />
            <span className="font-bold tracking-wider text-blue-400">ROTA TVDE 5.0 ADTECH</span>
            <span className="flex items-center gap-1 text-slate-300 ml-2">
              <Sun className="w-3.5 h-3.5 text-amber-400" /> 23°C Lisboa
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-300">
            <span className="font-semibold text-sm tracking-wide text-white">{currentTime}</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <Wifi className="w-3.5 h-3.5" /> 5G
            </span>
            <span className="flex items-center gap-1 text-slate-200">
              <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" /> {currentDevice?.batteryLevel || 94}%
            </span>
          </div>
        </div>

        {/* Ad Background & Visual Layer */}
        <div className="absolute inset-0 z-0">
          <img 
            src={currentCampaign?.mediaUrl} 
            alt={currentCampaign?.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover brightness-75 contrast-105 transition-all duration-700 scale-100 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-slate-950/60" />
        </div>

        {/* Scan Success Overlay Notification */}
        {scanSuccessFeedback && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 bg-emerald-600/95 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-emerald-400 backdrop-blur-md animate-bounce">
            <CheckCircle2 className="w-5 h-5 text-white" />
            <span className="text-sm font-semibold">{scanSuccessFeedback}</span>
          </div>
        )}

        {/* Middle Content Overlay */}
        <div className="relative z-10 p-6 sm:p-10 flex flex-col justify-end h-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            
            {/* Left 2 Columns: Ad Info & Advertiser Branding */}
            <div className="md:col-span-2 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/90 text-white text-xs font-semibold uppercase tracking-wider backdrop-blur-sm shadow-md">
                <Sparkles className="w-3.5 h-3.5" />
                {currentCampaign?.category || 'Destaque'} • {currentCampaign?.advertiser}
              </div>

              <h2 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight drop-shadow-md">
                {currentCampaign?.title}
              </h2>

              <p className="text-slate-200 text-sm sm:text-base line-clamp-2 max-w-xl drop-shadow">
                {currentCampaign?.description}
              </p>

              <div className="flex items-center gap-3 pt-2">
                <span className="px-3 py-1.5 rounded-lg bg-emerald-500/90 text-white font-bold text-xs sm:text-sm shadow-lg flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Oferta Exclusiva TVDE
                </span>
                <span className="text-xs text-slate-300">
                  {currentCampaign?.callToAction || 'Aponte a câmara do seu smartphone'}
                </span>
              </div>
            </div>

            {/* Right Column: Interactive Scan QR Card */}
            <div className="bg-slate-900/90 border-2 border-blue-500/80 rounded-2xl p-5 text-center shadow-2xl backdrop-blur-xl flex flex-col items-center justify-center space-y-3">
              <div className="relative group cursor-pointer" onClick={handleSimulateScan}>
                {/* Visual QR Code Box */}
                <div className="w-36 h-36 bg-white rounded-xl p-2.5 shadow-inner flex flex-col items-center justify-center relative overflow-hidden transition-transform group-hover:scale-105">
                  {/* Generated clean SVG QR Pattern */}
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
                  
                  <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                      Testar Scan
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-white font-bold text-sm flex items-center justify-center gap-1.5">
                  <QrCode className="w-4 h-4 text-blue-400" /> Aceder à Oferta
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Toque no QR ou aponte a câmara do telefone
                </p>
              </div>

              <button
                onClick={handleSimulateScan}
                className="w-full py-2 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 active:scale-95"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Simular Leitura do Passageiro
              </button>
            </div>

          </div>
        </div>

        {/* Bottom Progress & Passenger Controls */}
        <div className="relative z-20 bg-slate-950/90 border-t border-slate-800 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Campanha {currentIdx + 1} de {campaignsList.length}</span>
            <span>•</span>
            <span>Bónus Motorista por Scan: <strong className="text-emerald-400">+{(currentCampaign?.scanReward * 0.3).toFixed(2)}€</strong></span>
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
              <span className="text-xs text-slate-400">Próximo anúncio em:</span>
              <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 transition-all duration-100 ease-linear rounded-full" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PassengerTabletPlayer;
