import { Professional, Service, Client, Appointment, Promotion, SentNotification, AutomaticNotificationSetting } from '../types';

export const professionals: Professional[] = [
  { id: '1', name: 'Ana', color: 'red', email: 'ana@example.com', phone: '600111222', role: 'Profesional', avatar: 'https://picsum.photos/seed/prof1/100/100', assignedServices: [1, 2, 3], creationDate: '2023-01-15', status: 'active' },
  { id: '2', name: 'Laura', color: 'green', email: 'laura@example.com', phone: '600333444', role: 'Profesional', avatar: 'https://picsum.photos/seed/prof2/100/100', assignedServices: [4, 5], creationDate: '2023-02-20', status: 'active' },
  { id: '3', name: 'Carmen', color: 'purple', email: 'carmen@example.com', phone: '600555666', role: 'Administradora', avatar: 'https://picsum.photos/seed/prof3/100/100', assignedServices: [1,2,3,4,5], creationDate: '2022-11-10', status: 'active' },
  { id: '4', name: 'Sofía', color: 'blue', email: 'sofia@example.com', phone: '600777888', role: 'Profesional', avatar: 'https://picsum.photos/seed/prof4/100/100', assignedServices: [2, 3], creationDate: '2023-05-01', status: 'inactive' },
];

export const services: Service[] = [
  { id: 1, name: 'Limpieza facial', category: 'Tratamientos', duration: 60, breakDuration: 15, price: 50 },
  { id: 2, name: 'Manicura básica', category: 'Uñas', duration: 30, breakDuration: 5, price: 15 },
  { id: 3, name: 'Manicura semipermanente', category: 'Uñas', duration: 45, breakDuration: 10, price: 25 },
  { id: 4, name: 'Masaje de espalda', category: 'Masajes', duration: 60, breakDuration: 10, price: 40 },
  { id: 5, name: 'Masaje de pies', category: 'Masajes', duration: 30, breakDuration: 5, price: 20 },
];

export const clients: Client[] = [
  { id: 'c1', name: 'María López', phone: '611222333', email: 'maria@email.com', registrationDate: '10/5/2024', nickname: 'La chica de las uñas rojas' },
  { id: 'c2', name: 'Juan Pérez', phone: '622333444', email: 'juan@email.com', registrationDate: '21/6/2024', nickname: '-' },
  { id: 'c3', name: 'Elena García', phone: '655666777', email: 'elena@email.com', registrationDate: '2/2/2024', nickname: 'Amiga de Laura' },
  { id: 'c4', name: 'Carlos Sanchez', phone: '644555666', email: 'carlos@email.com', registrationDate: '15/3/2024', nickname: '-' },
  { id: 'c5', name: 'Lucía García', phone: '633444555', email: 'lucia@email.com', registrationDate: '1/8/2024', nickname: 'Cliente VIP' },
];

// Helper to format date as YYYY-MM-DD
const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
};

const today = new Date();
const tomorrow = new Date();
tomorrow.setDate(today.getDate() + 1);
const dayAfterTomorrow = new Date();
dayAfterTomorrow.setDate(today.getDate() + 2);
const yesterday = new Date();
yesterday.setDate(today.getDate() - 1);
const twoDaysAgo = new Date();
twoDaysAgo.setDate(today.getDate() - 2);


export const appointments: Appointment[] = [
  {
    id: 'a1',
    date: formatDate(today),
    startTime: '09:00',
    endTime: '10:00',
    client: clients[0],
    service: services[3], // Masaje de espalda
    professional: professionals[0],
    status: 'Pendiente',
  },
  {
    id: 'a2',
    date: formatDate(today),
    startTime: '09:30',
    endTime: '10:15',
    client: clients[1],
    service: services[2], // Manicura semipermanente
    professional: professionals[1],
    status: 'Pendiente',
  },
  {
    id: 'a3',
    date: formatDate(today),
    startTime: '11:00',
    endTime: '11:45',
    client: clients[0],
    service: services[2], // Manicura semipermanente
    professional: professionals[2],
    status: 'Pendiente',
  },
  {
    id: 'a4',
    date: formatDate(today),
    startTime: '12:00',
    endTime: '13:00',
    client: clients[2],
    service: services[0], // Limpieza facial
    professional: professionals[0],
    status: 'Pendiente',
  },
  {
    id: 'a5',
    date: formatDate(today),
    startTime: '16:00',
    endTime: '16:30',
    client: clients[3],
    service: services[1], // Manicura básica
    professional: professionals[3],
    status: 'Cancelada',
  },
  {
    id: 'a6',
    date: formatDate(tomorrow),
    startTime: '10:00',
    endTime: '11:00',
    client: clients[4],
    service: services[0], // Limpieza facial
    professional: professionals[1],
    status: 'Pendiente',
  },
  {
    id: 'a7',
    date: formatDate(tomorrow),
    startTime: '11:30',
    endTime: '12:00',
    client: clients[2],
    service: services[4], // Masaje de pies
    professional: professionals[3],
    status: 'Pendiente',
  },
    {
    id: 'a8',
    date: formatDate(dayAfterTomorrow),
    startTime: '15:00',
    endTime: '15:45',
    client: clients[1],
    service: services[2],
    professional: professionals[0],
    status: 'Pendiente',
  },
  {
    id: 'a9',
    date: formatDate(yesterday),
    startTime: '17:00',
    endTime: '17:30',
    client: clients[3],
    service: services[1],
    professional: professionals[2],
    status: 'Completada',
  },
  {
    id: 'a10',
    date: formatDate(twoDaysAgo),
    startTime: '10:00',
    endTime: '11:00',
    client: clients[0],
    service: services[0],
    professional: professionals[0],
    status: 'Completada',
  },
  {
    id: 'a11',
    date: formatDate(twoDaysAgo),
    startTime: '12:00',
    endTime: '12:30',
    client: clients[4],
    service: services[1],
    professional: professionals[1],
    status: 'Cancelada',
  }
];

export const promotions: Promotion[] = [
    { id: 1, title: "Pack Relax Total", description: "Masaje de espalda + Limpieza facial", image: "https://picsum.photos/seed/promo1/100/100", originalPrice: 115, promoPrice: 90, isActive: true },
    { id: 2, title: "Manos y Pies Perfectos", description: "Manicura y pedicura completas", image: "https://picsum.photos/seed/promo2/100/100", originalPrice: 70, promoPrice: 55, isActive: true },
    { id: 3, title: "Mirada de Impacto", description: "Depilación de cejas y lifting de pestañas", image: "https://picsum.photos/seed/promo3/100/100", originalPrice: 52, promoPrice: 40, isActive: false },
];

export const sentNotifications: SentNotification[] = [];

export const automaticNotificationSettings: AutomaticNotificationSetting[] = [
    {
        id: 1,
        title: "Confirmación de Reserva",
        description: "Enviar un aviso al cliente en cuanto se crea una nueva cita.",
        enabled: true,
    },
    {
        id: 2,
        title: "Recordatorio de Cita (24h antes)",
        description: "Enviar un recordatorio el día antes de la cita para reducir ausencias.",
        enabled: true,
    },
    {
        id: 3,
        title: "Aviso de Modificación / Cancelación",
        description: "Notificar al cliente si su cita es modificada o cancelada por el centro.",
        enabled: false,
    }
];