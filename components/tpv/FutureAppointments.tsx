import React, { useState, useEffect } from 'react';

import { PencilIcon, PlusIcon } from '../icons/Icons'; // Import PencilIcon and PlusIcon

// Define the shape of the appointment data we expect from the RPC
import { PendingAppointment } from '../../types';

interface FutureAppointmentsProps {
  appointments: PendingAppointment[];
  onAppointmentAdd: (appointment: PendingAppointment) => void;
  onAppointmentEdit: (appointment: PendingAppointment) => void;
  addedAppointmentIds: string[];
}

const FutureAppointments: React.FC<FutureAppointmentsProps> = ({ appointments, onAppointmentAdd, onAppointmentEdit, addedAppointmentIds }) => {
    if (appointments.length === 0) {
        return <div className="text-center p-8 text-gray-400 bg-gray-50 rounded-lg">Este cliente no tiene citas futuras pendientes de cobro.</div>;
    }

    if (appointments.length === 0) {
        return <div className="text-center p-8 text-gray-400 bg-gray-50 rounded-lg">Este cliente no tiene citas pendientes de cobro.</div>;
    }

    return (
        <div className="space-y-3">
            {appointments.map(app => {
                const isAdded = addedAppointmentIds.includes(app.id);
                return (
                    <div key={app.id} className={`p-4 rounded-lg flex items-center justify-between transition-colors ${isAdded ? 'bg-green-100' : 'bg-gray-50'}`}>
                        <div>
                            <p className="font-bold text-gray-800">{app.service_name}</p>
                            <p className="text-sm text-gray-600">
                                {new Date(app.start_time).toLocaleDateString('es-ES', { day: '2-digit', month: 'long' })} - {new Date(app.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="text-sm text-gray-500">con {app.professional_name}</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <p className="font-semibold text-lg text-gray-800">{app.price.toLocaleString('es-ES')}€</p>
                            <div className="flex flex-col items-center">
                                <button 
                                    onClick={() => onAppointmentAdd(app)}
                                    disabled={isAdded}
                                    className="text-sm font-semibold text-pink-600 hover:text-pink-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                                >
                                    {isAdded ? <span className="text-green-600">Añadido ✓</span> : <PlusIcon className="h-8 w-8" />}
                                </button>
                                {!isAdded && (
                                    <button onClick={() => onAppointmentEdit(app)} className="mt-1 text-gray-500 hover:text-gray-700">
                                        <PencilIcon className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    );
};

export default FutureAppointments;
