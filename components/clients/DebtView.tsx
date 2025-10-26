import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { ChevronDownIcon, ChevronUpIcon } from '../icons/Icons';
import PaymentModal from '../tpv/PaymentModal';
import { showSuccessToast, showErrorToast } from '../ui/CustomToast';

// --- TYPES ---
interface SaleItemInfo {
  price: number;
  services: { name: string };
}

interface Debt {
  id: string; // debt_id
  created_at: string;
  initial_amount: number;
  remaining_amount: number;
  sale_id: string;
  payments: Payment[];
  sale_items: SaleItemInfo[];
}

interface Payment {
  id: number;
  created_at: string;
  amount_paid: number;
  payment_method: string;
}

interface DebtViewProps {
  clientId: string;
  onDebtUpdate: () => void;
}

// --- COMPONENT ---
const DebtView: React.FC<DebtViewProps> = ({ clientId, onDebtUpdate }) => {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debtToPay, setDebtToPay] = useState<Debt | null>(null);

  const fetchDebts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const { data: debtData, error: debtError } = await supabase
      .from('client_debts')
      .select('*')
      .eq('client_id', clientId)
      .eq('status', 'pendiente')
      .order('created_at', { ascending: false });

    if (debtError) {
      console.error('Error fetching debts:', debtError);
      setError('No se pudieron cargar las deudas.');
      setIsLoading(false);
      return;
    }

    const debtsWithDetails = await Promise.all(
      debtData.map(async (debt) => {
        const { data: paymentData } = await supabase
          .from('debt_payments')
          .select('*')
          .eq('debt_id', debt.id)
          .order('created_at', { ascending: false });
        
        const { data: saleItemsData } = await supabase
          .from('sale_items')
          .select('price, services(name)')
          .eq('sale_id', debt.sale_id);

        return { 
          ...debt, 
          payments: paymentData || [],
          sale_items: saleItemsData || []
        };
      })
    );

    setDebts(debtsWithDetails);
    setIsLoading(false);
  }, [clientId]);

  useEffect(() => {
    fetchDebts();
  }, [fetchDebts]);

  const handlePaymentSuccess = async (paymentDetails: { payments: { method: string; amount: number }[] }) => {
    if (!debtToPay) return;
    const cashier_id = '228dc81f-3fab-47ba-9d7a-27ae0e4854f0'; // TODO: Dynamic cashier ID

    const payment = paymentDetails.payments[0];

    const { error } = await supabase.rpc('make_debt_payment_v2', {
        p_debt_id: debtToPay.id,
        p_amount_paid: payment.amount,
        p_payment_method: payment.method,
        p_cashier_id: cashier_id
    });

    if (error) {
        showErrorToast(`Error al registrar el pago: ${error.message}`);
    } else {
        showSuccessToast('Pago registrado con éxito');
        setDebtToPay(null);
        fetchDebts();
        onDebtUpdate();
    }
  };

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Cargando deudas...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return (
    <>
        <div className="p-8">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Gestión de Deudas</h2>
            {debts.length > 0 ? (
                <div className="space-y-4">
                {debts.map(debt => (
                    <DebtCard key={debt.id} debt={debt} onPay={() => setDebtToPay(debt)} />
                ))}
                </div>
            ) : (
                <div className="text-center p-8 bg-gray-100 rounded-lg">
                <p className="text-gray-600">¡Buenas noticias!</p>
                <p className="font-semibold text-gray-800">Este cliente no tiene ninguna deuda pendiente.</p>
                </div>
            )}
        </div>

        {debtToPay && (
            <PaymentModal 
                isOpen={!!debtToPay}
                onClose={() => setDebtToPay(null)}
                totalAmount={debtToPay.remaining_amount}
                paymentType="deuda"
                onPaymentSuccess={handlePaymentSuccess}
            />
        )}
    </>
  );
};

// --- SUB-COMPONENTS ---

const DebtCard: React.FC<{ debt: Debt; onPay: () => void; }> = ({ debt, onPay }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setIsExpanded(!isExpanded)}>
        <div>
          <p className="font-bold text-gray-800">Deuda del {new Date(debt.created_at).toLocaleDateString('es-ES')}</p>
          <p className="text-sm text-gray-500">Importe original: {debt.initial_amount.toLocaleString('es-ES')}€</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-red-600">Restan</p>
          <p className="text-2xl font-bold text-red-600">{debt.remaining_amount.toLocaleString('es-ES')}€</p>
        </div>
      </div>

      <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 flex justify-end items-center gap-4">
        <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900">
            {isExpanded ? 'Ocultar Detalles' : 'Ver Detalles'} 
            {isExpanded ? <ChevronUpIcon className="h-4 w-4 ml-1" /> : <ChevronDownIcon className="h-4 w-4 ml-1" />}
        </button>
        <button onClick={onPay} className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">
          Realizar Pago
        </button>
      </div>

      {isExpanded && (
        <div className="border-t border-gray-200 p-4 bg-gray-100">
          <h4 className="font-semibold text-sm text-gray-700 mb-2">Servicios en esta Venta</h4>
          <ul className="space-y-2 mb-4">
            {debt.sale_items.map((item, index) => (
              <li key={index} className="flex justify-between items-center text-sm p-2 rounded-md bg-white">
                <p className="font-medium text-gray-800">{item.services.name}</p>
                <p className="font-semibold text-gray-600">{item.price.toLocaleString('es-ES')}€</p>
              </li>
            ))}
          </ul>

          <h4 className="font-semibold text-sm text-gray-700 mb-2">Historial de Pagos</h4>
          {debt.payments.length > 0 ? (
            <ul className="space-y-2">
              {debt.payments.map(payment => (
                <li key={payment.id} className="flex justify-between items-center text-sm p-2 rounded-md bg-white">
                  <div>
                    <span className="font-medium text-gray-800">{payment.amount_paid.toLocaleString('es-ES')}€</span>
                    <span className="text-gray-500"> pagados el {new Date(payment.created_at).toLocaleString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <span className="font-semibold text-xs uppercase text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">{payment.payment_method}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 italic">No hay pagos registrados para esta deuda.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default DebtView;