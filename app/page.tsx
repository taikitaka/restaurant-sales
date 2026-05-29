'use client';

import { useApp } from '@/lib/context';
import Link from 'next/link';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

function StatCard({ label, value, sub, color = 'text-white' }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="bg-slate-800 rounded-2xl p-4">
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const { sales, reservations, salesItems, settings } = useApp();
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const thisMonth = today.slice(0, 7);

  const todaySales = sales.filter(s => s.date === today);
  const todayRevenue = todaySales.reduce((a, b) => a + b.revenue, 0);
  const todayCustomers = todaySales.reduce((a, b) => a + b.customers, 0);
  const avgSpend = todayCustomers > 0 ? Math.round(todayRevenue / todayCustomers) : 0;

  const yesterdayRevenue = sales.filter(s => s.date === yesterday).reduce((a, b) => a + b.revenue, 0);
  const diffPct = yesterdayRevenue > 0 ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100) : null;

  const monthRevenue = sales.filter(s => s.date.startsWith(thisMonth)).reduce((a, b) => a + b.revenue, 0);
  const monthProgress = settings.targetMonthlyRevenue > 0 ? (monthRevenue / settings.targetMonthlyRevenue) * 100 : 0;
  const dailyProgress = settings.targetDailyRevenue > 0 ? (todayRevenue / settings.targetDailyRevenue) * 100 : 0;

  const todayReservations = reservations.filter(r => r.date === today && r.status !== 'cancelled');
  const upcomingRes = todayReservations.filter(r => r.status === 'confirmed' || r.status === 'pending').sort((a, b) => a.time.localeCompare(b.time));
  const seatedRes = todayReservations.filter(r => r.status === 'seated');

  const todayItems = salesItems.filter(s => s.date === today);
  const itemRanking = Object.values(
    todayItems.reduce((acc, si) => {
      if (!acc[si.menuItemId]) acc[si.menuItemId] = { name: si.menuItemName, qty: 0, rev: 0 };
      acc[si.menuItemId].qty += si.quantity;
      acc[si.menuItemId].rev += si.revenue;
      return acc;
    }, {} as Record<string, { name: string; qty: number; rev: number }>)
  ).sort((a, b) => b.qty - a.qty).slice(0, 5);

  const dateLabel = format(new Date(), 'M月d日(E)', { locale: ja });

  return (
    <div className="min-h-screen">
      {/* ヘッダー */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 px-4 pt-12 pb-6 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm">{settings.restaurantName}</p>
            <h1 className="text-2xl font-bold text-white mt-0.5">{dateLabel}</h1>
          </div>
          <Link href="/settings" className="w-9 h-9 bg-slate-700 rounded-full flex items-center justify-center text-slate-300">
            ⚙️
          </Link>
        </div>

        {/* 目標達成バー */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>本日目標</span>
            <span>{Math.min(100, Math.round(dailyProgress))}% (¥{settings.targetDailyRevenue.toLocaleString()})</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, dailyProgress)}%`, background: dailyProgress >= 100 ? '#10b981' : dailyProgress >= 70 ? '#f59e0b' : '#6366f1' }} />
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* 今日のKPI */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800 rounded-2xl p-4 col-span-2">
            <p className="text-slate-400 text-xs mb-1">本日売上</p>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold text-white">¥{todayRevenue.toLocaleString()}</p>
              {diffPct !== null && (
                <p className={`text-sm font-bold mb-1 ${diffPct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {diffPct >= 0 ? '↑' : '↓'}{Math.abs(diffPct)}%
                </p>
              )}
            </div>
            <p className="text-slate-500 text-xs mt-1">前日: ¥{yesterdayRevenue.toLocaleString()}</p>
          </div>
          <StatCard label="本日客数" value={`${todayCustomers}人`} />
          <StatCard label="客単価" value={avgSpend > 0 ? `¥${avgSpend.toLocaleString()}` : '-'} />
        </div>

        {/* 今月進捗 */}
        <div className="bg-slate-800 rounded-2xl p-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-slate-400 text-sm">今月の売上</p>
            <p className="text-xs text-slate-500">目標 ¥{settings.targetMonthlyRevenue.toLocaleString()}</p>
          </div>
          <p className="text-xl font-bold text-white mb-2">¥{monthRevenue.toLocaleString()}</p>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, monthProgress)}%`, background: '#6366f1' }} />
          </div>
          <p className="text-xs text-slate-500 mt-1">{Math.round(monthProgress)}% 達成</p>
        </div>

        {/* 今日の予約状況 */}
        <div className="bg-slate-800 rounded-2xl p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-bold text-white">本日の予約 📅</h2>
            <Link href="/reservations" className="text-indigo-400 text-sm">すべて →</Link>
          </div>
          {seatedRes.length > 0 && (
            <div className="mb-2 flex gap-2 flex-wrap">
              {seatedRes.map(r => (
                <span key={r.id} className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded-lg">{r.time} {r.name} ({r.guests}名) 着席中</span>
              ))}
            </div>
          )}
          {upcomingRes.length === 0 ? (
            <p className="text-slate-500 text-sm">予約なし</p>
          ) : (
            <div className="space-y-2">
              {upcomingRes.slice(0, 4).map(r => (
                <div key={r.id} className="flex items-center gap-3">
                  <span className="text-indigo-400 font-mono text-sm w-12">{r.time}</span>
                  <span className="text-white text-sm flex-1">{r.name}</span>
                  <span className="text-slate-400 text-xs">{r.guests}名</span>
                  {r.tableNo && <span className="text-slate-500 text-xs">#{r.tableNo}</span>}
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-slate-500 mt-2">本日 {todayReservations.length}件</p>
        </div>

        {/* 本日の売れ筋 */}
        {itemRanking.length > 0 && (
          <div className="bg-slate-800 rounded-2xl p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-bold text-white">本日の売れ筋 🔥</h2>
              <Link href="/menu" className="text-indigo-400 text-sm">詳細 →</Link>
            </div>
            <div className="space-y-2">
              {itemRanking.map((item, i) => (
                <div key={item.name} className="flex items-center gap-3">
                  <span className={`text-sm font-bold w-5 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-slate-300' : 'text-amber-600'}`}>{i + 1}</span>
                  <span className="text-white text-sm flex-1">{item.name}</span>
                  <span className="text-indigo-400 text-sm font-bold">{item.qty}件</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* クイックアクション */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/sales" className="bg-indigo-600 rounded-2xl p-4 text-center active:scale-95 transition-transform">
            <p className="text-2xl">💴</p>
            <p className="font-bold text-white mt-1 text-sm">売上を入力</p>
          </Link>
          <Link href="/reservations" className="bg-slate-800 rounded-2xl p-4 text-center active:scale-95 transition-transform">
            <p className="text-2xl">📅</p>
            <p className="font-bold text-white mt-1 text-sm">予約を追加</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
