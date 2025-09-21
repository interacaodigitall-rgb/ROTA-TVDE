import React, { useMemo, useState, useRef } from 'react';
import { useCalculations } from '../hooks/useCalculations';
import { CalculationStatus } from '../types';
import { calculateSummary } from '../utils/calculationUtils';
import Button from './ui/Button';
import Card from './ui/Card';
import { useAuth } from '../hooks/useAuth';
import { MOCK_COMPANY_INFO } from '../demoData';

// Add declarations for CDN libraries
declare const html2canvas: any;
declare const jspdf: any;


interface ReportsViewProps {
  onBack: () => void;
  driverId?: string; // Optional: Scope the report to a single driver
}

interface ReportRow {
  driverId: string;
  driverName: string;
  totalGanhos: number;
  totalDeducoes: number;
  totalValorFinal: number;
  calculationCount: number;
}

const formatCurrency = (value: number) => `€${value.toFixed(2)}`;

const getDefaultDateRange = () => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth(); // 0-11

    // Default End Date: 20th of the current month
    const endDate = new Date(currentYear, currentMonth, 20);
    
    // Default Start Date: 20th of the previous month
    const startDate = new Date(currentYear, currentMonth - 1, 20);

    return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
    };
};

const toDate = (timestamp: any) => timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);

