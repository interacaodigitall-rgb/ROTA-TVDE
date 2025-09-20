
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import Button from './ui/Button';
import { useIbans } from '../hooks/useIbans';

const InfoCard: React.FC<{ title: string; icon: JSX.Element; children: React.ReactNode; borderColor: string; }> = ({ title, icon, children, borderColor }) => (
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

const InfoListItem: React.FC<{ title: string; description: React.ReactNode }> = ({ title, description }) => (
  <div className="list-item">
    <p className="font-bold text-gray-200">&#8226; {title}</p>
    <div className="ml-4 text-sm">{description}</div>
  </div>
);

const DriverInfoView: React.FC<{ onNavigateToCalculations: () => void }> = ({ onNavigateToCalculations }) => {
  const { user, logout } = useAuth();
  const { ibans, loading: ibansLoading } = useIbans();

  const myIban = user ? ibans.find(iban => iban.driverId === user.id) : null;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      {/* Header */}
      <header className="bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
                <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center font-bold text-black text-xl">R5</div>
                <div className="ml-4">
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
          <div className="bg-gray-800 rounded-lg shadow-lg p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6">
             <div className="flex-grow">
                <h2 className="text-2xl font-bold text-white">Bem-vindo, {user?.name}!</h2>
                <p className="text-gray-400">Frota {user?.type} - Matrícula: {user?.matricula}</p>
                <p className="text-gray-400">Contacto: (indisponível)</p>
             </div>
             <div className="w-full sm:w-auto">
                <Button onClick={onNavigateToCalculations} variant="primary" className="w-full">Aceder aos Meus Cálculos</Button>
             </div>
          </div>

          <h2 className="text-xl font-semibold text-gray-200">Informações Importantes</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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

             <InfoCard title="Equipamentos Obrigatórios" borderColor="border-t-red-500" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}>
                <ul className="space-y-4">
                  <InfoListItem title="Extintor 2kg com certificado" description="Deve estar dentro do prazo e fixado na viatura." />
                  <InfoListItem title="Dístico TVDE" description="Colado no para-brisas, visível e válido." />
                  <InfoListItem title="Aviso 'Não Fumadores'" description="Afixado visivelmente no interior do veículo." />
                </ul>
             </InfoCard>

             <InfoCard title="Documentos e Apps" borderColor="border-t-orange-500" icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}>
                <ul className="space-y-4">
                  <InfoListItem title="App de controlo de horas" description="Obrigatória para cumprir com a legislação laboral." />
                  <InfoListItem title="Seguro de acidentes de trabalho" description="Emitido em nome do motorista, obrigatório por lei." />
                  <InfoListItem title="Contratos assinados" description="Comodato e prestação de serviço guardados." />
                </ul>
             </InfoCard>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DriverInfoView;
