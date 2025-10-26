
import React, { useState } from 'react';
import SalesManagementTab from './SalesManagementTab';
import AppointmentsManagementTab from './AppointmentsManagementTab'; // Import the real component

type ManagementTab = 'sales' | 'appointments';

// The placeholder AppointmentsManagementTab component is removed.

const AdvancedManagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ManagementTab>('sales');

    const renderContent = () => {
        switch (activeTab) {
            case 'sales':
                return <SalesManagementTab />;
            case 'appointments':
                return <AppointmentsManagementTab />;
            default:
                return null;
        }
    };

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Gestión Avanzada</h2>
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('sales')}
                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'sales'
                                ? 'border-pink-500 text-pink-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Gestionar Ventas
                    </button>
                    <button
                        onClick={() => setActiveTab('appointments')}
                        className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'appointments'
                                ? 'border-pink-500 text-pink-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Gestionar Citas
                    </button>
                </nav>
            </div>

            <div className="mt-6">
                {renderContent()}
            </div>
        </div>
    );
};

export default AdvancedManagement;
