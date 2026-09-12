import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Plus, 
  Edit3, 
  DollarSign, 
  Car, 
  TrendingUp, 
  ExternalLink, 
  Download, 
  CheckCircle2, 
  X, 
  Search,
  ShieldCheck,
  FileSpreadsheet,
  Percent
} from 'lucide-react';
import { Establishment, EstablishmentCategory, PrivateRide } from '../../types';
import { establishmentService } from '../../services/establishmentService';
import { dispatchService } from '../../services/dispatchService';

export const B2BAdminView: React.FC = () => {
  const [establishments, setEstablishments] = useState<Establishment[]>(establishmentService.getAll());
  const [rides, setRides] = useState<PrivateRide[]>(dispatchService.getAllRides());
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Modal State for New / Edit Partner
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formTradeName, setFormTradeName] = useState('');
  const [formCategory, setFormCategory] = useState<EstablishmentCategory>('HOTEL');
  const [formLogoUrl, setFormLogoUrl] = useState('');
  const [formFixedAddress, setFormFixedAddress] = useState('');
  const [formLat, setFormLat] = useState(38.7212);
  const [formLng, setFormLng] = useState(-9.1465);
  const [formContactPhone, setFormContactPhone] = useState('');
  const [formContactEmail, setFormContactEmail] = useState('');
  const [formAccountManager, setFormAccountManager] = useState('');
  const [formCommissionRate, setFormCommissionRate] = useState(10);
  const [formBillingNif, setFormBillingNif] = useState('');
  const [formBillingAddress, setFormBillingAddress] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Open Modal for New Establishment
  const handleOpenNew = () => {
    setEditingId(null);
    setFormName('');
    setFormTradeName('');
    setFormCategory('HOTEL');
    setFormLogoUrl('');
    setFormFixedAddress('');
    setFormLat(38.7212);
    setFormLng(-9.1465);
    setFormContactPhone('+351 ');
    setFormContactEmail('');
    setFormAccountManager('Equipa Asfalto VIP');
    setFormCommissionRate(10);
    setFormBillingNif('');
    setFormBillingAddress('');
    setFormNotes('');
    setShowModal(true);
  };

  // Open Modal to Edit Existing
  const handleOpenEdit = (est: Establishment) => {
    setEditingId(est.id);
    setFormName(est.name);
    setFormTradeName(est.tradeName || '');
    setFormCategory(est.category);
    setFormLogoUrl(est.logoUrl);
    setFormFixedAddress(est.fixedPickupAddress);
    setFormLat(est.fixedPickupCoords.lat);
    setFormLng(est.fixedPickupCoords.lng);
    setFormContactPhone(est.contactPhone);
    setFormContactEmail(est.contactEmail);
    setFormAccountManager(est.accountManager || '');
    setFormCommissionRate(est.commissionRatePercent);
    setFormBillingNif(est.billingNif || '');
    setFormBillingAddress(est.billingAddress || '');
    setFormNotes(est.notes || '');
    setShowModal(true);
  };

  // Save Partner
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim() || !formFixedAddress.trim()) {
      alert('Nome e Morada Fixa são campos obrigatórios.');
      return;
    }

    if (editingId) {
      establishmentService.updateEstablishment(editingId, {
        name: formName.trim(),
        tradeName: formTradeName.trim() || undefined,
        category: formCategory,
        logoUrl: formLogoUrl.trim() || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&auto=format&fit=crop&q=80',
        fixedPickupAddress: formFixedAddress.trim(),
        fixedPickupCoords: { lat: Number(formLat), lng: Number(formLng) },
        contactPhone: formContactPhone.trim(),
        contactEmail: formContactEmail.trim(),
        accountManager: formAccountManager.trim(),
        commissionRatePercent: Number(formCommissionRate),
        billingNif: formBillingNif.trim(),
        billingAddress: formBillingAddress.trim(),
        notes: formNotes.trim()
      });
    } else {
      establishmentService.addEstablishment({
        name: formName.trim(),
        tradeName: formTradeName.trim() || undefined,
        category: formCategory,
        logoUrl: formLogoUrl.trim() || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200&auto=format&fit=crop&q=80',
        fixedPickupAddress: formFixedAddress.trim(),
        fixedPickupCoords: { lat: Number(formLat), lng: Number(formLng) },
        contactPhone: formContactPhone.trim(),
        contactEmail: formContactEmail.trim(),
        accountManager: formAccountManager.trim(),
        commissionRatePercent: Number(formCommissionRate),
        billingNif: formBillingNif.trim(),
        billingAddress: formBillingAddress.trim(),
        status: 'ACTIVE',
        notes: formNotes.trim()
      });
    }

    setEstablishments([...establishmentService.getAll()]);
    setShowModal(false);
  };

  // Metrics grouped by establishment
  const statsPerEstablishment = useMemo(() => {
    return establishments.map(est => {
      const estRides = rides.filter(r => r.establishmentId === est.id);
      const completed = estRides.filter(r => r.status === 'concluido');
      const totalVolume = estRides.reduce((sum, r) => sum + (r.valorTotal || 0), 0);
      const totalCommission = estRides.reduce((sum, r) => sum + (r.b2bCommissionValue || (r.valorTotal * est.commissionRatePercent / 100)), 0);
      const netFleetRevenue = totalVolume - totalCommission;

      return {
        establishment: est,
        totalRides: estRides.length,
        completedCount: completed.length,
        totalVolume,
        totalCommission,
        netFleetRevenue,
        lastRide: estRides[0]
      };
    });
  }, [establishments, rides]);

  // Overall Totals
  const overallStats = useMemo(() => {
    const b2bRides = rides.filter(r => r.isB2B);
    const totalVolume = b2bRides.reduce((sum, r) => sum + (r.valorTotal || 0), 0);
    const totalCommissions = b2bRides.reduce((sum, r) => sum + (r.b2bCommissionValue || 0), 0);
    const netRevenue = totalVolume - totalCommissions;

    return {
      activePartners: establishments.filter(e => e.status === 'ACTIVE').length,
      totalRides: b2bRides.length,
      totalVolume,
      totalCommissions,
      netRevenue
    };
  }, [rides, establishments]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Estabelecimento', 'Categoria', 'Morada Fixa', 'Comissão (%)', 'Total Viagens', 'Volume Faturado (€)', 'Comissões Parceiro (€)', 'Receita Líquida Frota (€)'];
    const rows = statsPerEstablishment.map(s => [
      `"${s.establishment.name}"`,
      s.establishment.category,
      `"${s.establishment.fixedPickupAddress}"`,
      `${s.establishment.commissionRatePercent}%`,
      s.totalRides,
      s.totalVolume.toFixed(2),
      s.totalCommission.toFixed(2),
      s.netFleetRevenue.toFixed(2)
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `relatorio_b2b_concierge_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn text-slate-100">
      {/* Top Banner & Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-black uppercase tracking-wider">
              Módulo Corporativo
            </span>
            <span className="text-xs text-slate-400">ROTA TVDE 5.0</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Gestão B2B: Concierge, Hotéis & Restaurantes
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Painel unificado de parceiros de hotelaria com morada fixa de recolha, rastreio exclusivo para hóspedes e liquidação mensal de comissões.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-2 border border-slate-700"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={handleOpenNew}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black shadow-lg shadow-purple-600/30 transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Estabelecimento Parceiro</span>
          </button>
        </div>
      </div>

      {/* Global B2B Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Parceiros Ativos
          </span>
          <span className="text-3xl font-black text-white block">
            {overallStats.activePartners}
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">Hotéis, Restaurantes e VIP Lounges</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block mb-1">
            Volume Bruto B2B
          </span>
          <span className="text-3xl font-black text-white block">
            €{overallStats.totalVolume.toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">{overallStats.totalRides} viagens corporativas</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-1">
            Comissões dos Parceiros
          </span>
          <span className="text-3xl font-black text-amber-400 block">
            €{overallStats.totalCommissions.toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">A creditar no fim do mês</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">
            Receita Líquida da Frota
          </span>
          <span className="text-3xl font-black text-emerald-400 block">
            €{overallStats.netRevenue.toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-400 mt-1 block">Margem líquida da empresa</span>
        </div>
      </div>

      {/* Partners List & Reports Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="font-extrabold text-white text-base">Estabelecimentos Cadastrados & Comissionamento</h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold">
              {statsPerEstablishment.length} Parceiros
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filtrar por nome ou morada..."
                className="pl-8 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-850 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Estabelecimento</th>
                <th className="py-3.5 px-4">Morada Fixa de Recolha</th>
                <th className="py-3.5 px-4 text-center">Comissão</th>
                <th className="py-3.5 px-4 text-center">Transfers</th>
                <th className="py-3.5 px-4 text-right">Volume (€)</th>
                <th className="py-3.5 px-4 text-right">Comissão Hotel (€)</th>
                <th className="py-3.5 px-4 text-right">Líquido Frota (€)</th>
                <th className="py-3.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {statsPerEstablishment
                .filter(s => {
                  if (search && !s.establishment.name.toLowerCase().includes(search.toLowerCase()) && !s.establishment.fixedPickupAddress.toLowerCase().includes(search.toLowerCase())) return false;
                  return true;
                })
                .map(s => (
                  <tr key={s.establishment.id} className="hover:bg-slate-850/50 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 flex-shrink-0">
                          <img
                            src={s.establishment.logoUrl}
                            alt={s.establishment.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <span className="font-bold text-white text-sm block">{s.establishment.name}</span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            {s.establishment.category === 'HOTEL' ? 'Hotel 5 Estrelas' : 'Restaurante Executivo'}
                            {s.establishment.billingNif && ` • NIF ${s.establishment.billingNif}`}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <span className="text-slate-300 font-medium block truncate">
                        {s.establishment.fixedPickupAddress}
                      </span>
                      <span className="text-[10px] text-purple-400 font-mono">
                        {s.establishment.fixedPickupCoords.lat.toFixed(4)}, {s.establishment.fixedPickupCoords.lng.toFixed(4)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-purple-950/80 border border-purple-800 text-purple-300 font-black text-xs">
                        {s.establishment.commissionRatePercent}%
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-white">
                      {s.totalRides}
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-white">
                      €{s.totalVolume.toFixed(2)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-black text-amber-400">
                      €{s.totalCommission.toFixed(2)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-black text-emerald-400">
                      €{s.netFleetRevenue.toFixed(2)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            establishmentService.setActiveId(s.establishment.id);
                            window.location.href = '/concierge';
                          }}
                          title="Aceder ao Portal Concierge deste parceiro"
                          className="px-2.5 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 transition text-xs font-bold flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Portal</span>
                        </button>

                        <button
                          onClick={() => handleOpenEdit(s.establishment)}
                          title="Editar Estabelecimento"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CRIAR / EDITAR ESTABELECIMENTO */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 animate-fadeIn text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-lg">
                    {editingId ? 'Editar Estabelecimento B2B' : 'Cadastrar Novo Parceiro Concierge'}
                  </h3>
                  <p className="text-xs text-slate-400">Configuração de morada fixa e taxa de comissão</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 uppercase tracking-wider block">
                    Nome Oficial do Estabelecimento *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="ex: Hotel Tivoli Avenida Liberdade"
                    className="w-full px-3 py-2 bg-slate-850 border border-slate-700 rounded-xl text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 uppercase tracking-wider block">
                    Categoria
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as EstablishmentCategory)}
                    className="w-full px-3 py-2 bg-slate-850 border border-slate-700 rounded-xl text-white font-bold"
                  >
                    <option value="HOTEL">Hotel / Resort</option>
                    <option value="RESTAURANT">Restaurante / Fine Dining</option>
                    <option value="VIP_LOUNGE">VIP Lounge / Clube Privado</option>
                    <option value="CORPORATE">Sede Corporativa</option>
                  </select>
                </div>
              </div>

              {/* MORADA FIXA DE RECOLHA */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Morada Fixa de Recolha (Bloqueada no Concierge) *</span>
                </label>
                <input
                  type="text"
                  required
                  value={formFixedAddress}
                  onChange={(e) => setFormFixedAddress(e.target.value)}
                  placeholder="ex: Av. da Liberdade 185, 1269-050 Lisboa"
                  className="w-full px-3 py-2 bg-slate-850 border border-slate-700 rounded-xl text-white"
                />
              </div>

              {/* COORDENADAS GPS */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-400 block">Latitude GPS</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formLat}
                    onChange={(e) => setFormLat(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-850 border border-slate-700 rounded-xl text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-400 block">Longitude GPS</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formLng}
                    onChange={(e) => setFormLng(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-850 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              {/* TAXA DE COMISSÃO & NIF */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-emerald-400 uppercase tracking-wider block">
                    Taxa de Comissão do Parceiro (%) *
                  </label>
                  <div className="relative">
                    <Percent className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="number"
                      min="0"
                      max="50"
                      required
                      value={formCommissionRate}
                      onChange={(e) => setFormCommissionRate(Number(e.target.value))}
                      className="w-full pl-8 pr-3 py-2 bg-slate-850 border border-slate-700 rounded-xl text-white font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 uppercase tracking-wider block">
                    NIF da Empresa
                  </label>
                  <input
                    type="text"
                    value={formBillingNif}
                    onChange={(e) => setFormBillingNif(e.target.value)}
                    placeholder="ex: 502345678"
                    className="w-full px-3 py-2 bg-slate-850 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              {/* CONTACTOS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Telefone do Concierge</label>
                  <input
                    type="text"
                    value={formContactPhone}
                    onChange={(e) => setFormContactPhone(e.target.value)}
                    placeholder="+351 213 198 900"
                    className="w-full px-3 py-2 bg-slate-850 border border-slate-700 rounded-xl text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-300 block">Email Oficial</label>
                  <input
                    type="email"
                    value={formContactEmail}
                    onChange={(e) => setFormContactEmail(e.target.value)}
                    placeholder="concierge@hotel.com"
                    className="w-full px-3 py-2 bg-slate-850 border border-slate-700 rounded-xl text-white"
                  />
                </div>
              </div>

              {/* LOGO URL */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">URL do Logótipo / Foto da Fachada</label>
                <input
                  type="url"
                  value={formLogoUrl}
                  onChange={(e) => setFormLogoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-slate-850 border border-slate-700 rounded-xl text-white"
                />
              </div>

              {/* NOTAS */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300 block">Instruções de Embarque para os Motoristas</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="ex: Apresentar-se no pórtico principal. Solicitar ao valet parking para anunciar a matrícula."
                  className="w-full px-3 py-2 bg-slate-850 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black shadow-lg shadow-purple-600/30 cursor-pointer"
                >
                  {editingId ? 'Salvar Alterações' : 'Criar Estabelecimento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
