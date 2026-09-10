import { 
  Calculation, 
  FiscalSettings, 
  FiscalQuarter, 
  WeeklyIvaRecord, 
  QuarterlyIvaSummary, 
  AnnualIvaSummary,
  FuelType 
} from '../types';

export const DEFAULT_FISCAL_SETTINGS: FiscalSettings = {
  taxaIvaPassageiros: 0.06, // 6% Taxa reduzida em Portugal (transporte TVDE)
  taxaNormalIva: 0.23, // 23% Taxa normal em Portugal continental
  quotaDeducaoDiesel: 0.50, // 50% legalmente dedutível (Art. 21º, nº 1, al. b do CIVA)
  quotaDeducaoEletrico: 1.00, // 100% dedutível para eletricidade e veículos 100% elétricos
  quotaDeducaoPortagens: 1.00, // 100% dedutível do IVA 23% contido nas portagens afetas à atividade
  quotaDeducaoAluguer: 1.00, // 100% dedutível do IVA 23% contido no aluguer operacional
  quotaDeducaoManutencao: 1.00 // 100% dedutível em peças, oficina e consumíveis
};

export const QUARTERS_META: Record<FiscalQuarter, { label: string; deadline: string; months: string; startMonth: number; endMonth: number }> = {
  Q1: {
    label: '1º Trimestre (Jan - Mar)',
    deadline: '15 de Maio',
    months: 'Janeiro, Fevereiro, Março',
    startMonth: 0,
    endMonth: 2
  },
  Q2: {
    label: '2º Trimestre (Abr - Jun)',
    deadline: '15 de Agosto',
    months: 'Abril, Maio, Junho',
    startMonth: 3,
    endMonth: 5
  },
  Q3: {
    label: '3º Trimestre (Jul - Set)',
    deadline: '15 de Novembro',
    months: 'Julho, Agosto, Setembro',
    startMonth: 6,
    endMonth: 8
  },
  Q4: {
    label: '4º Trimestre (Out - Dez)',
    deadline: '15 de Fevereiro (ano n+1)',
    months: 'Outubro, Novembro, Dezembro',
    startMonth: 9,
    endMonth: 11
  }
};

/**
 * Extrai o montante de IVA contido num valor com IVA incluído
 * Ex: valorComIva / (1 + taxa) * taxa
 */
export const extractIvaFromGross = (grossAmount: number, rate = 0.23): number => {
  if (!grossAmount || grossAmount <= 0) return 0;
  return (grossAmount / (1 + rate)) * rate;
};

/**
 * Converte Timestamp do Firestore ou data genérica para Date de JS
 */
export const toJsDate = (dateOrTimestamp: any): Date => {
  if (!dateOrTimestamp) return new Date();
  if (typeof dateOrTimestamp.toDate === 'function') {
    return dateOrTimestamp.toDate();
  }
  if (dateOrTimestamp instanceof Date) {
    return dateOrTimestamp;
  }
  return new Date(dateOrTimestamp);
};

/**
 * Determina o Ano Fiscal e o Trimestre correspondente a uma data
 */
export const getFiscalYearAndQuarter = (dateOrTimestamp: any): { year: number; quarter: FiscalQuarter } => {
  const date = toJsDate(dateOrTimestamp);
  const year = date.getFullYear();
  const month = date.getMonth(); // 0 a 11

  let quarter: FiscalQuarter = 'Q1';
  if (month >= 0 && month <= 2) quarter = 'Q1';
  else if (month >= 3 && month <= 5) quarter = 'Q2';
  else if (month >= 6 && month <= 8) quarter = 'Q3';
  else quarter = 'Q4';

  return { year, quarter };
};

/**
 * Calcula o apuramento de IVA semanal de um documento de cálculo específico
 */
