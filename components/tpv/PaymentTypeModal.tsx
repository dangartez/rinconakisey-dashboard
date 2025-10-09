import React from 'react';

interface PaymentTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: 'completo' | 'aplazado') => void;
}

const PaymentTypeModal: React.FC<PaymentTypeModalProps> = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-40 flex justify-center items-center p-4 animate-fadeIn" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-300 animate-scaleUp" onClick={e => e.stopPropagation()}>
            <div className="p-8 text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">¿Cómo se realizará el pago?</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button 
                        onClick={() => onSelect('completo')} 
                        className="p-6 bg-green-100 text-green-800 rounded-xl border-2 border-green-200 hover:bg-green-200 hover:border-green-400 transition-all transform hover:scale-105">
                        <span className="text-xl font-bold">Pago Completo</span>
                        <p className="text-sm mt-1">El cliente abona el 100% del total.</p>
                    </button>
                    <button 
                        onClick={() => onSelect('aplazado')} 
                        className="p-6 bg-yellow-100 text-yellow-800 rounded-xl border-2 border-yellow-200 hover:bg-yellow-200 hover:border-yellow-400 transition-all transform hover:scale-105">
                        <span className="text-xl font-bold">Pago Aplazado</span>
                        <p className="text-sm mt-1">El cliente paga una parte o nada.</p>
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default PaymentTypeModal;
