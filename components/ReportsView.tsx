import React, { useMemo, useState, useRef } from 'react';
import { useCalculations } from '../hooks/useCalculations';
import { CalculationStatus, UserRole } from '../types';
import { calculateSummary } from '../utils/calculationUtils';
import Button from './ui/Button';
import Card from './ui/Card';
import { useAuth } from '../hooks/useAuth';
import { MOCK_COMPANY_INFO } from '../demoData';
import { useReceipts } from '../hooks/useReceipts';
import { useUsers } from '../hooks/useUsers';

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
  totalReceipts: number;
  pendingBalance: number;
}

const formatCurrency = (value: number) => `€${value.toFixed(2)}`;

const toDate = (timestamp: any) => timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);

const ReportsView: React.FC<ReportsViewProps> = ({ onBack, driverId }) => {
  const { user, isDemo } = useAuth();
  const { calculations } = useCalculations();
  const { receipts } = useReceipts();
  const { users } = useUsers();
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('all');
  const reportPrintRef = useRef<HTMLDivElement>(null);

  const isDriverView = !!driverId && user?.id === driverId;
  const drivers = useMemo(() => users.filter(u => u.role === UserRole.DRIVER).sort((a,b) => a.name.localeCompare(b.name)), [users]);

  const reportData = useMemo(() => {
    const filteredCalculations = calculations.filter((c) => {
        const periodEndDate = toDate(c.periodEnd);
    
        // Filter conditions
        const isAccepted = c.status === CalculationStatus.ACCEPTED;
        const matchesDriver = driverId ? c.driverId === driverId : true;
        
        // Date range check
        let inRange = true;
        if (startDate) {
            const start = new Date(startDate + 'T00:00:00');
            if (!isNaN(start.getTime()) && periodEndDate < start) {
                inRange = false;
            }
        }
        if (endDate) {
            const end = new Date(endDate + 'T23:59:59');
            if (!isNaN(end.getTime()) && periodEndDate > end) {
                inRange = false;
            }
        }
    
        return isAccepted && matchesDriver && inRange;
    });
    
    const filteredReceipts = receipts.filter(r => {
        const receiptDate = toDate(r.date);
        let inRange = true;
        if (startDate) {
            const start = new Date(startDate + 'T00:00:00');
            if (!isNaN(start.getTime()) && receiptDate < start) {
                inRange = false;
            }
        }
        if (endDate) {
            const end = new Date(endDate + 'T23:59:59');
            if (!isNaN(end.getTime()) && receiptDate > end) {
                inRange = false;
            }
        }
        return inRange;
    });

    const groupedByDriver: Record<string, ReportRow> = filteredCalculations.reduce(
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
            totalReceipts: 0,
            pendingBalance: 0,
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

    filteredReceipts.forEach(receipt => {
        if (groupedByDriver[receipt.driverId]) {
            groupedByDriver[receipt.driverId].totalReceipts += receipt.amount;
        }
    });
    
    Object.values(groupedByDriver).forEach(row => {
        row.pendingBalance = row.totalValorFinal - row.totalReceipts;
    });

    const allDriversReport = Object.values(groupedByDriver).sort((a, b) => a.driverName.localeCompare(b.driverName));
    
    if (selectedDriverId === 'all' || isDriverView) {
        return allDriversReport;
    } else {
        return allDriversReport.filter(row => row.driverId === selectedDriverId);
    }

  }, [calculations, receipts, startDate, endDate, driverId, selectedDriverId, isDriverView]);

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
    clone.style.width = '800px'; // Increased width for better table rendering
    clone.style.backgroundColor = 'white';
    clone.style.fontSize = '12px'; // Base font size
    
    document.body.appendChild(clone);
    
    const allElements = clone.querySelectorAll<HTMLElement>('*');
    allElements.forEach(el => {
        el.style.color = 'black';
        el.style.backgroundColor = 'transparent';
    });
    
    // Desktop Table styling
    const table = clone.querySelector('table');
    if (table) {
        table.style.fontSize = '10px';
        const tableRows = table.querySelectorAll('tbody tr');
        tableRows.forEach(row => {
            const lastCell = row.querySelector('td:last-child');
            if (lastCell) {
                (lastCell as HTMLElement).style.fontWeight = 'bold';
                (lastCell as HTMLElement).style.backgroundColor = '#FFF8E1'; // Light yellow
            }
        });
    }

    // Mobile Cards styling
    const mobileCards = clone.querySelectorAll('.md\\:hidden .bg-gray-900\\/50');
    mobileCards.forEach(card => {
        const invoicingRow = card.querySelector<HTMLElement>('.border-t-2');
        if (invoicingRow) {
            invoicingRow.style.backgroundColor = '#FFF8E1'; // Light yellow
            invoicingRow.style.padding = '8px';
            invoicingRow.style.marginTop = '4px';
            invoicingRow.style.borderRadius = '4px';
        }
    });

    // Replace date/select inputs with static text for PDF rendering
    const dateAndSelectInputs = clone.querySelectorAll('input[type="date"], select');
    dateAndSelectInputs.forEach(input => {
      const p = document.createElement('p');
      if (input.tagName.toLowerCase() === 'select') {
          const select = input as HTMLSelectElement;
          p.textContent = select.options[select.selectedIndex].text;
      } else {
          const dateInput = input as HTMLInputElement;
          if (dateInput.value) {
            const [year, month, day] = dateInput.value.split('-');
            p.textContent = `${day}/${month}/${year}`;
          } else {
            p.textContent = "N/A";
          }
      }
      p.className = 'mt-1 block w-full rounded-md py-2 px-3 sm:text-sm text-black';
      input.parentElement?.replaceChild(p, input);
    });
    
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
    
    let finalWidth = availableWidth;
    let finalHeight = finalWidth / imgProps.width * imgProps.height;
    
    if (finalHeight > availableHeight) {
        finalHeight = availableHeight;
        finalWidth = finalHeight / imgProps.height * imgProps.width;
    }
    
    const xOffset = margin + (availableWidth - finalWidth) / 2;
    const yOffset = margin;
    
    pdf.addImage(data, 'PNG', xOffset, yOffset, finalWidth, finalHeight);
    
    const start = startDate.replace(/-/g, '');
    const end = endDate.replace(/-/g, '');
    const driverName = selectedDriverId !== 'all' ? drivers.find(d => d.id === selectedDriverId)?.name.replace(/\s+/g, '_') : 'Global';
    const fileName = `Relatorio_Faturacao_${driverName}_${start}_${end}.pdf`;
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
                  Este relatório resume todos os cálculos 'Aceitos' e recibos registados no período selecionado. O 'Saldo a Faturar' é o valor que o motorista ainda deve emitir em recibo para a empresa.
              </p>
              <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-300">Período de (Início)</label>
                  <input type="date" id="startDate" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 py-2 px-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-white" />
              </div>
              <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-300">Período até (Fim)</label>
                  <input type="date" id="endDate" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 py-2 px-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-white" />
              </div>
              {!isDriverView && (
                 <div>
                    <label htmlFor="driverFilter" className="block text-sm font-medium text-gray-300">Filtrar Motorista</label>
                    <select id="driverFilter" value={selectedDriverId} onChange={(e) => setSelectedDriverId(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md text-white">
                        <option value="all">Todos os Motoristas</option>
                        {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                </div>
              )}
          </div>
          
          {/* Mobile View - Cards */}
          <div className="md:hidden space-y-4">
            {reportData.length > 0 ? (
                reportData.map((row) => (
                    <div key={row.driverId} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                        {!isDriverView && <h4 className="font-bold text-lg text-white mb-2 pb-2 border-b border-gray-700">{row.driverName}</h4>}
                        <div className="space-y-1">
                            <ReportDataRow label="Semanas Aceites" value={String(row.calculationCount)} />
                            <ReportDataRow label="Total Líquido (Motorista)" value={formatCurrency(row.totalValorFinal)} className="text-green-400" />
                            <ReportDataRow label="Total Recibos Emitidos" value={formatCurrency(row.totalReceipts)} className="text-blue-400" />
                            <ReportDataRow label="Saldo a Faturar" value={formatCurrency(row.pendingBalance)} className="text-yellow-400 font-bold border-t-2 border-dashed border-gray-600 mt-2 pt-2" />
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
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Total Líquido (Motorista)</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Total Recibos Emitidos</th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider font-bold">Saldo a Faturar</th>
                </tr>
              </thead>
              <tbody className="bg-gray-900 divide-y divide-gray-800">
                {reportData.length > 0 ? (
                  reportData.map((row) => (
                    <tr key={row.driverId} className="hover:bg-gray-700/50">
                      {!isDriverView && <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{row.driverName}</td>}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-300">{row.calculationCount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-400">{formatCurrency(row.totalValorFinal)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-400">{formatCurrency(row.totalReceipts)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-yellow-400 font-bold">{formatCurrency(row.pendingBalance)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={isDriverView ? 4 : 5} className="text-center py-10 text-gray-400">
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