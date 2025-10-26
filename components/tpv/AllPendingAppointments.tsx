
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';

// --- TYPES ---
type FilterType = 'TODAS' | 'PASADAS' | 'HOY' | 'FUTURAS';

interface PendingAppointment {
  id: string;
  start_time: string;
  client_id: string;
  client_name: string;
  service_id: number;
  service_name: string;
  price: number;
  professional_id: string;
  professional_name: string;
}

// --- COMPONENT ---
const AllPendingAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<PendingAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('TODAS');

  useEffect(() => {
    const fetchAllPendingAppointments = async () => {
      setIsLoading(true);
      const { data, error } = await supabase.rpc('get_all_pending_appointments');

      if (error) {
        console.error('Error fetching all pending appointments:', error);
        setAppointments([]);
      } else {
        setAppointments(data || []);
      }
      setIsLoading(false);
    };

    fetchAllPendingAppointments();
  }, []);

  const filteredAppointments = useMemo(() => {
    if (activeFilter === 'TODAS') {
      return appointments;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return appointments.filter(app => {
      const appDate = new Date(app.start_time);
      if (activeFilter === 'PASADAS') {
        return appDate < today;
      }
      if (activeFilter === 'HOY') {
        return appDate >= today && appDate < tomorrow;
      }
      if (activeFilter === 'FUTURAS') {
        return appDate >= tomorrow;
      }
      return false;
    });
  }, [appointments, activeFilter]);

  const FilterButton: React.FC<{label: FilterType}> = ({ label }) => (
    <button 
      onClick={() => setActiveFilter(label)}
      className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all duration-200 ${activeFilter === label ? 'bg-pink-600 text-white shadow-sm' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}>
      {label}
    </button>
  );

  if (isLoading) {
    return <div className="text-center p-8 text-gray-400">Cargando todas las citas pendientes...</div>;
  }

  return (
    <div className="bg-white p-8 rounded-xl shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-gray-800">Citas Pendientes</h3>
        <div className="flex items-center gap-2">
          <FilterButton label="TODAS" />
          <FilterButton label="PASADAS" />
          <FilterButton label="HOY" />
          <FilterButton label="FUTURAS" />
        </div>
      </div>

      <div className="overflow-x-auto">
        {filteredAppointments.length > 0 ? (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-gray-100">
                <th className="p-3 text-sm font-semibold text-gray-500">Fecha y Hora</th>
                <th className="p-3 text-sm font-semibold text-gray-500">Cliente</th>
                <th className="p-3 text-sm font-semibold text-gray-500">Servicio</th>
                <th className="p-3 text-sm font-semibold text-gray-500">Profesional</th>
                <th className="p-3 text-sm font-semibold text-gray-500 text-right">Precio</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.map(app => (
                <tr key={app.id} className={`border-b border-gray-100 transition-colors ${app.has_debt ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}`}>
                  <td className="p-3 text-gray-700 whitespace-nowrap">
                    {new Date(app.start_time).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="p-3 text-gray-800 font-medium">{app.client_name}</td>
                  <td className="p-3 text-gray-600">{app.service_name}</td>
                  <td className="p-3 text-gray-600">{app.professional_name}</td>
                  <td className="p-3 text-gray-800 font-semibold text-right">{app.price.toLocaleString('es-ES')}€</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center p-8 text-gray-400 bg-gray-50 rounded-lg">No hay citas pendientes que coincidan con el filtro.</div>
        )}
      </div>
    </div>
  );
};

export default AllPendingAppointments;
