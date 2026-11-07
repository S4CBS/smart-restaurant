export type TableShape = 'round' | 'square' | 'rect' | 'oval';

export interface MockTable {
  id: string;
  zoneId: string;
  number: string;
  seats: number;
  shape: TableShape;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  isReservable: boolean;
  minSeats?: number;
  chairSides?: 'all' | 'top' | 'bottom' | 'left' | 'right' | 'none';
}

export type DecorType =
  | 'bar'
  | 'door'
  | 'pillar'
  | 'stage'
  | 'partition'
  | 'sofa'
  | 'bench'
  | 'counter'
  | 'stove'
  | 'sink'
  | 'fridge'
  | 'wc'
  | 'basin'
  | 'plant'
  | 'chair';

export interface MockDecor {
  id: string;
  type: DecorType;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation?: number;
}

export interface MockZone {
  id: string;
  floorId: string;
  name: string;
  type: 'main' | 'veranda' | 'vip' | 'service';
  color: string;
  polygon: { x: number; y: number }[];
  isActive: boolean;
  isReservable: boolean;
  tables: MockTable[];
  decors?: MockDecor[];
}

export interface WallSeg {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface MockFloor {
  id: string;
  number: number;
  name: string;
  zones: MockZone[];
  labels?: { id: string; x: number; y: number; text: string }[];
  walls?: WallSeg[];
  windows?: WallSeg[];
}

export type ReservationStatus = 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';
export type OccasionType = 'none' | 'birthday' | 'date' | 'business' | 'anniversary';

export interface MockReservation {
  id: string;
  tableId: string;
  tableNumber: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  guestsCount: number;
  status: ReservationStatus;
  occasion?: OccasionType;
  specialRequests?: string;
  notes?: string;
}

const HALL: MockZone = {
  id: 'zone-main',
  floorId: 'floor-1',
  name: 'Основной зал',
  type: 'main',
  color: '#FDFBF6',
  polygon: [
    { x: 60, y: 200 },
    { x: 900, y: 200 },
    { x: 900, y: 520 },
    { x: 60, y: 520 },
  ],
  isActive: true,
  isReservable: true,
  tables: [
    { id: 't-1', zoneId: 'zone-main', number: '1', seats: 2, shape: 'oval', x: 222, y: 245, w: 56, h: 74, rotation: 0, isReservable: true, minSeats: 1 },
    { id: 't-2', zoneId: 'zone-main', number: '2', seats: 2, shape: 'oval', x: 352, y: 245, w: 56, h: 74, rotation: 0, isReservable: true, minSeats: 1 },
    { id: 't-3', zoneId: 'zone-main', number: '3', seats: 4, shape: 'rect', x: 467, y: 245, w: 86, h: 86, rotation: 0, isReservable: true, minSeats: 2 },
    { id: 't-4', zoneId: 'zone-main', number: '4', seats: 6, shape: 'rect', x: 584, y: 245, w: 112, h: 94, rotation: 0, isReservable: true, minSeats: 3 },
    { id: 't-5', zoneId: 'zone-main', number: '5', seats: 4, shape: 'round', x: 147, y: 395, w: 86, h: 86, rotation: 0, isReservable: true, minSeats: 2 },
    { id: 't-6', zoneId: 'zone-main', number: '6', seats: 4, shape: 'round', x: 287, y: 395, w: 86, h: 86, rotation: 0, isReservable: true, minSeats: 2 },
    { id: 't-7', zoneId: 'zone-main', number: '7', seats: 2, shape: 'oval', x: 443, y: 395, w: 54, h: 74, rotation: 0, isReservable: true, minSeats: 1 },
    { id: 't-8', zoneId: 'zone-main', number: '8', seats: 6, shape: 'rect', x: 565, y: 395, w: 118, h: 84, rotation: 0, isReservable: true, minSeats: 3 },
    { id: 't-11', zoneId: 'zone-main', number: '11', seats: 4, shape: 'rect', x: 788, y: 230, w: 86, h: 76, rotation: 0, isReservable: true, minSeats: 2, chairSides: 'left' },
    { id: 't-15', zoneId: 'zone-main', number: '15', seats: 8, shape: 'oval', x: 720, y: 400, w: 140, h: 84, rotation: 0, isReservable: true, minSeats: 4 },
  ],
  decors: [
    { id: 'sofa-l-h', type: 'sofa', label: 'Диван', x: 62, y: 204, w: 96, h: 28 },
    { id: 'sofa-l-v', type: 'sofa', label: 'Диван', x: 62, y: 204, w: 28, h: 118 },
    { id: 'sofa-r-h', type: 'sofa', label: 'Диван', x: 802, y: 204, w: 96, h: 28 },
    { id: 'sofa-r-v', type: 'sofa', label: 'Диван', x: 870, y: 204, w: 28, h: 118 },
    { id: 'bar-pass', type: 'counter', label: 'Раздача', x: 470, y: 152, w: 250, h: 46 },
    { id: 'door-entry', type: 'door', label: 'Вход', x: 400, y: 70, w: 52, h: 52, rotation: 0 },
    { id: 'door-main-1', type: 'door', label: 'Дверь', x: 640, y: 520, w: 40, h: 40, rotation: 180 },
    { id: 'door-main-2', type: 'door', label: 'Дверь', x: 680, y: 520, w: 40, h: 40, rotation: 180 },
    { id: 'plant-1', type: 'plant', label: 'Растение', x: 860, y: 350, w: 30, h: 30 },
    { id: 'plant-2', type: 'plant', label: 'Растение', x: 70, y: 330, w: 30, h: 30 },
  ],
};

const KITCHEN: MockZone = {
  id: 'zone-kitchen',
  floorId: 'floor-1',
  name: 'Кухня',
  type: 'service',
  color: '#F4F1EA',
  polygon: [
    { x: 470, y: 70 },
    { x: 830, y: 70 },
    { x: 830, y: 200 },
    { x: 470, y: 200 },
  ],
  isActive: true,
  isReservable: false,
  tables: [],
  decors: [
    { id: 'kit-fridge', type: 'fridge', label: 'Холодильник', x: 480, y: 82, w: 62, h: 58 },
    { id: 'kit-sink', type: 'sink', label: 'Мойка', x: 556, y: 84, w: 84, h: 54 },
    { id: 'kit-counter', type: 'counter', label: 'Стол', x: 654, y: 84, w: 76, h: 54 },
    { id: 'kit-stove', type: 'stove', label: 'Плита', x: 736, y: 82, w: 82, h: 58 },
    { id: 'kit-line', type: 'counter', label: 'Линия раздачи', x: 480, y: 156, w: 210, h: 34 },
  ],
};

const WC: MockZone = {
  id: 'zone-wc',
  floorId: 'floor-1',
  name: 'Санузлы',
  type: 'service',
  color: '#F4F1EA',
  polygon: [
    { x: 170, y: 70 },
    { x: 380, y: 70 },
    { x: 380, y: 200 },
    { x: 170, y: 200 },
  ],
  isActive: true,
  isReservable: false,
  tables: [],
  decors: [
    { id: 'wc-1', type: 'wc', label: 'WC', x: 192, y: 86, w: 50, h: 66 },
    { id: 'wc-2', type: 'wc', label: 'WC', x: 300, y: 86, w: 50, h: 66 },
    { id: 'basin-1', type: 'basin', label: 'Раковина', x: 246, y: 160, w: 46, h: 28 },
    { id: 'basin-2', type: 'basin', label: 'Раковина', x: 246, y: 128, w: 46, h: 28 },
  ],
};

const ENTRY: MockZone = {
  id: 'zone-entry',
  floorId: 'floor-1',
  name: 'Вход',
  type: 'service',
  color: '#F4F1EA',
  polygon: [
    { x: 380, y: 70 },
    { x: 470, y: 70 },
    { x: 470, y: 200 },
    { x: 380, y: 200 },
  ],
  isActive: true,
  isReservable: false,
  tables: [],
};

export const INITIAL_FLOORS: MockFloor[] = [
  {
    id: 'floor-1',
    number: 1,
    name: '1 этаж — Основной зал',
    zones: [HALL, KITCHEN, WC, ENTRY],
    walls: [
      // hall
      { x1: 60, y1: 200, x2: 170, y2: 200 },
      { x1: 60, y1: 200, x2: 60, y2: 520 },
      { x1: 60, y1: 520, x2: 176, y2: 520 },
      { x1: 360, y1: 520, x2: 600, y2: 520 },
      { x1: 680, y1: 520, x2: 900, y2: 520 },
      { x1: 900, y1: 200, x2: 900, y2: 520 },
      { x1: 830, y1: 200, x2: 900, y2: 200 },
      { x1: 380, y1: 200, x2: 470, y2: 200 },
      // перегородки санузлов
      { x1: 170, y1: 200, x2: 200, y2: 200 },
      { x1: 250, y1: 200, x2: 300, y2: 200 },
      { x1: 350, y1: 200, x2: 380, y2: 200 },
      // стена кухни
      { x1: 470, y1: 200, x2: 830, y2: 200 },
      // service block
      { x1: 170, y1: 70, x2: 170, y2: 200 },
      { x1: 170, y1: 70, x2: 380, y2: 70 },
      { x1: 380, y1: 70, x2: 380, y2: 200 },
      { x1: 380, y1: 70, x2: 400, y2: 70 },
      { x1: 452, y1: 70, x2: 470, y2: 70 },
      { x1: 470, y1: 70, x2: 470, y2: 128 },
      { x1: 470, y1: 176, x2: 470, y2: 200 },
      { x1: 470, y1: 70, x2: 830, y2: 70 },
      { x1: 830, y1: 70, x2: 830, y2: 200 },
    ],
    windows: [
      { x1: 176, y1: 520, x2: 360, y2: 520 },
      { x1: 680, y1: 520, x2: 812, y2: 520 },
    ],
  },
  {
    id: 'floor-2',
    number: 2,
    name: '2 этаж — VIP-зал',
    zones: [
      {
        id: 'zone-vip',
        floorId: 'floor-2',
        name: 'VIP-зал',
        type: 'vip',
        color: '#FDFBF6',
        polygon: [
          { x: 200, y: 120 },
          { x: 760, y: 120 },
          { x: 760, y: 460 },
          { x: 200, y: 460 },
        ],
        isActive: true,
        isReservable: true,
        decors: [
          { id: 'vip-bar', type: 'counter', label: 'Бар', x: 220, y: 134, w: 220, h: 40 },
          { id: 'vip-sofa', type: 'sofa', label: 'Диван', x: 600, y: 132, w: 140, h: 26 },
        ],
        tables: [
          { id: 't-vip-1', zoneId: 'zone-vip', number: 'VIP-1', seats: 6, shape: 'oval', x: 240, y: 210, w: 140, h: 88, rotation: 0, isReservable: true, minSeats: 3 },
          { id: 't-vip-2', zoneId: 'zone-vip', number: 'VIP-2', seats: 8, shape: 'rect', x: 430, y: 206, w: 160, h: 94, rotation: 0, isReservable: true, minSeats: 4 },
          { id: 't-vip-3', zoneId: 'zone-vip', number: 'VIP-3', seats: 10, shape: 'rect', x: 430, y: 340, w: 180, h: 96, rotation: 0, isReservable: true, minSeats: 5 },
          { id: 't-vip-4', zoneId: 'zone-vip', number: 'VIP-4', seats: 4, shape: 'round', x: 260, y: 350, w: 90, h: 90, rotation: 0, isReservable: true, minSeats: 2 },
          { id: 't-vip-5', zoneId: 'zone-vip', number: 'VIP-5', seats: 4, shape: 'round', x: 660, y: 180, w: 84, h: 84, rotation: 0, isReservable: true, minSeats: 2 },
        ],
      },
    ],
    walls: [
      { x1: 200, y1: 120, x2: 760, y2: 120 },
      { x1: 200, y1: 120, x2: 200, y2: 460 },
      { x1: 200, y1: 460, x2: 470, y2: 460 },
      { x1: 540, y1: 460, x2: 760, y2: 460 },
      { x1: 760, y1: 120, x2: 760, y2: 460 },
    ],
    windows: [{ x1: 470, y1: 460, x2: 540, y2: 460 }],
  },
];

export const INITIAL_RESERVATIONS: MockReservation[] = [
  {
    id: 'res-1',
    tableId: 't-2',
    tableNumber: '2',
    guestName: 'Михаил Соколов',
    guestPhone: '+7 (916) 123-45-67',
    guestEmail: 'sokolov.m@gmail.com',
    startTime: '18:00',
    endTime: '20:00',
    guestsCount: 2,
    status: 'seated',
    occasion: 'date',
    specialRequests: 'Поставить свечи, романтическая музыка',
    notes: 'Постоянный гость, любит авторские вина',
  },
  {
    id: 'res-2',
    tableId: 't-4',
    tableNumber: '4',
    guestName: 'Екатерина Романова',
    guestPhone: '+7 (903) 987-65-43',
    guestEmail: 'romanova.e@yandex.ru',
    startTime: '19:00',
    endTime: '21:30',
    guestsCount: 5,
    status: 'confirmed',
    occasion: 'birthday',
    specialRequests: 'Поздравление от шеф-повара и десерт со свечой',
  },
  {
    id: 'res-3',
    tableId: 't-7',
    tableNumber: '7',
    guestName: 'Дмитрий Волков',
    guestPhone: '+7 (925) 444-22-11',
    startTime: '16:30',
    endTime: '18:00',
    guestsCount: 2,
    status: 'completed',
    occasion: 'business',
    specialRequests: 'Тихий столик для переговоров',
  },
  {
    id: 'res-4',
    tableId: 't-11',
    tableNumber: '11',
    guestName: 'Анна Кузнецова',
    guestPhone: '+7 (999) 777-88-99',
    guestEmail: 'kuznetsova@mail.ru',
    startTime: '20:00',
    endTime: '22:00',
    guestsCount: 4,
    status: 'confirmed',
    occasion: 'none',
    specialRequests: 'Нужен один детский стульчик',
  },
  {
    id: 'res-5',
    tableId: 't-8',
    tableNumber: '8',
    guestName: 'Алексей Панов',
    guestPhone: '+7 (905) 555-12-34',
    guestEmail: 'panov@it-restaurant.ru',
    startTime: '19:30',
    endTime: '22:30',
    guestsCount: 6,
    status: 'confirmed',
    occasion: 'anniversary',
    specialRequests: 'Широкая рассадка, праздничный сет',
  },
];
