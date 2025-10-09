import { AppSettings } from '../types';

export const initialSettings: AppSettings = {
  businessInfo: {
    salonName: 'BellezaSana',
    logoUrl: '', // Initially empty
    address: 'Calle Falsa 123, 28080 Madrid',
    phone: '910 123 456',
    email: 'contacto@bellezasana.com',
    currency: 'EUR',
    taxRate: 21,
    contactTitle: 'Contacto y Horario',
    contactSubtitle: 'Estamos aquí para ayudarte. ¡Contáctanos!',
    contactDescription: 'BellezaSana es tu santuario personal en el corazón de la ciudad, un lugar donde la belleza, el bienestar y la salud se encuentran. Nuestro equipo de profesionales altamente cualificados se dedica a ofrecerte una experiencia única y personalizada, utilizando los productos más innovadores y las técnicas más avanzadas. Creemos en realzar tu belleza natural y en proporcionarte un momento de paz y desconexión de la rutina diaria. Ven a conocernos y déjate cuidar.',
  },
  agenda: {
    businessHours: [
      { day: 'Lunes', isOpen: true, openTime: '09:00', closeTime: '13:30', openTime2: '15:00', closeTime2: '19:00' },
      { day: 'Martes', isOpen: true, openTime: '09:00', closeTime: '13:30', openTime2: '15:00', closeTime2: '19:00' },
      { day: 'Miércoles', isOpen: true, openTime: '09:00', closeTime: '13:30', openTime2: '15:00', closeTime2: '19:00' },
      { day: 'Jueves', isOpen: true, openTime: '09:00', closeTime: '13:30', openTime2: '15:00', closeTime2: '19:00' },
      { day: 'Viernes', isOpen: true, openTime: '09:00', closeTime: '13:30', openTime2: '15:00', closeTime2: '19:00' },
      { day: 'Sábado', isOpen: true, openTime: '10:00', closeTime: '14:00', openTime2: '', closeTime2: '' },
      { day: 'Domingo', isOpen: false, openTime: '09:00', closeTime: '18:00', openTime2: '', closeTime2: '' },
    ],
    defaultInterval: 30,
    minBookingNotice: 2, // 2 hours
  },
  appearance: {
    brandColor: 'pink',
    mode: 'light',
  },
  home: {
    headerImage: 'https://picsum.photos/seed/header/1200/400',
    headerTitle: 'Tu Belleza, Nuestra Pasión',
    headerSubtitle: 'Expertos en realzar tu belleza natural con tratamientos de vanguardia.',
    featuredServices: [1, 2, 4], // IDs for Limpieza facial, Manicura básica, Masaje de espalda
    footerSlogan: 'Tu oasis de bienestar y belleza.',
    footerCopyright: `© ${new Date().getFullYear()} BellezaSana. Todos los derechos reservados.`,
  }
};