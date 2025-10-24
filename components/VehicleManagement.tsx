import React, { useState, useMemo } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import { useUsers } from '../hooks/useUsers';
import { User, UserRole, CalculationType, PercentageType } from '../types';

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
    name: '',
    email: '',
    password: '',
    role: UserRole.DRIVER,
    status: 'ACTIVE' as 'ACTIVE' | 'ARCHIVED',
    matricula: '',
    type: CalculationType.FROTA,
    vehicleModel: '',
    insuranceCompany: '',
    insurancePolicy: '',
    fleetCardCompany: '',
    fleetCardNumber: '',
    outstandingDebt: '0',
    debtNotes: '',
    defaultRentalValue: '0',
    isIvaExempt: false,
    slotType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    slotFixedValue: '0',
    percentageType: PercentageType.FIFTY_FIFTY,
};

const VehicleManagement: React.FC = () => {
    const { users, updateUser, addUser, loading: usersLoading } = useUsers();
    const [formData, setFormData] = useState(initialFormState);
    const [editingDriver, setEditingDriver] = useState<User | null>(null);
    const [isAddingNewUser, setIsAddingNewUser] = useState(false);
    const [showArchived, setShowArchived] = useState(false);

    const allUsers = useMemo(() => [...users].sort((a, b) => a.name.localeCompare(b.name)), [users]);
    const visibleUsers = useMemo(() => {
        return allUsers.filter(u => u.role !== UserRole.ADMIN && (showArchived || u.status !== 'ARCHIVED'));
    }, [allUsers, showArchived]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFormData(prev => ({...prev, [name]: checked}));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSelectForEdit = (user: User) => {
        setIsAddingNewUser(false);
        setEditingDriver(user);
        setFormData({
            name: user.name,
            email: user.email,
            password: '',
            role: user.role,
            status: user.status || 'ACTIVE',
            matricula: user.matricula,
            type: user.type,
            vehicleModel: user.vehicleModel || '',
            insuranceCompany: user.insuranceCompany || '',
            insurancePolicy: user.insurancePolicy || '',
            fleetCardCompany: user.fleetCardCompany || '',
            fleetCardNumber: user.fleetCardNumber || '',
            outstandingDebt: String(user.outstandingDebt || '0'),
            debtNotes: user.debtNotes || '',
            defaultRentalValue: String(user.defaultRentalValue || '0'),
            isIvaExempt: user.isIvaExempt || false,
            slotType: user.slotType || 'PERCENTAGE',
            slotFixedValue: String(user.slotFixedValue || '0'),
            percentageType: user.percentageType || PercentageType.FIFTY_FIFTY,
        });
    };
    
    const handleSwapDriver = (userToSwap: User) => {
        setIsAddingNewUser(true);
        setEditingDriver(null);
        setFormData({
            ...initialFormState,
            // Copy vehicle and contract data from the user being swapped
            matricula: userToSwap.matricula,
            type: userToSwap.type,
            vehicleModel: userToSwap.vehicleModel || '',
            insuranceCompany: userToSwap.insuranceCompany || '',
            insurancePolicy: userToSwap.insurancePolicy || '',
            fleetCardCompany: userToSwap.fleetCardCompany || '',
            fleetCardNumber: userToSwap.fleetCardNumber || '',
            defaultRentalValue: String(userToSwap.defaultRentalValue || '0'),
            isIvaExempt: userToSwap.isIvaExempt || false,
            slotType: userToSwap.slotType || 'PERCENTAGE',
            slotFixedValue: String(userToSwap.slotFixedValue || '0'),
            percentageType: userToSwap.percentageType || PercentageType.FIFTY_FIFTY,
        });
        alert('Formulário pré-preenchido com os dados da viatura. Por favor, insira os dados do novo motorista para criar um novo login.');
    };

    const handleStartAdding = () => {
        setIsAddingNewUser(true);
        setEditingDriver(null);
        setFormData(initialFormState);
    };

    const handleCancel = () => {
        setIsAddingNewUser(false);
        setEditingDriver(null);
        setFormData(initialFormState);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isAddingNewUser) {
             if (!formData.name || !formData.email || !formData.password) {
                alert('Por favor, preencha todos os dados básicos (Nome, Email, Password).');
                return;
            }
            if (formData.role === UserRole.DRIVER && !formData.matricula) {
                alert('A matrícula é obrigatória para motoristas.');
                return;
            }

            const result = await addUser({ 
                ...formData,
                status: 'ACTIVE',
                outstandingDebt: parseFloat(formData.outstandingDebt) || 0,
                defaultRentalValue: parseFloat(formData.defaultRentalValue) || 0,
                slotFixedValue: parseFloat(formData.slotFixedValue) || 0,
            });
            if (result.success) {
                alert('Utilizador adicionado com sucesso!');
                handleCancel();
            } else {
                alert(`Erro ao adicionar utilizador: ${result.error}`);
            }
        } else if (editingDriver) {
            // When editing, we only update profile fields, not core auth info (email/password).
            const { email, password, ...updatableData } = formData;
            const dataToUpdate = {
                ...updatableData,
                outstandingDebt: parseFloat(formData.outstandingDebt) || 0,
                defaultRentalValue: parseFloat(formData.defaultRentalValue) || 0,
                slotFixedValue: parseFloat(formData.slotFixedValue) || 0,
            };
            await updateUser(editingDriver.id, dataToUpdate);
            alert('Dados do utilizador atualizados com sucesso!');
            handleCancel();
        }
    };

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">Gestão de Utilizadores</h2>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-2">
                    <Card>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <h3 className="text-xl font-semibold text-white">
                                {isAddingNewUser ? 'Adicionar Novo Utilizador' : editingDriver ? `Editar ${editingDriver.name}` : 'Selecione um Utilizador'}
                            </h3>

                            {(!isAddingNewUser && !editingDriver) && <p className="text-gray-400">Selecione um utilizador da lista para ver ou editar os seus detalhes, ou clique em "Adicionar Novo Utilizador".</p>}

                            {(isAddingNewUser || editingDriver) && (
                                <>
                                    {isAddingNewUser ? (
                                        <>
                                            <div>
                                                <label htmlFor="role" className="block text-sm font-medium text-gray-300">Tipo de Utilizador</label>
                                                <select id="role" name="role" value={formData.role} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md text-white">
                                                    <option value={UserRole.DRIVER}>Motorista</option>
                                                    <option value={UserRole.OWNER}>Proprietário</option>
                                                </select>
                                            </div>
                                            <VehicleInput label="Nome Completo" id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                                            <VehicleInput label="Email" id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
                                            <VehicleInput label="Password" id="password" name="password" type="password" value={formData.password} onChange={handleInputChange} required />
                                        </>
                                    ) : (
                                        <>
                                            <div className="p-3 bg-gray-900 rounded-lg">
                                                 {formData.role !== UserRole.DRIVER && <p className="text-sm font-semibold text-white">{formData.name}</p>}
                                                 <p className="text-xs text-gray-400">{formData.email} ({formData.role})</p>
                                            </div>
                                            <div>
                                                <label htmlFor="status" className="block text-sm font-medium text-gray-300">Estado do Utilizador</label>
                                                <select id="status" name="status" value={formData.status} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md text-white">
                                                    <option value="ACTIVE">Ativo</option>
                                                    <option value="ARCHIVED">Arquivado</option>
                                                </select>
                                            </div>
                                        </>
                                    )}

                                    {formData.role === UserRole.DRIVER && (
                                        <>
                                            <hr className="border-gray-600" />
                                            <h4 className="text-lg font-semibold text-white">Dados do Motorista</h4>
                                            <VehicleInput label="Matrícula (Identificador)" id="matricula" name="matricula" value={formData.matricula} onChange={handleInputChange} required disabled={!isAddingNewUser} />
                                            <div>
                                                <label htmlFor="type" className="block text-sm font-medium text-gray-300">Tipo de Contrato</label>
                                                <select id="type" name="type" value={formData.type} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md text-white">
                                                    <option value={CalculationType.FROTA}>Frota</option>
                                                    <option value={CalculationType.SLOT}>Slot</option>
                                                    <option value={CalculationType.PERCENTAGE}>Percentagem</option>
                                                </select>
                                            </div>
                                            {!isAddingNewUser && (
                                                 <VehicleInput label="Nome Completo do Condutor" id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                                            )}
                                            <hr className="border-gray-600" />
                                            <h4 className="text-lg font-semibold text-white">Configurações Financeiras</h4>
                                            
                                            <div className="flex items-center pt-2">
                                                <input id="isIvaExempt" name="isIvaExempt" type="checkbox" checked={formData.isIvaExempt} onChange={handleInputChange} className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-blue-600 focus:ring-blue-500" />
                                                <label htmlFor="isIvaExempt" className="ml-3 block text-sm font-medium text-gray-300">Isento de IVA 6%</label>
                                            </div>

                                            {formData.type === CalculationType.FROTA && (
                                                <VehicleInput label="Valor do Aluguer Semanal (€)" id="defaultRentalValue" name="defaultRentalValue" type="number" step="0.01" value={formData.defaultRentalValue} onChange={handleInputChange} />
                                            )}

                                            {formData.type === CalculationType.PERCENTAGE && (
                                                 <div className="space-y-4 rounded-md p-4 border border-gray-600 bg-gray-900/50">
                                                    <label htmlFor="percentageType" className="block text-sm font-medium text-gray-300">Tipo de Partilha</label>
                                                    <select id="percentageType" name="percentageType" value={formData.percentageType} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md text-white">
                                                        <option value={PercentageType.FIFTY_FIFTY}>50/50</option>
                                                        <option value={PercentageType.SIXTY_FORTY}>60% Frota / 40% Motorista</option>
                                                    </select>
                                                    <VehicleInput label="Valor do Aluguer (para 60/40)" id="defaultRentalValue" name="defaultRentalValue" type="number" step="0.01" value={formData.defaultRentalValue} onChange={handleInputChange} />
                                                 </div>
                                            )}

                                            {formData.type === CalculationType.SLOT && (
                                                <div className="space-y-4 rounded-md p-4 border border-gray-600 bg-gray-900/50">
                                                    <label className="block text-sm font-medium text-gray-300">Tipo de Comissão Slot</label>
                                                    <div className="flex flex-col sm:flex-row gap-4">
                                                        <div className="flex items-center">
                                                            <input id="slotTypePercentage" name="slotType" type="radio" value="PERCENTAGE" checked={formData.slotType === 'PERCENTAGE'} onChange={handleInputChange} className="h-4 w-4 border-gray-500 bg-gray-700 text-blue-600 focus:ring-blue-500" />
                                                            <label htmlFor="slotTypePercentage" className="ml-3 block text-sm font-medium text-gray-300">Percentagem (4%)</label>
                                                        </div>
                                                        <div className="flex items-center">
                                                            <input id="slotTypeFixed" name="slotType" type="radio" value="FIXED" checked={formData.slotType === 'FIXED'} onChange={handleInputChange} className="h-4 w-4 border-gray-500 bg-gray-700 text-blue-600 focus:ring-blue-500" />
                                                            <label htmlFor="slotTypeFixed" className="ml-3 block text-sm font-medium text-gray-300">Valor Fixo</label>
                                                        </div>
                                                    </div>
                                                    {formData.slotType === 'FIXED' && (
                                                        <VehicleInput label="Valor Fixo Semanal (€)" id="slotFixedValue" name="slotFixedValue" type="number" step="0.01" value={formData.slotFixedValue} onChange={handleInputChange} />
                                                    )}
                                                </div>
                                            )}

                                            <hr className="border-gray-600" />
                                            <h4 className="text-lg font-semibold text-white">Dados da Viatura</h4>
                                            <VehicleInput label="Modelo da Viatura (ex: TESLA model3 2020)" id="vehicleModel" name="vehicleModel" value={formData.vehicleModel} onChange={handleInputChange} />
                                            <VehicleInput label="Seguradora" id="insuranceCompany" name="insuranceCompany" value={formData.insuranceCompany} onChange={handleInputChange} />
                                            <VehicleInput label="Nº da Apólice" id="insurancePolicy" name="insurancePolicy" value={formData.insurancePolicy} onChange={handleInputChange} />
                                            <VehicleInput label="Cartão Frota (Empresa)" id="fleetCardCompany" name="fleetCardCompany" value={formData.fleetCardCompany} onChange={handleInputChange} />
                                            <VehicleInput label="Nº Cartão Frota" id="fleetCardNumber" name="fleetCardNumber" value={formData.fleetCardNumber} onChange={handleInputChange} />

                                            <hr className="border-gray-600" />
                                            <h4 className="text-lg font-semibold text-white">Gestão de Dívidas</h4>
                                            <VehicleInput label="Dívida Pendente (€)" id="outstandingDebt" name="outstandingDebt" type="number" step="0.01" value={formData.outstandingDebt} onChange={handleInputChange} />
                                            <VehicleInput label="Notas da Dívida" id="debtNotes" name="debtNotes" value={formData.debtNotes} onChange={handleInputChange} />
                                        </>
                                    )}

                                    <div className="flex gap-4 pt-4 border-t border-gray-700">
                                        <Button type="submit" variant="primary" className="w-full">{isAddingNewUser ? 'Criar Utilizador' : 'Salvar Alterações'}</Button>
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
                            <div>
                                <h3 className="text-xl font-semibold text-white">Utilizadores Registrados</h3>
                                <div className="flex items-center mt-2">
                                    <input id="showArchived" name="showArchived" type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-blue-600 focus:ring-blue-500" />
                                    <label htmlFor="showArchived" className="ml-2 block text-sm font-medium text-gray-300">Mostrar utilizadores arquivados</label>
                                </div>
                            </div>
                             <Button onClick={handleStartAdding} variant="primary">Adicionar Novo Utilizador</Button>
                        </div>
                        {usersLoading ? (
                             <p className="text-gray-400">A carregar utilizadores...</p>
                        ) : visibleUsers.length > 0 ? (
                            <div className="space-y-4">
                                {visibleUsers.map(user => {
                                    const isDriver = user.role === UserRole.DRIVER;
                                    const hasDebt = isDriver && user.outstandingDebt > 0;
                                    const isEditingCurrent = editingDriver?.id === user.id;
                                    const isArchived = user.status === 'ARCHIVED';
                                    
                                    return (
                                        <div key={user.id} className={`p-4 rounded-lg border transition-all duration-200 ${isEditingCurrent ? 'bg-blue-900/30 border-blue-600' : isArchived ? 'bg-gray-800/50 border-gray-700 opacity-60' : 'bg-gray-900/50 border-gray-700'}`}>
                                            <div className="flex justify-between items-start gap-4 flex-wrap">
                                                <div className="flex-grow">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className={`font-bold text-white ${isArchived ? 'line-through' : ''}`}>{user.name}</p>
                                                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${isDriver ? 'bg-cyan-800 text-cyan-200' : 'bg-purple-800 text-purple-200'}`}>{user.role}</span>
                                                        {isDriver && <span className="text-xs text-gray-400">({user.matricula})</span>}
                                                        {isArchived && <span className="text-xs font-bold text-gray-400 bg-gray-700 px-2 py-0.5 rounded-full">ARQUIVADO</span>}
                                                        {hasDebt && !isArchived && <span className="text-xs font-bold text-red-400 bg-red-900/50 px-2 py-0.5 rounded-full">COM DÍVIDA</span>}
                                                    </div>
                                                    <p className="mt-1 text-xs text-gray-400">{user.email}</p>
                                                </div>
                                                <div className="flex-shrink-0 flex gap-2 flex-wrap">
                                                     {isDriver && !isArchived && <Button variant="secondary" onClick={() => handleSwapDriver(user)} className="text-xs px-2 py-1">Trocar Motorista</Button>}
                                                    <Button variant={isEditingCurrent ? 'success' : 'secondary'} onClick={() => handleSelectForEdit(user)} className="text-xs px-2 py-1">
                                                        {isEditingCurrent ? 'A Editar' : 'Editar'}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-gray-400">Nenhum motorista ou proprietário encontrado.</p>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default VehicleManagement;