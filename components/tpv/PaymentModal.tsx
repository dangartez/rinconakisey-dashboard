import React, { useState, useMemo } from 'react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  paymentType: 'completo' | 'aplazado';
  onPaymentSuccess: (paymentDetails: any) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, totalAmount, paymentType, onPaymentSuccess }) => {
    const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'tarjeta' | 'bizum' | 'aplazado' | null>(null);
    const [amountPaid, setAmountPaid] = useState<number | string>('');

    const change = useMemo(() => {
        const received = typeof amountPaid === 'number' ? amountPaid : parseFloat(amountPaid);
        if (paymentMethod === 'efectivo' && received >= totalAmount) {
            return received - totalAmount;
        }
        return 0;
    }, [amountPaid, totalAmount, paymentMethod]);

    if (!isOpen) return null;

    const handlePayment = () => {
        onPaymentSuccess({
            method: paymentType === 'aplazado' ? 'aplazado' : paymentMethod,
            amount_paid: paymentType === 'aplazado' ? (parseFloat(amountPaid as string) || 0) : totalAmount,
            cashReceived: paymentMethod === 'efectivo' ? amountPaid : null,
            change: paymentMethod === 'efectivo' ? change : null,
            partial_payment_method: paymentType === 'aplazado' ? paymentMethod : null
        });
    };

    const paymentOptions = [
        { id: 'efectivo', label: 'Efectivo' },
        { id: 'tarjeta', label: 'Tarjeta' },
        { id: 'bizum', label: 'Bizum' },
    ];

    const isCompleto = paymentType === 'completo';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4 animate-fadeIn" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 animate-scaleUp" onClick={e => e.stopPropagation()}>
                <div className="p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{isCompleto ? 'Procesar Pago Completo' : 'Registrar Pago Aplazado'}</h2>
                    <p className="text-4xl font-extrabold text-pink-600 mb-6">{totalAmount.toLocaleString('es-ES')}€</p>

                    <div className="space-y-4">
                        {isCompleto ? (
                            <p className="font-medium text-gray-700">Selecciona el método de pago:</p>
                        ) : (
                            <p className="font-medium text-gray-700">¿Cuánto abona el cliente ahora y con qué método?</p>
                        )}
                        
                        <div className={`grid ${isCompleto ? 'grid-cols-3' : 'grid-cols-3'} gap-3`}>
                            {paymentOptions.map(opt => (
                                <button 
                                    key={opt.id} 
                                    onClick={() => setPaymentMethod(opt.id as any)}
                                    className={`p-4 rounded-lg border-2 transition-colors font-semibold ${paymentMethod === opt.id ? 'bg-pink-100 border-pink-500' : 'bg-gray-100 border-gray-200 hover:border-pink-300'}`}>
                                    {opt.label}
                                </button>
                            ))}
                        </div>

                        {paymentMethod === 'efectivo' && isCompleto && (
                             <div className="pt-4">
                                <label htmlFor="cash-received" className="block text-sm font-medium text-gray-700">Efectivo recibido</label>
                                <input type="number" id="cash-received" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} placeholder="Ej: 50" className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"/>
                                {change > 0 && <div className="text-center bg-blue-100 p-3 rounded-lg mt-2"><p className="text-sm text-blue-700">Cambio a devolver</p><p className="text-2xl font-bold text-blue-800">{change.toLocaleString('es-ES')}€</p></div>}
                            </div>
                        )}

                        {!isCompleto && (
                            <div className="pt-4">
                                <label htmlFor="amount-paid" className="block text-sm font-medium text-gray-700">Cantidad abonada ahora</label>
                                <input type="number" id="amount-paid" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} placeholder="Ej: 20" className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"/>
                                <div className="text-center bg-yellow-100 p-3 rounded-lg mt-2">
                                    <p className="text-sm text-yellow-700">Cantidad pendiente</p>
                                    <p className="text-2xl font-bold text-yellow-800">{(totalAmount - (parseFloat(amountPaid as string) || 0)).toLocaleString('es-ES')}€</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-gray-50 px-8 py-4 rounded-b-2xl flex justify-end items-center space-x-3">
                    <button onClick={onClose} className="px-5 py-2 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors">Cancelar</button>
                    <button 
                        onClick={handlePayment}
                        disabled={!paymentMethod || (isCompleto && paymentMethod === 'efectivo' && (amountPaid === '' || parseFloat(amountPaid as string) < totalAmount)) || (!isCompleto && amountPaid === '')}
                        className="px-8 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed transition-colors"
                    >
                        Confirmar Pago
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;