export const computeWeeklyIva = (
  calc: Calculation,
  settings: FiscalSettings = DEFAULT_FISCAL_SETTINGS
): WeeklyIvaRecord => {
  const referenceDate = calc.periodEnd || calc.date || calc.periodStart;
  const { year: calculatedYear, quarter: calculatedQuarter } = getFiscalYearAndQuarter(referenceDate);

  const anoFiscal = calc.anoFiscal || calculatedYear;
  const trimestre = (calc.trimestre as FiscalQuarter) || calculatedQuarter;

  // 1. Ganhos Brutos e IVA Liquidado (Débito a favor do Estado Português)
  const uberGross = calc.uberRides || 0;
  const boltGross = calc.boltRides || 0;
  const faturacaoBruta = uberGross + boltGross;

  // Em TVDE em Portugal a taxa aplicável aos serviços de transporte é a taxa reduzida de 6%
  const ivaLiquidado = !calc.isIvaExempt ? faturacaoBruta * settings.taxaIvaPassageiros : 0;

  // 2. Despesas Elegíveis e IVA Dedutível (Crédito a favor da Frota)
  
  // A. Combustível / Cartão Frota (Prio / Galp / Repsol)
  const combustivelTotal = calc.fleetCard || 0;
  const isElectric = calc.fuelType === FuelType.ELECTRIC;
  const quotaCombustivel = isElectric ? settings.quotaDeducaoEletrico : settings.quotaDeducaoDiesel;
  const combustivelIvaBruto = extractIvaFromGross(combustivelTotal, settings.taxaNormalIva);
  const combustivelIvaDedutivel = combustivelIvaBruto * quotaCombustivel;

  // B. Via Verde / Portagens
  const portagensTotal = calc.rentalTolls || 0;
  const portagensIvaBruto = extractIvaFromGross(portagensTotal, settings.taxaNormalIva);
  const portagensIvaDedutivel = portagensIvaBruto * settings.quotaDeducaoPortagens;

  // C. Aluguer / Slot de Viaturas
  const aluguerTotal = calc.vehicleRental || 0;
  const aluguerIvaBruto = extractIvaFromGross(aluguerTotal, settings.taxaNormalIva);
  const aluguerIvaDedutivel = aluguerIvaBruto * settings.quotaDeducaoAluguer;

  // D. Outras Despesas (Peças, Oficina, Lavagens, Despesas Operacionais)
  const outrasDespesasTotal = calc.otherExpenses || 0;
  const outrasDespesasIvaBruto = extractIvaFromGross(outrasDespesasTotal, settings.taxaNormalIva);
  const outrasDespesasIvaDedutivel = outrasDespesasIvaBruto * settings.quotaDeducaoManutencao;

  // Total do IVA Dedutível
  const totalIvaDedutivel = 
    combustivelIvaDedutivel + 
    portagensIvaDedutivel + 
    aluguerIvaDedutivel + 
    outrasDespesasIvaDedutivel;

  // Saldo da Semana: Liquidado - Dedutível
  // > 0 => IVA a pagar ao Estado
  // < 0 => Crédito de IVA a favor da Frota (a recuperar)
  const saldoIvaSemana = ivaLiquidado - totalIvaDedutivel;

  let statusSemana: 'A_RECUPERAR' | 'A_PAGAR' | 'EQUILIBRADO' = 'EQUILIBRADO';
  if (saldoIvaSemana < -0.01) {
    statusSemana = 'A_RECUPERAR';
  } else if (saldoIvaSemana > 0.01) {
    statusSemana = 'A_PAGAR';
  }

  return {
    calculationId: calc.id,
    driverId: calc.driverId,
    driverName: calc.driverName,
    matricula: calc.matricula,
    periodStart: calc.periodStart,
    periodEnd: calc.periodEnd,
    anoFiscal,
    trimestre,
    faturacaoBruta,
    taxaIvaLiquidado: settings.taxaIvaPassageiros,
    ivaLiquidado,
    combustivelTotal,
    combustivelIvaDedutivel,
    portagensTotal,
    portagensIvaDedutivel,
    aluguerTotal,
    aluguerIvaDedutivel,
    outrasDespesasTotal,
    outrasDespesasIvaDedutivel,
    totalIvaDedutivel,
    saldoIvaSemana,
    statusSemana
  };
};

/**
 * Agrega todos os cálculos para um determinado Ano Fiscal e gera o resumo anual e trimestral
 */
