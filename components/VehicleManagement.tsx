import React, { useState, useEffect, useMemo } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import { useUsers } from '../hooks/useUsers';
import { User, UserRole } from '../types';

const VehicleInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, id, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-300">{label}</label>
        <input
            id={id}
            {...props}
            className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 py-2 px-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-white"
        />
    </div>
);

const initialFormState = {
    vehicleModel: '',
    insuranceCompany: '',
    insurancePolicy: '',
    fleetCardCompany: '',
    fleetCardNumber: '',
};

const VehicleManagement: React.FC = () => {
    const { users, updateUser, loading: usersLoading } = useUsers();
    const [formData, setFormData] = useState(initialFormState);
    const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);

    const drivers = useMemo(() => users.filter(u => u.role === UserRole.DRIVER).sort((a,b) => a.name.localeCompare(b.name)), [users]);

    const selectedDriver = useMemo(() => {
        if (!selectedDriverId) return null;
        return users.find(u => u.id === selectedDriverId);
    }, [selectedDriverId, users]);


    useEffect(() => {
        if (selectedDriver) {
            setFormData({
                vehicleModel: selectedDriver.vehicleModel || '',
                insuranceCompany: selectedDriver.insuranceCompany || '',
                insurancePolicy: selectedDriver.insurancePolicy || '',
                fleetCardCompany: selectedDriver.fleetCardCompany || '',
                fleetCardNumber: selectedDriver.fleetCardNumber || '',
            });
        } else {
            setFormData(initialFormState);
        }
    }, [selectedDriver]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCancelEdit = () => {
        setSelectedDriverId(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDriverId) {
            alert('Por favor, selecione um motorista para editar.');
            return;
        }

        updateUser(selectedDriverId, formData);
        handleCancelEdit();
    };

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">Gestão de Viaturas</h2>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-2">
                    <Card>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <h3 className="text-xl font-semibold text-white">{selectedDriver ? `Editar Viatura de ${selectedDriver.name}` : 'Selecione um Motorista'}</h3>
                            
                            {!selectedDriverId && <p className="text-gray-400">Selecione um motorista da lista para ver ou editar os detalhes da sua viatura.</p>}
                            
                            {selectedDriverId && (
                                <>
                                    <VehicleInput label="Modelo da Viatura (ex: TESLA model3 2020)" id="vehicleModel" name="vehicleModel" value={formData.vehicleModel} onChange={handleInputChange} />
                                    <VehicleInput label="Seguradora" id="insuranceCompany" name="insuranceCompany" value={formData.insuranceCompany} onChange={handleInputChange} />
                                    <VehicleInput label="Nº da Apólice" id="insurancePolicy" name="insurancePolicy" value={formData.insurancePolicy} onChange={handleInputChange} />
                                    <VehicleInput label="Cartão Frota (Empresa)" id="fleetCardCompany" name="fleetCardCompany" value={formData.fleetCardCompany} onChange={handleInputChange} />
                                    <VehicleInput label="Nº Cartão Frota" id="fleetCardNumber" name="fleetCardNumber" value={formData.fleetCardNumber} onChange={handleInputChange} />

                                    <div className="flex gap-4">
                                        <Button type="submit" variant="primary" className="w-full">Salvar Alterações</Button>
                                        <Button type="button" variant="secondary" onClick={handleCancelEdit}>Cancelar</Button>
                                    </div>
                                </>
                            )}
                        </form>
                    </Card>
                </div>

                {/* List Section */}
                <div className="lg:col-span-3">
                    <Card className="h-full">
                        <h3 className="text-xl font-semibold text-white mb-4">Motoristas e Viaturas</h3>
                        {usersLoading ? (
                             <p className="text-gray-400">A carregar motoristas...</p>
                        ) : drivers.length > 0 ? (
                            <div className="space-y-4">
                                {drivers.map(driver => {
                                    const hasVehicleInfo = driver.vehicleModel || driver.insuranceCompany || driver.insurancePolicy || driver.fleetCardCompany || driver.fleetCardNumber;
                                    return (
                                        <div key={driver.id} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex-grow">
                                                    <p className="font-bold text-white">{driver.name} <span className="text-xs font-normal text-gray-400">({driver.matricula})</span></p>
                                                    {hasVehicleInfo ? (
                                                        <div className="mt-2 text-xs text-gray-300 space-y-1">
                                                            <p><span className="font-semibold text-gray-500">Modelo:</span> {driver.vehicleModel || 'N/A'}</p>
                                                            <p><span className="font-semibold text-gray-500">Apólice:</span> {driver.insurancePolicy || 'N/A'} ({driver.insuranceCompany || 'N/A'})</p>
                                                            <p><span className="font-semibold text-gray-500">Cartão:</span> {driver.fleetCardNumber || 'N/A'} ({driver.fleetCardCompany || 'N/A'})</p>
                                                        </div>
                                                    ) : (
                                                        <p className="mt-2 text-xs text-gray-400 italic">Nenhuma viatura associada.</p>
                                                    )}
                                                </div>
                                                <div className="flex-shrink-0">
                                                    <Button variant={selectedDriverId === driver.id ? 'success' : 'secondary'} onClick={() => setSelectedDriverId(driver.id)} className="text-xs px-2 py-1">
                                                        {selectedDriverId === driver.id ? 'A Editar' : 'Editar'}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-gray-400">Nenhum motorista encontrado.</p>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default VehicleManagement;