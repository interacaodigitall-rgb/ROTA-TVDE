import React, { useState, useRef } from 'react';
import { Calculation, CalculationStatus, User, UserRole, CalculationType, PercentageType } from '../types';
import Button from './ui/Button';
import { useCalculations } from '../hooks/useCalculations';
import { useAuth } from '../hooks/useAuth';
import { calculateSummary } from '../utils/calculationUtils';
import Card from './ui/Card';
import { useUsers } from '../hooks/useUsers';
import { MOCK_COMPANY_INFO } from '../demoData';

// Add declarations for CDN libraries
declare const html2canvas: any;
declare const jspdf: any;

interface CalculationViewProps {
  calculation: Calculation;
  onAccept?: () => void;
}

const formatCurrency = (value: number) => `€ ${value.toFixed(2).padStart(8, ' ')}`;

const CalculationLine: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between items-start gap-2">
    <span className="flex-shrink-0">{label.padEnd(20, ' ')}</span>
    <span className="text-right break-words">{value}</span>
  </div>
);

const CompanyInfo: React.FC<{ isDemo: boolean }> = ({ isDemo }) => (
    <div className="text-center text-xs text-gray-400 space-y-0.5 mt-6 pt-4 border-t border-dashed border-gray-600">
        {isDemo ? (
            <>
                <p className="font-bold">{MOCK_COMPANY_INFO.name}</p>
                <p>NIPC: {MOCK_COMPANY_INFO.nipc}</p>
                <p>MORADA: {MOCK_COMPANY_INFO.address}</p>
                <p>TEL: {MOCK_COMPANY_INFO.phone}</p>
            </>
        ) : (
            <>
                <p className="font-bold">ASFALTO CATIVANTE - UNIPESSOAL LDA</p>
                <p>NIPC: 517112604</p>
                <p>MORADA: PRACETA ALEXANDRE HERCULANO, 5 3ºESQ - 2745-706 QUELUZ</p>
                <p>TEL: +351 914 800 818</p>
            </>
        )}
    </div>
);

const RevisionNotesModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (notes: string) => void;
}> = ({ isOpen, onClose, onSubmit }) => {
    const [notes, setNotes] = useState('');

    if (!isOpen) return null;
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(notes);
        onClose();
    };

    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-lg">
          <h3 className="text-xl font-semibold mb-4">Pedir Revisão</h3>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <label htmlFor="revisionNotes" className="block text-sm font-medium text-gray-300">
                Por favor, descreva o motivo do pedido de revisão.
              </label>
              <textarea
                id="revisionNotes"
                rows={5}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                required
                className="block w-full rounded-md border-gray-600 bg-gray-700 py-2 px-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-white"
              />
            </div>
            <div className="mt-6 flex justify-end gap-4">
              <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
              <Button type="submit" variant="primary">Enviar Pedido</Button>
            </div>
          </form>
        </Card>
      </div>
    );
};


