import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCalculations } from '../hooks/useCalculations';
import { Calculation, CalculationStatus, CalculationType, UserRole, PercentageType, FuelType } from '../types';
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
  uberRides: '0', uberTips: '0', uberTolls: '0', uberPreviousPeriodAdjustments: '0',
  boltRides: '0', boltTips: '0', boltTolls: '0', boltPreviousPeriodAdjustments: '0',
  vehicleRental: '0', fleetCard: '0', rentalTolls: '0', otherExpenses: '0',
  debtDeduction: '0',
  otherExpensesNotes: '',
  isIvaExempt: false,
  isSlotExempt: false,
  fuelType: '',
};

const toDate = (timestamp: any) => timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
const toInputDate = (timestamp: any) => toDate(timestamp).toISOString().split('T')[0];

const CalculationForm: React.FC<CalculationFormProps> = ({ onClose, calculationToEdit }) => {
  const { user: adminUser } = useAuth();
  const { addCalculation, updateCalculation } = useCalculations();
  const { users, updateUser } = useUsers();
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
        uberRides: String(calculationToEdit.uberRides || '0'),
        uberTips: String(calculationToEdit.uberTips || '0'),
        uberTolls: String(calculationToEdit.uberTolls || '0'),
        uberPreviousPeriodAdjustments: String(calculationToEdit.uberPreviousPeriodAdjustments || '0'),
        boltRides: String(calculationToEdit.boltRides || '0'),
        boltTips: String(calculationToEdit.boltTips || '0'),
        boltTolls: String(calculationToEdit.boltTolls || '0'),
        boltPreviousPeriodAdjustments: String(calculationToEdit.boltPreviousPeriodAdjustments || '0'),
        vehicleRental: String(calculationToEdit.vehicleRental || '0'),
        fleetCard: String(calculationToEdit.fleetCard || '0'),
        rentalTolls: String(calculationToEdit.rentalTolls || '0'),
        otherExpenses: String(calculationToEdit.otherExpenses || '0'),
        debtDeduction: String(calculationToEdit.debtDeduction || '0'),
        otherExpensesNotes: String(calculationToEdit.otherExpensesNotes || ''),
        isIvaExempt: !!calculationToEdit.isIvaExempt,
        isSlotExempt: !!calculationToEdit.isSlotExempt,
        fuelType: calculationToEdit.fuelType || '',
      });
    } else {
      setDriverId('');
      setDriverName('');
      setFormData(initialFormData);
    }
  }, [calculationToEdit, isEditMode]);

  useEffect(() => {
    if (selectedDriver && !isEditMode) {
      setDriverName(selectedDriver.name || '');

      // Apply default values from user profile for a new calculation
      const newDefaults: Partial<typeof initialFormData> = {
          isIvaExempt: selectedDriver.isIvaExempt || false,
          isSlotExempt: false,
          vehicleRental: '0',
          fuelType: '',
      };

      if (selectedDriver.type === CalculationType.FROTA || selectedDriver.type === CalculationType.PERCENTAGE) {
          newDefaults.vehicleRental = String(selectedDriver.defaultRentalValue || '0');
      } else if (selectedDriver.type === CalculationType.SLOT) {
          if (selectedDriver.slotType === 'FIXED') {
              // For fixed slot, we use the vehicleRental field and disable the percentage slot fee
              newDefaults.vehicleRental = String(selectedDriver.slotFixedValue || '0');
              newDefaults.isSlotExempt = true; 
          }
      }
      
      // Use a functional update to avoid stale state issues, merging with existing form data
      setFormData(prev => ({
          ...prev,
          ...newDefaults,
      }));
    } else if (!selectedDriver && !isEditMode) {
      // Clear defaults if driver is deselected
      setDriverName('');
      setFormData(prev => ({
          ...prev,
          isIvaExempt: false,
          isSlotExempt: false,
          vehicleRental: '0',
          fuelType: '',
      }));
    }
  }, [selectedDriver, isEditMode]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
        const { checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value === '0') {
        const { name } = e.target;
        setFormData(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (e.target.value === '') {
          const { name } = e.target;
          setFormData(prev => ({ ...prev, [name]: '0' }));
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUser || !driverId || !driverName || !formData.periodStart || !formData.periodEnd) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (selectedDriver?.type === CalculationType.PERCENTAGE && !formData.fuelType) {
        alert('Por favor, selecione o tipo de combustível para cálculos de percentagem.');
        return;
    }

    const debtDeductionAmount = parseFloat(formData.debtDeduction) || 0;
    if (selectedDriver?.outstandingDebt && debtDeductionAmount > selectedDriver.outstandingDebt) {
        alert(`O valor a deduzir da dívida (€${debtDeductionAmount.toFixed(2)}) não pode ser superior à dívida pendente (€${selectedDriver.outstandingDebt.toFixed(2)}).`);
        return;
    }

    const numericFormData = {
        uberRides: parseFloat(formData.uberRides) || 0,
        uberTips: parseFloat(formData.uberTips) || 0,
        uberTolls: parseFloat(formData.uberTolls) || 0,
        uberPreviousPeriodAdjustments: parseFloat(formData.uberPreviousPeriodAdjustments) || 0,
        boltRides: parseFloat(formData.boltRides) || 0,
        boltTips: parseFloat(formData.boltTips) || 0,
        boltTolls: parseFloat(formData.boltTolls) || 0,
        boltPreviousPeriodAdjustments: parseFloat(formData.boltPreviousPeriodAdjustments) || 0,
        fleetCard: parseFloat(formData.fleetCard) || 0,
        rentalTolls: parseFloat(formData.rentalTolls) || 0,
        otherExpenses: parseFloat(formData.otherExpenses) || 0,
        vehicleRental: parseFloat(formData.vehicleRental) || 0,
        debtDeduction: debtDeductionAmount,
    };

    const calculationData: any = {
      driverId,
      driverName,
      adminId: adminUser.id,
      type: calculationType,
      periodStart: formData.periodStart,
      periodEnd: formData.periodEnd,
      ...numericFormData,
      otherExpensesNotes: formData.otherExpensesNotes,
      vehicleRental: calculationType === CalculationType.FROTA || calculationType === CalculationType.PERCENTAGE || (selectedDriver?.type === CalculationType.SLOT && selectedDriver?.slotType === 'FIXED') ? numericFormData.vehicleRental : 0,
      isIvaExempt: formData.isIvaExempt,
      isSlotExempt: formData.isSlotExempt,
      fuelType: selectedDriver?.type === CalculationType.PERCENTAGE ? formData.fuelType : undefined,
      percentageType: selectedDriver?.type === CalculationType.PERCENTAGE ? selectedDriver.percentageType : undefined,
    };
    
    if (isEditMode && calculationToEdit) {
        // If editing, we need to handle the debt change carefully.
        // We calculate the difference between the old debt deduction and the new one.
        const oldDebtDeduction = calculationToEdit.debtDeduction || 0;
        const debtDifference = debtDeductionAmount - oldDebtDeduction;
        
        await updateCalculation(calculationToEdit.id, {
            ...calculationData,
            status: CalculationStatus.PENDING, 
            revisionNotes: '',
        });

        if (debtDifference !== 0 && selectedDriver) {
            const newDebt = (selectedDriver.outstandingDebt || 0) - debtDifference;
            await updateUser(selectedDriver.id, { outstandingDebt: newDebt });
        }

    } else {
        await addCalculation({
            ...calculationData,
            status: CalculationStatus.PENDING,
        });
        if (debtDeductionAmount > 0 && selectedDriver) {
            const newDebt = (selectedDriver.outstandingDebt || 0) - debtDeductionAmount;
            await updateUser(selectedDriver.id, { outstandingDebt: newDebt });
        }
    }
    
    onClose();
  };

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-8">
        <h2 className="text-2xl font-bold text-center">{isEditMode ? 'Editar Cálculo' : 'Criar Novo Cálculo'}</h2>
        
        {selectedDriver && selectedDriver.outstandingDebt > 0 && (
            <div className="p-4 text-sm text-yellow-200 bg-yellow-900/50 border border-yellow-700 rounded-lg">
                <p className="font-bold">Atenção: Dívida Pendente</p>
                <p>Este motorista tem uma dívida de <span className="font-bold">€{selectedDriver.outstandingDebt.toFixed(2)}</span>.</p>
                {selectedDriver.debtNotes && <p className="mt-1 text-xs">Notas: {selectedDriver.debtNotes}</p>}
                <p className="mt-2">Pode usar o campo "Dedução de Dívida" abaixo para abater este valor no cálculo atual.</p>
            </div>
        )}

        {selectedDriver && selectedDriver.type === CalculationType.PERCENTAGE && (
            <div className="p-4 bg-gray-900/50 rounded-md border border-cyan-500">
                <h4 className="font-bold text-cyan-300">Cálculo de Percentagem</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-400">Tipo de Partilha</label>
                        <p className="font-semibold text-lg">{selectedDriver.percentageType}</p>
                    </div>
                    <div>
                        <label htmlFor="fuelType" className="block text-sm font-medium text-gray-300">Tipo de Combustível</label>
                        <select id="fuelType" name="fuelType" value={formData.fuelType} onChange={handleInputChange} required className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md text-white">
                            <option value="">Selecione...</option>
                            <option value={FuelType.DIESEL}>Diesel</option>
                            <option value={FuelType.ELECTRIC}>Elétrico</option>
                        </select>
                    </div>
                </div>
            </div>
        )}


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
                    <input type="date" id="periodStart" name="periodStart" value={formData.periodStart} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 py-2 px-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-white" />
                </div>
                <div>
                    <label htmlFor="periodEnd" className="block text-sm font-medium text-gray-300">Fim do Período</label>
                    <input type="date" id="periodEnd" name="periodEnd" value={formData.periodEnd} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 py-2 px-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-white" />
                </div>
            </div>
        </div>

        <hr className="border-gray-600" />
        
        {/* Ganhos */}
        <div>
            <h3 className="text-lg font-semibold text-white">Ganhos</h3>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <NumberInput label="Uber Corridas" id="uberRides" name="uberRides" value={formData.uberRides} onChange={handleInputChange} onFocus={handleFocus} onBlur={handleBlur} />
                <NumberInput label="Uber Gorjetas" id="uberTips" name="uberTips" value={formData.uberTips} onChange={handleInputChange} onFocus={handleFocus} onBlur={handleBlur} />
                <NumberInput label="Uber Portagens" id="uberTolls" name="uberTolls" value={formData.uberTolls} onChange={handleInputChange} onFocus={handleFocus} onBlur={handleBlur} />
                <NumberInput label="Uber Ajustes" id="uberPreviousPeriodAdjustments" name="uberPreviousPeriodAdjustments" value={formData.uberPreviousPeriodAdjustments} onChange={handleInputChange} onFocus={handleFocus} onBlur={handleBlur} />
                <NumberInput label="Bolt Corridas" id="boltRides" name="boltRides" value={formData.boltRides} onChange={handleInputChange} onFocus={handleFocus} onBlur={handleBlur} />
                <NumberInput label="Bolt Gorjetas" id="boltTips" name="boltTips" value={formData.boltTips} onChange={handleInputChange} onFocus={handleFocus} onBlur={handleBlur} />
                <NumberInput label="Bolt Portagens" id="boltTolls" name="boltTolls" value={formData.boltTolls} onChange={handleInputChange} onFocus={handleFocus} onBlur={handleBlur} />
                <NumberInput label="Bolt Ajustes" id="boltPreviousPeriodAdjustments" name="boltPreviousPeriodAdjustments" value={formData.boltPreviousPeriodAdjustments} onChange={handleInputChange} onFocus={handleFocus} onBlur={handleBlur} />
            </div>
        </div>

        {/* Deduções */}
        <div>
            <h3 className="text-lg font-semibold text-white">Deduções</h3>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <NumberInput label="Aluguer Veículo" id="vehicleRental" name="vehicleRental" value={formData.vehicleRental} onChange={handleInputChange} onFocus={handleFocus} onBlur={handleBlur} disabled={selectedDriver?.type === CalculationType.SLOT && selectedDriver?.slotType === 'PERCENTAGE'} />
                <NumberInput label="Cartão Frota" id="fleetCard" name="fleetCard" value={formData.fleetCard} onChange={handleInputChange} onFocus={handleFocus} onBlur={handleBlur} />
                <NumberInput label="Portagens (Aluguer)" id="rentalTolls" name="rentalTolls" value={formData.rentalTolls} onChange={handleInputChange} onFocus={handleFocus} onBlur={handleBlur} />
                <NumberInput label="Outras Despesas" id="otherExpenses" name="otherExpenses" value={formData.otherExpenses} onChange={handleInputChange} onFocus={handleFocus} onBlur={handleBlur} />
            </div>
            <div className="mt-4">
                <label htmlFor="otherExpensesNotes" className="block text-sm font-medium text-gray-300">Notas (Outras Despesas)</label>
                <textarea id="otherExpensesNotes" name="otherExpensesNotes" value={formData.otherExpensesNotes} onChange={handleInputChange} rows={2} className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 py-2 px-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-white" />
            </div>
            {selectedDriver?.outstandingDebt > 0 && (
                <div className="mt-4">
                    <NumberInput label="Dedução de Dívida" id="debtDeduction" name="debtDeduction" value={formData.debtDeduction} onChange={handleInputChange} onFocus={handleFocus} onBlur={handleBlur} />
                </div>
            )}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div className="flex items-center">
                    <input id="isIvaExempt" name="isIvaExempt" type="checkbox" checked={formData.isIvaExempt} onChange={handleInputChange} className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-blue-600 focus:ring-blue-500" />
                    <label htmlFor="isIvaExempt" className="ml-3 block text-sm font-medium text-gray-300">Isento de IVA (6%)</label>
                </div>
                 <div className="flex items-center">
                    <input id="isSlotExempt" name="isSlotExempt" type="checkbox" checked={formData.isSlotExempt} onChange={handleInputChange} disabled={selectedDriver?.type !== CalculationType.SLOT || selectedDriver?.slotType === 'FIXED'} className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-blue-600 focus:ring-blue-500 disabled:opacity-50" />
                    <label htmlFor="isSlotExempt" className="ml-3 block text-sm font-medium text-gray-300">Isento de Slot (4%)</label>
                </div>
            </div>
        </div>
        
        <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
            <Button type="button" variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button type="submit" variant="primary">{isEditMode ? 'Salvar Alterações' : 'Criar Cálculo'}</Button>
        </div>
      </form>
    </Card>
  );
};

// FIX: Add default export to make the component available for import.
export default CalculationForm;