export const aggregateAnnualIva = (
  calculations: Calculation[],
  targetYear: number = new Date().getFullYear(),
  settings: FiscalSettings = DEFAULT_FISCAL_SETTINGS
): AnnualIvaSummary => {
  // 1. Inicializar trimestres
  const createEmptyQuarter = (q: FiscalQuarter): QuarterlyIvaSummary => ({
    trimestre: q,
    anoFiscal: targetYear,
    label: QUARTERS_META[q].label,
    dataLimiteEntrega: QUARTERS_META[q].deadline,
    ivaLiquidado: 0,
    ivaDedutivel: 0,
    saldoIva: 0,
    status: 'EQUILIBRADO',
    totalFaturacao: 0,
    totalDespesas: 0,
    numCalculos: 0,
    semanas: []
  });

  const trimestres: Record<FiscalQuarter, QuarterlyIvaSummary> = {
    Q1: createEmptyQuarter('Q1'),
    Q2: createEmptyQuarter('Q2'),
    Q3: createEmptyQuarter('Q3'),
    Q4: createEmptyQuarter('Q4')
  };

  let totalCalculos = 0;
  let totalFaturacaoBruta = 0;
  let totalDespesasOperacionais = 0;

  let ivaLiquidadoTotal = 0;
  let ivaDedutivelTotal = 0;

  let combustivelIvaTotal = 0;
  let portagensIvaTotal = 0;
  let aluguerIvaTotal = 0;
  let outrasDespesasIvaTotal = 0;

  // 2. Processar cada cálculo
  calculations.forEach(calc => {
    const weeklyRecord = computeWeeklyIva(calc, settings);

    // Filtrar apenas o ano fiscal pretendido
    if (weeklyRecord.anoFiscal !== targetYear) {
      return;
    }

    totalCalculos++;
    totalFaturacaoBruta += weeklyRecord.faturacaoBruta;
    totalDespesasOperacionais += 
      weeklyRecord.combustivelTotal + 
      weeklyRecord.portagensTotal + 
      weeklyRecord.aluguerTotal + 
      weeklyRecord.outrasDespesasTotal;

    ivaLiquidadoTotal += weeklyRecord.ivaLiquidado;
    ivaDedutivelTotal += weeklyRecord.totalIvaDedutivel;

    combustivelIvaTotal += weeklyRecord.combustivelIvaDedutivel;
    portagensIvaTotal += weeklyRecord.portagensIvaDedutivel;
    aluguerIvaTotal += weeklyRecord.aluguerIvaDedutivel;
    outrasDespesasIvaTotal += weeklyRecord.outrasDespesasIvaDedutivel;

    // Adicionar ao trimestre correspondente
    const q = weeklyRecord.trimestre;
    if (trimestres[q]) {
      trimestres[q].numCalculos++;
      trimestres[q].totalFaturacao += weeklyRecord.faturacaoBruta;
      trimestres[q].totalDespesas += 
        weeklyRecord.combustivelTotal + 
        weeklyRecord.portagensTotal + 
        weeklyRecord.aluguerTotal + 
        weeklyRecord.outrasDespesasTotal;
      trimestres[q].ivaLiquidado += weeklyRecord.ivaLiquidado;
      trimestres[q].ivaDedutivel += weeklyRecord.totalIvaDedutivel;
      trimestres[q].semanas.push(weeklyRecord);
    }
  });

  // 3. Fechar saldos dos trimestres
  (['Q1', 'Q2', 'Q3', 'Q4'] as FiscalQuarter[]).forEach(q => {
    const qt = trimestres[q];
    qt.saldoIva = qt.ivaLiquidado - qt.ivaDedutivel;
    if (qt.saldoIva < -0.01) {
      qt.status = 'REEMBOLSO';
    } else if (qt.saldoIva > 0.01) {
      qt.status = 'PAGAMENTO';
    } else {
      qt.status = 'EQUILIBRADO';
    }
  });

  // 4. Saldo Anual Acumulado
  const saldoIvaAnual = ivaLiquidadoTotal - ivaDedutivelTotal;
  const isReembolso = saldoIvaAnual < -0.01;
  const reembolsoEstimado = isReembolso ? Math.abs(saldoIvaAnual) : 0;
  const aPagarEstimado = !isReembolso && saldoIvaAnual > 0.01 ? saldoIvaAnual : 0;

  return {
    anoFiscal: targetYear,
    totalCalculos,
    totalFaturacaoBruta,
    totalDespesasOperacionais,
    ivaLiquidadoTotal,
    ivaDedutivelTotal,
    saldoIvaAnual,
    isReembolso,
    reembolsoEstimado,
    aPagarEstimado,
    combustivelIvaTotal,
    portagensIvaTotal,
    aluguerIvaTotal,
    outrasDespesasIvaTotal,
    trimestres
  };
};

/**
 * Gera texto CSV formatado para contabilidade e declaração periódica
 */
