import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Phone, 
  FileText, 
  Fuel, 
  Car, 
  ExternalLink,
  Sparkles,
  Info
} from 'lucide-react';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface ChecklistItem {
  id: string;
  label: string;
  category: 'SEGURANCA' | 'DOCUMENTACAO' | 'VIATURA';
  description: string;
  mandatory: boolean;
}

const DEFAULT_ITEMS: ChecklistItem[] = [
  {
    id: 'extintor',
    label: 'Extintor de Incêndios 2kg Certificado',
    category: 'SEGURANCA',
    description: 'Com selo de validade do ano corrente afixado e manómetro no verde.',
    mandatory: true
  },
  {
    id: 'distico_tvde',
    label: 'Dístico TVDE Homologado (Dianteiro e Traseiro)',
    category: 'VIATURA',
    description: 'Afixado no canto inferior direito do para-brisas e óculo traseiro.',
    mandatory: true
  },
  {
    id: 'distico_tabaco',
    label: 'Aviso de Não Fumadores & Lotação Máxima',
    category: 'VIATURA',
    description: 'Sinalética regulamentar visível a partir do banco traseiro do veículo.',
    mandatory: true
  },
  {
    id: 'cmtvde_cc',
    label: 'Certificado de Motorista TVDE (CMTVDE) & CC',
    category: 'DOCUMENTACAO',
    description: 'Documentos físicos ou digitais válidos na app id.gov.pt.',
    mandatory: true
  },
  {
    id: 'apps_ativas',
    label: 'Aplicações Parceiras Operacionais (Uber / Bolt)',
    category: 'DOCUMENTACAO',
    description: 'Contas validadas sem pendências de documentos ou seguros.',
    mandatory: true
  },
  {
    id: 'colete_triangulo',
    label: 'Colete Retrorrefletor & Triângulo de Sinalização',
    category: 'SEGURANCA',
    description: 'Colete ao alcance do condutor no habitáculo e triângulo homologado.',
    mandatory: true
  },
  {
    id: 'folheto_reclamacoes',
    label: 'Livro de Reclamações & Folheto Informativo',
    category: 'DOCUMENTACAO',
    description: 'Acesso ao livro de reclamações eletrónico visível aos passageiros.',
    mandatory: true
  },
  {
    id: 'higiene_veiculo',
    label: 'Higienização & Limpeza da Viatura',
    category: 'VIATURA',
    description: 'Habitáculo aspirado, tapetes limpos, vidros transparentes e sem odores.',
    mandatory: false
  }
];

