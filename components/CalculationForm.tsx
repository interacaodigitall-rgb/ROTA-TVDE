import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCalculations } from '../hooks/useCalculations';
import { Calculation, CalculationStatus, CalculationType, UserRole } from '../types';
import Button from './ui/Button';
import Card from './ui/Card';
import { useUsers } from '../hooks/useUsers';

interface CalculationFormProps {
  onClose: () => void;
  calculationToEdit?: Calculation | null;
}

const NumberInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, id, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-300">{label}</label>
        <div className="relative mt-1 rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-gray-400 sm:text-sm">€</span>
            </div>
            <input
                type="number"
                id={id}
                step="0.01"
                className="block w-full rounded-md border-gray-600 bg-gray-700 pl-7 pr-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-white"
                placeholder="0.00"
                {...props}
            />
        </div>
    </div>
);

const initialFormData = {
  periodStart: '',
  periodEnd: '',
  uberRides: 0, uberTips: 0, uberTolls: 0,
  boltRides: 0, boltTips: 0, boltTolls: 0,
  vehicleRental: 0, fleetCard: 0, rentalTolls: 0, otherExpenses: 0,
};

const toDate = (timestamp: any) => timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
const toInputDate = (timestamp: any) => toDate(timestamp).toISOString().split('T')[0];

