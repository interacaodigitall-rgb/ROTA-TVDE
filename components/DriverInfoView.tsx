import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import Button from './ui/Button';
import { useIbans } from '../hooks/useIbans';
import { CalculationStatus, CalculationType } from '../types';
import Card from './ui/Card';
import { MOCK_COMPANY_INFO } from '../demoData';
import { useCalculations } from '../hooks/useCalculations';
import { useReceipts } from '../hooks/useReceipts';
import { calculateSummary } from '../utils/calculationUtils';

// FIX: Changed JSX.Element to React.ReactNode to resolve "Cannot find namespace 'JSX'" error.
const InfoCard: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; borderColor: string; }> = ({ title, icon, children, borderColor }) => (
  <div className={`border border-gray-700 rounded-lg p-6 bg-gray-800 border-t-4 ${borderColor}`}>
    <div className="flex items-center mb-4">
      {icon}
      <h3 className="ml-3 text-lg font-semibold text-gray-100">{title}</h3>
    </div>
    <div className="space-y-4 text-gray-300">
      {children}
    </div>
  </div>
);

const RequirementItem: React.FC<{ title: string; children: React.ReactNode; }> = ({ title, children }) => (
    <div>
        <p className="font-bold text-gray-200">&#8226; {title}</p>
        <div className="ml-5 text-sm text-gray-400 border-l border-gray-600 pl-3 mt-1">
            {children}
        </div>
    </div>
);


const SosModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <Card className="w-full max-w-lg border-t-4 border-t-red-500" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-red-400 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        SOS / Contactos de Assistência
                    </h3>
                     <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
                </div>
                <div className="space-y-4 text-lg">
                    <div className="p-4 bg-gray-900 rounded-lg">
                        <p className="text-sm text-gray-400">Em Portugal (chamada para a rede fixa nacional)</p>
                        <a href="tel:214405008" className="font-bold text-2xl text-white hover:text-blue-400">214 405 008</a>
                    </div>
                    <div className="p-4 bg-gray-900 rounded-lg">
                        <p className="text-sm text-gray-400">No Estrangeiro</p>
                        <a href="tel:+351214417373" className="font-bold text-2xl text-white hover:text-blue-400">+351 21 441 73 73</a>
                    </div>
                </div>
                 <div className="mt-6 text-center">
                     <Button variant="secondary" onClick={onClose}>Fechar</Button>
                 </div>
            </Card>
        </div>
    );
};

const ReminderModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  amount: number;
}> = ({ isOpen, onClose, amount }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <Card className="w-full max-w-lg border-t-4 border-t-yellow-500" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-yellow-400 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        Lembrete de Faturação
                    </h3>
                     <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
                </div>
                <div className="space-y-4 text-gray-200">
                    <p>Lembrete: Tem um saldo pendente de meses anteriores no valor de:</p>
                    <p className="text-3xl font-bold text-center text-white py-4 bg-gray-900 rounded-lg">€{amount.toFixed(2)}</p>
                    <p>Por favor, emita os recibos verdes correspondentes para regularizar a sua situação.</p>
                </div>
                 <div className="mt-6 text-center">
                     <Button variant="primary" onClick={onClose}>Entendido</Button>
                 </div>
            </Card>
        </div>
    );
};

