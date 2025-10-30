
import React, { useState, useMemo, useEffect } from 'react';
import Card from './ui/Card';
import Button from './ui/Button';
import { useUsers } from '../hooks/useUsers';
import { UserRole } from '../types';
import { db, firestore } from '../firebase';

const getPreviousMonday = (date: Date) => {
    const prevMonday = new Date(date);
    prevMonday.setHours(0, 0, 0, 0);
    const day = prevMonday.getDay();
    const diff = prevMonday.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    prevMonday.setDate(diff);
    return prevMonday.toISOString().split('T')[0];
};

const TollRegistration: React.FC = () => {
    const { users } = useUsers();
    const [driverId, setDriverId] = useState('');
    const [periodStart, setPeriodStart] = useState(getPreviousMonday(new Date()));
    const [amount, setAmount] = useState('');
    const [initialAmount, setInitialAmount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });

    const drivers = useMemo(() => users.filter(u => u.role === UserRole.DRIVER).sort((a,b) => a.name.localeCompare(b.name)), [users]);

    useEffect(() => {
        const fetchExistingToll = async () => {
            if (!driverId || !periodStart) {
                setAmount('');
                setInitialAmount(0);
                return;
            };
            
            setIsLoading(true);
            setStatusMessage({ type: '', text: '' });
            try {
                const docRef = db.collection('prefilledTolls').doc(`${driverId}_${periodStart}`);
                const doc = await docRef.get();
                if (doc.exists) {
                    const data = doc.data();
                    const fetchedAmount = data.amount || 0;
                    setAmount(String(fetchedAmount));
                    setInitialAmount(fetchedAmount);
                } else {
                    setAmount('');
                    setInitialAmount(0);
                }
            } catch (error) {
                console.error("Error fetching toll data:", error);
                setStatusMessage({ type: 'error', text: 'Erro ao carregar dados.' });
            } finally {
                setIsLoading(false);
            }
        };

        fetchExistingToll();

    }, [driverId, periodStart]);
    
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedDate = new Date(e.target.value + 'T00:00:00'); // Ensure local timezone
        setPeriodStart(getPreviousMonday(selectedDate));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!driverId || !periodStart || amount === '') {
            setStatusMessage({ type: 'error', text: 'Por favor, preencha todos os campos.' });
            return;
        }

        setIsLoading(true);
        setStatusMessage({ type: '', text: '' });
        
        try {
            const tollAmount = parseFloat(amount);
            if (isNaN(tollAmount) || tollAmount < 0) {
                 setStatusMessage({ type: 'error', text: 'Por favor, insira um valor numérico válido.' });
                 setIsLoading(false);
                 return;
            }

            const batch = db.batch();
            
            const tollDocRef = db.collection('prefilledTolls').doc(`${driverId}_${periodStart}`);
            batch.set(tollDocRef, {
                driverId,
                periodStart,
                amount: tollAmount,
            });
            
            const debtDifference = tollAmount - initialAmount;
            if (debtDifference !== 0) {
                const userDocRef = db.collection('users').doc(driverId);
                batch.update(userDocRef, {
                    outstandingDebt: firestore.FieldValue.increment(debtDifference)
                });
            }
            
            await batch.commit();

            setStatusMessage({ type: 'success', text: 'Valor salvo com sucesso e atualizado na dívida do motorista!' });
            setInitialAmount(tollAmount);

        } catch (error) {
            console.error("Error saving toll data:", error);
            setStatusMessage({ type: 'error', text: 'Ocorreu um erro ao salvar.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <h2 className="text-3xl font-bold mb-2">Registar Portagens (Aluguer)</h2>
            <p className="text-gray-400 mb-6">Insira o valor semanal de portagens da viatura para um motorista. Este valor será pré-preenchido no formulário do administrador.</p>
            <form onSubmit={handleSubmit} className="space-y-6 max-w-lg mx-auto">
                 <div>
                    <label htmlFor="driverId" className="block text-sm font-medium text-gray-300">Motorista</label>
                    <select 
                        id="driverId" 
                        value={driverId} 
                        onChange={(e) => setDriverId(e.target.value)} 
                        required 
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md text-white"
                    >
                        <option value="">Selecione um motorista...</option>
                        {drivers.map(d => <option key={d.id} value={d.id}>{d.name} ({d.matricula})</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="periodStart" className="block text-sm font-medium text-gray-300">Semana de (será ajustado para a Segunda-feira)</label>
                    <input type="date" id="periodStart" value={periodStart} onChange={handleDateChange} required className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 py-2 px-3 focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-white" />
                </div>
                <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-300">Valor das Portagens de Aluguer</label>
                    <div className="relative mt-1 rounded-md shadow-sm">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <span className="text-gray-400 sm:text-sm">€</span>
                        </div>
                        <input
                            type="number"
                            id="amount"
                            step="0.01"
                            className="block w-full rounded-md border-gray-600 bg-gray-700 pl-7 pr-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-white"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                        />
                    </div>
                </div>
                 {statusMessage.text && (
                    <p className={`text-sm text-center ${statusMessage.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                        {statusMessage.text}
                    </p>
                )}
                <div>
                    <Button type="submit" variant="primary" className="w-full" disabled={isLoading}>
                        {isLoading ? 'A Salvar...' : 'Salvar Valor'}
                    </Button>
                </div>
            </form>
        </Card>
    );
};

export default TollRegistration;