const ReportsView: React.FC<ReportsViewProps> = ({ onBack, driverId }) => {
  const { user, isDemo } = useAuth();
  const { calculations } = useCalculations();
  const { startDate: defaultStart, endDate: defaultEnd } = getDefaultDateRange();
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);
  const reportPrintRef = useRef<HTMLDivElement>(null);

  const isDriverView = !!driverId && user?.id === driverId;

  const reportData = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Include the whole end day

    const filteredCalculations = calculations.filter(
      (c) => {
          const periodEndDate = toDate(c.periodEnd);
          const matchesDriver = driverId ? c.driverId === driverId : true;
          return matchesDriver && c.status === CalculationStatus.ACCEPTED && periodEndDate >= start && periodEndDate <= end;
      }
    );

    const groupedByDriver = filteredCalculations.reduce<Record<string, ReportRow>>(
      (acc, calc) => {
        const summary = calculateSummary(calc);
        if (!acc[calc.driverId]) {
          acc[calc.driverId] = {
            driverId: calc.driverId,
            driverName: calc.driverName,
            totalGanhos: 0,
            totalDeducoes: 0,
            totalValorFinal: 0,
            calculationCount: 0,
          };
        }

        acc[calc.driverId].totalGanhos += summary.totalGanhos;
        acc[calc.driverId].totalDeducoes += summary.totalDeducoes;
        acc[calc.driverId].totalValorFinal += summary.valorFinal;
        acc[calc.driverId].calculationCount++;
        
        return acc;
      },
      {}
    );
    return Object.values(groupedByDriver).sort((a,b) => a.driverName.localeCompare(b.driverName));
  }, [calculations, startDate, endDate, driverId]);

  const handleDownloadReportPdf = async () => {
    const element = reportPrintRef.current;
    if (!element || typeof html2canvas === 'undefined' || typeof jspdf === 'undefined') {
        alert('PDF generation library not loaded.');
        return;
    }
    
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.top = '0px';
    clone.style.width = '700px'; // Use a fixed width for consistent PDF rendering
    clone.style.backgroundColor = 'white';
    
    document.body.appendChild(clone);
    
    const allElements = clone.querySelectorAll<HTMLElement>('*');
    allElements.forEach(el => {
        el.style.color = 'black';
        el.style.backgroundColor = 'transparent';
    });
    
    // Replace date inputs with simple text to ensure they render correctly in the PDF.
    const startDateInput = clone.querySelector<HTMLInputElement>('#startDate');
    const endDateInput = clone.querySelector<HTMLInputElement>('#endDate');
    
    const formatDateForDisplay = (dateString: string) => {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    };

    if (startDateInput?.parentElement) {
        const p = document.createElement('p');
        p.textContent = formatDateForDisplay(startDateInput.value);
        p.className = 'mt-1 block w-full rounded-md py-2 px-3 sm:text-sm text-black';
        startDateInput.parentElement.replaceChild(p, startDateInput);
    }
    if (endDateInput?.parentElement) {
        const p = document.createElement('p');
        p.textContent = formatDateForDisplay(endDateInput.value);
        p.className = 'mt-1 block w-full rounded-md py-2 px-3 sm:text-sm text-black';
        endDateInput.parentElement.replaceChild(p, endDateInput);
    }
    
    if (isDriverView) {
        clone.style.fontSize = '12px';
        clone.style.lineHeight = '1.4';
        clone.style.padding = '1rem'; 
        
        const header = clone.querySelector<HTMLElement>('.text-center.mb-6');
        if (header) {
            header.style.marginBottom = '1rem';
            header.style.paddingBottom = '0.5rem';
        }

        const dateContainer = clone.querySelector<HTMLElement>('.border-b.pb-4.mb-4');
        if (dateContainer) {
            dateContainer.style.marginBottom = '1rem';
            dateContainer.style.paddingBottom = '0.5rem';
        }

        const reportCard = clone.querySelector<HTMLElement>('.bg-gray-900\\/50.p-4');
        if(reportCard) {
            reportCard.style.padding = '0.75rem';
        }

        const reportRows = clone.querySelectorAll<HTMLElement>('.py-2');
        reportRows.forEach(row => {
            row.style.paddingTop = '0.25rem';
            row.style.paddingBottom = '0.25rem';
        });
    }

    const canvas = await html2canvas(clone, { scale: 2, backgroundColor: '#ffffff' });
    document.body.removeChild(clone);

    const data = canvas.toDataURL('image/png');
    
    const pdf = new jspdf.jsPDF('p', 'pt', 'a4');
    const imgProps = pdf.getImageProperties(data);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const margin = 40;
    const availableWidth = pdfWidth - margin * 2;
    const availableHeight = pdfHeight - margin * 2;
    
    const imgRatio = imgProps.width / imgProps.height;
    
    let finalWidth = availableWidth;
    let finalHeight = finalWidth / imgRatio;
    
    // Ensure the image fits within the page height
    if (finalHeight > availableHeight) {
        finalHeight = availableHeight;
        finalWidth = finalHeight * imgRatio;
    }
    
    // Center horizontally
    const xOffset = margin + (availableWidth - finalWidth) / 2;
    // Align to top
    const yOffset = margin;
    
    pdf.addImage(data, 'PNG', xOffset, yOffset, finalWidth, finalHeight);
    
    const start = startDate.replace(/-/g, '');
    const end = endDate.replace(/-/g, '');
    const fileName = isDriverView
      ? `Meu_Relatorio_Faturacao_${start}_${end}.pdf`
      : `Relatorio_Faturacao_Global_${start}_${end}.pdf`;
    pdf.save(fileName);
  };
  
  const ReportDataRow: React.FC<{ label: string; value: string; className?: string }> = ({label, value, className = ''}) => (
    <div className={`flex justify-between items-center py-2 ${className}`}>
        <span className="text-sm text-gray-400">{label}</span>
        <span className="font-semibold text-white">{value}</span>
    </div>
  );


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-3xl font-bold">{isDriverView ? 'Meu Relatório de Faturação' : 'Relatório de Faturação'}</h2>
        <div className="flex gap-4 flex-wrap">
          <Button onClick={handleDownloadReportPdf} variant="primary">
            Baixar PDF
          </Button>
          <Button onClick={onBack} variant="secondary">
            &larr; Voltar
          </Button>
        </div>
      </div>
      <Card>
       <div ref={reportPrintRef} className="p-1 sm:p-4">
            <div className="text-center mb-6 border-b border-gray-700 pb-4">
                <h3 className="text-xl font-bold">ROTA TVDE 5.0</h3>
                 {isDemo ? (
                    <>
                        <p className="text-sm font-semibold">{MOCK_COMPANY_INFO.name}</p>
                        <p className="text-xs text-gray-400">NIPC: {MOCK_COMPANY_INFO.nipc} | TEL: {MOCK_COMPANY_INFO.phone}</p>
                        <p className="text-xs text-gray-400">MORADA: {MOCK_COMPANY_INFO.address}</p>
                    </>
                ) : (
                    <>
                        <p className="text-sm font-semibold">ASFALTO CATIVANTE - UNIPESSOAL LDA</p>
                        <p className="text-xs text-gray-400">NIPC: 517112604 | TEL: +351 914 800 818</p>
                        <p className="text-xs text-gray-400">MORADA: PRACETA ALEXANDRE HERCULANO, 5 3ºESQ - 2745-706 QUELUZ</p>
                    </>
                )}
            </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-gray-700 pb-4 mb-4">
              <p className="text-sm text-gray-400 md:col-span-3">
                {isDriverView
                  ? "Este relatório resume os seus cálculos 'Aceitos' no período selecionado. Use o 'Valor a Faturar' para emitir o recibo para a empresa."
                  : "Este relatório resume todos os cálculos 'Aceitos' no período selecionado. O 'Valor a Faturar' é o valor líquido que o motorista deve usar para passar o recibo à empresa."
                }
              </p>
              <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-300">Período de (Início)</label>
                  <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 py-2 px-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-white" />
              </div>
              <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-300">Período até (Fim)</label>
                  <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 py-2 px-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-white" />
              </div>
          </div>
          
          {/* Mobile View - Cards */}
          <div className="md:hidden space-y-4">
            {reportData.length > 0 ? (
                reportData.map((row) => (
                    <div key={row.driverId} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                        {!isDriverView && <h4 className="font-bold text-lg text-white mb-2 pb-2 border-b border-gray-700">{row.driverName}</h4>}
                        <div className="space-y-1">
                            <ReportDataRow label="Semanas Aceites" value={String(row.calculationCount)} />
                            <ReportDataRow label="Total Ganhos" value={formatCurrency(row.totalGanhos)} />
                            <ReportDataRow label="Total Deduções" value={formatCurrency(row.totalDeducoes)} className="text-yellow-400" />
                            <ReportDataRow label="Total Líquido" value={formatCurrency(row.totalValorFinal)} className="text-green-400" />
                            <ReportDataRow label="Valor a Faturar (Recibo)" value={formatCurrency(row.totalValorFinal)} className="text-green-400 font-bold border-t border-dashed border-gray-600 mt-2 pt-2" />
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-center py-10 text-gray-400">Nenhum cálculo aceite para o período selecionado.</p>
            )}
          </div>

          {/* Desktop View - Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-800">
                <tr>
                  {!isDriverView && <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Motorista</th>}
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Semanas Aceites</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Total Ganhos</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Total Deduções</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Total Líquido Motorista</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider font-bold">Valor a Faturar (Recibo)</th>
                </tr>
              </thead>
              <tbody className="bg-gray-900 divide-y divide-gray-800">
                {reportData.length > 0 ? (
                  reportData.map((row) => (
                    <tr key={row.driverId} className="hover:bg-gray-700/50">
                      {!isDriverView && <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{row.driverName}</td>}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-300">{row.calculationCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-300">{formatCurrency(row.totalGanhos)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-yellow-400">{formatCurrency(row.totalDeducoes)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-400 font-semibold">{formatCurrency(row.totalValorFinal)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-400 font-bold">{formatCurrency(row.totalValorFinal)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={isDriverView ? 5 : 6} className="text-center py-10 text-gray-400">
                      Nenhum cálculo aceite para o período selecionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ReportsView;