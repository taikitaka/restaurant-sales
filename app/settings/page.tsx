'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { settings, saveSettings } = useApp();
  const [name, setName] = useState(settings.restaurantName);
  const [dailyTarget, setDailyTarget] = useState(settings.targetDailyRevenue.toString());
  const [monthlyTarget, setMonthlyTarget] = useState(settings.targetMonthlyRevenue.toString());
  const [seats, setSeats] = useState(settings.totalSeats.toString());
  const [open, setOpen] = useState(settings.openTime);
  const [close, setClose] = useState(settings.closeTime);

  async function handleSave() {
    await saveSettings({ restaurantName: name, targetDailyRevenue: Number(dailyTarget), targetMonthlyRevenue: Number(monthlyTarget), totalSeats: Number(seats), openTime: open, closeTime: close });
    toast.success('設定を保存しました');
  }

  return (
    <div className="min-h-screen">
      <div className="bg-slate-800 px-4 pt-12 pb-6 border-b border-slate-700">
        <h1 className="text-2xl font-bold text-white">設定 ⚙️</h1>
      </div>
      <div className="px-4 py-4 space-y-4">
        <div className="bg-slate-800 rounded-2xl p-4 space-y-4">
          <h2 className="font-bold text-white">店舗情報</h2>
          <div>
            <label className="text-sm text-slate-400">店舗名</label>
            <input value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-sm text-slate-400">営業開始</label>
              <input type="time" value={open} onChange={e => setOpen(e.target.value)} className="mt-1 w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="flex-1">
              <label className="text-sm text-slate-400">営業終了</label>
              <input type="time" value={close} onChange={e => setClose(e.target.value)} className="mt-1 w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-400">席数</label>
            <input type="number" value={seats} onChange={e => setSeats(e.target.value)} className="mt-1 w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <div className="bg-slate-800 rounded-2xl p-4 space-y-4">
          <h2 className="font-bold text-white">売上目標</h2>
          <div>
            <label className="text-sm text-slate-400">1日の目標売上 (¥)</label>
            <input type="number" value={dailyTarget} onChange={e => setDailyTarget(e.target.value)} className="mt-1 w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-lg font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="text-sm text-slate-400">月間の目標売上 (¥)</label>
            <input type="number" value={monthlyTarget} onChange={e => setMonthlyTarget(e.target.value)} className="mt-1 w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-lg font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <button onClick={handleSave} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-2xl text-lg transition-colors">
          保存する
        </button>
      </div>
    </div>
  );
}
