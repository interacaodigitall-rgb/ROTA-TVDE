import { useState, useMemo } from 'react';
import { useCalculations } from './useCalculations';
import { useCompany } from './useCompany';
import { 
  FiscalSettings, 
  FiscalQuarter, 
  AnnualIvaSummary, 
  QuarterlyIvaSummary,
  WeeklyIvaRecord 
} from '../types';
import { 
  DEFAULT_FISCAL_SETTINGS, 
  aggregateAnnualIva, 
  exportIvaToCsv, 
  triggerCsvDownload,
  toJsDate
} from '../utils/ivaUtils';

export const useIvaManagement = () => {
  const { calculations, loading, error } = useCalculations();
  const { currentCompany } = useCompany();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedQuarter, setSelectedQuarter] = useState<FiscalQuarter | 'ALL'>('ALL');
  const [fiscalSettings, setFiscalSettings] = useState<FiscalSettings>(DEFAULT_FISCAL_SETTINGS);
  const [searchDriver, setSearchDriver] = useState<string>('');

  // Identificar anos fiscais presentes na base de dados
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    yearsSet.add(currentYear);
    yearsSet.add(currentYear - 1);

    calculations.forEach(calc => {
      const refDate = calc.periodEnd || calc.date || calc.periodStart;
      const d = toJsDate(refDate);
      if (!isNaN(d.getFullYear())) {
        yearsSet.add(d.getFullYear());
      }
    });

    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [calculations, currentYear]);

  // Resumo anual completo calculado
  const annualSummary: AnnualIvaSummary = useMemo(() => {
    return aggregateAnnualIva(calculations, selectedYear, fiscalSettings);
  }, [calculations, selectedYear, fiscalSettings]);

  // Lista de semanas filtradas pelo trimestre e pesquisa de motorista
  const filteredWeeks: WeeklyIvaRecord[] = useMemo(() => {
    let weeks: WeeklyIvaRecord[] = [];

    if (selectedQuarter === 'ALL') {
      (['Q1', 'Q2', 'Q3', 'Q4'] as FiscalQuarter[]).forEach(q => {
        weeks.push(...annualSummary.trimestres[q].semanas);
      });
    } else {
      weeks = [...annualSummary.trimestres[selectedQuarter].semanas];
    }

    if (searchDriver.trim()) {
      const q = searchDriver.toLowerCase();
      weeks = weeks.filter(w => 
        w.driverName.toLowerCase().includes(q) || 
        (w.matricula && w.matricula.toLowerCase().includes(q))
      );
    }

    // Ordenar decrescente por data de fim de período
    return weeks.sort((a, b) => {
      const timeA = toJsDate(a.periodEnd).getTime();
      const timeB = toJsDate(b.periodEnd).getTime();
      return timeB - timeA;
    });
  }, [annualSummary, selectedQuarter, searchDriver]);

  // Exportar relatório em formato CSV
  const handleExportCsv = () => {
    const companyName = currentCompany?.tradeName || currentCompany?.name || 'Asfalto Cativante - Unipessoal Lda';
    const nipc = currentCompany?.nipc || '517112604';
    const csv = exportIvaToCsv(annualSummary, companyName, nipc);
    const fileName = `declaracao_iva_${selectedYear}_${companyName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.csv`;
    triggerCsvDownload(csv, fileName);
  };

  return {
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
  };
};
