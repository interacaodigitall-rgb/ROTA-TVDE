import React, { useState, useMemo, useEffect, useRef } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import { useUsers } from '../hooks/useUsers';
import { User, UserRole, CalculationType, PercentageType } from '../types';
import { useAuth } from '../hooks/useAuth';
import { MoreVertical, Edit2, Trash2, RefreshCw, Car } from 'lucide-react';

const VehicleInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, id, ...props }) => (
    <div>
        <label htmlFor={id} className="block text-xs font-medium text-slate-300 mb-1">{label}</label>
        <input
            id={id}
            {...props}
            className="block w-full rounded-xl border border-slate-700 bg-slate-900/90 py-2 px-3 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:bg-slate-800 transition-colors"
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
    const [roleFilter, setRoleFilter] = useState<'ALL' | 'DRIVER' | 'MANAGEMENT' | 'OWNER'>('ALL');
    const [activeDropdownUserId, setActiveDropdownUserId] = useState<string | null>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = () => setActiveDropdownUserId(null);
        if (activeDropdownUserId) {
            window.addEventListener('click', handleClickOutside);
            return () => window.removeEventListener('click', handleClickOutside);
        }
    }, [activeDropdownUserId]);

    const allUsers = useMemo(() => [...users].sort((a, b) => a.name.localeCompare(b.name)), [users]);
    
    const availableVehicles = useMemo(() => {
        return allUsers.filter(u => u.status === 'ARCHIVED' && u.role === UserRole.DRIVER);
    }, [allUsers]);

    const visibleUsers = useMemo(() => {
        return allUsers.filter(u => {
            const matchesArchived = hideArchivedToggle ? u.status !== 'ARCHIVED' : (showArchived || u.status !== 'ARCHIVED');
            if (!matchesArchived) return false;

            if (roleFilter === 'DRIVER') return u.role === UserRole.DRIVER;
            if (roleFilter === 'MANAGEMENT') return u.role === UserRole.ADMIN || u.role === UserRole.MANAGER;
            if (roleFilter === 'OWNER') return u.role === UserRole.OWNER;
            return true;
        });
    }, [allUsers, showArchived, hideArchivedToggle, roleFilter]);

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
                                                        <label htmlFor="role" className="block text-sm font-medium text-gray-300">Tipo de Utilizador / Função</label>
                                                        <select id="role" name="role" value={formData.role} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md text-white">
                                                            <option value={UserRole.DRIVER}>Motorista</option>
                                                            <option value={UserRole.MANAGER}>Gerente / Gestor da Frota</option>
                                                            <option value={UserRole.ADMIN}>Administrador</option>
                                                            <option value={UserRole.OWNER}>Proprietário de Viatura</option>
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
                                                    <label htmlFor="editRole" className="block text-sm font-medium text-gray-300">Função / Papel</label>
                                                    <select id="editRole" name="role" value={formData.role} onChange={handleInputChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md text-white">
                                                        <option value={UserRole.DRIVER}>Motorista</option>
                                                        <option value={UserRole.MANAGER}>Gerente / Gestor da Frota</option>
                                                        <option value={UserRole.ADMIN}>Administrador</option>
                                                        <option value={UserRole.OWNER}>Proprietário de Viatura</option>
                                                    </select>
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

                        {/* Filter Tabs for Roles */}
                        <div className="flex items-center gap-1.5 mb-4 overflow-x-auto pb-1">
                            <button
                                type="button"
                                onClick={() => setRoleFilter('ALL')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${roleFilter === 'ALL' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'}`}
                            >
                                Todos ({allUsers.length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setRoleFilter('DRIVER')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${roleFilter === 'DRIVER' ? 'bg-cyan-600 text-white shadow-sm' : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'}`}
                            >
                                Motoristas ({allUsers.filter(u => u.role === UserRole.DRIVER).length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setRoleFilter('MANAGEMENT')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${roleFilter === 'MANAGEMENT' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'}`}
                            >
                                Gerentes ({allUsers.filter(u => u.role === UserRole.ADMIN || u.role === UserRole.MANAGER).length})
                            </button>
                            <button
                                type="button"
                                onClick={() => setRoleFilter('OWNER')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${roleFilter === 'OWNER' ? 'bg-purple-600 text-white shadow-sm' : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'}`}
                            >
                                Proprietários ({allUsers.filter(u => u.role === UserRole.OWNER).length})
                            </button>
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
                                    
                                    const roleBadgeConfig = () => {
                                        if (user.role === UserRole.ADMIN) {
                                            return { label: 'ADMINISTRADOR', cls: 'bg-rose-900/80 text-rose-200 border border-rose-700/60' };
                                        }
                                        if (user.role === UserRole.MANAGER) {
                                            return { label: 'GERENTE', cls: 'bg-indigo-900/80 text-indigo-200 border border-indigo-700/60' };
                                        }
                                        if (user.role === UserRole.OWNER) {
                                            return { label: 'PROPRIETÁRIO', cls: 'bg-purple-900/80 text-purple-200 border border-purple-700/60' };
                                        }
                                        return { label: 'MOTORISTA', cls: 'bg-cyan-950 text-cyan-300 border border-cyan-800/60' };
                                    };
                                    const badge = roleBadgeConfig();

                                     return (
                                        <div 
                                            key={user.id} 
                                            className={`p-4 rounded-xl border transition-all relative ${
                                                isSelected 
                                                    ? 'bg-blue-950/40 border-blue-600 ring-1 ring-blue-500/40' 
                                                    : isArchived 
                                                        ? 'bg-slate-900/40 border-slate-800/60 opacity-60' 
                                                        : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                                            }`}
                                        >
                                            {/* Linha 1: Nome do Motorista + Badges + Menu de Opções */}
                                            <div className="flex items-start justify-between gap-2 min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
                                                    <p className={`font-semibold text-white text-sm truncate ${isArchived ? 'line-through text-slate-400' : ''}`}>
                                                        {user.name}
                                                    </p>
                                                    <span className={`text-[10px] font-semibold tracking-wider px-2 py-0.5 rounded-md ${badge.cls}`}>
                                                        {badge.label}
                                                    </span>
                                                    {hasDebt && !isArchived && (
                                                        <span className="text-[10px] font-bold text-rose-300 bg-rose-950/80 border border-rose-800/80 px-2 py-0.5 rounded-md">
                                                            COM DÍVIDA
                                                        </span>
                                                    )}
                                                    {isArchived && (
                                                        <span className="text-[10px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
                                                            ARQUIVADO
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Botão discreto de 3 pontos para ações secundárias */}
                                                {!readOnly && (
                                                    <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            type="button"
                                                            onClick={() => setActiveDropdownUserId(activeDropdownUserId === user.id ? null : user.id)}
                                                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                                                            title="Mais opções"
                                                            aria-label="Mais opções"
                                                        >
                                                            <MoreVertical className="w-4 h-4" />
                                                        </button>

                                                        {/* Dropdown Action Menu */}
                                                        {activeDropdownUserId === user.id && (
                                                            <div className="absolute right-0 mt-1 w-44 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-1.5 z-30">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        handleOperation('edit', user);
                                                                        setActiveDropdownUserId(null);
                                                                    }}
                                                                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800 flex items-center gap-2 transition-colors"
                                                                >
                                                                    <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                                                                    <span>Editar Registo</span>
                                                                </button>

                                                                {isDriver && !isArchived && (
                                                                    <>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                handleOperation('reassign', user);
                                                                                setActiveDropdownUserId(null);
                                                                            }}
                                                                            className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-300 hover:bg-slate-800 flex items-center gap-2 transition-colors"
                                                                        >
                                                                            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                                                                            <span>Reatribuir Viatura</span>
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                handleOperation('swap', user);
                                                                                setActiveDropdownUserId(null);
                                                                            }}
                                                                            className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800 flex items-center gap-2 transition-colors"
                                                                        >
                                                                            <Car className="w-3.5 h-3.5 text-slate-400" />
                                                                            <span>Trocar Motorista</span>
                                                                        </button>
                                                                    </>
                                                                )}

                                                                {currentUser?.id !== user.id && currentUser?.role === UserRole.ADMIN && (
                                                                    <div className="pt-1 mt-1 border-t border-slate-800">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                handleDeleteUser(user);
                                                                                setActiveDropdownUserId(null);
                                                                            }}
                                                                            className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-950/40 flex items-center gap-2 transition-colors"
                                                                        >
                                                                            <Trash2 className="w-3.5 h-3.5" />
                                                                            <span>Apagar Utilizador</span>
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Linha 2: Matrícula e E-mail */}
                                            <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-400 min-w-0">
                                                {isDriver && (
                                                    <span className="font-mono text-[11px] font-semibold bg-slate-800/90 text-slate-300 px-2 py-0.5 rounded border border-slate-700/60 flex-shrink-0">
                                                        {user.matricula || 'Sem Viatura'}
                                                    </span>
                                                )}
                                                <span className="truncate">{user.email}</span>
                                            </div>

                                            {/* Linha 3 (Botões de Ação Principais): Grelha limpa de 2 colunas sem qualquer overflow */}
                                            {!readOnly && (
                                                <div className="mt-3 pt-3 border-t border-slate-800/80 w-full">
                                                    {isDriver && !isArchived ? (
                                                        <div className="grid grid-cols-2 gap-2 w-full">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOperation('reassign', user)}
                                                                className="w-full py-2 px-2 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20 active:scale-95 transition-all text-center truncate"
                                                                title="Reatribuir Viatura"
                                                            >
                                                                Reatribuir Viatura
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOperation('swap', user)}
                                                                className="w-full py-2 px-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-750 active:scale-95 transition-all text-center truncate"
                                                                title="Trocar Motorista"
                                                            >
                                                                Trocar Motorista
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex justify-end gap-2 w-full">
                                                            <Button 
                                                                variant={operationMode === 'edit' && isSelected ? 'success' : 'secondary'} 
                                                                onClick={() => handleOperation('edit', user)} 
                                                                className="text-xs px-3 py-1.5 w-full sm:w-auto"
                                                            >
                                                                {operationMode === 'edit' && isSelected ? 'A Editar' : 'Editar Dados'}
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
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