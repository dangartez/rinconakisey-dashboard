import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { BusinessInfo, BusinessHours } from '../../types';
import { UploadIcon } from '../icons/Icons';

const BusinessInfoSettings: React.FC = () => {
    const [settings, setSettings] = useState<BusinessInfo | null>(null);
    const [businessHours, setBusinessHours] = useState<BusinessHours[]>([]);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchSettings = async () => {
            setIsLoading(true);
            const { data: settingsData, error: settingsError } = await supabase
                .from('business_settings')
                .select('*')
                .eq('id', 1)
                .single();

            const { data: hoursData, error: hoursError } = await supabase
                .from('business_hours')
                .select('*')
                .order('id');

            if (settingsError || hoursError) {
                console.error("Error fetching settings", settingsError || hoursError);
            } else {
                setSettings({
                    salonName: settingsData.name,
                    logoUrl: settingsData.logo_url,
                    address: settingsData.address,
                    phone: settingsData.phone,
                    email: settingsData.email,
                    currency: settingsData.currency,
                    taxRate: settingsData.tax_rate,
                    contactTitle: settingsData.contact_title,
                    contactSubtitle: settingsData.contact_subtitle,
                    contactDescription: settingsData.contact_description,
                });
                setBusinessHours(hoursData.map(h => ({
                    day: h.day_name,
                    isOpen: h.is_open,
                    openTime: h.open_time_1,
                    closeTime: h.close_time_1,
                    openTime2: h.open_time_2,
                    closeTime2: h.close_time_2,
                })));
            }
            setIsLoading(false);
        };
        fetchSettings();
    }, []);

    const getScheduleString = (day: string) => {
        const dayConfig = businessHours.find(h => h.day === day);
        if (!dayConfig || !dayConfig.isOpen) return 'Cerrado';
        let schedule = `${dayConfig.openTime} - ${dayConfig.closeTime}`;
        if (dayConfig.openTime2 && dayConfig.closeTime2) {
            schedule += `, ${dayConfig.openTime2} - ${dayConfig.closeTime2}`;
        }
        return schedule;
    }

    const weekDaysSchedule = getScheduleString('Lunes');
    const saturdaySchedule = getScheduleString('Sábado');
    const sundaySchedule = getScheduleString('Domingo');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        if (!settings) return;
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev!, [name]: name === 'taxRate' ? parseFloat(value) : value }));
    };

    const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !settings) return;

        const fileExt = file.name.split('.').pop();
        const fileName = `logo-${Date.now()}.${fileExt}`;
        const filePath = `public/${fileName}`;

        const previewUrl = URL.createObjectURL(file);
        setLogoPreview(previewUrl);

        const { error: uploadError } = await supabase.storage
            .from('site_assets')
            .upload(filePath, file, { upsert: true });

        if (uploadError) {
            console.error('Error uploading logo:', uploadError);
            alert('Error al subir el logo.');
            setLogoPreview(null);
        } else {
            const { data } = supabase.storage.from('site_assets').getPublicUrl(filePath);
            setSettings(prev => ({...prev!, logoUrl: data.publicUrl}));
        }
    };

    const handleSave = async () => {
        if (!settings) return;
        setIsSaving(true);

        const updates = {
            name: settings.salonName,
            logo_url: settings.logoUrl,
            address: settings.address,
            phone: settings.phone,
            email: settings.email,
            currency: settings.currency,
            tax_rate: settings.taxRate,
            contact_title: settings.contactTitle,
            contact_subtitle: settings.contactSubtitle,
            contact_description: settings.contactDescription,
        };

        const { error } = await supabase
            .from('business_settings')
            .update(updates)
            .eq('id', 1);

        setIsSaving(false);
        if (error) {
            alert('Error al guardar los ajustes.');
            console.error(error);
        } else {
            alert('Ajustes guardados con éxito.');
        }
    };

    if (isLoading) {
        return <div>Cargando ajustes...</div>;
    }

    if (!settings) {
        return <div>Error: No se pudieron cargar los ajustes.</div>;
    }

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Información del Negocio</h2>
            <div className="space-y-6">
                <div className="flex items-center gap-6">
                     <input type="file" accept="image/*" ref={fileInputRef} onChange={handleLogoChange} className="hidden" />
                    <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer border-2 border-dashed" onClick={() => fileInputRef.current?.click()}>
                       {(logoPreview || settings.logoUrl) ? (
                           <img src={logoPreview || settings.logoUrl} alt="Logo" className="w-full h-full rounded-full object-cover"/>
                       ) : (
                            <div className="text-gray-400 text-center">
                                <UploadIcon className="h-8 w-8 mx-auto"/>
                                <span className="text-xs mt-1 block">Subir logo</span>
                            </div>
                       )}
                    </div>
                    <div className="flex-1">
                        <label htmlFor="salonName" className="block text-sm font-medium text-gray-700 mb-1">Nombre del Salón</label>
                        <input type="text" id="salonName" name="salonName" value={settings.salonName} onChange={handleChange} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
                    </div>
                </div>

                <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                    <input type="text" id="address" name="address" value={settings.address} onChange={handleChange} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                        <input type="tel" id="phone" name="phone" value={settings.phone} onChange={handleChange} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
                    </div>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email de Contacto</label>
                        <input type="email" id="email" name="email" value={settings.email} onChange={handleChange} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">Moneda</label>
                         <select id="currency" name="currency" value={settings.currency} onChange={handleChange} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500">
                            <option value="EUR">Euro (€)</option>
                            <option value="USD">Dólar ($)</option>
                            <option value="GBP">Libra (£)</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="taxRate" className="block text-sm font-medium text-gray-700 mb-1">Impuesto por defecto (%)</label>
                        <input type="number" id="taxRate" name="taxRate" value={settings.taxRate} onChange={handleChange} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
                    </div>
                </div>
            </div>

            <div className="pt-8 mt-6 border-t border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Presentación en la Página de Contacto</h3>
                <p className="text-sm text-gray-500 mb-6">Edita los textos que verán tus clientes en la sección de contacto de tu página web.</p>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="contactTitle" className="block text-sm font-medium text-gray-700 mb-1">Título Principal</label>
                            <input type="text" id="contactTitle" name="contactTitle" value={settings.contactTitle} onChange={handleChange} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
                        </div>
                        <div>
                            <label htmlFor="contactSubtitle" className="block text-sm font-medium text-gray-700 mb-1">Subtítulo</label>
                            <input type="text" id="contactSubtitle" name="contactSubtitle" value={settings.contactSubtitle} onChange={handleChange} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
                        </div>
                        <div>
                             <label htmlFor="contactDescription" className="block text-sm font-medium text-gray-700 mb-1">Párrafo de Descripción</label>
                            <textarea id="contactDescription" name="contactDescription" value={settings.contactDescription} onChange={handleChange} rows={8} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"></textarea>
                        </div>
                    </div>
                    <div className="lg:sticky lg:top-24">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Vista Previa</label>
                        <div className="bg-slate-50 p-4 rounded-lg h-full border">
                           <div className="w-full max-w-lg mx-auto text-center">
                               <h2 className="text-2xl font-bold text-gray-900">{settings.contactTitle || 'Contacto y Horario'}</h2>
                               <p className="text-gray-600 mt-2 text-sm">{settings.contactSubtitle || 'Estamos aquí para ayudarte. ¡Contáctanos!'}</p>
                           </div>
                           <div className="bg-white p-6 rounded-lg shadow-md mt-4 text-left space-y-6">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-3">Sobre {settings.salonName}</h3>
                                    <p className="text-sm text-gray-600 leading-relaxed">{settings.contactDescription || 'Descripción de tu negocio...'}</p>
                                    <div className="flex gap-4 mt-6">
                                       <div className="bg-pink-100 border border-pink-200 text-pink-700 w-full text-center p-3 rounded-lg font-semibold text-sm">Llamar Ahora</div>
                                       <div className="bg-slate-200 border border-slate-300 text-slate-800 w-full text-center p-3 rounded-lg font-semibold text-sm">Enviar Email</div>
                                    </div>
                                </div>
                                <div className="border-t pt-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-3">Nuestro Horario</h3>
                                    <div className="relative pl-5">
                                        <div className="absolute left-0 top-1 bottom-1 w-1 bg-pink-300 rounded-full"></div>
                                        <div className="space-y-1">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-800 font-medium">Lunes a Viernes:</span>
                                                <span className="text-gray-600">{weekDaysSchedule}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-800 font-medium">Sábados:</span>
                                                <span className="text-gray-600">{saturdaySchedule}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-800 font-medium">Domingos:</span>
                                                <span className="text-gray-600 font-semibold">{sundaySchedule}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="border-t pt-6">
                                     <h3 className="text-xl font-bold text-gray-900 mb-3">Ubicación</h3>
                                     <p className="text-sm text-gray-600">{settings.address}</p>
                                </div>
                           </div>
                        </div>
                    </div>
                </div>

            </div>

             <div className="pt-8 mt-8 border-t flex justify-end">
                <button onClick={handleSave} disabled={isSaving} className="bg-pink-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-pink-700 transition-colors shadow-sm disabled:bg-pink-300 disabled:cursor-wait">
                    {isSaving ? 'Guardando...' : 'Guardar Todos los Cambios'}
                </button>
            </div>
        </div>
    );
};

export default BusinessInfoSettings;