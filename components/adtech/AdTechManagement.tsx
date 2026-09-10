import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useAdTech } from '../../hooks/useAdTech';
import { useUsers } from '../../hooks/useUsers';
import { AdCampaign, AdDevice, UserRole } from '../../types';
import PassengerTabletPlayer from './PassengerTabletPlayer';
import { 
  Tv, 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  BarChart3, 
  QrCode, 
  Smartphone, 
  Euro, 
  Eye, 
  Radio, 
  Battery, 
  CheckCircle, 
  AlertTriangle,
  ExternalLink,
  Layers,
  Sparkles,
  RefreshCw,
  Search
} from 'lucide-react';

export const AdTechManagement: React.FC = () => {
  const { 
    campaigns, 
    devices, 
    totalAdRevenue, 
    totalImpressions, 
    totalScans, 
    totalDriverBonusDistributed,
    addCampaign,
    toggleCampaignStatus,
    deleteCampaign,
    addDevice,
    updateDevice
  } = useAdTech();
  const { users } = useUsers();

  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'devices'>('overview');
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false);
  const [showNewDeviceModal, setShowNewDeviceModal] = useState(false);
  const [activeTabletMatricula, setActiveTabletMatricula] = useState<string | null>(null);

  // Form states
  const [campaignForm, setCampaignForm] = useState({
    title: '',
    advertiser: '',
    category: 'Consumo & Serviços',
    mediaUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&auto=format&fit=crop&q=80',
    mediaType: 'image' as 'image' | 'video',
    targetUrl: 'https://exemplo.pt/promo',
    qrCodeData: 'https://exemplo.pt/promo?origem=tvde',
    status: 'ACTIVE' as 'ACTIVE' | 'PAUSED',
    cpm: '20.00',
    scanReward: '0.50',
    description: '',
    callToAction: 'Faça scan e aproveite!',
    driverBonusRate: '30'
  });

  const [deviceForm, setDeviceForm] = useState({
    matricula: '',
    driverId: '',
    tabletModel: 'Samsung Galaxy Tab A9+ 11" 5G',
    status: 'ONLINE' as 'ONLINE' | 'OFFLINE' | 'STANDBY',
    batteryLevel: '95'
  });

  const drivers = users.filter(u => u.role === UserRole.DRIVER);

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignForm.title || !campaignForm.advertiser) return;

    await addCampaign({
      title: campaignForm.title,
      advertiser: campaignForm.advertiser,
      category: campaignForm.category,
      mediaUrl: campaignForm.mediaUrl,
      mediaType: campaignForm.mediaType,
      targetUrl: campaignForm.targetUrl,
      qrCodeData: campaignForm.qrCodeData,
      status: campaignForm.status,
      cpm: parseFloat(campaignForm.cpm) || 20,
      scanReward: parseFloat(campaignForm.scanReward) || 0.50,
      startDate: new Date(),
      endDate: new Date(Date.now() + 60 * 24 * 3600 * 1000),
      description: campaignForm.description,
      callToAction: campaignForm.callToAction,
      driverBonusRate: parseFloat(campaignForm.driverBonusRate) || 30
    });

    setShowNewCampaignModal(false);
    setCampaignForm({
      title: '',
      advertiser: '',
      category: 'Consumo & Serviços',
      mediaUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1200&auto=format&fit=crop&q=80',
      mediaType: 'image',
      targetUrl: 'https://exemplo.pt/promo',
      qrCodeData: 'https://exemplo.pt/promo?origem=tvde',
      status: 'ACTIVE',
      cpm: '20.00',
      scanReward: '0.50',
      description: '',
      callToAction: 'Faça scan e aproveite!',
      driverBonusRate: '30'
    });
  };

  const handleCreateDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceForm.matricula) return;

    const matchedDriver = drivers.find(d => d.id === deviceForm.driverId);

    await addDevice({
      matricula: deviceForm.matricula.toUpperCase(),
      driverId: deviceForm.driverId || undefined,
      driverName: matchedDriver?.name || 'Não atribuído',
      tabletModel: deviceForm.tabletModel,
      status: deviceForm.status,
      batteryLevel: parseInt(deviceForm.batteryLevel) || 90,
      lastPing: new Date(),
      appVersion: 'ROTA-AD-2.4'
    });

    setShowNewDeviceModal(false);
    setDeviceForm({
      matricula: '',
      driverId: '',
      tabletModel: 'Samsung Galaxy Tab A9+ 11" 5G',
      status: 'ONLINE',
      batteryLevel: '95'
    });
  };

  const onlineDevicesCount = devices.filter(d => d.status === 'ONLINE').length;

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Launcher */}
      <div className="bg-gradient-to-r from-blue-900/60 via-slate-900 to-indigo-950 p-6 rounded-xl border border-blue-800/40 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2 border border-blue-500/30">
            <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" /> ROTA AdTech 5.0
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Publicidade Digital & Tablets em Veículos</h2>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Monetização de passageiros TVDE através de ecrãs interativos nos encostos de cabeça com partilha de receita transparente para os motoristas.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button 
            onClick={() => setActiveTabletMatricula('FROTA-001')}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/50"
          >
            <Tv className="w-4 h-4" /> Abrir Tablet Passageiro
          </Button>
          <Button 
            onClick={() => setShowNewCampaignModal(true)}
            variant="primary"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Nova Campanha
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500 bg-slate-900/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase">Receita Total de Mídia</p>
              <p className="text-2xl font-black text-white mt-1">€ {totalAdRevenue.toFixed(2)}</p>
              <span className="text-xs text-blue-400 font-medium">Faturado aos Anunciantes</span>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
              <Euro className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 bg-slate-900/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase">Bónus para Motoristas</p>
              <p className="text-2xl font-black text-emerald-400 mt-1">€ {totalDriverBonusDistributed.toFixed(2)}</p>
              <span className="text-xs text-emerald-500/80 font-medium">30% repassado aos condutores</span>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
              <Sparkles className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-amber-500 bg-slate-900/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase">Impressões nos Tablets</p>
              <p className="text-2xl font-black text-white mt-1">{totalImpressions.toLocaleString('pt-PT')}</p>
              <span className="text-xs text-amber-400 font-medium">{totalScans.toLocaleString('pt-PT')} leituras de QR</span>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
              <Eye className="w-6 h-6" />
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-indigo-500 bg-slate-900/80">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase">Tablets Ativos na Frota</p>
              <p className="text-2xl font-black text-white mt-1">{onlineDevicesCount} / {devices.length}</p>
              <span className="text-xs text-indigo-400 font-medium">{devices.length - onlineDevicesCount} offline/standby</span>
            </div>
            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
              <Smartphone className="w-6 h-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Tablet Link Bar */}
      <div className="bg-slate-900 border border-blue-500/30 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-white text-sm">Link de Acesso Direto para os Tablets em Viagem</h4>
            <p className="text-xs text-slate-400 font-mono mt-0.5">https://tvdeemrota.vercel.app/tablet (ou o link atual da app + /tablet)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              navigator.clipboard.writeText('https://tvdeemrota.vercel.app/tablet');
              alert('Link copiado para a área de transferência: https://tvdeemrota.vercel.app/tablet');
            }}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition flex items-center gap-1.5"
          >
            Copiar Link Vercel
          </button>
          <a
            href="/tablet"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Abrir Modo Tablet
          </a>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 space-x-4">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'overview' 
              ? 'border-blue-500 text-blue-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Visão Geral & Painel
        </button>
        <button
          onClick={() => setActiveTab('campaigns')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'campaigns' 
              ? 'border-blue-500 text-blue-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" /> Campanhas ({campaigns.length})
        </button>
        <button
          onClick={() => setActiveTab('devices')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'devices' 
              ? 'border-blue-500 text-blue-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Smartphone className="w-4 h-4" /> Tablets da Frota ({devices.length})
        </button>
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Active Campaigns Highlights */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Play className="w-4 h-4 text-emerald-400" /> Campanhas em Transmissão Ativa
                </h3>
                <span className="text-xs text-slate-400">
                  {campaigns.filter(c => c.status === 'ACTIVE').length} no ar
                </span>
              </div>

              <div className="space-y-3">
                {campaigns.map(campaign => (
                  <div 
                    key={campaign.id} 
                    className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl hover:border-slate-700 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <img 
                        src={campaign.mediaUrl} 
                        alt={campaign.title} 
                        referrerPolicy="no-referrer"
                        className="w-20 h-14 object-cover rounded-lg border border-slate-700" 
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            campaign.status === 'ACTIVE' 
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                            {campaign.status === 'ACTIVE' ? 'No Ar' : 'Pausada'}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">{campaign.advertiser}</span>
                        </div>
                        <h4 className="text-sm font-bold text-white mt-1">{campaign.title}</h4>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                          <span>{campaign.impressions.toLocaleString()} views</span>
                          <span>•</span>
                          <span className="text-blue-400">{campaign.scans} scans QR</span>
                          <span>•</span>
                          <span className="text-emerald-400 font-bold">€ {campaign.revenue.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => toggleCampaignStatus(campaign.id)}
                        className={`p-2 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors ${
                          campaign.status === 'ACTIVE'
                            ? 'bg-amber-950/40 text-amber-400 border-amber-700/60 hover:bg-amber-900/60'
                            : 'bg-emerald-950/40 text-emerald-400 border-emerald-700/60 hover:bg-emerald-900/60'
                        }`}
                        title={campaign.status === 'ACTIVE' ? 'Pausar' : 'Ativar'}
                      >
                        {campaign.status === 'ACTIVE' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        {campaign.status === 'ACTIVE' ? 'Pausar' : 'Ativar'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Tablet Monitor */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-blue-400" /> Estado dos Ecrãs
                </h3>
                <Button 
                  onClick={() => setShowNewDeviceModal(true)} 
                  variant="secondary"
                  className="text-xs py-1 px-2.5"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Associar
                </Button>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 divide-y divide-slate-800">
                {devices.slice(0, 5).map(device => (
                  <div key={device.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-white">{device.matricula}</span>
                        <span className={`inline-block w-2 h-2 rounded-full ${
                          device.status === 'ONLINE' ? 'bg-emerald-400 shadow-sm shadow-emerald-400' :
                          device.status === 'STANDBY' ? 'bg-amber-400' : 'bg-red-400'
                        }`} />
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[150px]">{device.driverName}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-bold text-emerald-400">+{device.earnedBonus.toFixed(2)}€</p>
                      <button 
                        onClick={() => setActiveTabletMatricula(device.matricula)}
                        className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold underline mt-0.5"
                      >
                        Abrir Tablet
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Tab: Campaigns Management */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Todas as Campanhas Registadas</h3>
            <Button onClick={() => setShowNewCampaignModal(true)} variant="primary">
              <Plus className="w-4 h-4 mr-1.5" /> Adicionar Campanha
            </Button>
          </div>

          <div className="overflow-x-auto bg-slate-900/80 rounded-xl border border-slate-800">
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Campanha / Anunciante</th>
                  <th className="px-4 py-3 text-left">Categoria</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Impressões</th>
                  <th className="px-4 py-3 text-right">Scans QR</th>
                  <th className="px-4 py-3 text-right">CPM / Scan</th>
                  <th className="px-4 py-3 text-right">Faturação</th>
                  <th className="px-4 py-3 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {campaigns.map(camp => (
                  <tr key={camp.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img 
                          src={camp.mediaUrl} 
                          alt="" 
                          referrerPolicy="no-referrer"
                          className="w-12 h-9 object-cover rounded border border-slate-700" 
                        />
                        <div>
                          <p className="font-bold text-white">{camp.title}</p>
                          <p className="text-xs text-slate-400">{camp.advertiser}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{camp.category}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        camp.status === 'ACTIVE' 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {camp.status === 'ACTIVE' ? 'Ativo' : 'Pausa'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-white">
                      {camp.impressions.toLocaleString('pt-PT')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-blue-400 font-semibold">
                      {camp.scans.toLocaleString('pt-PT')}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-400">
                      €{camp.cpm.toFixed(2)} / €{camp.scanReward.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">
                      € {camp.revenue.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => toggleCampaignStatus(camp.id)}
                          className="p-1.5 rounded hover:bg-slate-700 text-slate-300"
                          title={camp.status === 'ACTIVE' ? 'Pausar' : 'Retomar'}
                        >
                          {camp.status === 'ACTIVE' ? <Pause className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 text-emerald-400" />}
                        </button>
                        <button
                          onClick={() => deleteCampaign(camp.id)}
                          className="p-1.5 rounded hover:bg-rose-900/40 text-rose-400"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Devices Management */}
      {activeTab === 'devices' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-white">Ecrãs / Tablets Instalados</h3>
              <p className="text-xs text-slate-400">Monitorização em tempo real de hardware embarcado e bónus acumulado por matrícula</p>
            </div>
            <Button onClick={() => setShowNewDeviceModal(true)} variant="primary">
              <Plus className="w-4 h-4 mr-1.5" /> Associar Novo Tablet
            </Button>
          </div>

          <div className="overflow-x-auto bg-slate-900/80 rounded-xl border border-slate-800">
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead className="bg-slate-950/80 text-slate-400 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Viatura / Matrícula</th>
                  <th className="px-4 py-3 text-left">Motorista Afeto</th>
                  <th className="px-4 py-3 text-left">Modelo do Tablet</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Bateria</th>
                  <th className="px-4 py-3 text-right">Impressões</th>
                  <th className="px-4 py-3 text-right">Scans</th>
                  <th className="px-4 py-3 text-right">Bónus Motorista</th>
                  <th className="px-4 py-3 text-center">Simulador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {devices.map(device => (
                  <tr key={device.id} className="hover:bg-slate-800/40">
                    <td className="px-4 py-3 font-mono font-bold text-white">
                      {device.matricula}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {device.driverName}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {device.tabletModel}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        device.status === 'ONLINE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        device.status === 'STANDBY' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}>
                        {device.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-xs text-slate-300 font-mono">
                        <Battery className={`w-3.5 h-3.5 ${device.batteryLevel > 30 ? 'text-emerald-400' : 'text-red-400'}`} />
                        {device.batteryLevel}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-white">
                      {device.totalImpressions.toLocaleString('pt-PT')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-blue-400">
                      {device.totalScans.toLocaleString('pt-PT')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">
                      € {device.earnedBonus.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setActiveTabletMatricula(device.matricula)}
                        className="px-3 py-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-400 hover:text-blue-200 border border-blue-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 mx-auto"
                      >
                        <Tv className="w-3.5 h-3.5" /> Abrir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Nova Campanha */}
      {showNewCampaignModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-400" /> Cadastrar Campanha Publicitária
              </h3>
              <button onClick={() => setShowNewCampaignModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4 text-slate-200 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Título do Anúncio</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Super Bock 0.0"
                    value={campaignForm.title}
                    onChange={e => setCampaignForm({ ...campaignForm, title: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Anunciante</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Super Bock Group"
                    value={campaignForm.advertiser}
                    onChange={e => setCampaignForm({ ...campaignForm, advertiser: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Categoria</label>
                  <select
                    value={campaignForm.category}
                    onChange={e => setCampaignForm({ ...campaignForm, category: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                  >
                    <option value="Bebidas & Alimentação">Bebidas & Alimentação</option>
                    <option value="Telecomunicações">Telecomunicações</option>
                    <option value="Hotelaria & Turismo">Hotelaria & Turismo</option>
                    <option value="Energia & Mobilidade">Energia & Mobilidade</option>
                    <option value="Retalho & Shopping">Retalho & Shopping</option>
                    <option value="Seguros & Finanças">Seguros & Finanças</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Partilha Motorista (%)</label>
                  <input
                    type="number"
                    value={campaignForm.driverBonusRate}
                    onChange={e => setCampaignForm({ ...campaignForm, driverBonusRate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">URL da Imagem / Banner (1200x800)</label>
                <input
                  type="url"
                  required
                  value={campaignForm.mediaUrl}
                  onChange={e => setCampaignForm({ ...campaignForm, mediaUrl: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm font-mono text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">URL de Destino do QR Code</label>
                <input
                  type="url"
                  required
                  value={campaignForm.qrCodeData}
                  onChange={e => setCampaignForm({ ...campaignForm, qrCodeData: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm font-mono text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Valor CPM (€ por 1000 views)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={campaignForm.cpm}
                    onChange={e => setCampaignForm({ ...campaignForm, cpm: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Valor por Scan (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={campaignForm.scanReward}
                    onChange={e => setCampaignForm({ ...campaignForm, scanReward: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Descrição Curta</label>
                <textarea
                  rows={2}
                  placeholder="Texto atrativo exibido ao passageiro no tablet..."
                  value={campaignForm.description}
                  onChange={e => setCampaignForm({ ...campaignForm, description: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <Button type="button" variant="secondary" onClick={() => setShowNewCampaignModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary">
                  Criar e Ativar Campanha
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Novo Tablet */}
      {showNewDeviceModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-400" /> Associar Tablet à Viatura
              </h3>
              <button onClick={() => setShowNewDeviceModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateDevice} className="space-y-4 text-slate-200 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Matrícula do Veículo</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: FROTA-006 ou AA-00-BB"
                  value={deviceForm.matricula}
                  onChange={e => setDeviceForm({ ...deviceForm, matricula: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Motorista Responsável</label>
                <select
                  value={deviceForm.driverId}
                  onChange={e => setDeviceForm({ ...deviceForm, driverId: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                >
                  <option value="">Selecione o motorista...</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.matricula})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Modelo do Tablet</label>
                <input
                  type="text"
                  value={deviceForm.tabletModel}
                  onChange={e => setDeviceForm({ ...deviceForm, tabletModel: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <Button type="button" variant="secondary" onClick={() => setShowNewDeviceModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary">
                  Registar Dispositivo
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Interactive In-Car Passenger Tablet Modal */}
      {activeTabletMatricula && (
        <PassengerTabletPlayer
          matricula={activeTabletMatricula}
          driverName={devices.find(d => d.matricula === activeTabletMatricula)?.driverName || 'Motorista Parceiro'}
          onClose={() => setActiveTabletMatricula(null)}
        />
      )}
    </div>
  );
};

export default AdTechManagement;
