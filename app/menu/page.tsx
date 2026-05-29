'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context';
import { MenuItemModal } from '@/components/MenuItemModal';
import type { MenuItem } from '@/lib/types';

export default function MenuPage() {
  const { menuItems, salesItems } = useApp();
  const [selected, setSelected] = useState<MenuItem | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [filterCat, setFilterCat] = useState('すべて');

  const categories = ['すべて', ...Array.from(new Set(menuItems.map(m => m.category)))];
  const filtered = filterCat === 'すべて' ? menuItems : menuItems.filter(m => m.category === filterCat);

  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthItems = salesItems.filter(s => s.date.startsWith(thisMonth));

  const itemStats = menuItems.map(m => {
    const records = monthItems.filter(s => s.menuItemId === m.id);
    const qty = records.reduce((a, b) => a + b.quantity, 0);
    const rev = records.reduce((a, b) => a + b.revenue, 0);
    return { ...m, qty, rev };
  });

  const maxQty = Math.max(...itemStats.map(i => i.qty), 1);
  const ranked = [...itemStats].sort((a, b) => b.qty - a.qty);
  const slow = ranked.filter(i => i.qty === 0 && i.isActive);

  return (
    <div className="min-h-screen">
      <div className="bg-slate-800 px-4 pt-12 pb-4 border-b border-slate-700">
        <h1 className="text-2xl font-bold text-white">メニュー分析 🍽️</h1>
        <p className="text-slate-400 text-sm mt-1">今月の販売状況</p>
      </div>

      {/* 売れていないメニュー警告 */}
      {slow.length > 0 && (
        <div className="mx-4 mt-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3">
          <p className="text-amber-400 text-sm font-bold mb-1">⚠️ 今月売れていないメニュー</p>
          <p className="text-amber-300/70 text-xs">{slow.map(i => i.name).join('、')}</p>
        </div>
      )}

      {/* カテゴリフィルター */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto">
        {categories.map(c => (
          <button key={c} onClick={() => setFilterCat(c)} className={`px-3 py-1 rounded-full text-sm whitespace-nowrap border transition-colors ${filterCat === c ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-600 text-slate-400'}`}>
            {c}
          </button>
        ))}
      </div>

      <div className="px-4 space-y-2 pb-4">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            <p className="text-4xl mb-2">🍽️</p>
            <p>メニューがありません</p>
          </div>
        )}
        {filtered.map(m => {
          const stat = itemStats.find(i => i.id === m.id)!;
          const barWidth = maxQty > 0 ? (stat.qty / maxQty) * 100 : 0;
          return (
            <div key={m.id} onClick={() => setSelected(m)} className={`bg-slate-800 rounded-2xl p-4 cursor-pointer ${!m.isActive ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white truncate">{m.name}</p>
                    {!m.isActive && <span className="text-xs bg-slate-700 text-slate-400 px-1.5 rounded">停止中</span>}
                  </div>
                  <p className="text-slate-500 text-xs">{m.category} · ¥{m.price.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-indigo-400 font-bold">{stat.qty}件</p>
                  <p className="text-slate-500 text-xs">¥{stat.rev.toLocaleString()}</p>
                </div>
              </div>
              {stat.qty > 0 && (
                <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${barWidth}%` }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button onClick={() => setShowAdd(true)} className="fixed bottom-24 right-4 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg text-2xl flex items-center justify-center active:scale-90 transition-transform">
        +
      </button>

      {selected && <MenuItemModal item={selected} onClose={() => setSelected(null)} />}
      {showAdd && <MenuItemModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
