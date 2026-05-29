'use client';

import { useState } from 'react';
import type { SalesRecord } from '@/lib/types';
import { PERIODS } from '@/lib/types';
import { useApp } from '@/lib/context';
import { toast } from 'sonner';

type Props = { sales?: SalesRecord; onClose: () => void };

export function SalesModal({ sales, onClose }: Props) {
  const { addSales, updateSales, deleteSales } = useApp();
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(sales?.date ?? today);
  const [period, setPeriod] = useState<SalesRecord['period']>(sales?.period ?? 'lunch');
  const [revenue, setRevenue] = useState(sales?.revenue.toString() ?? '');
  const [customers, setCustomers] = useState(sales?.customers.toString() ?? '');
  const [note, setNote] = useState(sales?.note ?? '');

  async function handleSave() {
    if (!revenue) return toast.error('売上を入力してください');
    const data = { date, period, revenue: Number(revenue), customers: Number(customers) || 0, note: note || undefined };
    if (sales) {
      await updateSales({ ...sales, ...data });
      toast.success('更新しました');
    } else {
      await addSales(data);
      toast.success('売上を記録しました');
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={onClose}>
      <div className="bg-slate-800 w-full max-w-lg mx-auto rounded-t-3xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto" />
        <h2 className="text-lg font-bold text-white text-center">{sales ? '売上を編集' : '売上を記録'}</h2>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-sm text-slate-400">日付</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex-1">
            <label className="text-sm text-slate-400">時間帯</label>
            <div className="mt-1 flex gap-1">
              {(Object.keys(PERIODS) as SalesRecord['period'][]).map(p => (
                <button key={p} onClick={() => setPeriod(p)} className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${period === p ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                  {PERIODS[p]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-sm text-slate-400">売上 (¥) *</label>
            <input type="number" value={revenue} onChange={e => setRevenue(e.target.value)} placeholder="50000" className="mt-1 w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-lg font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex-1">
            <label className="text-sm text-slate-400">客数</label>
            <input type="number" value={customers} onChange={e => setCustomers(e.target.value)} placeholder="20" className="mt-1 w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-lg font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <div>
          <label className="text-sm text-slate-400">メモ（任意）</label>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="特記事項..." className="mt-1 w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
        </div>

        <button onClick={handleSave} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-2xl text-lg transition-colors">
          {sales ? '更新する' : '記録する'}
        </button>
        {sales && (
          <button onClick={async () => { await deleteSales(sales.id); toast.success('削除しました'); onClose(); }} className="w-full text-red-400 text-sm py-2">
            削除する
          </button>
        )}
      </div>
    </div>
  );
}