const CalculationView: React.FC<CalculationViewProps> = ({ calculation, onAccept }) => {
  const { user, isDemo } = useAuth();
  const { updateCalculationStatus, updateCalculation } = useCalculations();
  const { findUserById } = useUsers();
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const admin = findUserById(calculation.adminId);
  const driver = findUserById(calculation.driverId);
  
  const summary = calculateSummary(calculation);
  
  const statusColor = {
    [CalculationStatus.PENDING]: 'text-yellow-400',
    [CalculationStatus.ACCEPTED]: 'text-green-400',
    [CalculationStatus.REVISION_REQUESTED]: 'text-red-400',
  };
  
  const handleAccept = async () => {
    await updateCalculationStatus(calculation.id, CalculationStatus.ACCEPTED);
    onAccept?.();
  };

  const handleRequestRevision = (notes: string) => {
      updateCalculation(calculation.id, {
        status: CalculationStatus.REVISION_REQUESTED,
        revisionNotes: notes,
      });
  };

  const handleDownloadPdf = async () => {
    const element = printRef.current;
    if (!element || typeof html2canvas === 'undefined' || typeof jspdf === 'undefined') {
        alert('PDF generation library not loaded.');
        return;
    }

    // Create a clone for printing to avoid altering the live view
    const clone = element.cloneNode(true) as HTMLElement;
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.top = '0px';
    clone.style.width = element.offsetWidth + 'px';
    clone.style.height = 'auto';
    clone.style.backgroundColor = 'white'; // Set a white background
    
    document.body.appendChild(clone);

    // Force all elements inside the clone to have black text for printing
    const allElements = clone.querySelectorAll<HTMLElement>('*');
    allElements.forEach(el => {
        el.style.color = 'black';
        
        // Special handling for the revision notes box for better visibility
        if (el.classList.contains('bg-yellow-900/50')) {
            el.style.backgroundColor = '#FEFBEB'; // A light yellow background
            el.style.borderColor = '#F59E0B'; // A visible yellow border
        } else {
            el.style.backgroundColor = 'transparent'; // Ensure other backgrounds are removed
        }
    });

    // Find and fix the truncated element for other expenses notes
    const truncatedElement = clone.querySelector<HTMLElement>('.truncate');
    if (truncatedElement) {
      truncatedElement.classList.remove('truncate');
      truncatedElement.style.whiteSpace = 'normal';
      truncatedElement.style.overflow = 'visible';
      truncatedElement.style.textOverflow = 'clip';
      truncatedElement.style.wordBreak = 'break-word';
    }

    // Generate canvas from the modified clone
    const canvas = await html2canvas(clone, { 
      scale: 2, // Higher scale for better quality
      backgroundColor: '#ffffff'
    });
    document.body.removeChild(clone); // Clean up the DOM

    const data = canvas.toDataURL('image/png');
    const pdf = new jspdf.jsPDF('p', 'pt', 'a4'); // p = portrait, pt = points, a4 size
    const imgProps = pdf.getImageProperties(data);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    
    const margin = 40; // margin in points
    const availableWidth = pdfWidth - margin * 2;
    const availableHeight = pdfHeight - margin * 2;
    
    // Calculate aspect ratios
    const imgRatio = imgProps.width / imgProps.height;
    const pageRatio = availableWidth / availableHeight;

    let finalWidth, finalHeight;

    // If image is taller than the available space, scale down to fit height.
    // Otherwise, fit to width. This ensures the entire content fits on one page.
    if (imgRatio > pageRatio) {
      finalWidth = availableWidth;
      finalHeight = finalWidth / imgRatio;
    } else {
      finalHeight = availableHeight;
      finalWidth = finalHeight * imgRatio;
    }
    
    // Center the (potentially scaled-down) image on the page
    const xOffset = margin + (availableWidth - finalWidth) / 2;
    const yOffset = margin + (availableHeight - finalHeight) / 2;
    
    pdf.addImage(data, 'PNG', xOffset, yOffset, finalWidth, finalHeight);

    const driverName = calculation.driverName.replace(/\s+/g, '_');
    const endDate = calculation.periodEnd.toDate().toLocaleDateString('pt-PT').replace(/\//g, '-');
    pdf.save(`Resumo_Semanal_${driverName}_${endDate}.pdf`);
  };
  
  const toDate = (timestamp: any) => timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);

  const hasVehicleInfo = driver && (driver.vehicleModel || driver.insurancePolicy || driver.fleetCardNumber);

  const renderStandardView = () => {
    const {
      totalGanhos,
      slotFee,
      iva,
      totalDeducoes,
      valorFinal,
      totalPlatformTolls,
      refundedTips,
      refundedAdjustments,
    } = summary;

    return (
        <>
            {/* Ganhos */}
            <div className="border-t-2 border-dashed border-gray-600 pt-4 mt-4">
                <p className="font-bold mb-2">┌─ GANHOS ─────────────┐</p>
                <div className="pl-4 pr-4 space-y-1">
                    <CalculationLine label="Uber Ganhos Brutos:" value={formatCurrency(calculation.uberRides)} />
                    <CalculationLine label="Bolt Ganhos Brutos:" value={formatCurrency(calculation.boltRides)} />
                    <div className="text-xs text-gray-400 pt-2 text-right">
                        <p>Detalhes (valores já incluídos nos ganhos brutos):</p>
                        <ul className="list-inside">
                            <li>Gorjetas: {formatCurrency(refundedTips)}</li>
                            <li>Portagens Plataforma: {formatCurrency(totalPlatformTolls)}</li>
                            <li>Ajustes: {formatCurrency(refundedAdjustments)}</li>
                        </ul>
                    </div>
                </div>
                <p className="font-bold mt-2">├──────────────────────┤</p>
                <p className="font-bold pl-4 pr-4"> TOTAL GANHOS: {formatCurrency(totalGanhos)}</p>
                <p className="font-bold mb-2">└──────────────────────┘</p>
            </div>


            {/* Deduções */}
            <div className="border-t-2 border-dashed border-gray-600 pt-4 mt-4">
                <p className="font-bold mb-2">┌─ DEDUÇÕES ───────────┐</p>
                <div className="pl-4 pr-4 space-y-1">
                    <CalculationLine label="Aluguer Veículo:" value={formatCurrency(calculation.vehicleRental)} />
                    <div className="flex justify-between items-start gap-2">
                        <span className="flex-shrink-0">{"Slot 4%:".padEnd(20, ' ')}</span>
                        <span className="text-right break-words">
                            {calculation.isSlotExempt && <span className="text-xs text-gray-400">(Isento) </span>}
                            {formatCurrency(slotFee)}
                        </span>
                    </div>
                    <div className="flex justify-between items-start gap-2">
                        <span className="flex-shrink-0">{"IVA 6%:".padEnd(20, ' ')}</span>
                        <span className="text-right break-words">
                            {calculation.isIvaExempt && <span className="text-xs text-gray-400">(Isento) </span>}
                            {formatCurrency(iva)}
                        </span>
                    </div>
                    <CalculationLine label="Cartão Frota:" value={formatCurrency(calculation.fleetCard)} />
                    <CalculationLine label="Portagens (Aluguer):" value={formatCurrency(calculation.rentalTolls)} />
                    <CalculationLine label="Portagens (Plataforma):" value={formatCurrency(totalPlatformTolls)} />
                    {calculation.debtDeduction > 0 && (
                        <CalculationLine label="Dedução de Dívida:" value={formatCurrency(calculation.debtDeduction)} />
                    )}
                    <div>
                        <CalculationLine label="Outras Despesas:" value={formatCurrency(calculation.otherExpenses)} />
                        {calculation.otherExpensesNotes && (
                            <div className="text-right text-xs text-gray-400 pr-1 truncate">
                                ({calculation.otherExpensesNotes})
                            </div>
                        )}
                    </div>
                </div>
                <p className="font-bold mt-2">├──────────────────────┤</p>
                <p className="font-bold pl-4 pr-4"> TOTAL DEDUÇÕES: {formatCurrency(totalDeducoes)}</p>
                <p className="font-bold mb-2">└──────────────────────┘</p>
            </div>

            <div className="border-y-4 border-double border-gray-600 py-4 my-4 text-center">
                <p className="text-lg font-bold">VALOR FINAL: {formatCurrency(valorFinal)}</p>
            </div>
        </>
    );
  };

  const renderPercentageView = () => {
    const {
        valorFinal,
        baseEarnings,
        refundedTips,
        driverShare,
        driverCosts,
        potToSplit,
        netToSplit,
        fleetCardExcess,
        totalCompanyCosts,
        iva,
        fleetCardCostToSplit,
        totalPlatformTolls
    } = summary;

    return (
        <>
            {/* Ganhos */}
            <div className="border-t-2 border-dashed border-gray-600 pt-4 mt-4">
                <p className="font-bold mb-2">┌─ RESUMO DE GANHOS ────────┐</p>
                <div className="pl-4 pr-4 space-y-1">
                    <CalculationLine label="Ganhos Brutos (Base):" value={formatCurrency(baseEarnings)} />
                    <p className="text-xs text-gray-400 pl-4">(Ganhos Totais - Gorjetas - Portagens)</p>
                    <CalculationLine label="Gorjetas (100% Motorista):" value={formatCurrency(refundedTips)} />
                    <CalculationLine label="Portagens (Devolvidas pela uber e bolt):" value={formatCurrency(totalPlatformTolls)} />
                </div>
                <p className="font-bold mb-2">└───────────────────────────┘</p>
            </div>

            {calculation.percentageType === PercentageType.FIFTY_FIFTY && (
                <>
                    <div className="border-t-2 border-dashed border-gray-600 pt-4 mt-4">
                        <p className="font-bold mb-2">┌─ DIVISÃO 50/50 ──────────┐</p>
                        <div className="pl-4 pr-4 space-y-1">
                            <CalculationLine label="Ganhos Brutos (Base):" value={formatCurrency(baseEarnings)} />
                            <CalculationLine label="(-) IVA (6%):" value={formatCurrency(iva > 0 ? -iva : 0)} />
                            <CalculationLine label="(-) Cartão Frota (Parte dividida):" value={formatCurrency(fleetCardCostToSplit > 0 ? -fleetCardCostToSplit : 0)} />
                            <p className="font-bold mt-2">├──────────────────────────┤</p>
                            <CalculationLine label="(=) Valor Líquido a Dividir:" value={formatCurrency(potToSplit)} />
                            <p className="font-bold mt-2">├──────────────────────────┤</p>
                            <CalculationLine label="→ Parte Motorista (50%):" value={formatCurrency(driverShare)} />
                            <CalculationLine label="(+) Gorjetas:" value={formatCurrency(refundedTips)} />
                            {driverCosts > 0 && (
                                 <CalculationLine label="(-) Custos do Motorista:" value={formatCurrency(-driverCosts)} />
                            )}
                            <p className="text-xs text-gray-400 pl-4">(Excesso Cartão, Portagens Aluguer, etc)</p>
                        </div>
                        <p className="font-bold mb-2">└───────────────────────────┘</p>
                    </div>
                </>
            )}

            {calculation.percentageType === PercentageType.SIXTY_FORTY && (
                 <>
                    <div className="border-t-2 border-dashed border-gray-600 pt-4 mt-4">
                        <p className="font-bold mb-2">┌─ CÁLCULO 60/40 ──────────┐</p>
                        <div className="pl-4 pr-4 space-y-1">
                            <CalculationLine label="Ganhos Brutos (Base):" value={formatCurrency(baseEarnings)} />
                            <CalculationLine label="(-) Custos da Frota:" value={formatCurrency(totalCompanyCosts > 0 ? -totalCompanyCosts : 0)} />
                            <p className="text-xs text-gray-400 pl-4"> (IVA + Cartão Frota + Aluguer + etc.)</p>
                            <p className="font-bold mt-2">├──────────────────────────┤</p>
                            <CalculationLine label="(=) Valor Líquido a Dividir:" value={formatCurrency(netToSplit)} />
                            <p className="font-bold mt-2">├──────────────────────────┤</p>
                            <CalculationLine label="→ Parte Motorista (40%):" value={formatCurrency(driverShare)} />
                            {fleetCardExcess > 0 && (
                                <CalculationLine label="(-) Excesso Cartão Frota:" value={formatCurrency(-fleetCardExcess)} />
                            )}
                            <CalculationLine label="(+) Gorjetas:" value={formatCurrency(refundedTips)} />
                             {(calculation.debtDeduction || 0) > 0 && (
                                <CalculationLine label="(-) Dedução de Dívida:" value={formatCurrency(-calculation.debtDeduction)} />
                            )}
                        </div>
                        <p className="font-bold mb-2">└───────────────────────────┘</p>
                    </div>
                </>
            )}

            <div className="border-y-4 border-double border-gray-600 py-4 my-4 text-center">
                <p className="text-lg font-bold">VALOR FINAL A PAGAR: {formatCurrency(valorFinal)}</p>
            </div>
        </>
    )
  }

  return (
    <>
      <div ref={printRef} className="bg-gray-800 border border-gray-700 shadow-2xl rounded-lg p-6 font-mono text-sm text-gray-200 max-w-md mx-auto">
        <div className="text-center border-b-2 border-dashed border-gray-600 pb-4 mb-4">
          <h2 className="text-lg font-bold">ROTA TVDE 5.0</h2>
          <h3 className="text-md">RESUMO SEMANAL</h3>
        </div>
        
        <div className="space-y-1 mb-4">
          <p>Motorista: {calculation.driverName}</p>
          <p>Matrícula: {driver?.matricula}</p>
          <p>Data: {toDate(calculation.date).toLocaleDateString('pt-PT')}</p>
          <p>Período: {toDate(calculation.periodStart).toLocaleDateString('pt-PT')} até {toDate(calculation.periodEnd).toLocaleDateString('pt-PT')}</p>
        </div>
        
        {/* Vehicle Info */}
        {hasVehicleInfo && (
            <div className="border-t-2 border-dashed border-gray-600 pt-4 mt-4">
                <p className="font-bold mb-2">┌─ VIATURA ────────────┐</p>
                <div className="pl-4 pr-4 space-y-1">
                    {driver.vehicleModel && <CalculationLine label="Viatura:" value={driver.vehicleModel} />}
                    {driver.insuranceCompany && <CalculationLine label="Seguro:" value={driver.insuranceCompany} />}
                    {driver.insurancePolicy && <CalculationLine label="Apólice:" value={driver.insurancePolicy} />}
                    {driver.fleetCardCompany && <CalculationLine label="Cartão Frota:" value={driver.fleetCardCompany} />}
                    {driver.fleetCardNumber && <CalculationLine label="Nº Cartão:" value={driver.fleetCardNumber} />}
                </div>
                <p className="font-bold mb-2">└──────────────────────┘</p>
            </div>
        )}
        
        {summary.isPercentage ? renderPercentageView() : renderStandardView()}

        {calculation.revisionNotes && (
          <div className="mt-4 p-3 bg-yellow-900/50 border border-dashed border-yellow-600 rounded-md">
            <p className="font-bold text-yellow-400">Notas de Revisão:</p>
            <p className="text-yellow-200 whitespace-pre-wrap text-xs">{calculation.revisionNotes}</p>
          </div>
        )}

        <div className="text-center text-xs text-gray-400 space-y-1 mt-4">
          <p>Status: <span className={`font-bold ${statusColor[calculation.status]}`}>{calculation.status}</span></p>
          <p>Calculado por: {admin?.name}</p>
        </div>
        <CompanyInfo isDemo={isDemo} />
      </div>
      
      <div className="max-w-md mx-auto mt-6 flex justify-center items-center gap-4 flex-wrap">
        {user?.role === UserRole.DRIVER && calculation.status === CalculationStatus.PENDING && (
          <>
            <Button variant="success" onClick={handleAccept}>
                Aceitar
            </Button>
            <Button variant="warning" onClick={() => setIsRevisionModalOpen(true)}>
                Pedir Revisão
            </Button>
          </>
        )}
        <Button onClick={handleDownloadPdf} variant="secondary">
          Baixar PDF
        </Button>
      </div>

      <RevisionNotesModal 
        isOpen={isRevisionModalOpen}
        onClose={() => setIsRevisionModalOpen(false)}
        onSubmit={handleRequestRevision}
      />
    </>
  );
};

export default CalculationView;
