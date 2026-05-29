'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context';
import { SalesModal } from '@/components/SalesModal';
import { PERIODS } from '@/lib/types';
import type { SalesRecord } from '@/lib/types';

export default function SalesPage() {
  const { sales, salesItems, menuItems, addSalesItem, deleteSalesItem } = useApp();
  const [selected, setSelected] = useState<SalesRecord | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [activeDate, setActiveDate] = useState(new Date().toISOString().slice(0, 10));
  const [showItemInput, setShowItemInput] = useState(false);
  const [selectedMenuId, setSelectedMenuId] = useState('');
  const [itemQty, setItemQty] = useState('1');

  const dateSales = sales.filter(s => s.date === activeDate);
  const dayRevenue = dateSales.reduce((a, b) => a + b.revenue, 0);
  const dayCustomers = dateSales.reduce((a, b) => a + b.customers, 0);

  const dateItems = salesItems.filter(s => s.date === activeDate);
  const activeMenuItems = menuItems.filter(m => m.isActive);

  async function handleAddItem() {
    const menu = menuItems.find(m => m.id === selectedMenuId);
    if (!menu) return;
    await addSalesItem({ date: activeDate, menuItemId: menu.id, menuItemName: menu.name, quantity: Number(itemQty) || 1, revenue: menu.price * (Number(itemQty) || 1) });
    setItemQty('1');
    setShowItemInput(false);
  }

  const last7days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - i * 86400000);
    return d.toISOString().slice(0, 10);
  });

  return (
    <div className="min-h-screen">
      <div className="bg-slate-800 px-4 pt-12 pb-4 border-b border-slate-700">
        <h1 className="text-2xl font-bold text-white">売上管理 💴</h1>
        {/* 日付セレクター */}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {last7days.map(d => {
            const label = d === new Date().toISOString().slice(0, 10) ? '今日' : d.slice(5).replace('-', '/');
            const rev = sales.filter(s => s.date === d).reduce((a, b) => a + b.revenue, 0);
            return (
              <button key={d} onClick={() => setActiveDate(d)} className={`flex flex-col items-center min-w-[56px] py-2 px-2 rounded-xl transition-colors ${activeDate === d ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                <span className="text-xs font-bold">{label}</span>
                <span className="text-xs mt-0.5 opacity-70">{rev > 0 ? `¥${(rev / 1000).toFixed(0)}k` : '-'}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* 日次サマリー */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-800 rounded-2xl p-3 text-center col-span-1">
            <p className="text-slate-400 text-xs">売上</p>
            <p className="text-lg font-bold text-white">¥{(dayRevenue / 1000).toFixed(0)}k</p>
          </div>
          <div className="bg-slate-800 rounded-2xl p-3 text-center">
            <p className="text-slate-400 text-xs">客数</p>
            <p className="text-lg font-bold text-white">{dayCustomers}人</p>
          </div>
          <div className="bg-slate-800 rounded-2xl p-3 text-center">
            <p className="text-slate-400 text-xs">客単価</p>
            <p className="text-lg font-bold text-white">{dayCustomers > 0 ? `¥${Math.round(dayRevenue / dayCustomers).toLocaleString()}` : '-'}</p>
          </div>
        </div>

        {/* 売上一覧 */}
        <div className="bg-slate-800 rounded-2xl p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-white">売上記録</h2>
            <button onClick={() => setShowAdd(true)} className="bg-indigo-600 text-white text-sm px-3 py-1.5 rounded-xl">+ 追加</button>
          </div>
          {dateSales.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-4">この日の売上記録なし</p>
          ) : (
            <div className="space-y-2">
              {dateSales.map(s => (
                <div key={s.id} onClick={() => setSelected(s)} className="flex items-center gap-3 p-3 bg-slate-700 rounded-xl cursor-pointer">
                  <span className="text-xs bg-slate-600 text-slate-300 px-2 py-0.5 rounded-lg">{PERIODS[s.period]}</span>
                  <span className="text-white font-bold flex-1">¥{s.revenue.toLocaleString()}</span>
                  <span className="text-slate-400 text-sm">{s.customers}人</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* メニュー別販売数 */}
        <div className="bg-slate-800 rounded-2xl p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-white">メニュー別販売数</h2>
            <button onClick={() => setShowItemInput(!showItemInput)} className="bg-slate-700 text-slate-300 text-sm px-3 py-1.5 rounded-xl">+ 追加</button>
          </div>

          {showItemInput && (
            <div className="mb-3 p-3 bg-slate-700 rounded-xl space-y-2">
              <select value={selectedMenuId} onChange={e => setSelectedMenuId(e.target.value)} className="w-full bg-slate-600 text-white rounded-lg px-3 py-2 text-sm">
                <option value="">メニューを選択</option>
                {activeMenuItems.map(m => <option key={m.id} value={m.id}>{m.name} ¥{m.price}</option>)}
              </select>
              <div className="flex gap-2">
                <input type="number" value={itemQty} onChange={e => setItemQty(e.target.value)} min="1" className="w-20 bg-slate-600 text-white rounded-lg px-3 py-2 text-sm" />
                <button onClick={handleAddItem} disabled={!selectedMenuId} className="flex-1 bg-indigo-600 disabled:opacity-40 text-white rounded-lg py-2 text-sm font-bold">記録</button>
              </div>
            </div>
          )}

          {dateItems.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-4">記録なし</p>
          ) : (
            <div className="space-y-2">
              {Object.values(dateItems.reduce((acc, si) => {
                if (!acc[si.menuItemId]) acc[si.menuItemId] = { id: si.id, name: si.menuItemName, qty: 0, rev: 0 };
                acc[si.menuItemId].qty += si.quantity;
                acc[si.menuItemId].rev += si.revenue;
                return acc;
              }, {} as Record<string, { id: string; name: string; qty: number; rev: number }>))
                .sort((a, b) => b.qty - a.qty)
                .map(item => (
                  <div key={item.name} className="flex items-center gap-3 p-2 bg-slate-700 rounded-xl">
                    <span className="text-white text-sm flex-1">{item.name}</span>
                    <span className="text-indigo-400 font-bold text-sm">{item.qty}件</span>
                    <span className="text-slate-400 text-xs">¥{item.rev.toLocaleString()}</span>
                  </div>
                ))
              }
            </div>
          )}
        </div>
      </div>

      {selected && <SalesModal sales={selected} onClose={() => setSelected(null)} />}
      {showAdd && <SalesModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
