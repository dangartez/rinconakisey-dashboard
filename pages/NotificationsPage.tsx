
import React, { useState } from 'react';
import PageHeader from '../components/ui/PageHeader';
import ToggleSwitch from '../components/ui/ToggleSwitch';
import { UploadIcon } from '../components/icons/Icons';
import { sentNotifications, automaticNotificationSettings } from '../data/mockData';
import { AutomaticNotificationSetting } from '../types';

const NotificationsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('manual');
    const [settings, setSettings] = useState<AutomaticNotificationSetting[]>(automaticNotificationSettings);

    const handleToggle = (id: number) => {
        setSettings(prevSettings =>
            prevSettings.map(setting =>
                setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
            )
        );
    };

    const getTabClassName = (tabName: string) => {
        return `whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm cursor-pointer ${
            activeTab === tabName
                ? 'border-pink-500 text-pink-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }`;
    };

    return (
        <div>
            <PageHeader
                title="Notificaciones Push"
                subtitle="Comunícate directamente con tus clientes."
            />

            <div className="border-b border-gray-200 mb-8">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button onClick={() => setActiveTab('manual')} className={getTabClassName('manual')}>
                        Enviar Notificación Manual
                    </button>
                    <button onClick={() => setActiveTab('automatic')} className={getTabClassName('automatic')}>
                        Ajustes de Notificaciones Automáticas
                    </button>
                </nav>
            </div>

            {activeTab === 'manual' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    <div className="bg-white p-8 rounded-xl shadow-sm space-y-6">
                        <h2 className="text-xl font-bold text-gray-800">Redactar Mensaje</h2>
                        <form className="space-y-6">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                                <input type="text" id="title" placeholder="Ej: ¡Oferta Flash!" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white" />
                            </div>
                             <div>
                                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
                                <textarea id="message" rows={4} placeholder="Ej: 20% de descuento en masajes esta semana." className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white"></textarea>
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Imagen (Opcional)</label>
                                <button type="button" className="w-full flex justify-center items-center px-4 py-3 border-2 border-dashed border-gray-300 rounded-md text-sm font-medium text-gray-500 bg-gray-50 hover:bg-gray-100">
                                    <UploadIcon className="h-5 w-5 mr-2"/>
                                    Subir Imagen
                                </button>
                            </div>
                             <div>
                                <label htmlFor="recipients" className="block text-sm font-medium text-gray-700 mb-1">Destinatarios</label>
                                <select id="recipients" className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-400 bg-white">
                                    <option>Todos los clientes</option>
                                    <option>Clientes con cita esta semana</option>
                                    <option>Clientes nuevos del mes</option>
                                </select>
                            </div>
                            <button type="submit" className="w-full bg-pink-600 text-white py-3 rounded-lg font-semibold hover:bg-pink-700 transition-colors">
                                Enviar Notificación
                            </button>
                        </form>
                    </div>

                    <div className="bg-white p-8 rounded-xl shadow-sm">
                         <h2 className="text-xl font-bold text-gray-800 mb-6">Historial de Envíos</h2>
                         <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b-2 border-gray-100">
                                        <th className="p-4 text-sm font-semibold text-gray-500">Título</th>
                                        <th className="p-4 text-sm font-semibold text-gray-500">Dest.</th>
                                        <th className="p-4 text-sm font-semibold text-gray-500">Fecha</th>
                                        <th className="p-4 text-sm font-semibold text-gray-500">Imagen</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sentNotifications.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="text-center p-8 text-gray-500">
                                                No se han enviado notificaciones.
                                            </td>
                                        </tr>
                                    ) : (
                                        sentNotifications.map(notification => (
                                            <tr key={notification.id}>
                                                {/* Data rows will go here */}
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                         </div>
                    </div>
                </div>
            )}

            {activeTab === 'automatic' && (
                 <div className="bg-white p-8 rounded-xl shadow-sm max-w-3xl mx-auto">
                    <h2 className="text-xl font-bold text-gray-800 mb-1">Alertas Automáticas</h2>
                    <p className="text-gray-500 mb-8">Activa o desactiva los avisos que se envían automáticamente a los clientes.</p>
                    <div className="space-y-4">
                        {settings.map(setting => (
                           <div key={setting.id} className="bg-white p-4 rounded-lg border border-gray-200 flex justify-between items-center">
                               <div>
                                   <h3 className="font-semibold text-gray-800">{setting.title}</h3>
                                   <p className="text-sm text-gray-500">{setting.description}</p>
                               </div>
                               <ToggleSwitch enabled={setting.enabled} onChange={() => handleToggle(setting.id)} />
                           </div>
                        ))}
                    </div>
                 </div>
            )}
        </div>
    );
};

export default NotificationsPage;
