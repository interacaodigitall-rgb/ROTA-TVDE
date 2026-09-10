import React, { useState } from 'react';
import { useIvaManagement } from '../../hooks/useIvaManagement';
import { BRAND_LOGOS } from '../../constants';
import { FiscalQuarter } from '../../types';
import Button from '../ui/Button';
import { 
  Receipt, 
  TrendingUp, 
  Calculator, 
  Download, 
  Printer, 
  Calendar, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Fuel, 
  Car, 
  Sliders, 
  Search, 
  HelpCircle,
  FileSpreadsheet,
  ArrowDownRight,
  ArrowUpRight,
  Percent
} from 'lucide-react';

export const IvaManagementView: React.FC = () => {
  const {
    loading,
    error,
    selectedYear,
    setSelectedYear,
    selectedQuarter,
    setSelectedQuarter,
    searchDriver,
    setSearchDriver,
    availableYears,
    fiscalSettings,
    setFiscalSettings,
    annualSummary,
    filteredWeeks,
    handleExportCsv,
    currentCompany
  } = useIvaManagement();

  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  const handlePrint = () => {
    window.print();
  };

  const isRefund = annualSummary.isReembolso;
  const saldoAbs = Math.abs(annualSummary.saldoIvaAnual);

  return (
    <div className="space-y-8 print:p-0 print:space-y-4">
      
      {/* HEADER WITH ENTERPRISE BRANDING & TITLE */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl shadow-xl backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <img 
            src={BRAND_LOGOS.DESKTOP} 
            alt="ROTA TVDE" 
            referrerPolicy="no-referrer"
            className="h-12 w-auto object-contain hidden sm:block filter drop-shadow"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Gestão Fiscal de IVA & Reembolso Anual
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                Autoridade Tributária (AT)
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Apuramento de IVA Liquidado (6% TVDE) vs. Dedutível nas despesas operacionais da frota {currentCompany?.tradeName || currentCompany?.name || 'Asfalto Cativante'}.
            </p>
          </div>
        </div>

        {/* YEAR SELECTOR & QUICK ACTIONS */}
        <div className="flex items-center gap-2.5 flex-wrap print:hidden">
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
            <Calendar className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400 font-semibold">Ano Fiscal:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
            >
              {availableYears.map(yr => (
                <option key={yr} value={yr} className="bg-slate-900 text-white">
                  {yr}
                </option>
              ))}
            </select>
          </div>

          <Button 
            onClick={() => setShowSettingsModal(!showSettingsModal)} 
            variant="secondary"
            className="text-xs flex items-center gap-1.5"
            title="Parâmetros de Dedução Fiscal"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-300" />
            <span className="hidden sm:inline">Parâmetros CIVA</span>
          </Button>

          <Button 
            onClick={handleExportCsv} 
            variant="secondary"
            className="text-xs flex items-center gap-1.5 text-emerald-300 border-emerald-800/80 hover:bg-emerald-950/40"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Exportar CSV</span>
          </Button>

          <Button 
            onClick={handlePrint} 
            variant="primary"
            className="text-xs flex items-center gap-1.5 shadow-lg shadow-blue-600/30"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir / PDF</span>
          </Button>
        </div>
      </div>

      {/* PARAMETRIZAÇÃO FISCAL ACCORDION / MODAL */}
      {showSettingsModal && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-blue-900/60 shadow-2xl space-y-4 animate-in fade-in duration-200">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white">Parâmetros Legais de Dedução de IVA (CIVA Portugal)</h3>
            </div>
            <button 
              onClick={() => setShowSettingsModal(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              &times; Fechar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <p className="text-slate-400 font-semibold mb-1">IVA Passageiros TVDE</p>
              <p className="text-lg font-black text-white">{(fiscalSettings.taxaIvaPassageiros * 100).toFixed(0)}% <span className="text-xs text-slate-400 font-normal">(Taxa Reduzida)</span></p>
              <p className="text-[10px] text-slate-500 mt-1">Aplicada sobre o faturamento bruto de passageiros (Uber / Bolt).</p>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <p className="text-slate-400 font-semibold mb-1">Dedução Gasóleo (Diesel)</p>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  step="5" 
                  min="0" 
                  max="100" 
                  value={Math.round(fiscalSettings.quotaDeducaoDiesel * 100)}
                  onChange={(e) => setFiscalSettings({ ...fiscalSettings, quotaDeducaoDiesel: Number(e.target.value) / 100 })}
                  className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white font-bold"
                />
                <span className="text-slate-300 font-bold">%</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Art. 21º CIVA: 50% do IVA contido a 23% para frotas licenciadas.</p>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <p className="text-slate-400 font-semibold mb-1">Dedução Eletricidade (VE)</p>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  step="5" 
                  min="0" 
                  max="100" 
                  value={Math.round(fiscalSettings.quotaDeducaoEletrico * 100)}
                  onChange={(e) => setFiscalSettings({ ...fiscalSettings, quotaDeducaoEletrico: Number(e.target.value) / 100 })}
                  className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white font-bold"
                />
                <span className="text-slate-300 font-bold">%</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">100% do IVA contido em postos de carregamento e fatura elétrica.</p>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <p className="text-slate-400 font-semibold mb-1">Portagens & Manutenção</p>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  step="5" 
                  min="0" 
                  max="100" 
                  value={Math.round(fiscalSettings.quotaDeducaoPortagens * 100)}
                  onChange={(e) => setFiscalSettings({ ...fiscalSettings, quotaDeducaoPortagens: Number(e.target.value) / 100, quotaDeducaoManutencao: Number(e.target.value) / 100 })}
                  className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white font-bold"
                />
                <span className="text-slate-300 font-bold">%</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">100% do IVA 23% contido nas portagens afetas e oficina.</p>
            </div>
          </div>
        </div>
      )}

      {/* CORE KPI CARDS WITH FINANCIAL RECOVERY HIGHLIGHT */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* CARD 1: SALDO FISCAL ACUMULADO / ESTIMATIVA DE REEMBOLSO (CORE REQUIREMENT) */}
        <div className={`p-6 rounded-2xl border shadow-2xl relative overflow-hidden flex flex-col justify-between ${
          isRefund 
            ? 'bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-950 border-emerald-500/50 text-white' 
            : 'bg-gradient-to-br from-amber-950/60 via-slate-900 to-slate-950 border-amber-500/50 text-white'
        }`}>
          <div>
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Saldo Fiscal Anual ({selectedYear})
              </span>
              <div className={`p-2 rounded-xl border ${
                isRefund 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/40'
              }`}>
                {isRefund ? <ArrowDownRight className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
              </div>
            </div>

            <div className="mt-3">
              <p className="text-3xl font-black tracking-tight text-white">
                €{saldoAbs.toFixed(2)}
              </p>
              
              <div className="mt-2.5">
                {isRefund ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Crédito a Recuperar / Reembolso Estimado
                  </span>
                ) : annualSummary.saldoIvaAnual > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                    IVA Estimado a Pagar às Finanças
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300">
                    Saldo Fiscal Equilibrado
                  </span>
                )}
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-800/80">
            {isRefund 
              ? 'As despesas com combustível, portagens e viaturas geraram mais IVA dedutível do que o IVA liquidado nas viagens.' 
              : 'O montante de IVA liquidado a 6% supera as deduções apuradas no período.'}
          </p>
        </div>

        {/* CARD 2: IVA LIQUIDADO TOTAL (6%) */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total IVA Liquidado (6%)
              </span>
              <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                <Receipt className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3">
              <p className="text-3xl font-black text-white">
                €{annualSummary.ivaLiquidadoTotal.toFixed(2)}
              </p>
              <div className="mt-2 text-xs text-slate-400 font-medium">
                Débito de transporte TVDE sobre €{annualSummary.totalFaturacaoBruta.toFixed(2)} brutos.
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-blue-400 font-semibold flex items-center justify-between">
            <span>{annualSummary.totalCalculos} acertos auditados</span>
            <span className="text-slate-500">Taxa legal 6%</span>
          </div>
        </div>

        {/* CARD 3: IVA DEDUTÍVEL TOTAL (CRÉDITO) */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total IVA Dedutível (Crédito)
              </span>
              <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-3">
              <p className="text-3xl font-black text-emerald-400">
                €{annualSummary.ivaDedutivelTotal.toFixed(2)}
              </p>
              <div className="mt-2 text-xs text-slate-400 font-medium">
                Recuperável em combustível, Via Verde, viaturas e oficina.
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-emerald-400 font-semibold flex items-center justify-between">
            <span>€{annualSummary.totalDespesasOperacionais.toFixed(2)} despesas totais</span>
            <span className="text-slate-500">CIVA Art. 19-21</span>
          </div>
        </div>

        {/* CARD 4: DISCRIMINAÇÃO DO CRÉDITO DE IVA */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">
              Origem das Deduções
            </span>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center gap-1.5"><Fuel className="w-3.5 h-3.5 text-amber-400" /> Combustível:</span>
                <span className="font-bold text-white">€{annualSummary.combustivelIvaTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center gap-1.5"><Car className="w-3.5 h-3.5 text-emerald-400" /> Portagens / Via Verde:</span>
                <span className="font-bold text-white">€{annualSummary.portagensIvaTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5 text-blue-400" /> Aluguer / Viaturas:</span>
                <span className="font-bold text-white">€{annualSummary.aluguerIvaTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center gap-1.5"><Sliders className="w-3.5 h-3.5 text-purple-400" /> Manutenção & Peças:</span>
                <span className="font-bold text-white">€{annualSummary.outrasDespesasIvaTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
            Valores prontos para o Contabilista Certificado.
          </div>
        </div>
      </div>

      {/* TRIMESTRAL REVIEW CARDS (DECLARAÇÃO PERIÓDICA AT) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>Visão Geral Trimestral (Declaração Periódica do IVA)</span>
            </h2>
            <p className="text-xs text-slate-400">
              Prazos oficiais e apuramento por trimestre fiscal para a Autoridade Tributária.
            </p>
          </div>

          {/* Quarter Pill Selector */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setSelectedQuarter('ALL')}
              className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                selectedQuarter === 'ALL' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Todos (Ano Inteiro)
            </button>
            {(['Q1', 'Q2', 'Q3', 'Q4'] as FiscalQuarter[]).map(q => (
              <button
                key={q}
                onClick={() => setSelectedQuarter(q)}
                className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                  selectedQuarter === q ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(['Q1', 'Q2', 'Q3', 'Q4'] as FiscalQuarter[]).map(q => {
            const qt = annualSummary.trimestres[q];
            const isQRefund = qt.status === 'REEMBOLSO';
            const isQPay = qt.status === 'PAGAMENTO';
            const saldoQtAbs = Math.abs(qt.saldoIva);
            const isSelected = selectedQuarter === q || selectedQuarter === 'ALL';

            return (
              <div 
                key={q}
                onClick={() => setSelectedQuarter(selectedQuarter === q ? 'ALL' : q)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                  selectedQuarter === q 
                    ? 'bg-slate-850 border-blue-500 shadow-xl ring-2 ring-blue-500/20' 
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-xs font-black text-blue-400 uppercase tracking-wider">{q}</span>
                    <h3 className="text-sm font-bold text-white">{qt.label}</h3>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                    isQRefund 
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800' 
                      : isQPay 
                        ? 'bg-amber-950 text-amber-300 border-amber-800' 
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {isQRefund ? 'A Recuperar' : isQPay ? 'A Pagar' : 'Sem Dados'}
                  </span>
                </div>

                <div className="space-y-2 text-xs mt-3">
                  <div className="flex justify-between text-slate-400">
                    <span>Prazo de Entrega:</span>
                    <span className="font-semibold text-slate-200">{qt.dataLimiteEntrega}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Faturação Bruta:</span>
                    <span className="font-bold text-white">€{qt.totalFaturacao.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>IVA Liquidado (6%):</span>
                    <span className="font-semibold text-blue-300">€{qt.ivaLiquidado.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>IVA Dedutível:</span>
                    <span className="font-semibold text-emerald-400">€{qt.ivaDedutivel.toFixed(2)}</span>
                  </div>
                </div>

                {/* Saldo Trimestral Destaque */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-between items-baseline">
                  <span className="text-xs font-semibold text-slate-400">Saldo Trimestre:</span>
                  <span className={`text-base font-black ${
                    isQRefund ? 'text-emerald-400' : isQPay ? 'text-amber-400' : 'text-slate-400'
                  }`}>
                    {isQRefund ? '-' : ''}€{saldoQtAbs.toFixed(2)}
                  </span>
                </div>

                <div className="mt-2 text-[10px] text-slate-500 text-right">
                  {qt.numCalculos} semanas apuradas
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* DETAILED WEEKLY AUDIT TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-400" />
              <span>Histórico Semanal de Apuramento do IVA</span>
            </h3>
            <p className="text-xs text-slate-400">
              Discriminação de todas as semanas do ano fiscal {selectedYear} com base nas faturas de transporte e despesas.
            </p>
          </div>

          {/* Search bar inside table header */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchDriver}
              onChange={(e) => setSearchDriver(e.target.value)}
              placeholder="Filtrar condutor ou matrícula..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            {searchDriver && (
              <button
                type="button"
                onClick={() => setSearchDriver('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
              >
                &times;
              </button>
            )}
          </div>
        </div>

        {/* Table Content - Desktop View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                <th scope="col" className="py-3 px-3 text-left">Condutor / Viatura</th>
                <th scope="col" className="py-3 px-3 text-left">Período</th>
                <th scope="col" className="py-3 px-3 text-center">Trimestre</th>
                <th scope="col" className="py-3 px-3 text-right">Faturação TVDE</th>
                <th scope="col" className="py-3 px-3 text-right">IVA Liquidado (6%)</th>
                <th scope="col" className="py-3 px-3 text-right">IVA Combustível</th>
                <th scope="col" className="py-3 px-3 text-right">IVA Portagens</th>
                <th scope="col" className="py-3 px-3 text-right">Total Dedutível</th>
                <th scope="col" className="py-3 px-3 text-right font-bold text-white">Saldo da Semana</th>
                <th scope="col" className="py-3 px-3 text-center">Situação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr><td colSpan={10} className="text-center py-8 text-slate-400">A carregar apuramentos fiscais...</td></tr>
              ) : filteredWeeks.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-slate-500">
                    Nenhum cálculo semanal encontrado para o ano fiscal {selectedYear} com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredWeeks.map((week) => {
                  const isWeekRefund = week.statusSemana === 'A_RECUPERAR';
                  const isWeekPay = week.statusSemana === 'A_PAGAR';
                  const saldoWeekAbs = Math.abs(week.saldoIvaSemana);

                  const pStart = week.periodStart?.toDate ? week.periodStart.toDate().toLocaleDateString('pt-PT') : new Date(week.periodStart).toLocaleDateString('pt-PT');
                  const pEnd = week.periodEnd?.toDate ? week.periodEnd.toDate().toLocaleDateString('pt-PT') : new Date(week.periodEnd).toLocaleDateString('pt-PT');

                  return (
                    <tr key={week.calculationId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-bold text-white">{week.driverName}</div>
                        {week.matricula && <div className="text-[10px] font-mono text-slate-400">{week.matricula}</div>}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-slate-300">
                        {pStart} a {pEnd}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-blue-300 border border-slate-700">
                          {week.trimestre}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-right font-medium text-slate-200">
                        €{week.faturacaoBruta.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-right font-semibold text-blue-400">
                        €{week.ivaLiquidado.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-right text-slate-300">
                        €{week.combustivelIvaDedutivel.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-right text-slate-300">
                        €{week.portagensIvaDedutivel.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-right font-semibold text-emerald-400">
                        €{week.totalIvaDedutivel.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-right font-black text-white">
                        {isWeekRefund ? '-' : ''}€{saldoWeekAbs.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isWeekRefund 
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800' 
                            : isWeekPay 
                              ? 'bg-amber-950 text-amber-300 border-amber-800' 
                              : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {isWeekRefund ? 'A Recuperar' : isWeekPay ? 'A Pagar' : 'Nulo'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile View - Card-Based Layout (md:hidden) */}
        <div className="md:hidden space-y-3">
          {loading ? (
            <p className="text-center py-8 text-slate-400 text-xs">A carregar apuramentos fiscais...</p>
          ) : filteredWeeks.length === 0 ? (
            <p className="text-center py-8 text-slate-500 text-xs">
              Nenhum cálculo semanal encontrado para o ano fiscal {selectedYear}.
            </p>
          ) : (
            filteredWeeks.map((week) => {
              const isWeekRefund = week.statusSemana === 'A_RECUPERAR';
              const isWeekPay = week.statusSemana === 'A_PAGAR';
              const saldoWeekAbs = Math.abs(week.saldoIvaSemana);

              const pStart = week.periodStart?.toDate ? week.periodStart.toDate().toLocaleDateString('pt-PT') : new Date(week.periodStart).toLocaleDateString('pt-PT');
              const pEnd = week.periodEnd?.toDate ? week.periodEnd.toDate().toLocaleDateString('pt-PT') : new Date(week.periodEnd).toLocaleDateString('pt-PT');

              return (
                <div key={week.calculationId} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{week.driverName}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {week.matricula && (
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                            {week.matricula}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">
                          {pStart} - {pEnd}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-blue-300 border border-slate-700">
                        {week.trimestre}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        isWeekRefund 
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800' 
                          : isWeekPay 
                            ? 'bg-amber-950 text-amber-300 border-amber-800' 
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {isWeekRefund ? 'A Recuperar' : isWeekPay ? 'A Pagar' : 'Nulo'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-850">
                    <div className="bg-slate-900/80 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-400 block">Faturação TVDE</span>
                      <span className="font-semibold text-slate-200">€{week.faturacaoBruta.toFixed(2)}</span>
                    </div>
                    <div className="bg-slate-900/80 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-400 block">IVA Liquidado (6%)</span>
                      <span className="font-semibold text-blue-400">€{week.ivaLiquidado.toFixed(2)}</span>
                    </div>
                    <div className="bg-slate-900/80 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-400 block">IVA Dedutível Total</span>
                      <span className="font-semibold text-emerald-400">€{week.totalIvaDedutivel.toFixed(2)}</span>
                    </div>
                    <div className="bg-slate-900/80 p-2 rounded-lg">
                      <span className="text-[10px] text-slate-400 block">Saldo Semanal</span>
                      <span className={`font-bold ${isWeekRefund ? 'text-emerald-400' : isWeekPay ? 'text-amber-400' : 'text-slate-300'}`}>
                        {isWeekRefund ? '-' : ''}€{saldoWeekAbs.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
};

export default IvaManagementView;
