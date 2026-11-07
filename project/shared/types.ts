/**
 * Общие типы данных и контракты для проекта «Умный ресторан»
 * Используются совместно клиентом и сервером.
 */

export type UserRole = 'guest' | 'constructor' | 'manager' | 'admin';

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  isBlocked: boolean;
  createdAt: string;
}

export type TableShape = 'round' | 'square' | 'rect';

export interface Table {
  id: string;
  zoneId: string;
  number: string;
  seats: number;
  shape: TableShape;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number; // 0 - 360 градусов
  isReservable: boolean;
}

export interface ZonePolygonPoint {
  x: number;
  y: number;
}

export interface Zone {
  id: string;
  floorId: string;
  name: string;
  type: string; // 'main' | 'veranda' | 'vip' | 'bar'
  description?: string;
  color: string;
  polygon: ZonePolygonPoint[];
  isActive: boolean;
  isReservable: boolean;
  sortOrder: number;
  tables: Table[];
}

export interface Floor {
  id: string;
  number: number;
  name: string;
  sortOrder: number;
  zones: Zone[];
}

export type ReservationStatus = 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface Reservation {
  id: string;
  tableId: string;
  userId: string;
  guestName: string;
  guestPhone: string;
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
  guestsCount: number;
  status: ReservationStatus;
  comment?: string;
  createdAt: string;
}

/** Снимок схемы для версионирования в LayoutRevision (JSONB) */
export interface LayoutSnapshot {
  floorId: string;
  revision: number;
  publishedAt: string;
  authorId: string;
  zones: Zone[];
}

/** Расчет доступности стола */
export type TableAvailabilityStatus = 'available' | 'occupied' | 'not_suitable' | 'disabled';

export interface TableWithAvailability extends Table {
  availability: TableAvailabilityStatus;
  currentReservation?: Reservation;
}
