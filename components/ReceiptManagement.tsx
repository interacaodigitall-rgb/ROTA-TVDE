import React, { useState, useMemo } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import { useUsers } from '../hooks/useUsers';
import { useReceipts } from '../hooks/useReceipts';
import { Receipt, UserRole } from '../types';

const toInputDate = (timestamp: any) => (timestamp?.toDate ? timestamp.toDate() : new Date(timestamp)).toISOString().split('T')[0];

const initialFormState = {
    driverId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
};

const ReceiptManagement: React.FC<{readOnly?: boolean}> = ({ readOnly = false }) => {
    const { users } = useUsers();
    const { receipts, addReceipt, updateReceipt, deleteReceipt, loading } = useReceipts();
    const [formData, setFormData] = useState(initialFormState);
    const [editingReceiptId, setEditingReceiptId] = useState<string | null>(null);

    const drivers = useMemo(() => users.filter(u => u.role === UserRole.DRIVER).sort((a, b) => a.name.localeCompare(b.name)), [users]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEdit = (receipt: Receipt) => {
        setEditingReceiptId(receipt.id);
        setFormData({
            driverId: receipt.driverId,
            amount: String(receipt.amount),
            date: toInputDate(receipt.date),
            notes: receipt.notes || '',
        });
    };

    const handleCancelEdit = () => {
        setEditingReceiptId(null);
        setFormData(initialFormState);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Tem a certeza que deseja apagar este registo de recibo? Esta ação é irreversível.')) {
            deleteReceipt(id);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const selectedDriver = drivers.find(d => d.id === formData.driverId);
        if (!selectedDriver || !formData.amount || !formData.date) {
            alert('Por favor, preencha todos os campos obrigatórios (Motorista, Valor, Data).');
            return;
        }

        const dataToSave = {
            driverId: formData.driverId,
            driverName: selectedDriver.name,
            amount: parseFloat(formData.amount),
            date: formData.date,
            notes: formData.notes,
        };

        if (editingReceiptId) {
            updateReceipt(editingReceiptId, dataToSave);
        } else {
            addReceipt(dataToSave);
        }
        handleCancelEdit();
    };


    return (
        <div>
            <h2 className="text-3xl font-bold mb-6">Gestão de Recibos</h2>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Form Section */}
                {!readOnly && (
                    <div className="lg:col-span-2">
                        <Card>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <h3 className="text-xl font-semibold text-white">{editingReceiptId ? 'Editar Recibo' : 'Adicionar Novo Recibo'}</h3>
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
                                    <label htmlFor="amount" className="block text-sm font-medium text-gray-300">Valor do Recibo</label>
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
                                            placeholder="0.00"
                                            value={formData.amount}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="date" className="block text-sm font-medium text-gray-300">Data do Recibo</label>
                                    <input type="date" id="date" name="date" value={formData.date} onChange={handleInputChange} required className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 py-2 px-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-white" />
                                </div>
                                <div>
                                    <label htmlFor="notes" className="block text-sm font-medium text-gray-300">Notas (Opcional)</label>
                                    <textarea id="notes" name="notes" value={formData.notes} onChange={handleInputChange} rows={3} className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 py-2 px-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-white" />
                                </div>

                                <div className="flex gap-4">
                                    <Button type="submit" variant="primary" className="w-full">{editingReceiptId ? 'Salvar Alterações' : 'Adicionar Registo'}</Button>
                                    {editingReceiptId && (
                                        <Button type="button" variant="secondary" onClick={handleCancelEdit}>Cancelar</Button>
                                    )}
                                </div>
                            </form>
                        </Card>
                    </div>
                )}

                {/* List Section */}
                <div className={readOnly ? "lg:col-span-5" : "lg:col-span-3"}>
                    <Card className="h-full">
                        <h3 className="text-xl font-semibold text-white mb-4">Recibos Emitidos</h3>
                        {loading ? (
                             <p className="text-gray-400">A carregar recibos...</p>
                        ) : receipts.length > 0 ? (
                            <div className="space-y-4">
                                {receipts.map(receipt => (
                                    <div key={receipt.id} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                                        <div className="flex justify-between items-start gap-4">
                                            <div>
                                                <p className="font-bold text-white">{receipt.driverName}</p>
                                                <p className="text-lg font-semibold text-green-400">€{receipt.amount.toFixed(2)}</p>
                                                <p className="text-sm text-gray-400">Data: {toInputDate(receipt.date)}</p>
                                                {receipt.notes && <p className="text-xs text-gray-500 mt-1">Notas: {receipt.notes}</p>}
                                            </div>
                                            {!readOnly && (
                                                <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                                                    <Button variant="secondary" onClick={() => handleEdit(receipt)} className="text-xs px-2 py-1">Editar</Button>
                                                    <Button variant="danger" onClick={() => handleDelete(receipt.id)} className="text-xs px-2 py-1">Apagar</Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400">Nenhum recibo registrado.</p>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ReceiptManagement;