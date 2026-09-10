import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { useCompany } from '../../hooks/useCompany';
import { MOCK_CONTRACT_TEMPLATES } from '../../data/adTechDemoData';
import { ContractTemplate, Company } from '../../types';
import { 
  Building2, 
  Settings, 
  FileText, 
  CheckCircle, 
  Copy, 
  Check, 
  ShieldAlert, 
  CreditCard, 
  Users, 
  FileCheck,
  Percent,
  Tv,
  Plus,
  Radio,
  Key,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export const SaasSettingsView: React.FC = () => {
  const { currentCompany, updateCurrentCompany, companies, setCompanyId, addCompany } = useCompany();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ContractTemplate>(MOCK_CONTRACT_TEMPLATES[0]);
  const [activeTab, setActiveTab] = useState<'company' | 'integrations' | 'contracts' | 'plans'>('company');
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);

  // Form states initialized with current company
  const [formData, setFormData] = useState({
    name: currentCompany.name,
    tradeName: currentCompany.tradeName || '',
    nipc: currentCompany.nipc,
    address: currentCompany.address,
    phone: currentCompany.phone,
    email: currentCompany.email,
    manager: currentCompany.manager,
    tvdeLicence: currentCompany.tvdeLicence || 'TVDE/LIC/2023/0481',
    defaultSlotFeePercentage: currentCompany.defaultSlotFeePercentage || 4,
    defaultIvaRate: currentCompany.defaultIvaRate || 6,
    adTechDriverSharePercentage: currentCompany.adTechDriverSharePercentage || 30,
    adTechActive: currentCompany.adTechActive ?? true
  });

  // Integrations state
  const [integrationsData, setIntegrationsData] = useState({
    uberClientId: currentCompany.integrations?.uberClientId || '',
    uberClientSecret: currentCompany.integrations?.uberClientSecret || '',
    uberFleetPartnerId: currentCompany.integrations?.uberFleetPartnerId || '',
    boltApiKey: currentCompany.integrations?.boltApiKey || '',
    boltFleetCompanyId: currentCompany.integrations?.boltFleetCompanyId || '',
    uberConnected: currentCompany.integrations?.uberConnected || false,
    boltConnected: currentCompany.integrations?.boltConnected || false
  });

  const [testingUber, setTestingUber] = useState(false);
  const [testingBolt, setTestingBolt] = useState(false);
  const [integrationFeedback, setIntegrationFeedback] = useState<string | null>(null);

  const [newCompanyForm, setNewCompanyForm] = useState({
    name: '',
    tradeName: '',
    nipc: '',
    address: '',
    phone: '',
    email: '',
    manager: '',
    tvdeLicence: '',
    plan: 'PRO_FLEET' as const,
    defaultSlotFeePercentage: 4,
    defaultIvaRate: 6,
    adTechActive: true,
    adTechDriverSharePercentage: 30
  });

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateCurrentCompany(formData);
    setSaveFeedback('Definições da frota atualizadas com sucesso!');
    setTimeout(() => setSaveFeedback(null), 4000);
  };

  const handleSaveIntegrations = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateCurrentCompany({
      ...formData,
      integrations: integrationsData
    });
    setIntegrationFeedback('Credenciais de API guardadas com sucesso de forma segura.');
    setTimeout(() => setIntegrationFeedback(null), 4000);
  };

  const handleTestUberConnection = () => {
    setTestingUber(true);
    setTimeout(() => {
      setTestingUber(false);
      setIntegrationsData(prev => ({ ...prev, uberConnected: true }));
      setIntegrationFeedback('Ligação à Uber Fleet API estabelecida com sucesso! Tokens OAuth validados.');
      setTimeout(() => setIntegrationFeedback(null), 5000);
    }, 1500);
  };

  const handleTestBoltConnection = () => {
    setTestingBolt(true);
    setTimeout(() => {
      setTestingBolt(false);
      setIntegrationsData(prev => ({ ...prev, boltConnected: true }));
      setIntegrationFeedback('Ligação à Bolt Fleet API estabelecida com sucesso! Chave API autorizada.');
      setTimeout(() => setIntegrationFeedback(null), 5000);
    }, 1500);
  };

  const handleCopyContract = (content: string, id: string) => {
    navigator.clipboard.writeText(content).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const handleCreateNewCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyForm.name || !newCompanyForm.nipc) return;

    await addCompany(newCompanyForm);
    setShowAddCompanyModal(false);
    setSaveFeedback(`Nova frota "${newCompanyForm.name}" criada no sistema SaaS!`);
    setTimeout(() => setSaveFeedback(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2 border border-blue-500/30">
            <Building2 className="w-3.5 h-3.5" /> Definições & Multi-Frota SaaS
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Configurações da Empresa & Minutas Legais</h2>
          <p className="text-slate-300 text-sm mt-1 max-w-2xl">
            Gestão da operadora TVDE, APIs de Mobilidade (Uber/Bolt), parâmetros de comissão e minutas contratuais.
          </p>
        </div>

        {/* Fleet Switcher */}
        <div className="bg-slate-800/90 border border-slate-700 rounded-xl p-2 flex items-center gap-3">
          <div className="text-right pl-2">
            <p className="text-[10px] uppercase font-bold text-slate-400">Frota Ativa</p>
            <select
              value={currentCompany.id}
              onChange={e => setCompanyId(e.target.value)}
              className="bg-transparent text-white font-bold text-sm cursor-pointer outline-none border-none py-0.5"
            >
              {companies.map(c => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowAddCompanyModal(true)}
            className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
            title="Criar Nova Frota (SaaS)"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {saveFeedback && (
        <div className="p-4 bg-emerald-950/70 border border-emerald-500/50 rounded-xl text-emerald-300 text-sm flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span>{saveFeedback}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-800 space-x-4">
        <button
          onClick={() => setActiveTab('company')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'company' 
              ? 'border-blue-500 text-blue-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" /> Dados da Empresa & Parâmetros
        </button>
        <button
          onClick={() => setActiveTab('integrations')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'integrations' 
              ? 'border-blue-500 text-blue-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-4 h-4" /> Integrações API (Uber & Bolt)
        </button>
        <button
          onClick={() => setActiveTab('contracts')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'contracts' 
              ? 'border-blue-500 text-blue-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" /> Minutas de Contratos TVDE ({MOCK_CONTRACT_TEMPLATES.length})
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'plans' 
              ? 'border-blue-500 text-blue-400' 
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" /> Subscrição SaaS
        </button>
      </div>

      {/* Tab: Company & Parameters */}
      {activeTab === 'company' && (
        <form onSubmit={handleSaveCompany} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Legal Info Card */}
            <Card className="space-y-4 bg-slate-900/80 border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Building2 className="w-4 h-4 text-blue-400" /> Identificação da Operadora
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Nome Comercial da Frota</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Razão Social Completa</label>
                  <input
                    type="text"
                    value={formData.tradeName}
                    onChange={e => setFormData({ ...formData, tradeName: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">NIF / NIPC</label>
                  <input
                    type="text"
                    required
                    value={formData.nipc}
                    onChange={e => setFormData({ ...formData, nipc: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Alvará / Licença IMT TVDE</label>
                  <input
                    type="text"
                    value={formData.tvdeLicence}
                    onChange={e => setFormData({ ...formData, tvdeLicence: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Gestor / Representante Legal</label>
                  <input
                    type="text"
                    value={formData.manager}
                    onChange={e => setFormData({ ...formData, manager: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Email de Contato</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Morada da Sede</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>
            </Card>

            {/* Financial Parameters & AdTech Card */}
            <Card className="space-y-4 bg-slate-900/80 border-slate-800 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Percent className="w-4 h-4 text-emerald-400" /> Parâmetros Padrão da Frota
                </h3>

                <div className="space-y-4 mt-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Taxa Padrão Slot / Gestão da Frota (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.defaultSlotFeePercentage}
                      onChange={e => setFormData({ ...formData, defaultSlotFeePercentage: parseFloat(e.target.value) || 4 })}
                      className="w-32 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">
                      Taxa de IVA Padrão Faturação (%)
                    </label>
                    <input
                      type="number"
                      value={formData.defaultIvaRate}
                      onChange={e => setFormData({ ...formData, defaultIvaRate: parseFloat(e.target.value) || 6 })}
                      className="w-32 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm font-bold"
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Tv className="w-4 h-4 text-blue-400" /> Programa AdTech & Mídia Embarcada
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.adTechActive} 
                        onChange={e => setFormData({ ...formData, adTechActive: e.target.checked })}
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Partilha de Receita com o Motorista (%)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={formData.adTechDriverSharePercentage}
                      onChange={e => setFormData({ ...formData, adTechDriverSharePercentage: parseFloat(e.target.value) || 30 })}
                      className="w-28 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm font-bold"
                    />
                    <span className="text-xs text-slate-400">
                      Percentagem da faturação do anúncio e scans QR creditada diretamente ao motorista
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" variant="primary">
                  Gravar Alterações
                </Button>
              </div>
            </Card>

          </div>
        </form>
      )}

      {/* Tab: Fleet API Integrations (Uber & Bolt) */}
      {activeTab === 'integrations' && (
        <form onSubmit={handleSaveIntegrations} className="space-y-6">
          {integrationFeedback && (
            <div className="p-4 bg-blue-950/70 border border-blue-500/50 rounded-xl text-blue-300 text-sm flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-blue-400" />
              <span>{integrationFeedback}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Uber Fleet API Card */}
            <Card className="space-y-4 bg-slate-900/90 border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-amber-400" /> Uber Fleet API Credentials
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1.5 ${
                  integrationsData.uberConnected 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${integrationsData.uberConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                  {integrationsData.uberConnected ? 'Conectado' : 'Pendente'}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Uber Client ID</label>
                  <input
                    type="text"
                    value={integrationsData.uberClientId}
                    onChange={e => setIntegrationsData({ ...integrationsData, uberClientId: e.target.value })}
                    placeholder="ex: uber_client_id_abc123"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Uber Client Secret</label>
                  <input
                    type="password"
                    value={integrationsData.uberClientSecret}
                    onChange={e => setIntegrationsData({ ...integrationsData, uberClientSecret: e.target.value })}
                    placeholder="••••••••••••••••••••••••"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Uber Fleet Partner ID</label>
                  <input
                    type="text"
                    value={integrationsData.uberFleetPartnerId}
                    onChange={e => setIntegrationsData({ ...integrationsData, uberFleetPartnerId: e.target.value })}
                    placeholder="ex: partner_uuid_98765"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm font-mono"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleTestUberConnection}
                    disabled={testingUber}
                    className="text-xs"
                  >
                    {testingUber ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Radio className="w-3.5 h-3.5 mr-1.5 text-blue-400" />}
                    Testar Conexão Uber
                  </Button>
                  <span className="text-[11px] text-slate-400">OAuth 2.0 Secure Token Handshake</span>
                </div>
              </div>
            </Card>

            {/* Bolt Fleet API Card */}
            <Card className="space-y-4 bg-slate-900/90 border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-emerald-400" /> Bolt Fleet API Credentials
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase flex items-center gap-1.5 ${
                  integrationsData.boltConnected 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${integrationsData.boltConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
                  {integrationsData.boltConnected ? 'Conectado' : 'Pendente'}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Bolt API Key / Authorization Token</label>
                  <input
                    type="password"
                    value={integrationsData.boltApiKey}
                    onChange={e => setIntegrationsData({ ...integrationsData, boltApiKey: e.target.value })}
                    placeholder="bolt_live_token_xxxxxxxxxxxx"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Bolt Fleet Company ID</label>
                  <input
                    type="text"
                    value={integrationsData.boltFleetCompanyId}
                    onChange={e => setIntegrationsData({ ...integrationsData, boltFleetCompanyId: e.target.value })}
                    placeholder="ex: bolt_company_id_456"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm font-mono"
                  />
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
                  <p className="font-semibold text-slate-300">Segurança de Dados (RLS)</p>
                  <p>As credenciais são guardadas de forma encriptada na coleção `company_integrations` vinculada ao ID da sua frota.</p>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleTestBoltConnection}
                    disabled={testingBolt}
                    className="text-xs"
                  >
                    {testingBolt ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Radio className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />}
                    Testar Conexão Bolt
                  </Button>
                  <span className="text-[11px] text-slate-400">Bearer Token Validation</span>
                </div>
              </div>
            </Card>

          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" variant="primary">
              Salvar Credenciais com Segurança
            </Button>
          </div>
        </form>
      )}

      {/* Tab: Contracts & Legal Templates */}
      {activeTab === 'contracts' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* List of Templates */}
          <div className="space-y-3">
            <h3 className="text-base font-bold text-white">Modelos Disponíveis</h3>
            {MOCK_CONTRACT_TEMPLATES.map(template => (
              <div
                key={template.id}
                onClick={() => setSelectedTemplate(template)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedTemplate.id === template.id
                    ? 'bg-blue-900/30 border-blue-500 shadow-md'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-blue-400 border border-slate-700">
                    {template.type}
                  </span>
                  <span className="text-[10px] text-slate-500">{template.lastUpdated}</span>
                </div>
                <h4 className="text-sm font-bold text-white mt-2">{template.title}</h4>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{template.description}</p>
              </div>
            ))}
          </div>

          {/* Template Preview & Actions */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="bg-slate-900/90 border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
                <div>
                  <h3 className="text-base font-bold text-white">{selectedTemplate.title}</h3>
                  <p className="text-xs text-slate-400">{selectedTemplate.description}</p>
                </div>
                <Button
                  onClick={() => handleCopyContract(selectedTemplate.content, selectedTemplate.id)}
                  variant="secondary"
                  className="text-xs flex items-center gap-1.5"
                >
                  {copiedId === selectedTemplate.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {copiedId === selectedTemplate.id ? 'Copiado!' : 'Copiar Minuta'}
                </Button>
              </div>

              <div className="mt-4 p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto">
                {selectedTemplate.content}
              </div>
            </Card>
          </div>

        </div>
      )}

      {/* Tab: SaaS Plans */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <Card className="bg-slate-900 border-slate-800 p-6 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase text-slate-400">Plano Inicial</span>
                <h3 className="text-2xl font-black text-white mt-1">Starter</h3>
                <p className="text-3xl font-black text-white mt-4">€ 19<span className="text-sm font-normal text-slate-400">/mês</span></p>
                <p className="text-xs text-slate-400 mt-1">Até 5 viaturas ativas</p>

                <ul className="mt-6 space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Calculadora 5.0 (Uber/Bolt)</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Gestão de Recibos Verdes & IBANs</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> App do Motorista (Portal)</li>
                </ul>
              </div>
            </Card>

            <Card className="bg-slate-900 border-2 border-blue-500 p-6 relative flex flex-col justify-between shadow-2xl">
              <span className="absolute -top-3 right-6 bg-blue-600 text-white text-[10px] font-bold uppercase px-3 py-0.5 rounded-full shadow">
                Plano Atual da Frota
              </span>
              <div>
                <span className="text-xs font-bold uppercase text-blue-400">Profissional</span>
                <h3 className="text-2xl font-black text-white mt-1">Pro Fleet + AdTech</h3>
                <p className="text-3xl font-black text-white mt-4">€ 49<span className="text-sm font-normal text-slate-400">/mês</span></p>
                <p className="text-xs text-slate-400 mt-1">Até 25 viaturas ativas</p>

                <ul className="mt-6 space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Tudo do Plano Starter</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> <strong>Módulo AdTech & Ecrãs Passageiro</strong></li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Importação de Extratos (Uber/Bolt/Via Verde)</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Gestão de Dívidas & Cartões Combustível</li>
                </ul>
              </div>
            </Card>

            <Card className="bg-slate-900 border-slate-800 p-6 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase text-purple-400">Corporativo</span>
                <h3 className="text-2xl font-black text-white mt-1">Enterprise</h3>
                <p className="text-3xl font-black text-white mt-4">€ 99<span className="text-sm font-normal text-slate-400">/mês</span></p>
                <p className="text-xs text-slate-400 mt-1">Viaturas ilimitadas + Multi-Empresa</p>

                <ul className="mt-6 space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Suporte Dedicado 24/7</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> Multi-Frota com sub-contas</li>
                  <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400" /> API de Integração Direta com Bancos</li>
                </ul>
              </div>
            </Card>

          </div>
        </div>
      )}

      {/* Modal: Nova Frota SaaS */}
      {showAddCompanyModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" /> Registar Nova Empresa / Frota
              </h3>
              <button onClick={() => setShowAddCompanyModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateNewCompany} className="space-y-4 text-slate-200 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Nome da Frota</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Porto Prime TVDE"
                  value={newCompanyForm.name}
                  onChange={e => setNewCompanyForm({ ...newCompanyForm, name: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">NIF / NIPC</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: 512345678"
                  value={newCompanyForm.nipc}
                  onChange={e => setNewCompanyForm({ ...newCompanyForm, nipc: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Email de Contato</label>
                <input
                  type="email"
                  required
                  placeholder="admin@frota.pt"
                  value={newCompanyForm.email}
                  onChange={e => setNewCompanyForm({ ...newCompanyForm, email: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <Button type="button" variant="secondary" onClick={() => setShowAddCompanyModal(false)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary">
                  Adicionar Frota
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaasSettingsView;