export const DriverRequirementsView: React.FC = () => {
  const [checkedIds, setCheckedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('rota_tvde_driver_checklist');
      if (saved) return JSON.parse(saved);
    } catch {}
    return ['extintor', 'distico_tvde', 'distico_tabaco', 'cmtvde_cc', 'apps_ativas'];
  });

  const [filterCategory, setFilterCategory] = useState<'ALL' | 'SEGURANCA' | 'DOCUMENTACAO' | 'VIATURA'>('ALL');

  useEffect(() => {
    try {
      localStorage.setItem('rota_tvde_driver_checklist', JSON.stringify(checkedIds));
    } catch {}
  }, [checkedIds]);

  const toggleItem = (id: string) => {
    setCheckedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setCheckedIds(DEFAULT_ITEMS.map(i => i.id));
  };

  const completedCount = checkedIds.length;
  const totalCount = DEFAULT_ITEMS.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  const filteredItems = filterCategory === 'ALL' 
    ? DEFAULT_ITEMS 
    : DEFAULT_ITEMS.filter(i => i.category === filterCategory);

  return (
    <div className="w-full text-slate-100 font-sans p-4 sm:p-6 lg:p-8 space-y-6 pb-24">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Banner do Progresso da Checklist */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
                  <ClipboardList className="w-5 h-5" />
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Requisitos & Equipamentos TVDE
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Checklist operacional diária de conformidade legal com o IMT e normas de qualidade da frota.
              </p>
            </div>

            <div className="text-left sm:text-right flex-shrink-0">
              <span className="text-2xl font-black text-emerald-400">{completedCount}/{totalCount}</span>
              <span className="text-xs text-slate-400 block font-medium">Itens Verificados</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-5 space-y-2">
            <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                {progressPercent === 100 ? (
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 100% Conforme para Serviço
                  </span>
                ) : (
                  <span>Regularize os itens pendentes antes de iniciar turno</span>
                )}
              </span>
              <button 
                onClick={handleSelectAll}
                className="text-emerald-400 hover:text-emerald-300 underline font-bold cursor-pointer"
              >
                Marcar Todos
              </button>
            </div>
          </div>
        </div>

        {/* Categorias de Filtro */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'ALL', label: 'Todos os Itens' },
            { id: 'SEGURANCA', label: 'Segurança & Extintor' },
            { id: 'VIATURA', label: 'Viatura & Dísticos' },
            { id: 'DOCUMENTACAO', label: 'Documentação' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                filterCategory === cat.id
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Lista Interativa de Itens */}
        <div className="space-y-3">
          {filteredItems.map(item => {
            const isChecked = checkedIds.includes(item.id);
            return (
              <div
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                  isChecked
                    ? 'bg-slate-900/90 border-emerald-500/40 shadow-sm'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className={`w-5 h-5 mt-0.5 rounded-lg border flex items-center justify-center transition-colors flex-shrink-0 ${
                    isChecked 
                      ? 'bg-emerald-500 border-emerald-500 text-slate-950' 
                      : 'border-slate-600 bg-slate-800/80'
                  }`}>
                    {isChecked && <CheckCircle2 className="w-4 h-4 text-slate-950 stroke-[3]" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm font-bold ${isChecked ? 'text-white' : 'text-slate-300'}`}>
                        {item.label}
                      </h4>
                      {item.mandatory && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">
                          LEGAL
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>

                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md flex-shrink-0 ${
                  isChecked ? 'text-emerald-400 bg-emerald-950/60' : 'text-slate-500 bg-slate-850'
                }`}>
                  {isChecked ? 'Verificado' : 'Pendente'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Secção de Avisos da Frota */}
        <div className="space-y-3 pt-4">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Comunicados & Avisos da Frota
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Aviso 1: Abastecimento */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-amber-400">
                <Fuel className="w-4 h-4" />
                <h4 className="text-xs font-bold text-white uppercase">Cartão Frota & Abastecimento</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Abasteça exclusivamente nos postos da rede autorizada (Prio / Galp). <strong>É estritamente obrigatório</strong> introduzir a quilometragem correta do odómetro no terminal de pagamento.
              </p>
            </div>

            {/* Aviso 2: Sinistros */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-rose-400">
                <AlertTriangle className="w-4 h-4" />
                <h4 className="text-xs font-bold text-white uppercase">Sinistros, Toques & Avarias</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Qualquer dano ou sinistro deve ser comunicado à central no prazo máximo de <strong>2 horas</strong>. Preencha a Declaração Amigável e fotografe matrículas e documentos dos intervenientes.
              </p>
            </div>

            {/* Aviso 3: Faturação */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-purple-400">
                <FileText className="w-4 h-4" />
                <h4 className="text-xs font-bold text-white uppercase">Recibos Verdes & Faturação</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Emita os recibos verdes no Portal das Finanças com o valor final do seu acerto semanal e envie o comprovativo em PDF até ao dia 5 de cada mês.
              </p>
            </div>

            {/* Aviso 4: Tablet AdTech */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <Sparkles className="w-4 h-4" />
                <h4 className="text-xs font-bold text-white uppercase">Tablet de Encosto (AdTech)</h4>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Mantenha o tablet sempre ligado à alimentação da viatura e com o ecrã ativo durante os serviços. Os bónus publicitários acumulam semanalmente no seu acerto.
              </p>
            </div>
          </div>
        </div>

        {/* Botão de Contactos SOS & Apoio */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-red-950/50 to-slate-900 border border-red-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider block">
              Central Operacional & Linha 24/7
            </span>
            <p className="text-sm font-bold text-white mt-0.5">
              Precisa de assistência na estrada ou apoio imediato?
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <a 
              href="tel:+351912345678"
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Central: 912 345 678</span>
            </a>
            <a 
              href="tel:808293949"
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
              <span>Seguro: 808 29 39 49</span>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DriverRequirementsView;
