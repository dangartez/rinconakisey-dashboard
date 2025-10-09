import React, { useState, useRef, useMemo, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { HomeSettings as HomeSettingsType, Service, BusinessInfo, BusinessHours } from '../../types';
import { UploadIcon } from '../icons/Icons';

const HomeSettings: React.FC = () => {
    const [settings, setSettings] = useState<HomeSettingsType | null>(null);
    const [allServices, setAllServices] = useState<Service[]>([]);
    const [businessInfo, setBusinessInfo] = useState<BusinessInfo | null>(null);
    const [businessHours, setBusinessHours] = useState<BusinessHours[]>([]);
    
    const [headerImagePreview, setHeaderImagePreview] = useState<string | null>(null);
    const [serviceSearchTerm, setServiceSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchAllSettings = async () => {
            setIsLoading(true);
            const [settingsRes, servicesRes, hoursRes] = await Promise.all([
                supabase.from('business_settings').select('*').single(),
                supabase.from('services').select('id, name'),
                supabase.from('business_hours').select('*').order('id')
            ]);

            const { data: settingsData, error: settingsError } = settingsRes;
            const { data: servicesData, error: servicesError } = servicesRes;
            const { data: hoursData, error: hoursError } = hoursRes;

            if (settingsError || servicesError || hoursError) {
                console.error("Error fetching settings", settingsError || servicesError || hoursError);
            } else {
                setSettings({
                    headerImage: settingsData.home_header_image_url,
                    headerTitle: settingsData.home_header_title,
                    headerSubtitle: settingsData.home_header_subtitle,
                    featuredServices: settingsData.home_featured_services_ids || [],
                    footerSlogan: settingsData.home_footer_slogan,
                    footerCopyright: settingsData.home_footer_copyright,
                });
                setHeaderImagePreview(settingsData.home_header_image_url);
                setAllServices(servicesData as Service[]);
                setBusinessInfo({
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
        fetchAllSettings();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!settings) return;
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev!, [name]: value }));
    };

    const handleHeaderImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !settings) return;

        const fileExt = file.name.split('.').pop();
        const fileName = `header-${Date.now()}.${fileExt}`;
        const filePath = `public/${fileName}`;

        const previewUrl = URL.createObjectURL(file);
        setHeaderImagePreview(previewUrl);

        const { error: uploadError } = await supabase.storage
            .from('site_assets')
            .upload(filePath, file, { upsert: true });

        if (uploadError) {
            console.error('Error uploading header image:', uploadError);
            alert('Error al subir la imagen.');
        } else {
            const { data } = supabase.storage.from('site_assets').getPublicUrl(filePath);
            setSettings(prev => ({...prev!, headerImage: data.publicUrl}));
        }
    };

    const handleServiceToggle = (serviceId: number) => {
        if (!settings) return;
        setSettings(prev => {
            const featuredServices = prev!.featuredServices.includes(serviceId)
                ? prev!.featuredServices.filter(id => id !== serviceId)
                : [...prev!.featuredServices, serviceId];
            return { ...prev!, featuredServices };
        });
    };

    const handleSave = async () => {
        if (!settings) return;
        setIsSaving(true);

        const updates = {
            home_header_image_url: settings.headerImage,
            home_header_title: settings.headerTitle,
            home_header_subtitle: settings.headerSubtitle,
            home_featured_services_ids: settings.featuredServices,
            home_footer_slogan: settings.footerSlogan,
            home_footer_copyright: settings.footerCopyright,
        };

        const { error } = await supabase.from('business_settings').update(updates).eq('id', 1);

        setIsSaving(false);
        if (error) {
            alert('Error al guardar los ajustes.');
            console.error(error);
        } else {
            alert('Ajustes de la página de inicio guardados con éxito.');
        }
    };

    const filteredServices = useMemo(() => {
        return allServices.filter(service => 
            service.name.toLowerCase().includes(serviceSearchTerm.toLowerCase())
        );
    }, [serviceSearchTerm, allServices]);

    const getScheduleString = (day: string) => {
        const dayConfig = businessHours.find(h => h.day === day);
        if (!dayConfig || !dayConfig.isOpen) return 'Cerrado';
        let schedule = `${dayConfig.openTime || ''} - ${dayConfig.closeTime || ''}`.replace(/^ - $/, '');
        if (dayConfig.openTime2 && dayConfig.closeTime2) {
            schedule += `, ${dayConfig.openTime2} - ${dayConfig.closeTime2}`;
        }
        return schedule.trim() === '-' ? 'Cerrado' : schedule;
    }

    const weekDaysSchedule = getScheduleString('Lunes');
    const saturdaySchedule = getScheduleString('Sábado');
    const sundaySchedule = getScheduleString('Domingo');

    if (isLoading || !settings || !businessInfo) {
        return <div>Cargando...</div>;
    }

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Página de Inicio</h2>
            
            <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-700">Cabecera</h3>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Imagen de Cabecera</label>
                    <div className="w-full h-48 rounded-lg bg-gray-100 flex items-center justify-center border-2 border-dashed relative overflow-hidden">
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleHeaderImageChange} className="hidden" />
                        {headerImagePreview ? (
                            <img src={headerImagePreview} alt="Header Preview" className="w-full h-full object-cover"/>
                        ) : (
                            <div className="text-gray-400 text-center">
                                <UploadIcon className="h-8 w-8 mx-auto"/>
                                <span className="text-xs mt-1 block">Subir imagen</span>
                            </div>
                        )}
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute top-3 right-3 bg-white/80 backdrop-blur-sm text-gray-800 px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-white transition-colors shadow">
                            Cambiar Imagen
                        </button>
                    </div>
                </div>
                <div>
                    <label htmlFor="headerTitle" className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                    <input type="text" id="headerTitle" name="headerTitle" value={settings.headerTitle} onChange={handleChange} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
                </div>
                <div>
                    <label htmlFor="headerSubtitle" className="block text-sm font-medium text-gray-700 mb-1">Subtítulo</label>
                    <input type="text" id="headerSubtitle" name="headerSubtitle" value={settings.headerSubtitle} onChange={handleChange} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
                </div>
            </div>

            <div className="pt-8 mt-8 border-t">
                <h3 className="text-lg font-semibold text-gray-700 mb-1">Servicios Populares</h3>
                <p className="text-sm text-gray-500 mb-4">Selecciona los servicios que aparecerán destacados en la página de inicio.</p>
                <div className="mb-4">
                    <input 
                        type="text" 
                        placeholder="Buscar servicios para destacar..."
                        value={serviceSearchTerm}
                        onChange={(e) => setServiceSearchTerm(e.target.value)}
                        className="w-full max-w-sm bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-72 overflow-y-auto border p-4 rounded-lg bg-gray-50/50">
                    {filteredServices.map(service => (
                        <div key={service.id} className="flex items-center p-3 rounded-lg bg-white border border-gray-200">
                            <input
                                type="checkbox"
                                id={`service-featured-${service.id}`}
                                checked={settings.featuredServices.includes(service.id)}
                                onChange={() => handleServiceToggle(service.id)}
                                className="h-4 w-4 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                            />
                            <label htmlFor={`service-featured-${service.id}`} className="ml-3 text-sm font-medium text-gray-800">{service.name}</label>
                        </div>
                    ))}
                </div>
            </div>

            <div className="pt-8 mt-8 border-t">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Pie de Página (Footer)</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-6">
                         <div>
                            <label htmlFor="footerSlogan" className="block text-sm font-medium text-gray-700 mb-1">Slogan</label>
                            <input type="text" id="footerSlogan" name="footerSlogan" value={settings.footerSlogan} onChange={handleChange} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
                        </div>
                         <div>
                            <label htmlFor="footerCopyright" className="block text-sm font-medium text-gray-700 mb-1">Texto de Copyright</label>
                            <input type="text" id="footerCopyright" name="footerCopyright" value={settings.footerCopyright} onChange={handleChange} className="w-full bg-white px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Vista Previa del Footer</label>
                        <div className="bg-slate-800 text-white p-8 rounded-lg">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
                                <div>
                                    <h4 className="text-2xl font-bold mb-3">Belleza<span className="text-pink-500">Sana</span></h4>
                                    <p className="text-slate-300">{settings.footerSlogan}</p>
                                </div>
                                <div>
                                    <h4 className="font-bold mb-3 text-white">Contacto</h4>
                                    <ul className="space-y-2 text-slate-300">
                                        <li>{businessInfo.address}</li>
                                        <li>{businessInfo.phone}</li>
                                        <li>{businessInfo.email}</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-bold mb-3 text-white">Horario</h4>
                                    <ul className="space-y-2 text-slate-300">
                                        <li>Lunes a Viernes: {weekDaysSchedule}</li>
                                        <li>Sábados: {saturdaySchedule}</li>
                                        <li>Domingos: {sundaySchedule}</li>
                                    </ul>
                                </div>
                            </div>
                            <div className="border-t border-slate-700 mt-8 pt-6 text-center text-xs text-slate-400">
                                <p>{settings.footerCopyright}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-8 mt-8 border-t flex justify-end">
                <button onClick={handleSave} disabled={isSaving} className="bg-pink-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-pink-700 transition-colors shadow-sm disabled:bg-pink-300 disabled:cursor-wait">
                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>
        </div>
    );
};

export default HomeSettings;