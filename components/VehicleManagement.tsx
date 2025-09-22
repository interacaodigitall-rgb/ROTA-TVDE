
import React, { useState, useMemo } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import { useUsers } from '../hooks/useUsers';
import { User, UserRole, CalculationType } from '../types';

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

const initialDriverFormState = {
    name: '',
    email: '',
    password: '',
    matricula: '',
    type: CalculationType.FROTA,
    vehicleModel: '',
    insuranceCompany: '',
    insurancePolicy: '',
    fleetCardCompany: '',
    fleetCardNumber: '',
};

const VehicleManagement: React.FC = () => {
    const { users, updateUser, addUser, loading: usersLoading } = useUsers();
    const [formData, setFormData] = useState(initialDriverFormState);
    const [editingDriver, setEditingDriver] = useState<User | null>(null);
    const [isAddingNewDriver, setIsAddingNewDriver] = useState(false);

    const drivers = useMemo(() => users.filter(u => u.role === UserRole.DRIVER).sort((a, b) => a.name.localeCompare(b.name)), [users]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectForEdit = (driver: User) => {
        setIsAddingNewDriver(false);
        setEditingDriver(driver);
        setFormData({
            name: driver.name,
            email: driver.email,
            password: '',
            matricula: driver.matricula,
            type: driver.type,
            vehicleModel: driver.vehicleModel || '',
            insuranceCompany: driver.insuranceCompany || '',
            insurancePolicy: driver.insurancePolicy || '',
            fleetCardCompany: driver.fleetCardCompany || '',
            fleetCardNumber: driver.fleetCardNumber || '',
        });
    };
    
    const handleStartAdding = () => {
        setIsAddingNewDriver(true);
        setEditingDriver(null);
        setFormData(initialDriverFormState);
    };

    const handleCancel = () => {
        setIsAddingNewDriver(false);
        setEditingDriver(null);
        setFormData(initialDriverFormState);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isAddingNewDriver) {
             if (!formData.name || !formData.email || !formData.password || !formData.matricula) {
                alert('Por favor, preencha todos os dados do motorista (Nome, Email, Password, Matrícula).');
                return;
            }
            const result = await addUser({ ...formData, role: UserRole.DRIVER });
            if (result.success) {
                alert('Motorista adicionado com sucesso!');
                handleCancel();
            } else {
                alert(`Erro ao adicionar motorista: ${result.error}`);
            }
        } else if (editingDriver) {
            const { name, email, password, matricula, type, ...vehicleData } = formData;
            await updateUser(editingDriver.id, vehicleData);
            alert('Dados da viatura atualizados com sucesso!');
            handleCancel();
        }
    };

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">Gestão de Viaturas e Motoristas</h2>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-2">
                    <Card>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <h3 className="text-xl font-semibold text-white">
                                {isAddingNewDriver ? 'Adicionar Novo Motorista' : editingDriver ? `Editar Viatura de ${editingDriver.name}` : 'Selecione um Motorista'}
                            </h3>

                            {(!isAddingNewDriver && !editingDriver) && <p className="text-gray-400">Selecione um motorista da lista para ver ou editar os detalhes da sua viatura, ou clique em "Adicionar Novo Motorista".</p>}

                            {(isAddingNewDriver || editingDriver) && (
                                <>
                                    {isAddingNewDriver && (
                                        <>
                                            <VehicleInput label="Nome Completo" id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                                            <VehicleInput label="Email" id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
                                            <VehicleInput label="Password" id="password" name="password" type="password" value={formData.password} onChange={handleInputChange} required />
                                            <VehicleInput label="Matrícula (Identificador)" id="matricula" name="matricula" value={formData.matricula} onChange={handleInputChange} required />
                                            <div>
                                                <label htmlFor="type" className="block text-sm font-medium text-gray-300">Tipo de Contrato</label>
                                                <select id="type" name="type" value={formData.type} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md text-white">
                                                    <option value={CalculationType.FROTA}>Frota</option>
                                                    <option value={CalculationType.SLOT}>Slot</option>
                                                </select>
                                            </div>
                                            <hr className="border-gray-600" />
                                            <h4 className="text-lg font-semibold text-white">Dados da Viatura (Opcional)</h4>
                                        </>
                                    )}

                                    <VehicleInput label="Modelo da Viatura (ex: TESLA model3 2020)" id="vehicleModel" name="vehicleModel" value={formData.vehicleModel} onChange={handleInputChange} />
                                    <VehicleInput label="Seguradora" id="insuranceCompany" name="insuranceCompany" value={formData.insuranceCompany} onChange={handleInputChange} />
                                    <VehicleInput label="Nº da Apólice" id="insurancePolicy" name="insurancePolicy" value={formData.insurancePolicy} onChange={handleInputChange} />
                                    <VehicleInput label="Cartão Frota (Empresa)" id="fleetCardCompany" name="fleetCardCompany" value={formData.fleetCardCompany} onChange={handleInputChange} />
                                    <VehicleInput label="Nº Cartão Frota" id="fleetCardNumber" name="fleetCardNumber" value={formData.fleetCardNumber} onChange={handleInputChange} />

                                    <div className="flex gap-4 pt-4 border-t border-gray-700">
                                        <Button type="submit" variant="primary" className="w-full">{isAddingNewDriver ? 'Criar Motorista' : 'Salvar Alterações'}</Button>
                                        <Button type="button" variant="secondary" onClick={handleCancel}>Cancelar</Button>
                                    </div>
                                </>
                            )}
                        </form>
                    </Card>
                </div>

                {/* List Section */}
                <div className="lg:col-span-3">
                    <Card className="h-full">
                        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                            <h3 className="text-xl font-semibold text-white">Motoristas Registrados</h3>
                             <Button onClick={handleStartAdding} variant="primary">Adicionar Novo Motorista</Button>
                        </div>
                        {usersLoading ? (
                             <p className="text-gray-400">A carregar motoristas...</p>
                        ) : drivers.length > 0 ? (
                            <div className="space-y-4">
                                {drivers.map(driver => {
                                    const hasVehicleInfo = driver.vehicleModel || driver.insuranceCompany || driver.insurancePolicy || driver.fleetCardCompany || driver.fleetCardNumber;
                                    const isEditingCurrent = editingDriver?.id === driver.id;
                                    return (
                                        <div key={driver.id} className={`p-4 rounded-lg border ${isEditingCurrent ? 'bg-blue-900/30 border-blue-600' : 'bg-gray-900/50 border-gray-700'}`}>
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
                                                        <p className="mt-2 text-xs text-yellow-400 italic">Nenhuma viatura associada.</p>
                                                    )}
                                                </div>
                                                <div className="flex-shrink-0">
                                                    <Button variant={isEditingCurrent ? 'success' : 'secondary'} onClick={() => handleSelectForEdit(driver)} className="text-xs px-2 py-1">
                                                        {isEditingCurrent ? 'A Editar' : 'Editar Viatura'}
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
