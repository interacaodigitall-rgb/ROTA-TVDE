import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useCompany } from '../../hooks/useCompany';
import { useIbans } from '../../hooks/useIbans';
import { MOCK_COMPANY_INFO } from '../../demoData';
import { 
  User as UserIcon, 
  Car, 
  ShieldCheck, 
  CreditCard, 
  Building2, 
  Tv, 
  LogOut, 
  Copy, 
  Check, 
  FileText,
  KeyRound,
  Sparkles,
  Phone,
  Mail,
  CheckCircle2
} from 'lucide-react';

export const DriverProfileView: React.FC = () => {
  const { user, logout, isDemo } = useAuth();
  const { currentCompany } = useCompany();
  const { ibans, loading: ibansLoading } = useIbans();
  const [copiedIban, setCopiedIban] = useState(false);
  const [copiedNipc, setCopiedNipc] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const myIban = user ? ibans.find(iban => iban.driverId === user.id) : null;
  const companyNipc = currentCompany.nipc || (isDemo ? MOCK_COMPANY_INFO.nipc : "517112604");
  const companyName = currentCompany.tradeName || currentCompany.name || (isDemo ? MOCK_COMPANY_INFO.name : "ASFALTO CATIVANTE - UNIPESSOAL LDA");
  const companyManager = currentCompany.manager || (isDemo ? MOCK_COMPANY_INFO.manager : "PAULO ROGÉRIO COSTA FERREIRA");

  const copyToClipboard = (text: string, type: 'iban' | 'nipc') => {
    navigator.clipboard.writeText(text);
    if (type === 'iban') {
      setCopiedIban(true);
      setTimeout(() => setCopiedIban(false), 2000);
    } else {
      setCopiedNipc(true);
      setTimeout(() => setCopiedNipc(false), 2000);
    }
  };

  const handleLogout = () => {
    logout();
    window.location.href = '/';
  };

  return (
    <div className="w-full text-slate-100 font-sans p-4 sm:p-6 lg:p-8 space-y-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Driver Header Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-black text-2xl shadow-lg border border-emerald-400/30 flex-shrink-0">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'TV'}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-white">{user?.name || 'Motorista TVDE'}</h2>
                  <span className="px-2.5 py-0.5 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-emerald-400">
                    {user?.matricula || '45-TX-90'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {user?.email || 'motorista@tvdecheck.pt'}
                  </span>
                  <span>•</span>
                  <span className="text-emerald-400 font-semibold">
                    Regime: {user?.type || 'Percentagem (Frota)'}
                  </span>
                </div>
              </div>
            </div>

            {/* Logout Trigger Header */}
            <button
              id="btn-profile-logout"
              onClick={() => setShowLogoutConfirm(true)}
              className="px-4 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-300 text-xs font-bold flex items-center gap-2 transition cursor-pointer self-stretch sm:self-auto justify-center"
            >
              <LogOut className="w-4 h-4" />
              <span>Terminar Sessão</span>
            </button>
          </div>
        </div>

        {/* Informações da Viatura */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-teal-950/80 border border-teal-500/40 text-teal-400">
                <Car className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Viatura TVDE Atribuída</h3>
                <p className="text-xs text-slate-400">Dados do veículo e cobertura de seguro</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
              ATIVA NA FROTA
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-slate-400 block font-medium">Modelo da Viatura</span>
              <p className="font-bold text-white text-sm">{user?.vehicleModel || 'Tesla Model 3 / Standard'}</p>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-slate-400 block font-medium">Matrícula</span>
              <p className="font-bold font-mono text-emerald-400 text-sm">{user?.matricula || '45-TX-90'}</p>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-slate-400 block font-medium">Seguradora & Apólice</span>
              <p className="font-bold text-white">{user?.insuranceCompany || 'Fidelidade Seguros'}</p>
              <p className="text-slate-400 font-mono text-[11px]">{user?.insurancePolicy || 'Apólice: 0089/2026/TVDE'}</p>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-slate-400 block font-medium">Cartão de Frota (Combustível/EV)</span>
              <p className="font-bold text-white">{user?.fleetCardCompany || 'Prio / Galp Frota'}</p>
              <p className="text-slate-400 font-mono text-[11px]">Nº: {user?.fleetCardNumber || '7081 2930 1928 3491'}</p>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-slate-400 block font-medium">Dísticos TVDE</span>
              <p className="font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Homologados & Afixados
              </p>
            </div>

            <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-slate-400 block font-medium">Inspeção Periódica Obrigatória</span>
              <p className="font-bold text-slate-200">Válida até 2026/11</p>
            </div>
          </div>
        </div>

        {/* Dados de Pagamento (IBAN) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-blue-950/80 border border-blue-500/40 text-blue-400">
                <CreditCard className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Dados Bancários para Pagamento</h3>
                <p className="text-xs text-slate-400">Conta bancária onde recebe as transferências semanais</p>
              </div>
            </div>
          </div>

          {ibansLoading ? (
            <p className="text-xs text-slate-400 py-2">A carregar dados bancários...</p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <span className="text-slate-400 block">Titular da Conta</span>
                  <p className="font-bold text-white text-sm">{myIban?.fullName || user?.name || 'Motorista TVDE'}</p>
                </div>
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <span className="text-slate-400 block">NIF do Titular</span>
                  <p className="font-bold font-mono text-white text-sm">{myIban?.nif || '245 890 123'}</p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] text-slate-400 block uppercase font-bold">IBAN Registado</span>
                  <span className="font-mono text-xs sm:text-sm font-bold text-emerald-400 break-all">
                    {myIban?.iban || 'PT50 0033 0000 4521 8976 1234 5'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(myIban?.iban || 'PT50 0033 0000 4521 8976 1234 5', 'iban')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold flex items-center gap-1.5 border border-slate-700 transition flex-shrink-0 cursor-pointer"
                >
                  {copiedIban ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedIban ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Dados para Emissão de Recibos Verdes */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-purple-950/80 border border-purple-500/40 text-purple-400">
                <Building2 className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Dados para Faturação (Recibos Verdes)</h3>
                <p className="text-xs text-slate-400">Dados da empresa parceira para emitir faturas no Portal das Finanças</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
              <span className="text-slate-400 block font-medium">Nome da Entidade Adquirente</span>
              <p className="font-bold text-white text-sm">{companyName}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block font-medium">NIPC</span>
                  <span className="font-mono text-sm font-bold text-purple-300">{companyNipc}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(companyNipc, 'nipc')}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold flex items-center gap-1 border border-slate-700 transition cursor-pointer"
                >
                  {copiedNipc ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedNipc ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>

              <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-slate-400 block font-medium">Gerência</span>
                <p className="font-bold text-white">{companyManager}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Monetização AdTech */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
                <Tv className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Tablet de Encosto & Publicidade</h3>
                <p className="text-xs text-slate-400">Monetização passiva através do ecrã do passageiro</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Ativo
            </span>
          </div>

          <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <span className="text-slate-300">Ganhos AdTech estimados para o ciclo semanal atual:</span>
            <span className="font-mono font-black text-emerald-400 text-sm">+€25.00 a €35.00</span>
          </div>
        </div>

        {/* Botão de Logout Fixo no Fim da Página */}
        <div className="pt-2">
          <button
            id="btn-logout-bottom"
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-red-950/60 border border-slate-800 hover:border-red-500/60 text-red-400 hover:text-red-300 font-bold text-sm flex items-center justify-center gap-2.5 shadow-xl transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Terminar Sessão na Plataforma</span>
          </button>
        </div>

      </div>

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
                Deseja sair do Portal do Motorista? A sua localização ficará offline até voltar a entrar.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 transition"
              >
                Sim, Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverProfileView;
