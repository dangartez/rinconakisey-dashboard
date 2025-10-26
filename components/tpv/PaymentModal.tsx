import React, { useState, useMemo, useEffect } from 'react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  onPaymentSuccess: (paymentDetails: any) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, totalAmount, paymentType, onPaymentSuccess }) => {
    const [payments, setPayments] = useState<{ method: string; amount: number }[]>([]);
    const [currentPaymentMethod, setCurrentPaymentMethod] = useState<'efectivo' | 'tarjeta' | 'bizum' | null>(null);
    const [currentAmount, setCurrentAmount] = useState<string>('');

    useEffect(() => {
        if (isOpen) {
            setPayments([]);
            setCurrentPaymentMethod(null);
            setCurrentAmount('');
        }
    }, [isOpen]);

    const totalPaid = useMemo(() => {
        return payments.reduce((acc, p) => acc + p.amount, 0);
    }, [payments]);

    const remainingAmount = useMemo(() => {
        return totalAmount - totalPaid;
    }, [totalAmount, totalPaid]);

    const change = useMemo(() => {
        if (currentPaymentMethod === 'efectivo' && parseFloat(currentAmount) > remainingAmount) {
            return parseFloat(currentAmount) - remainingAmount;
        }
        return 0;
    }, [currentAmount, remainingAmount, currentPaymentMethod]);

    if (!isOpen) return null;

    const handleAddPayment = () => {
        if (!currentPaymentMethod || !currentAmount) return;
        const amount = parseFloat(currentAmount);
        if (amount <= 0) return;

        setPayments([...payments, { method: currentPaymentMethod, amount }]);
        setCurrentPaymentMethod(null);
        setCurrentAmount('');
    };

    const handleRemovePayment = (index: number) => {
        setPayments(payments.filter((_, i) => i !== index));
    };

    const handleFinalizePayment = () => {
        onPaymentSuccess({ payments });
    };

    const paymentOptions = [
        { id: 'efectivo', label: 'Efectivo' },
        { id: 'tarjeta', label: 'Tarjeta' },
        { id: 'bizum', label: 'Bizum' },
    ];

    const isCompleto = paymentType === 'completo';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all duration-300 animate-scaleUp" onClick={e => e.stopPropagation()}>
                <div className="p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{isCompleto ? 'Procesar Pago Completo' : 'Registrar Pago Aplazado'}</h2>
                    <p className="text-4xl font-extrabold text-pink-600 mb-6">{totalAmount.toLocaleString('es-ES')}€</p>

                    <div className="space-y-4">
                        <div>
                            <h3 className="font-medium text-gray-800 mb-3">Añadir método de pago</h3>
                            <div className="grid grid-cols-3 gap-3 mb-3">
                                {paymentOptions.map(opt => (
                                    <button 
                                        key={opt.id} 
                                        onClick={() => setCurrentPaymentMethod(opt.id as any)}
                                        className={`p-3 rounded-lg border-2 transition-colors font-semibold text-sm ${currentPaymentMethod === opt.id ? 'bg-pink-100 border-pink-500' : 'bg-gray-100 border-gray-200 hover:border-pink-300'}`}>
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-3">
                                <input 
                                    type="number" 
                                    value={currentAmount} 
                                    onChange={e => setCurrentAmount(e.target.value)} 
                                    placeholder={`Restante: ${remainingAmount.toLocaleString('es-ES')}€`}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                                />
                                <button onClick={handleAddPayment} disabled={!currentPaymentMethod || !currentAmount} className="px-6 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 transition-colors">Añadir</button>
                            </div>
                            {change > 0 && <div className="text-center bg-blue-100 p-2 rounded-lg mt-2"><p className="text-xs text-blue-700">Cambio a devolver</p><p className="text-lg font-bold text-blue-800">{change.toLocaleString('es-ES')}€</p></div>}
                        </div>

                        {payments.length > 0 && (
                            <div>
                                <h3 className="font-medium text-gray-800 mb-2">Pagos añadidos</h3>
                                <div className="space-y-2">
                                    {payments.map((p, i) => (
                                        <div key={i} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg">
                                            <span className="font-semibold capitalize">{p.method}</span>
                                            <span className="font-bold text-gray-800">{p.amount.toLocaleString('es-ES')}€</span>
                                            <button onClick={() => handleRemovePayment(i)} className="text-red-500 hover:text-red-700">Quitar</button>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 text-right">
                                    <p className="text-sm text-gray-600">Total Pagado: <span className="font-bold">{totalPaid.toLocaleString('es-ES')}€</span></p>
                                    <p className="text-lg text-pink-600 font-bold">Restante: <span className="font-extrabold">{remainingAmount.toLocaleString('es-ES')}€</span></p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-gray-50 px-8 py-4 rounded-b-2xl flex justify-end items-center space-x-3">
                    <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">Cancelar</button>
                    <button 
                        onClick={handleFinalizePayment}
                        disabled={isCompleto ? remainingAmount > 0 : totalPaid === 0}
                        className="px-8 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors"
                    >
                        Confirmar Venta
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;