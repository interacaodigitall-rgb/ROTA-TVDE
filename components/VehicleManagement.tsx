import React, { useState, useMemo, useEffect } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import { useUsers } from '../hooks/useUsers';
import { User, UserRole, CalculationType, PercentageType } from '../types';
import { useAuth } from '../hooks/useAuth';

const VehicleInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, id, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-300">{label}</label>
        <input
            id={id}
            {...props}
            className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 py-2 px-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-white disabled:opacity-50 disabled:bg-gray-600"
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

type OperationMode = 'idle' | 'add' | 'edit' | 'swap' | 'reassign';

const VehicleManagement: React.FC<{readOnly?: boolean; hideArchivedToggle?: boolean}> = ({ readOnly = false, hideArchivedToggle = false }) => {
    const { users, updateUser, addUser, deleteUser, loading: usersLoading } = useUsers();
    const { user: currentUser } = useAuth();
    const [formData, setFormData] = useState(initialFormState);
    const [operationMode, setOperationMode] = useState<OperationMode>('idle');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [showArchived, setShowArchived] = useState(false);
    const [selectedVacantVehicleId, setSelectedVacantVehicleId] = useState('');


    const allUsers = useMemo(() => [...users].sort((a, b) => a.name.localeCompare(b.name)), [users]);
    
    const availableVehicles = useMemo(() => {
        return allUsers.filter(u => u.status === 'ARCHIVED' && u.role === UserRole.DRIVER);
    }, [allUsers]);

    const visibleUsers = useMemo(() => {
        if (hideArchivedToggle) {
            return allUsers.filter(u => u.role !== UserRole.ADMIN && u.status !== 'ARCHIVED');
        }
        return allUsers.filter(u => u.role !== UserRole.ADMIN && (showArchived || u.status !== 'ARCHIVED'));
    }, [allUsers, showArchived, hideArchivedToggle]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
            const { checked } = e.target as HTMLInputElement;
            setFormData(prev => ({...prev, [name]: checked}));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };
    
    const prefillFormWithUserData = (user: User) => {
        return {
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
        };
    };

    const handleVacantVehicleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const vacantUserId = e.target.value;
        setSelectedVacantVehicleId(vacantUserId);
        const vehicleData = availableVehicles.find(u => u.id === vacantUserId);
        
        if (vehicleData && selectedUser) { // selectedUser is the driver being reassigned
            // Prefill with the driver's personal/financial data first
            const driverData = prefillFormWithUserData(selectedUser);
            
            // Overwrite with the selected vehicle's data
            driverData.matricula = vehicleData.matricula;
            driverData.type = vehicleData.type;
            driverData.vehicleModel = vehicleData.vehicleModel || '';
            driverData.insuranceCompany = vehicleData.insuranceCompany || '';
            driverData.insurancePolicy = vehicleData.insurancePolicy || '';
            driverData.fleetCardCompany = vehicleData.fleetCardCompany || '';
            driverData.fleetCardNumber = vehicleData.fleetCardNumber || '';
            driverData.defaultRentalValue = String(vehicleData.defaultRentalValue || '0');
            driverData.isIvaExempt = vehicleData.isIvaExempt || false;
            driverData.slotType = vehicleData.slotType || 'PERCENTAGE';
            driverData.slotFixedValue = String(vehicleData.slotFixedValue || '0');
            driverData.percentageType = vehicleData.percentageType || PercentageType.FIFTY_FIFTY;
            
            // Clear login credentials for security
            driverData.email = '';
            driverData.password = '';
            
            setFormData(driverData);
        } else {
             // If "Selecione..." is chosen, reset vehicle fields but keep driver data
            if (selectedUser) {
                const driverData = prefillFormWithUserData(selectedUser);
                setFormData({
                    ...initialFormState, // Start with a blank slate for vehicle info
                    name: driverData.name,
                    outstandingDebt: driverData.outstandingDebt,
                    debtNotes: driverData.debtNotes,
                });
            }
        }
    };


    const handleOperation = (mode: OperationMode, user: User | null = null) => {
        setOperationMode(mode);
        setSelectedUser(user);
        setSelectedVacantVehicleId('');

        if (mode === 'add') {
            setFormData(initialFormState);
        } else if (user) {
            const prefilledData = prefillFormWithUserData(user);
            if (mode === 'reassign') {
                // For reassign, only keep the driver's personal and debt info.
                // Vehicle info will come from the selected vacant vehicle.
                setFormData({
                    ...initialFormState,
                    name: prefilledData.name,
                    outstandingDebt: prefilledData.outstandingDebt,
                    debtNotes: prefilledData.debtNotes,
                });
            } else if (mode === 'swap') {
                prefilledData.name = ''; // Clear for new driver's name
                prefilledData.email = '';
                prefilledData.password = '';
                prefilledData.outstandingDebt = '0';
                prefilledData.debtNotes = '';
                alert('Formulário pré-preenchido com os dados da viatura. Por favor, insira os dados do NOVO motorista.');
                setFormData(prefilledData);
            } else { // Edit mode
                 setFormData(prefilledData);
            }
        }
    };

    const handleCancel = () => {
        setOperationMode('idle');
        setSelectedUser(null);
        setFormData(initialFormState);
        setSelectedVacantVehicleId('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const isCreateOperation = ['add', 'swap', 'reassign'].includes(operationMode);

        if (isCreateOperation) {
             if (!formData.name || !formData.email || !formData.password) {
                alert('Por favor, preencha todos os dados básicos (Nome, Email, Password).');
                return;
            }
            if (formData.role === UserRole.DRIVER && !formData.matricula) {
                alert('A matrícula é obrigatória para motoristas.');
                return;
            }
            if (operationMode === 'reassign' && selectedUser) {
                 if (formData.email === selectedUser.email) {
                    alert('Para reatribuir, deve fornecer um novo email de login.');
                    return;
                }
                 if (!selectedVacantVehicleId) {
                    alert('Por favor, selecione uma viatura vaga da lista.');
                    return;
                 }
            }

            const result = await addUser({ 
                ...formData,
                status: 'ACTIVE', // New users are always active
                outstandingDebt: parseFloat(formData.outstandingDebt) || 0,
                defaultRentalValue: parseFloat(formData.defaultRentalValue) || 0,
                slotFixedValue: parseFloat(formData.slotFixedValue) || 0,
            });

            if (result.success) {
                if (operationMode === 'swap' && selectedUser) {
                    await updateUser(selectedUser.id, { status: 'ARCHIVED' });
                    alert(`Utilizador ${formData.name} adicionado com sucesso. O motorista anterior, ${selectedUser.name}, foi arquivado.`);
                } else if (operationMode === 'reassign' && selectedUser) {
                    await updateUser(selectedUser.id, { status: 'ARCHIVED', outstandingDebt: 0, debtNotes: 'Dívida transferida para nova viatura.' });
                    alert(`Motorista ${selectedUser.name} reatribuído com sucesso para a viatura ${formData.matricula}. O login antigo foi desativado. O novo login é com o email: ${formData.email}. A viatura anterior (${selectedUser.matricula}) está agora vaga.`);
                } else {
                    alert('Utilizador adicionado com sucesso!');
                }
                handleCancel();
            } else {
                alert(`Erro ao adicionar utilizador: ${result.error}`);
            }

        } else if (operationMode === 'edit' && selectedUser) {
            const { email, password, ...updatableData } = formData;
            const dataToUpdate = {
                ...updatableData,
                outstandingDebt: parseFloat(formData.outstandingDebt) || 0,
                defaultRentalValue: parseFloat(formData.defaultRentalValue) || 0,
                slotFixedValue: parseFloat(formData.slotFixedValue) || 0,
            };
            await updateUser(selectedUser.id, dataToUpdate);
            alert('Dados do utilizador atualizados com sucesso!');
            handleCancel();
        }
    };
    
    const handleDeleteUser = async (userToDelete: User) => {
        if (window.confirm(`Tem a certeza que deseja EXCLUIR permanentemente o utilizador ${userToDelete.name}? Esta ação não pode ser desfeita.`)) {
            try {
                await deleteUser(userToDelete.id);
                alert('Utilizador excluído com sucesso.');
                if (selectedUser?.id === userToDelete.id) {
                    handleCancel();
                }
            } catch (error) {
                alert('Ocorreu um erro ao excluir o utilizador.');
                console.error(error);
            }
        }
    };

    const getFormTitle = () => {
        switch (operationMode) {
            case 'add': return 'Adicionar Novo Utilizador';
            case 'edit': return `Editar ${selectedUser?.name}`;
            case 'swap': return `Substituir Motorista da Viatura ${selectedUser?.matricula}`;
            case 'reassign': return `Reatribuir ${selectedUser?.name} a Viatura`;
            default: return 'Selecione um Utilizador';
        }
    };

    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">Gestão de Utilizadores</h2>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Form Section */}
                {!readOnly && (
                    <div className="lg:col-span-2">
                        <Card>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <h3 className="text-xl font-semibold text-white">{getFormTitle()}</h3>

                                {operationMode === 'idle' && <p className="text-gray-400">Selecione um utilizador da lista para ver ou editar os seus detalhes, ou clique em "Adicionar Novo Utilizador".</p>}

                                {operationMode !== 'idle' && (
                                    <>
                                        {operationMode === 'reassign' && (
                                            <div>
                                                <label htmlFor="vacantVehicle" className="block text-sm font-medium text-gray-300">Selecionar Viatura Vaga</label>
                                                <select id="vacantVehicle" value={selectedVacantVehicleId} onChange={handleVacantVehicleSelect} required className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md text-white">
                                                    <option value="">Selecione...</option>
                                                    {availableVehicles.map(v => (
                                                        <option key={v.id} value={v.id}>
                                                            {v.matricula} ({v.vehicleModel || 'Modelo Desconhecido'})
                                                        </option>
                                                    ))}
                                                </select>
                                                {availableVehicles.length === 0 && <p className="text-xs text-yellow-400 mt-2">Nenhuma viatura vaga encontrada. Para uma viatura ficar vaga, o motorista anterior deve ser arquivado.</p>}
                                            </div>
                                        )}

                                        {['add', 'swap'].includes(operationMode) ? (
                                             <>
                                                {operationMode !== 'reassign' && (
                                                    <div>
                                                        <label htmlFor="role" className="block text-sm font-medium text-gray-300">Tipo de Utilizador</label>
                                                        <select id="role" name="role" value={formData.role} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md text-white">
                                                            <option value={UserRole.DRIVER}>Motorista</option>
                                                            <option value={UserRole.OWNER}>Proprietário</option>
                                                        </select>
                                                    </div>
                                                )}
                                                <VehicleInput label="Nome Completo" id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                                            </>
                                        ) : (
                                            <VehicleInput label="Nome Completo" id="name" name="name" value={formData.name} onChange={handleInputChange} required disabled />
                                        )}
                                        
                                        {(operationMode !== 'edit') && (
                                            <>
                                                <VehicleInput label="Email de Login" id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required />
                                                {operationMode === 'reassign' && <p className="text-xs text-yellow-400 -mt-4">O email deve ser único. Se usar Gmail, pode adicionar um sufixo, ex: `email+viaturanova@gmail.com`.</p>}
                                                <VehicleInput label="Password" id="password" name="password" type="password" value={formData.password} onChange={handleInputChange} required />
                                            </>
                                        )}

                                        {operationMode === 'edit' && (
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
                                                <h4 className="text-lg font-semibold text-white">Dados do Motorista e Viatura</h4>
                                                <VehicleInput label="Matrícula (Identificador)" id="matricula" name="matricula" value={formData.matricula} onChange={handleInputChange} required disabled={operationMode !== 'add'} />
                                                <div>
                                                    <label htmlFor="type" className="block text-sm font-medium text-gray-300">Tipo de Contrato</label>
                                                    <select id="type" name="type" value={formData.type} onChange={handleInputChange} disabled={operationMode === 'reassign'} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md text-white disabled:opacity-50 disabled:bg-gray-600">
                                                        <option value={CalculationType.FROTA}>Frota</option>
                                                        <option value={CalculationType.SLOT}>Slot</option>
                                                        <option value={CalculationType.PERCENTAGE}>Percentagem</option>
                                                    </select>
                                                </div>
                                                {operationMode === 'edit' && (
                                                    <VehicleInput label="Nome Completo do Condutor" id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                                                )}
                                                <hr className="border-gray-600" />
                                                <h4 className="text-lg font-semibold text-white">Configurações Financeiras</h4>
                                                
                                                <div className="flex items-center pt-2">
                                                    <input id="isIvaExempt" name="isIvaExempt" type="checkbox" checked={formData.isIvaExempt} onChange={handleInputChange} disabled={operationMode === 'reassign'} className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-blue-600 focus:ring-blue-500 disabled:opacity-50" />
                                                    <label htmlFor="isIvaExempt" className="ml-3 block text-sm font-medium text-gray-300">Isento de IVA 6%</label>
                                                </div>

                                                {formData.type === CalculationType.FROTA && (
                                                    <VehicleInput label="Valor do Aluguer Semanal (€)" id="defaultRentalValue" name="defaultRentalValue" type="number" step="0.01" value={formData.defaultRentalValue} onChange={handleInputChange} disabled={operationMode === 'reassign'} />
                                                )}

                                                {formData.type === CalculationType.PERCENTAGE && (
                                                    <div className="space-y-4 rounded-md p-4 border border-gray-600 bg-gray-900/50">
                                                        <label htmlFor="percentageType" className="block text-sm font-medium text-gray-300">Tipo de Partilha</label>
                                                        <select id="percentageType" name="percentageType" value={formData.percentageType} onChange={handleInputChange} disabled={operationMode === 'reassign'} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md text-white disabled:opacity-50 disabled:bg-gray-600">
                                                            <option value={PercentageType.FIFTY_FIFTY}>50/50</option>
                                                            <option value={PercentageType.SIXTY_FORTY}>60% Frota / 40% Motorista</option>
                                                        </select>
                                                        <VehicleInput label="Valor do Aluguer (para 60/40)" id="defaultRentalValue" name="defaultRentalValue" type="number" step="0.01" value={formData.defaultRentalValue} onChange={handleInputChange} disabled={operationMode === 'reassign'} />
                                                    </div>
                                                )}

                                                {formData.type === CalculationType.SLOT && (
                                                    <div className="space-y-4 rounded-md p-4 border border-gray-600 bg-gray-900/50">
                                                        <label className="block text-sm font-medium text-gray-300">Tipo de Comissão Slot</label>
                                                        <div className="flex flex-col sm:flex-row gap-4">
                                                            <div className="flex items-center">
                                                                <input id="slotTypePercentage" name="slotType" type="radio" value="PERCENTAGE" checked={formData.slotType === 'PERCENTAGE'} onChange={handleInputChange} disabled={operationMode === 'reassign'} className="h-4 w-4 border-gray-500 bg-gray-700 text-blue-600 focus:ring-blue-500 disabled:opacity-50" />
                                                                <label htmlFor="slotTypePercentage" className="ml-3 block text-sm font-medium text-gray-300">Percentagem (4%)</label>
                                                            </div>
                                                            <div className="flex items-center">
                                                                <input id="slotTypeFixed" name="slotType" type="radio" value="FIXED" checked={formData.slotType === 'FIXED'} onChange={handleInputChange} disabled={operationMode === 'reassign'} className="h-4 w-4 border-gray-500 bg-gray-700 text-blue-600 focus:ring-blue-500 disabled:opacity-50" />
                                                                <label htmlFor="slotTypeFixed" className="ml-3 block text-sm font-medium text-gray-300">Valor Fixo</label>
                                                            </div>
                                                        </div>
                                                        {formData.slotType === 'FIXED' && (
                                                            <VehicleInput label="Valor Fixo Semanal (€)" id="slotFixedValue" name="slotFixedValue" type="number" step="0.01" value={formData.slotFixedValue} onChange={handleInputChange} disabled={operationMode === 'reassign'} />
                                                        )}
                                                    </div>
                                                )}

                                                <hr className="border-gray-600" />
                                                <h4 className="text-lg font-semibold text-white">Dados da Viatura</h4>
                                                <VehicleInput label="Modelo da Viatura (ex: TESLA model3 2020)" id="vehicleModel" name="vehicleModel" value={formData.vehicleModel} onChange={handleInputChange} disabled={operationMode === 'reassign'} />
                                                <VehicleInput label="Seguradora" id="insuranceCompany" name="insuranceCompany" value={formData.insuranceCompany} onChange={handleInputChange} disabled={operationMode === 'reassign'} />
                                                <VehicleInput label="Nº da Apólice" id="insurancePolicy" name="insurancePolicy" value={formData.insurancePolicy} onChange={handleInputChange} disabled={operationMode === 'reassign'} />
                                                <VehicleInput label="Cartão Frota (Empresa)" id="fleetCardCompany" name="fleetCardCompany" value={formData.fleetCardCompany} onChange={handleInputChange} disabled={operationMode === 'reassign'} />
                                                <VehicleInput label="Nº Cartão Frota" id="fleetCardNumber" name="fleetCardNumber" value={formData.fleetCardNumber} onChange={handleInputChange} disabled={operationMode === 'reassign'} />

                                                <hr className="border-gray-600" />
                                                <h4 className="text-lg font-semibold text-white">Gestão de Dívidas</h4>
                                                <VehicleInput label="Dívida Pendente (€)" id="outstandingDebt" name="outstandingDebt" type="number" step="0.01" value={formData.outstandingDebt} onChange={handleInputChange} disabled={operationMode === 'swap' || operationMode === 'reassign'}/>
                                                <VehicleInput label="Notas da Dívida" id="debtNotes" name="debtNotes" value={formData.debtNotes} onChange={handleInputChange} disabled={operationMode === 'swap' || operationMode === 'reassign'} />
                                            </>
                                        )}

                                        <div className="flex gap-4 pt-4 border-t border-gray-700">
                                            <Button type="submit" variant="primary" className="w-full">Confirmar</Button>
                                            <Button type="button" variant="secondary" onClick={handleCancel}>Cancelar</Button>
                                        </div>
                                    </>
                                )}
                            </form>
                        </Card>
                    </div>
                )}

                {/* List Section */}
                <div className={readOnly ? "lg:col-span-5" : "lg:col-span-3"}>
                    <Card className="h-full">
                        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                            <div>
                                <h3 className="text-xl font-semibold text-white">Utilizadores Registrados</h3>
                                {!hideArchivedToggle && (
                                    <div className="flex items-center mt-2">
                                        <input id="showArchived" name="showArchived" type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-blue-600 focus:ring-blue-500" />
                                        <label htmlFor="showArchived" className="ml-2 block text-sm font-medium text-gray-300">Mostrar utilizadores arquivados</label>
                                    </div>
                                )}
                            </div>
                             {!readOnly && <Button onClick={() => handleOperation('add')} variant="primary">Adicionar Novo Utilizador</Button>}
                        </div>
                        {usersLoading ? (
                             <p className="text-gray-400">A carregar utilizadores...</p>
                        ) : visibleUsers.length > 0 ? (
                            <div className="space-y-4">
                                {visibleUsers.map(user => {
                                    const isDriver = user.role === UserRole.DRIVER;
                                    const hasDebt = isDriver && user.outstandingDebt > 0;
                                    const isSelected = selectedUser?.id === user.id;
                                    const isArchived = user.status === 'ARCHIVED';
                                    
                                    return (
                                        <div key={user.id} className={`p-4 rounded-lg border transition-all duration-200 ${isSelected ? 'bg-blue-900/30 border-blue-600' : isArchived ? 'bg-gray-800/50 border-gray-700 opacity-60' : 'bg-gray-900/50 border-gray-700'}`}>
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
                                                {!readOnly && (
                                                    <div className="flex-shrink-0 flex gap-2 flex-wrap">
                                                        {isDriver && !isArchived && <Button variant="warning" onClick={() => handleOperation('reassign', user)} className="text-xs px-2 py-1">Reatribuir Viatura</Button>}
                                                        {isDriver && !isArchived && <Button variant="secondary" onClick={() => handleOperation('swap', user)} className="text-xs px-2 py-1">Trocar Motorista</Button>}
                                                        <Button variant={operationMode === 'edit' && isSelected ? 'success' : 'secondary'} onClick={() => handleOperation('edit', user)} className="text-xs px-2 py-1">
                                                            {operationMode === 'edit' && isSelected ? 'A Editar' : 'Editar'}
                                                        </Button>
                                                        {currentUser?.id !== user.id && currentUser?.role === UserRole.ADMIN && (
                                                            <Button variant="danger" onClick={() => handleDeleteUser(user)} className="text-xs px-2 py-1">Apagar</Button>
                                                        )}
                                                    </div>
                                                )}
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