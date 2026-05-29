'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { SalesRecord, MenuItem, SalesItem, Reservation, Settings } from './types';
import { supabase } from './supabase';

type AppContextValue = {
  sales: SalesRecord[];
  menuItems: MenuItem[];
  salesItems: SalesItem[];
  reservations: Reservation[];
  settings: Settings;
  loading: boolean;
  addSales: (s: Omit<SalesRecord, 'id'>) => Promise<void>;
  updateSales: (s: SalesRecord) => Promise<void>;
  deleteSales: (id: string) => Promise<void>;
  addMenuItem: (m: Omit<MenuItem, 'id'>) => Promise<void>;
  updateMenuItem: (m: MenuItem) => Promise<void>;
  deleteMenuItem: (id: string) => Promise<void>;
  addSalesItem: (s: Omit<SalesItem, 'id'>) => Promise<void>;
  deleteSalesItem: (id: string) => Promise<void>;
  addReservation: (r: Omit<Reservation, 'id'>) => Promise<void>;
  updateReservation: (r: Reservation) => Promise<void>;
  deleteReservation: (id: string) => Promise<void>;
  saveSettings: (s: Settings) => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

const DEFAULT_SETTINGS: Settings = {
  targetDailyRevenue: 100000,
  targetMonthlyRevenue: 2500000,
  totalSeats: 30,
  openTime: '11:00',
  closeTime: '22:00',
  restaurantName: '私のお店',
};

export function AppProvider({ children }: { children: ReactNode }) {
  const [sales, setSales] = useState<SalesRecord[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [salesItems, setSalesItems] = useState<SalesItem[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  async function load() {
    const [{ data: sd }, { data: md }, { data: sid }, { data: rd }, { data: std }] = await Promise.all([
      supabase.from('sales').select('*').order('date', { ascending: false }),
      supabase.from('menu_items').select('*').order('category'),
      supabase.from('sales_items').select('*').order('date', { ascending: false }),
      supabase.from('reservations').select('*').order('date').order('time'),
      supabase.from('settings').select('*').limit(1),
    ]);
    if (sd) setSales(sd.map(r => ({ id: r.id, date: r.date, period: r.period, revenue: Number(r.revenue), customers: Number(r.customers), note: r.note })));
    if (md) setMenuItems(md.map(r => ({ id: r.id, name: r.name, category: r.category, price: Number(r.price), isActive: r.is_active })));
    if (sid) setSalesItems(sid.map(r => ({ id: r.id, date: r.date, menuItemId: r.menu_item_id, menuItemName: r.menu_item_name, quantity: Number(r.quantity), revenue: Number(r.revenue) })));
    if (rd) setReservations(rd.map(r => ({ id: r.id, date: r.date, time: r.time, name: r.name, guests: Number(r.guests), tableNo: r.table_no, status: r.status, note: r.note, phone: r.phone })));
    if (std && std.length > 0) {
      const s = std[0];
      setSettings({ targetDailyRevenue: Number(s.target_daily_revenue), targetMonthlyRevenue: Number(s.target_monthly_revenue), totalSeats: Number(s.total_seats), openTime: s.open_time, closeTime: s.close_time, restaurantName: s.restaurant_name });
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    const ch = supabase.channel('rs-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales_items' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  return (
    <AppContext.Provider value={{
      sales, menuItems, salesItems, reservations, settings, loading,
      async addSales(data) {
        const id = Date.now().toString();
        setSales(p => [{ ...data, id }, ...p]);
        await supabase.from('sales').insert({ id, date: data.date, period: data.period, revenue: data.revenue, customers: data.customers, note: data.note ?? null });
      },
      async updateSales(s) {
        setSales(p => p.map(x => x.id === s.id ? s : x));
        await supabase.from('sales').update({ date: s.date, period: s.period, revenue: s.revenue, customers: s.customers, note: s.note ?? null }).eq('id', s.id);
      },
      async deleteSales(id) {
        setSales(p => p.filter(x => x.id !== id));
        await supabase.from('sales').delete().eq('id', id);
      },
      async addMenuItem(data) {
        const id = Date.now().toString();
        setMenuItems(p => [...p, { ...data, id }]);
        await supabase.from('menu_items').insert({ id, name: data.name, category: data.category, price: data.price, is_active: data.isActive });
      },
      async updateMenuItem(m) {
        setMenuItems(p => p.map(x => x.id === m.id ? m : x));
        await supabase.from('menu_items').update({ name: m.name, category: m.category, price: m.price, is_active: m.isActive }).eq('id', m.id);
      },
      async deleteMenuItem(id) {
        setMenuItems(p => p.filter(x => x.id !== id));
        await supabase.from('menu_items').delete().eq('id', id);
      },
      async addSalesItem(data) {
        const id = Date.now().toString();
        setSalesItems(p => [{ ...data, id }, ...p]);
        await supabase.from('sales_items').insert({ id, date: data.date, menu_item_id: data.menuItemId, menu_item_name: data.menuItemName, quantity: data.quantity, revenue: data.revenue });
      },
      async deleteSalesItem(id) {
        setSalesItems(p => p.filter(x => x.id !== id));
        await supabase.from('sales_items').delete().eq('id', id);
      },
      async addReservation(data) {
        const id = Date.now().toString();
        setReservations(p => [...p, { ...data, id }].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)));
        await supabase.from('reservations').insert({ id, date: data.date, time: data.time, name: data.name, guests: data.guests, table_no: data.tableNo ?? null, status: data.status, note: data.note ?? null, phone: data.phone ?? null });
      },
      async updateReservation(r) {
        setReservations(p => p.map(x => x.id === r.id ? r : x));
        await supabase.from('reservations').update({ date: r.date, time: r.time, name: r.name, guests: r.guests, table_no: r.tableNo ?? null, status: r.status, note: r.note ?? null, phone: r.phone ?? null }).eq('id', r.id);
      },
      async deleteReservation(id) {
        setReservations(p => p.filter(x => x.id !== id));
        await supabase.from('reservations').delete().eq('id', id);
      },
      async saveSettings(s) {
        setSettings(s);
        const existing = await supabase.from('settings').select('id').limit(1);
        if (existing.data && existing.data.length > 0) {
          await supabase.from('settings').update({ target_daily_revenue: s.targetDailyRevenue, target_monthly_revenue: s.targetMonthlyRevenue, total_seats: s.totalSeats, open_time: s.openTime, close_time: s.closeTime, restaurant_name: s.restaurantName }).eq('id', existing.data[0].id);
        } else {
          await supabase.from('settings').insert({ id: '1', target_daily_revenue: s.targetDailyRevenue, target_monthly_revenue: s.targetMonthlyRevenue, total_seats: s.totalSeats, open_time: s.openTime, close_time: s.closeTime, restaurant_name: s.restaurantName });
        }
      },
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('Must be inside AppProvider');
  return ctx;
}
