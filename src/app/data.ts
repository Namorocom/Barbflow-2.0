export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  icon: string;
  barberId?: string;
  imageUrl?: string;
}

export interface Barber {
  id: string;
  name: string;
  avatar: string;
  rating: number;
  reviewCount?: number;
  specialty: string;
  description?: string;
  gallery?: string[];
  locationName?: string;
  coordinates?: { lat: number, lng: number };
  availableTimes?: string[];
  availableDays?: number[];
  workingHours?: { start: string, end: string };
  blockedDates?: string[];
  isOnline?: boolean;
}

export interface Review {
  id: string;
  barberId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment?: string;
  appointmentId: string;
  createdAt: Date;
}

export interface Appointment {
  id: string;
  serviceId: string;
  barberId: string;
  userId: string;
  userName?: string;
  userPhone?: string;
  userAvatar?: string;
  barberAvatar?: string;
  date: Date;
  status: 'upcoming' | 'completed' | 'cancelled';
  rating?: number;
  review?: string;
  chatInitiated?: boolean;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'chat_started' | 'new_message' | 'appointment_created' | 'appointment_reminder' | 'system';
  relatedId?: string;
  read: boolean;
  createdAt: Date;
}

export const SERVICES: Service[] = [
  {
    id: 's1',
    name: 'Corte Clássico',
    description: 'Corte tradicional com tesoura e máquina, finalização com pomada.',
    price: 45,
    durationMinutes: 40,
    icon: 'content_cut'
  },
  {
    id: 's2',
    name: 'Barba Terapia',
    description: 'Aparar a barba com toalha quente, massagem facial e óleos essenciais.',
    price: 35,
    durationMinutes: 30,
    icon: 'face'
  },
  {
    id: 's3',
    name: 'Combo: Cabelo + Barba',
    description: 'O pacote completo para um visual impecável.',
    price: 70,
    durationMinutes: 60,
    icon: 'spa'
  },
  {
    id: 's4',
    name: 'Sobrancelha',
    description: 'Limpeza e alinhamento com navalha.',
    price: 15,
    durationMinutes: 15,
    icon: 'visibility'
  }
];

export const BARBERS: Barber[] = [
  {
    id: 'b1',
    name: 'Carlos Silva',
    avatar: 'https://picsum.photos/seed/barber1/200/200',
    rating: 4.9,
    reviewCount: 124,
    specialty: 'Especialista em Fade',
    description: 'Com mais de 10 anos de experiência, Carlos é referência em cortes modernos e fade perfeito. Atua com precisão, garantindo sempre um excelente acabamento e satisfação dos clientes.',
    gallery: [
      'https://picsum.photos/seed/cut1/600/600',
      'https://picsum.photos/seed/cut2/600/600',
      'https://picsum.photos/seed/cut3/600/600',
      'https://picsum.photos/seed/cut4/600/600'
    ]
  },
  {
    id: 'b2',
    name: 'Marcos Paulo',
    avatar: 'https://picsum.photos/seed/barber2/200/200',
    rating: 4.8,
    reviewCount: 98,
    specialty: 'Mestre das Tesouras',
    description: 'Especialista em cortes clássicos e tesoura. Marcos trás uma visão vintage para a barbearia, focando na elegância e nos detalhes para quem procura um visual mais tradicional.',
    gallery: [
      'https://picsum.photos/seed/cut5/600/600',
      'https://picsum.photos/seed/cut6/600/600',
      'https://picsum.photos/seed/cut7/600/600'
    ]
  },
  {
    id: 'b3',
    name: 'Diego Costa',
    avatar: 'https://picsum.photos/seed/barber3/200/200',
    rating: 4.7,
    reviewCount: 86,
    specialty: 'Barboterapia',
    description: 'A verdadeira experiência de relaxamento está com Diego. Especialista em barbas esculpidas, toalha quente e massagem facial para você se desligar dos problemas.',
    gallery: [
      'https://picsum.photos/seed/cut8/600/600',
      'https://picsum.photos/seed/cut9/600/600'
    ]
  }
];
