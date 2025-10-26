
import React, { useState } from 'react';
import PageHeader from '../components/ui/PageHeader';
import BusinessInfoSettings from '../components/settings/BusinessInfoSettings';
import AgendaSettings from '../components/settings/AgendaSettings';
import AppearanceSettings from '../components/settings/AppearanceSettings';
import DataManagementSettings from '../components/settings/DataManagementSettings';
import HomeSettings from '../components/settings/HomeSettings';
import AdvancedManagement from '../components/settings/AdvancedManagement'; // Importado
import { MenuIcon, ChevronLeftIcon } from '../components/icons/Icons';

type SettingsTab = 'business' | 'agenda' | 'home' | 'appearance' | 'data' | 'advanced'; // Añadido

const SettingsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('business');
    const [isSubmenuCollapsed, setSubmenuCollapsed] = useState(false);

    const tabs: { id: SettingsTab; label: string; isSeparator?: boolean }[] = [
        { id: 'business', label: 'Información del Negocio' },
        { id: 'agenda', label: 'Horarios y Reservas' },
        { id: 'home', label: 'Página de Inicio' },
        { id: 'appearance', label: 'Personalización' },
        { id: 'data', label: 'Gestión de Datos' },
        { id: 'advanced', label: 'Gestión Avanzada', isSeparator: true }, // Añadido
    ];
    
    const renderContent = () => {
        switch (activeTab) {
            case 'business':
                return <BusinessInfoSettings />;
            case 'agenda':
                return <AgendaSettings />;
            case 'home':
                return <HomeSettings />;
            case 'appearance':
                return <AppearanceSettings />;
            case 'data':
                return <DataManagementSettings />;
            case 'advanced': // Añadido
                return <AdvancedManagement />;
            default:
                return null;
        }
    };

    return (
        <div>
            <PageHeader title="Ajustes" subtitle="Configura y personaliza la aplicación para tu negocio." />

            <div className="relative flex flex-col md:flex-row gap-8">
                {!isSubmenuCollapsed && (
                    <aside className={`w-full md:w-1/4 transition-all duration-300`}>
                        <div className="flex justify-between items-center mb-4 px-4 md:px-0">
                            <h3 className="text-lg font-semibold text-gray-800">Navegación</h3>
                            <button onClick={() => setSubmenuCollapsed(true)} className="p-1 rounded-md hover:bg-gray-200">
                                <ChevronLeftIcon className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>
                        <nav className="flex flex-col space-y-1">
                            {tabs.map(tab => (
                                <React.Fragment key={tab.id}>
                                    {tab.isSeparator && (
                                        <div className="pt-2 mt-2 border-t border-gray-200">
                                            <span className="px-4 text-xs font-semibold tracking-wider text-gray-400 uppercase">Avanzado</span>
                                        </div>
                                    )}
                                    <button
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`px-4 py-2 text-left rounded-lg text-sm font-medium transition-colors w-full ${ 
                                            activeTab === tab.id
                                                ? 'bg-pink-100 text-pink-700'
                                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                </React.Fragment>
                            ))}
                        </nav>
                    </aside>
                )}

                <main className={`transition-all duration-300 ${isSubmenuCollapsed ? 'w-full' : 'flex-1'}`}>
                    {isSubmenuCollapsed && (
                        <button 
                            onClick={() => setSubmenuCollapsed(false)} 
                            className="absolute top-0 left-0 z-10 p-2 bg-gray-100 rounded-full shadow-md hover:bg-gray-200"
                            aria-label="Mostrar menú de ajustes"
                        >
                            <MenuIcon className="h-5 w-5 text-gray-700" />
                        </button>
                    )}
                    <div className="bg-white p-8 rounded-xl shadow-sm">
                        {renderContent()}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default SettingsPage;