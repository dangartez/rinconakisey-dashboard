export interface Professional {
  id: string;
  full_name: string;
  color: 'red' | 'green' | 'purple' | 'blue' | 'yellow' | 'pink' | 'indigo' | 'gray';
  email: string;
  phone: string;
  role: 'Profesional' | 'Administradora';
  avatar?: string;
  assignedServices?: number[];
  professional_skills?: { service_id: number }[];
  creationDate: string;
  status: 'active' | 'inactive';
}

export interface Service {
  id: number;
  name: string;
  category: string;
  category_id?: number;
  duration: number; // in minutes
  break_time: number; // in minutes
  price: number;
}

export interface Client {
  id: string; // UUID
  user_id?: string | null; // Foreign key to auth.users
  full_name: string;
  phone: string;
  email: string;
  created_at: string;
  nickname: string;
  claim_code?: string;
  has_debt?: boolean;
}

export interface Appointment {
  id: string;
  start_time: string; // ISO string
  end_time: string; // ISO string
  client: Client;
  service: Service;
  professional: Professional;
  status: 'Pendiente' | 'Completada' | 'Cancelada';
}

export interface Promotion {
    id: number;
    title: string;
    description: string;
    image: string;
    originalPrice: number;
    promoPrice: number;
    isActive: boolean;
}

export interface SentNotification {
  id: string;
  title: string;
  destination: string;
  date: string;
  image?: string;
}

export interface AutomaticNotificationSetting {
  id: number;
  title: string;
  description: string;
  enabled: boolean;
}

export interface BusinessInfo {
  salonName: string;
  logoUrl: string;
  address: string;
  phone: string;
  email: string;
  currency: 'EUR' | 'USD' | 'GBP';
  taxRate: number;
  contactTitle: string;
  contactSubtitle: string;
  contactDescription: string;
}

export interface BusinessHours {
  day: 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';
  isOpen: boolean;
  openTime: string;
  closeTime: string;
  openTime2?: string;
  closeTime2?: string;
}

export interface AgendaSettings {
  businessHours: BusinessHours[];
  defaultInterval: 15 | 30 | 60;
  minBookingNotice: number; // in hours
}

export interface AppearanceSettings {
    brandColor: 'pink' | 'blue' | 'green' | 'purple';
    mode: 'light' | 'dark';
}

export interface HomeSettings {
  headerImage: string;
  headerTitle: string;
  headerSubtitle: string;
  featuredServices: number[]; // array of service IDs
  footerSlogan: string;
  footerCopyright: string;
}

export interface AppSettings {
    businessInfo: BusinessInfo;
    agenda: AgendaSettings;
    appearance: AppearanceSettings;
    home: HomeSettings;
}

// --- Tipos para la gestión de horarios de profesionales ---

export interface ScheduleEntry {
  start_time: string;
  end_time: string;
}

export interface WeeklySchedule {
  [dayId: number]: ScheduleEntry[];
}

export interface ScheduleOverride {
  id: number; // Usado para la key en React, puede ser temporal
  period_id?: string; // Para agrupar días del mismo período en la UI
  description?: string; // Nombre del período, ej: "Vacaciones Verano"
  override_date: string; // Formato YYYY-MM-DD
  is_working: boolean;
  start_time: string | null;
  end_time: string | null;
}

export interface PendingAppointment {
  id: string;
  start_time: string;
  service_id: number;
  service_name: string;
  price: number;
  professional_id: string;
  professional_name: string;
  client_id: string;
  client_name: string;
}