const DriverInfoView: React.FC<{ onNavigateToCalculations: () => void }> = ({ onNavigateToCalculations }) => {
  const { user, logout, isDemo } = useAuth();
  const { ibans, loading: ibansLoading } = useIbans();
  const { calculations } = useCalculations();
  const { receipts } = useReceipts();
  const [isSosModalOpen, setIsSosModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);

  const myIban = user ? ibans.find(iban => iban.driverId === user.id) : null;
  const hasVehicleInfo = user && (user.vehicleModel || user.insuranceCompany || user.insurancePolicy || user.fleetCardCompany || user.fleetCardNumber);
  
  const toDate = (timestamp: any) => timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);

  const { pendingBalance, previousMonthsPendingBalance } = useMemo(() => {
    if (!user) return { pendingBalance: 0, previousMonthsPendingBalance: 0 };

    const acceptedCalculations = calculations.filter(
        c => c.driverId === user.id && c.status === CalculationStatus.ACCEPTED
    );

    const userReceipts = receipts.filter(r => r.driverId === user.id);

    const totalValorFinal = acceptedCalculations.reduce((sum, calc) => {
        const summary = calculateSummary(calc);
        return sum + (summary.valorFinal || 0);
    }, 0);

    const totalReceipts = userReceipts.reduce((sum, receipt) => sum + receipt.amount, 0);

    // --- Previous months balance calculation ---
    const now = new Date();
    const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const prevMonthsCalculations = acceptedCalculations.filter(c => 
        toDate(c.periodEnd) < firstDayOfCurrentMonth
    );

    const prevMonthsReceipts = userReceipts.filter(r => 
        toDate(r.date) < firstDayOfCurrentMonth
    );

    const prevMonthsTotalValorFinal = prevMonthsCalculations.reduce((sum, calc) => {
        const summary = calculateSummary(calc);
        return sum + (summary.valorFinal || 0);
    }, 0);
    
    const prevMonthsTotalReceipts = prevMonthsReceipts.reduce((sum, receipt) => sum + receipt.amount, 0);

    return {
        pendingBalance: totalValorFinal - totalReceipts,
        previousMonthsPendingBalance: prevMonthsTotalValorFinal - prevMonthsTotalReceipts
    };
  }, [calculations, receipts, user]);

  useEffect(() => {
    const now = new Date();
    const dayOfMonth = now.getDate();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // JS months are 0-indexed
    const storageKey = `reminderDismissed_${year}-${month}`;

    const hasDismissed = localStorage.getItem(storageKey);

    if (dayOfMonth <= 7 && previousMonthsPendingBalance > 0 && !hasDismissed) {
        setIsReminderModalOpen(true);
    }
  }, [previousMonthsPendingBalance]);

  const handleCloseReminder = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const storageKey = `reminderDismissed_${year}-${month}`;
    localStorage.setItem(storageKey, 'true');
    setIsReminderModalOpen(false);
  };

  return (
    <>
    <div className="w-full text-gray-100 font-sans">
      {/* Header */}
      <header className="bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
                <div>
                    <h1 className="text-lg font-bold text-gray-100">Área do Motorista</h1>
                    <p className="text-sm text-gray-400">ROTA TVDE 5.0</p>
                </div>
            </div>
            <div className="flex items-center space-x-4">
                <div className="hidden sm:flex items-center text-sm text-green-400">
                    <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                    Sistema operacional
                </div>
                <Button onClick={logout} variant="secondary">Sair</Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Welcome Card */}
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col items-start gap-6">
             <div className="flex-grow w-full">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Bem-vindo, {user?.name}!</h2>
                        <p className="text-gray-400">Frota {user?.type} - Matrícula: {user?.matricula}</p>
                    </div>
                    <div className="w-full sm:w-auto flex-shrink-0">
                        <Button onClick={onNavigateToCalculations} variant="primary" className="w-full">Aceder aos Meus Cálculos</Button>
                    </div>
                </div>
                {pendingBalance > 0.01 && (
                    <div className="w-full mt-6 p-4 border-l-4 border-yellow-500 bg-yellow-900/50 text-yellow-200 rounded-r-lg">
                        <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="font-bold">Aviso de Faturação Pendente</p>
                                <p className="text-sm">Tem um saldo de <strong>€{pendingBalance.toFixed(2)}</strong> a faturar em recibos verdes.</p>
                            </div>
                        </div>
                    </div>
                )}
             </div>
          </div>

          <h2 className="text-xl font-semibold text-gray-200">Informações Importantes</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
             <InfoCard title="Requisitos e Equipamentos" borderColor="border-t-orange-500" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}>
                <div className="space-y-4">
                    <RequirementItem title="Extintor 2kg com certificado">
                        Deve estar dentro do prazo e fixado na viatura.
                    </RequirementItem>
                    <RequirementItem title="Dístico TVDE">
                        Colado no para-brisas, visível e válido.
                    </RequirementItem>
                    <RequirementItem title="Aviso 'Não Fumadores'">
                        Afixado visivelmente no interior do veículo.
                    </RequirementItem>
                    <RequirementItem title="Documentos Pessoais e Contratos">
                        <p>Carta de Condução, Cartão de Cidadão, Registo Criminal, Certificado de Motorista TVDE (sempre válidos).</p>
                        <p className="mt-2 font-semibold">Sempre estar acompanhado pelo contrato de aluguer ou contrato de prestação de serviços para o "SLOT".</p>
                    </RequirementItem>
                    <RequirementItem title="Aplicações TVDE">
                        Uber Driver e Bolt Driver instaladas e atualizadas no telemóvel.
                    </RequirementItem>
                </div>
             </InfoCard>

            <InfoCard title="SOS / Assistência" borderColor="border-t-red-500" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}>
                <p>Em caso de emergência ou necessidade de assistência em viagem, utilize os contactos abaixo.</p>
                <div className="mt-4">
                    <Button variant="danger" onClick={() => setIsSosModalOpen(true)} className="w-full">
                        Contactar Assistência
                    </Button>
                </div>
            </InfoCard>

            <InfoCard title="Dados da Viatura" borderColor="border-t-teal-500" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.623 5.91l-4.62 4.62a2.121 2.121 0 01-3-3l4.62-4.62A6 6 0 0117 7z" /></svg>}>
                {hasVehicleInfo ? (
                    <div className="space-y-3">
                        {user.vehicleModel && <div>
                            <p className="text-xs text-gray-400">Modelo</p>
                            <p className="font-semibold">{user.vehicleModel}</p>
                        </div>}
                         {(user.insuranceCompany || user.insurancePolicy) && <div>
                            <p className="text-xs text-gray-400">Seguro</p>
                            <p className="font-semibold">{user.insuranceCompany || 'N/A'} - Apólice: {user.insurancePolicy || 'N/A'}</p>
                        </div>}
                        {(user.fleetCardCompany || user.fleetCardNumber) && <div>
                            <p className="text-xs text-gray-400">Cartão Frota</p>
                            <p className="font-semibold">{user.fleetCardCompany || 'N/A'} - Nº: {user.fleetCardNumber || 'N/A'}</p>
                        </div>}
                    </div>
                ) : (
                    <p>Dados da viatura não disponíveis. Contacte a administração.</p>
                )}
             </InfoCard>

             <InfoCard title="Dados para Faturação" borderColor="border-t-purple-500" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}>
                <p className="text-sm text-gray-400">Utilize estes dados para emitir os seus recibos verdes.</p>
                {isDemo ? (
                    <div className="space-y-3 pt-3 mt-3 border-t border-gray-700">
                        <div>
                            <p className="font-semibold">{MOCK_COMPANY_INFO.name}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">NIPC</p>
                            <p className="font-semibold">{MOCK_COMPANY_INFO.nipc}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">GERÊNCIA</p>
                            <p className="font-semibold">{MOCK_COMPANY_INFO.manager}</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3 pt-3 mt-3 border-t border-gray-700">
                        <div>
                            <p className="font-semibold">ASFALTO CATIVANTE - UNIPESSOAL LDA</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">NIPC</p>
                            <p className="font-semibold">517112604</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">GERÊNCIA</p>
                            <p className="font-semibold">PAULO ROGÉRIO COSTA FERREIRA</p>
                        </div>
                    </div>
                )}
            </InfoCard>

             <InfoCard title="Dados de Pagamento" borderColor="border-t-blue-500" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H4a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>}>
                {ibansLoading ? (
                    <p>A carregar dados...</p>
                ) : myIban ? (
                    <div className="space-y-3">
                        <div>
                            <p className="text-xs text-gray-400">Nome do Titular</p>
                            <p className="font-semibold">{myIban.fullName}</p>
                        </div>
                         <div>
                            <p className="text-xs text-gray-400">NIF</p>
                            <p className="font-semibold">{myIban.nif}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-400">IBAN</p>
                            <p className="font-semibold break-all">{myIban.iban}</p>
                        </div>
                        <p className="text-xs text-yellow-400 pt-2 border-t border-gray-700">Se os dados estiverem incorretos, por favor entre em contato com a administração para correção.</p>
                    </div>
                ) : (
                    <p>Nenhum IBAN registado. Por favor, entre em contato com a administração.</p>
                )}
             </InfoCard>

          </div>
        </div>
      </main>
    </div>
    <SosModal isOpen={isSosModalOpen} onClose={() => setIsSosModalOpen(false)} />
    <ReminderModal 
        isOpen={isReminderModalOpen} 
        onClose={handleCloseReminder} 
        amount={previousMonthsPendingBalance} 
    />
    </>
  );
};

export default DriverInfoView;