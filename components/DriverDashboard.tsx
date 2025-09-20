
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCalculations } from '../hooks/useCalculations';
import CalculationView from './CalculationView';
import { Calculation, CalculationStatus } from '../types';
import Card from './ui/Card';
import ReportsView from './ReportsView';
import Button from './ui/Button';
import DriverInfoView from './DriverInfoView';

type DriverView = 'info' | 'list' | 'details' | 'reports';

const DriverCalculationsList: React.FC<{
  onSelectCalculation: (calc: Calculation) => void;
  onShowReports: () => void;
  onBack: () => void;
}> = ({ onSelectCalculation, onShowReports, onBack }) => {
  const { calculations, loading, error } = useCalculations();

  const toDate = (timestamp: any) => timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);

  const getStatusColor = (status: CalculationStatus) => {
    switch (status) {
      case CalculationStatus.ACCEPTED: return 'text-green-400';
      case CalculationStatus.REVISION_REQUESTED: return 'text-red-400';
      case CalculationStatus.PENDING: return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };
  
  return (
      <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
           <Button onClick={onBack} className="mb-6">
                &larr; Voltar às Informações
            </Button>
            <Card>
              <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <h3 className="text-xl font-semibold">Meus Resumos Semanais</h3>
                <Button onClick={onShowReports} variant="secondary">Ver Relatórios</Button>
              </div>
              {error && <p className="text-red-400">{error}</p>}
              {loading ? (
                <p className="text-gray-400 text-center py-4">A carregar...</p>
              ) : calculations.length > 0 ? (
                <ul className="space-y-4">
                  {calculations.map(calc => (
                    <li 
                      key={calc.id} 
                      className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 flex justify-between items-center hover:bg-gray-700/50 transition-colors cursor-pointer"
                      onClick={() => onSelectCalculation(calc)}
                    >
                      <div>
                        <p className="font-semibold text-white">Período: {toDate(calc.periodStart).toLocaleDateString('pt-PT')} - {toDate(calc.periodEnd).toLocaleDateString('pt-PT')}</p>
                        <p className="text-sm text-gray-400">Tipo: {calc.type}</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${getStatusColor(calc.status)}`}>{calc.status}</p>
                        <p className="text-xs text-gray-500">Clique para ver detalhes</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 text-center py-4">Nenhum cálculo encontrado.</p>
              )}
            </Card>
        </div>
      </div>
  );
};


const DriverDashboard: React.FC = () => {
  const { user } = useAuth();
  const [view, setView] = useState<DriverView>('info');
  const [selectedCalculation, setSelectedCalculation] = useState<Calculation | null>(null);

  const handleSelectCalculation = (calc: Calculation) => {
    setSelectedCalculation(calc);
    setView('details');
  };

  const renderContent = () => {
    switch (view) {
      case 'info':
        return <DriverInfoView onNavigateToCalculations={() => setView('list')} />;

      case 'list':
        return <DriverCalculationsList 
                  onSelectCalculation={handleSelectCalculation} 
                  onShowReports={() => setView('reports')}
                  onBack={() => setView('info')}
               />;
      
      case 'details':
        if (!selectedCalculation) return null;
        return (
            <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
                 <div className="max-w-md mx-auto">
                    <Button onClick={() => setView('list')} className="mb-4">
                        &larr; Voltar aos Meus Cálculos
                    </Button>
                    <CalculationView calculation={selectedCalculation} />
                 </div>
            </div>
        );

      case 'reports':
        return (
            <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
                 <ReportsView onBack={() => setView('list')} driverId={user?.id} />
            </div>
        );
    }
  };

  return <>{renderContent()}</>;
};

export default DriverDashboard;