import React, { useState, useMemo } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import { useUsers } from '../hooks/useUsers';
import { useAdjustments } from '../hooks/useAdjustments';
import { AdjustmentStatus, UserRole } from '../types';

const initialFormState = {
    driverId: '',
    amount: '',
    notes: '',
};

const AdjustmentManagement: React.FC = () => {
    const { users } = useUsers();
    const { adjustments, addAdjustment, deleteAdjustment, loading } = useAdjustments();
    const [formData, setFormData] = useState(initialFormState);

    const drivers = useMemo(() => users.filter(u => u.role === UserRole.DRIVER).sort((a, b) => a.name.localeCompare(b.name)), [users]);
    const pendingAdjustments = useMemo(() => adjustments.filter(a => a.status === AdjustmentStatus.PENDING), [adjustments]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Tem a certeza que deseja apagar este ajuste? Esta ação é irreversível.')) {
            deleteAdjustment(id);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const selectedDriver = drivers.find(d => d.id === formData.driverId);
        if (!selectedDriver || !formData.amount || !formData.notes) {
            alert('Por favor, preencha todos os campos.');
            return;
        }

        const amount = parseFloat(formData.amount);
        if (isNaN(amount)) {
            alert('Por favor, insira um valor numérico válido.');
            return;
        }

        addAdjustment({
            driverId: formData.driverId,
            driverName: selectedDriver.name,
            amount: amount,
            notes: formData.notes,
        });
        
        setFormData(initialFormState); // Reset form
    };


    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">Gestão de Ajustes Pendentes</h2>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-2">
                    <Card>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <h3 className="text-xl font-semibold text-white">Adicionar Ajuste</h3>
                             <p className="text-sm text-gray-400">
                                Use esta secção para registar um valor a ser pago ao motorista no próximo cálculo (valor positivo) ou um valor que o motorista deve à empresa (valor negativo).
                            </p>
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
                            <div>
                                <label htmlFor="amount" className="block text-sm font-medium text-gray-300">Valor do Ajuste</label>
                                <div className="relative mt-1 rounded-md shadow-sm">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <span className="text-gray-400 sm:text-sm">€</span>
                                    </div>
                                    <input
                                        type="number"
                                        id="amount"
                                        name="amount"
                                        step="0.01"
                                        className="block w-full rounded-md border-gray-600 bg-gray-700 pl-7 pr-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-white"
                                        placeholder="ex: 50.00 ou -25.50"
                                        value={formData.amount}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="notes" className="block text-sm font-medium text-gray-300">Notas (Motivo do Ajuste)</label>
                                <textarea id="notes" name="notes" value={formData.notes} onChange={handleInputChange} rows={3} required className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 py-2 px-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-white" />
                            </div>

                            <div className="flex gap-4">
                                <Button type="submit" variant="primary" className="w-full">Salvar Ajuste</Button>
                            </div>
                        </form>
                    </Card>
                </div>

                {/* List Section */}
                <div className="lg:col-span-3">
                    <Card className="h-full">
                        <h3 className="text-xl font-semibold text-white mb-4">Ajustes Atualmente Pendentes</h3>
                        {loading ? (
                             <p className="text-gray-400">A carregar...</p>
                        ) : pendingAdjustments.length > 0 ? (
                            <div className="space-y-4">
                                {pendingAdjustments.map(adj => (
                                    <div key={adj.id} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                                        <div className="flex justify-between items-start gap-4">
                                            <div>
                                                <p className="font-bold text-white">{adj.driverName}</p>
                                                <p className={`text-lg font-semibold ${adj.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                                    €{adj.amount.toFixed(2)}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">Motivo: {adj.notes}</p>
                                            </div>
                                            <div className="flex-shrink-0">
                                                <Button variant="danger" onClick={() => handleDelete(adj.id)} className="text-xs px-2 py-1">Apagar</Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400">Nenhum ajuste pendente.</p>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default AdjustmentManagement;