export const exportIvaToCsv = (
  summary: AnnualIvaSummary, 
  companyName = 'Asfalto Cativante - Unipessoal Lda',
  nipc = '517112604'
): string => {
  const lines: string[] = [];

  // Cabeçalho da Empresa
  lines.push(`"RELATÓRIO FISCAL DE IVA & ESTIMATIVA DE REEMBOLSO ANUAL"`);
  lines.push(`"Entidade:","${companyName}"`);
  lines.push(`"NIPC:","${nipc}"`);
  lines.push(`"Ano Fiscal:","${summary.anoFiscal}"`);
  lines.push(`"Data de Emissão:","${new Date().toLocaleDateString('pt-PT')} ${new Date().toLocaleTimeString('pt-PT')}"`);
  lines.push(``);

  // Resumo Geral do Ano
  lines.push(`"RESUMO CONSOLIDADO DO ANO FISCAL ${summary.anoFiscal}"`);
  lines.push(`"Faturação Bruta TVDE Total:","€${summary.totalFaturacaoBruta.toFixed(2)}"`);
  lines.push(`"Despesas Operacionais Elegíveis:","€${summary.totalDespesasOperacionais.toFixed(2)}"`);
  lines.push(`"Total IVA Liquidado (6%):","€${summary.ivaLiquidadoTotal.toFixed(2)}"`);
  lines.push(`"Total IVA Dedutível:","€${summary.ivaDedutivelTotal.toFixed(2)}"`);
  lines.push(`"  - IVA Combustível:","€${summary.combustivelIvaTotal.toFixed(2)}"`);
  lines.push(`"  - IVA Portagens / Via Verde:","€${summary.portagensIvaTotal.toFixed(2)}"`);
  lines.push(`"  - IVA Aluguer de Viaturas:","€${summary.aluguerIvaTotal.toFixed(2)}"`);
  lines.push(`"  - IVA Manutenção / Outros:","€${summary.outrasDespesasIvaTotal.toFixed(2)}"`);
  lines.push(`"Saldo Fiscal Anual Acumulado:","€${summary.saldoIvaAnual.toFixed(2)}"`);
  lines.push(`"Posição Fiscal:","${summary.isReembolso ? 'CRÉDITO DE IVA A RECUPERAR (REEMBOLSO)' : 'IVA A PAGAR ÀS FINANÇAS'}"`);
  lines.push(`"Montante Estimado:","€${(summary.isReembolso ? summary.reembolsoEstimado : summary.aPagarEstimado).toFixed(2)}"`);
  lines.push(``);

  // Resumo Trimestral (Declaração Periódica de IVA)
  lines.push(`"APURAMENTO TRIMESTRAL (DECLARAÇÃO PERIÓDICA DO IVA)"`);
  lines.push(`"Trimestre","Período","Prazo Limite Entrega","Faturação Bruta","IVA Liquidado (6%)","IVA Dedutível","Saldo Trimestral","Situação Fiscal"`);

  (['Q1', 'Q2', 'Q3', 'Q4'] as FiscalQuarter[]).forEach(q => {
    const qt = summary.trimestres[q];
    lines.push(
      `"${qt.trimestre}","${qt.label}","${qt.dataLimiteEntrega}","€${qt.totalFaturacao.toFixed(2)}","€${qt.ivaLiquidado.toFixed(2)}","€${qt.ivaDedutivel.toFixed(2)}","€${qt.saldoIva.toFixed(2)}","${qt.status === 'REEMBOLSO' ? 'A Recuperar' : qt.status === 'PAGAMENTO' ? 'A Pagar' : 'Sem Movimento'}"`
    );
  });
  lines.push(``);

  // Discriminação Semanal Detalhada
  lines.push(`"DISCRIMINAÇÃO DETALHADA POR CÁLCULO SEMANAL"`);
  lines.push(`"Cálculo ID","Motorista","Matrícula","Trimestre","Início","Fim","Faturação Bruta","IVA Liquidado (6%)","Combustível Bruto","IVA Combustível Ded.","Portagens Bruto","IVA Portagens Ded.","Aluguer Bruto","IVA Aluguer Ded.","Outros Bruto","IVA Outros Ded.","Total IVA Dedutível","Saldo Semana","Situação"`);

  const allWeeks: WeeklyIvaRecord[] = [];
  (['Q1', 'Q2', 'Q3', 'Q4'] as FiscalQuarter[]).forEach(q => {
    allWeeks.push(...summary.trimestres[q].semanas);
  });

  allWeeks.forEach(w => {
    const pStart = toJsDate(w.periodStart).toLocaleDateString('pt-PT');
    const pEnd = toJsDate(w.periodEnd).toLocaleDateString('pt-PT');
    lines.push(
      `"${w.calculationId}","${w.driverName}","${w.matricula || '-'}","${w.trimestre}","${pStart}","${pEnd}","€${w.faturacaoBruta.toFixed(2)}","€${w.ivaLiquidado.toFixed(2)}","€${w.combustivelTotal.toFixed(2)}","€${w.combustivelIvaDedutivel.toFixed(2)}","€${w.portagensTotal.toFixed(2)}","€${w.portagensIvaDedutivel.toFixed(2)}","€${w.aluguerTotal.toFixed(2)}","€${w.aluguerIvaDedutivel.toFixed(2)}","€${w.outrasDespesasTotal.toFixed(2)}","€${w.outrasDespesasIvaDedutivel.toFixed(2)}","€${w.totalIvaDedutivel.toFixed(2)}","€${w.saldoIvaSemana.toFixed(2)}","${w.statusSemana === 'A_RECUPERAR' ? 'Crédito' : w.statusSemana === 'A_PAGAR' ? 'Débito' : 'Nulo'}"`
    );
  });

  return lines.join('\n');
};

/**
 * Dispara o download direto do CSV no browser
 */
export const triggerCsvDownload = (csvContent: string, fileName = 'relatorio_iva_financas.csv') => {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
