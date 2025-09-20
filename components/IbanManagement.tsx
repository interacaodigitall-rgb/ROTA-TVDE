
import React, { useState, useEffect, useMemo } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import { useUsers } from '../hooks/useUsers';
import { useIbans } from '../hooks/useIbans';
import { Iban, UserRole } from '../types';

const IbanInput: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, id, ...props }) => (
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
    driverId: '',
    fullName: '',
    nif: '',
    iban: '',
};

const IbanManagement: React.FC = () => {
    const { users } = useUsers();
    const { ibans, addIban, updateIban, deleteIban, loading } = useIbans();
    const [formData, setFormData] = useState(initialFormState);
    const [editingIbanId, setEditingIbanId] = useState<string | null>(null);

    const drivers = useMemo(() => users.filter(u => u.role === UserRole.DRIVER), [users]);

    useEffect(() => {
        const selectedDriver = drivers.find(d => d.id === formData.driverId);
        if (selectedDriver && !editingIbanId) {
             // You can pre-fill if you want, but the screenshot implies separate fields
             // setFormData(prev => ({ ...prev, fullName: selectedDriver.name }));
        }
    }, [formData.driverId, drivers, editingIbanId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEdit = (iban: Iban) => {
        setEditingIbanId(iban.id);
        setFormData({
            driverId: iban.driverId,
            fullName: iban.fullName,
            nif: iban.nif,
            iban: iban.iban,
        });
    };

    const handleCancelEdit = () => {
        setEditingIbanId(null);
        setFormData(initialFormState);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Tem a certeza que deseja apagar este IBAN? Esta ação é irreversível.')) {
            deleteIban(id);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const selectedDriver = drivers.find(d => d.id === formData.driverId);
        if (!selectedDriver) {
            alert('Por favor, selecione um motorista válido.');
            return;
        }

        const dataToSave = {
            ...formData,
            driverName: selectedDriver.name,
        };

        if (editingIbanId) {
            updateIban(editingIbanId, dataToSave);
        } else {
            addIban(dataToSave);
        }
        handleCancelEdit();
    };


    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">Gestão de IBANs</h2>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-2">
                    <Card>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <h3 className="text-xl font-semibold text-white">{editingIbanId ? 'Editar IBAN' : 'Adicionar Novo IBAN'}</h3>
                            <div>
                                <label htmlFor="driverId" className="block text-sm font-medium text-gray-300">Motorista</label>
                                <select 
                                    id="driverId" 
                                    name="driverId" 
                                    value={formData.driverId} 
                                    onChange={handleInputChange} 
                                    required 
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md text-white"
                                >
                                    <option value="">Selecione um motorista...</option>
                                    {drivers.map(d => <option key={d.id} value={d.id}>{d.name} ({d.matricula})</option>)}
                                </select>
                            </div>

                            <IbanInput label="Nome Completo (Titular da Conta)" id="fullName" name="fullName" value={formData.fullName} onChange={handleInputChange} required />
                            <IbanInput label="NIF" id="nif" name="nif" value={formData.nif} onChange={handleInputChange} required />
                            <IbanInput label="IBAN" id="iban" name="iban" value={formData.iban} onChange={handleInputChange} required />

                            <div className="flex gap-4">
                                <Button type="submit" variant="primary" className="w-full">{editingIbanId ? 'Salvar Alterações' : 'Salvar IBAN'}</Button>
                                {editingIbanId && (
                                    <Button type="button" variant="secondary" onClick={handleCancelEdit}>Cancelar</Button>
                                )}
                            </div>
                        </form>
                    </Card>
                </div>

                {/* List Section */}
                <div className="lg:col-span-3">
                    <Card className="h-full">
                        <h3 className="text-xl font-semibold text-white mb-4">IBANs Registrados</h3>
                        {loading ? (
                             <p className="text-gray-400">A carregar IBANs...</p>
                        ) : ibans.length > 0 ? (
                            <div className="space-y-4">
                                {ibans.map(iban => (
                                    <div key={iban.id} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                                        <div className="flex justify-between items-start gap-4">
                                            <div>
                                                <p className="font-bold text-white">{iban.driverName}</p>
                                                <p className="text-sm text-gray-300">{iban.fullName}</p>
                                                <p className="text-sm text-gray-400 font-mono">{iban.iban}</p>
                                                <p className="text-xs text-gray-500">NIF: {iban.nif}</p>
                                            </div>
                                            <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                                                <Button variant="secondary" onClick={() => handleEdit(iban)} className="text-xs px-2 py-1">Editar</Button>
                                                <Button variant="danger" onClick={() => handleDelete(iban.id)} className="text-xs px-2 py-1">Apagar</Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400">Nenhum IBAN registrado.</p>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default IbanManagement;