const CalculationForm: React.FC<CalculationFormProps> = ({ onClose, calculationToEdit }) => {
  const { user: adminUser } = useAuth();
  const { addCalculation, updateCalculation } = useCalculations();
  const { users } = useUsers();
  const isEditMode = !!calculationToEdit;

  const [driverId, setDriverId] = useState('');
  const [driverName, setDriverName] = useState('');
  const [formData, setFormData] = useState(initialFormData);

  const selectedDriver = useMemo(() => users.find(u => u.id === driverId), [driverId, users]);
  const calculationType = selectedDriver?.type ?? CalculationType.SLOT;
  
  const drivers = useMemo(() => users.filter(u => u.role === UserRole.DRIVER), [users]);
  const nonDrivers = useMemo(() => users.filter(u => u.role !== UserRole.DRIVER && u.id !== adminUser?.id), [users, adminUser]);


  useEffect(() => {
    if (isEditMode && calculationToEdit) {
      setDriverId(calculationToEdit.driverId);
      setDriverName(calculationToEdit.driverName);
      setFormData({
        periodStart: toInputDate(calculationToEdit.periodStart),
        periodEnd: toInputDate(calculationToEdit.periodEnd),
        uberRides: calculationToEdit.uberRides,
        uberTips: calculationToEdit.uberTips,
        uberTolls: calculationToEdit.uberTolls,
        boltRides: calculationToEdit.boltRides,
        boltTips: calculationToEdit.boltTips,
        boltTolls: calculationToEdit.boltTolls,
        vehicleRental: calculationToEdit.vehicleRental,
        fleetCard: calculationToEdit.fleetCard,
        rentalTolls: calculationToEdit.rentalTolls,
        otherExpenses: calculationToEdit.otherExpenses,
      });
    } else {
      setDriverId('');
      setDriverName('');
      setFormData(initialFormData);
    }
  }, [calculationToEdit, isEditMode]);

  useEffect(() => {
    if (!isEditMode) {
      setDriverName(selectedDriver?.name || '');
    }
  }, [selectedDriver, isEditMode]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUser || !driverId || !driverName || !formData.periodStart || !formData.periodEnd) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const calculationData: any = {
      driverId,
      driverName,
      adminId: adminUser.id,
      type: calculationType,
      periodStart: formData.periodStart,
      periodEnd: formData.periodEnd,
      ...formData,
      vehicleRental: calculationType === CalculationType.FROTA ? formData.vehicleRental : 0,
    };
    
    if (isEditMode && calculationToEdit) {
        updateCalculation(calculationToEdit.id, {
            ...calculationData,
            // DO NOT pass back the 'date' field. It's the creation timestamp and should not be updated.
            // Passing back the original Timestamp object can cause serialization issues.
            status: CalculationStatus.PENDING, // Reset status for re-approval
            revisionNotes: '', // Clear previous notes
        });
    } else {
        addCalculation({
            ...calculationData,
            status: CalculationStatus.PENDING,
        });
    }
    
    onClose();
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-8">
        <h2 className="text-2xl font-bold text-center">{isEditMode ? 'Editar Cálculo' : 'Criar Novo Cálculo'}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="driverId" className="block text-sm font-medium text-gray-300">Motorista (Matrícula)</label>
                    <select id="driverId" value={driverId} onChange={(e) => setDriverId(e.target.value)} required className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md text-white">
                        <option value="">Selecione...</option>
                        {drivers.map(d => <option key={d.id} value={d.id}>{d.matricula}</option>)}
                    </select>
                    {drivers.length === 0 && !isEditMode && (
                        <div className="mt-2 text-sm text-yellow-400 p-3 bg-yellow-900/50 border border-yellow-700 rounded-md">
                            <p className="font-bold">Nenhum motorista disponível para seleção.</p>
                            {nonDrivers.length > 0 ? (
                                <>
                                    <p className="mt-1">
                                        Foram encontrados {nonDrivers.length} utilizador(es) que não estão configurados como motoristas. 
                                        Verifique se o campo <code className="bg-gray-700 px-1 rounded">'role'</code> está definido como <code className="bg-gray-700 px-1 rounded">'DRIVER'</code> na base de dados para:
                                    </p>
                                    <ul className="list-disc list-inside mt-2 text-yellow-300">
                                        {nonDrivers.map(u => <li key={u.id}>{u.name || u.email}</li>)}
                                    </ul>
                                </>
                            ) : (
                                <p className="mt-1">
                                    Nenhum utilizador com a função de motorista foi encontrado na base de dados. Por favor, adicione um.
                                </p>
                            )}
                        </div>
                    )}
                </div>
                 <div>
                    <label htmlFor="driverName" className="block text-sm font-medium text-gray-300">Nome</label>
                    <input 
                      type="text" 
                      id="driverName" 
                      value={driverName} 
                      onChange={(e) => setDriverName(e.target.value)}
                      required
                      className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 py-2 px-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-white" 
                    />
                </div>
            </div>
            <div className="md:col-span-1 grid grid-cols-1 sm:grid-cols-2 gap-4 md:grid-cols-1">
                 <div>
                    <label htmlFor="periodStart" className="block text-sm font-medium text-gray-300">Início do Período</label>
                    <input type="date" id="periodStart" value={formData.periodStart} onChange={(e) => setFormData({...formData, periodStart: e.target.value})} required className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 py-2 px-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-white" />
                </div>
                <div>
                    <label htmlFor="periodEnd" className="block text-sm font-medium text-gray-300">Fim do Período</label>
                    <input type="date" id="periodEnd" value={formData.periodEnd} onChange={(e) => setFormData({...formData, periodEnd: e.target.value})} required className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 py-2 px-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-white" />
                </div>
            </div>
        </div>

        <div>
            <h3 className="text-lg font-medium leading-6 text-white border-b border-gray-700 pb-2 mb-4">Ganhos</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <NumberInput label="Uber Corridas" name="uberRides" value={formData.uberRides} onChange={handleInputChange} />
                <NumberInput label="Uber Gorjetas" name="uberTips" value={formData.uberTips} onChange={handleInputChange} />
                <NumberInput label="Uber Portagens" name="uberTolls" value={formData.uberTolls} onChange={handleInputChange} />
                <NumberInput label="Bolt Corridas" name="boltRides" value={formData.boltRides} onChange={handleInputChange} />
                <NumberInput label="Bolt Gorjetas" name="boltTips" value={formData.boltTips} onChange={handleInputChange} />
                <NumberInput label="Bolt Portagens" name="boltTolls" value={formData.boltTolls} onChange={handleInputChange} />
            </div>
        </div>

        <div>
            <h3 className="text-lg font-medium leading-6 text-white border-b border-gray-700 pb-2 mb-4">Deduções</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                 <NumberInput label="Aluguer Veículo" name="vehicleRental" value={formData.vehicleRental} onChange={handleInputChange} disabled={calculationType !== CalculationType.FROTA} />
                <NumberInput label="Cartão Frota" name="fleetCard" value={formData.fleetCard} onChange={handleInputChange} />
                <NumberInput label="Portagens (Aluguer)" name="rentalTolls" value={formData.rentalTolls} onChange={handleInputChange} />
                <NumberInput label="Outras Despesas" name="otherExpenses" value={formData.otherExpenses} onChange={handleInputChange} />
            </div>
        </div>

        <div className="flex justify-end gap-4">
            <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant="primary">{isEditMode ? 'Atualizar Cálculo' : 'Criar Cálculo'}</Button>
        </div>
      </form>
    </Card>
  );
};

export default CalculationForm;
