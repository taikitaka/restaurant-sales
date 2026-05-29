export type SalesRecord = {
  id: string;
  date: string;
  period: 'lunch' | 'dinner' | 'other';
  revenue: number;
  customers: number;
  note?: string;
};

export type MenuItem = {
  id: string;
  name: string;
  category: string;
  price: number;
  isActive: boolean;
};

export type SalesItem = {
  id: string;
  date: string;
  menuItemId: string;
  menuItemName: string;
  quantity: number;
  revenue: number;
};

export type Reservation = {
  id: string;
  date: string;
  time: string;
  name: string;
  guests: number;
  tableNo?: string;
  status: 'confirmed' | 'pending' | 'cancelled' | 'seated' | 'done';
  note?: string;
  phone?: string;
};

export type Settings = {
  targetDailyRevenue: number;
  targetMonthlyRevenue: number;
  totalSeats: number;
  openTime: string;
  closeTime: string;
  restaurantName: string;
};

export const PERIODS: Record<SalesRecord['period'], string> = {
  lunch: 'ランチ',
  dinner: 'ディナー',
  other: 'その他',
};

export const RESERVATION_STATUS: Record<Reservation['status'], string> = {
  confirmed: '予約確定',
  pending: '仮予約',
  cancelled: 'キャンセル',
  seated: '着席中',
  done: '会計済',
};

export const STATUS_COLORS: Record<Reservation['status'], string> = {
  confirmed: '#3b82f6',
  pending: '#f59e0b',
  cancelled: '#6b7280',
  seated: '#10b981',
  done: '#8b5cf6',
};
