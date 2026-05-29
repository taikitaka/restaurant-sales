'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function ReportsPage() {
  const { sales, salesItems, settings } = useApp();
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  const today = new Date();
  const thisMonth = today.toISOString().slice(0, 7);
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1).toISOString().slice(0, 7);

  // 週間データ
  const weekData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    const date = d.toISOString().slice(0, 10);
    const rev = sales.filter(s => s.date === date).reduce((a, b) => a + b.revenue, 0);
    const cust = sales.filter(s => s.date === date).reduce((a, b) => a + b.customers, 0);
    return { label: `${d.getMonth() + 1}/${d.getDate()}`, revenue: rev, customers: cust };
  });

  // 月間データ（過去6ヶ月）
  const monthData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (5 - i), 1);
    const month = d.toISOString().slice(0, 7);
    const rev = sales.filter(s => s.date.startsWith(month)).reduce((a, b) => a + b.revenue, 0);
    return { label: `${d.getMonth() + 1}月`, revenue: rev };
  });

  const chartData = period === 'week' ? weekData : monthData;

  const thisMonthRev = sales.filter(s => s.date.startsWith(thisMonth)).reduce((a, b) => a + b.revenue, 0);
  const lastMonthRev = sales.filter(s => s.date.startsWith(lastMonth)).reduce((a, b) => a + b.revenue, 0);
  const monthDiff = lastMonthRev > 0 ? Math.round(((thisMonthRev - lastMonthRev) / lastMonthRev) * 100) : null;

  const thisMonthCust = sales.filter(s => s.date.startsWith(thisMonth)).reduce((a, b) => a + b.customers, 0);
  const avgDaily = (() => {
    const days = new Set(sales.filter(s => s.date.startsWith(thisMonth)).map(s => s.date)).size;
    return days > 0 ? Math.round(thisMonthRev / days) : 0;
  })();

  // メニューABC分析（今月）
  const monthItems = salesItems.filter(s => s.date.startsWith(thisMonth));
  const itemRanking = Object.values(
    monthItems.reduce((acc, si) => {
      if (!acc[si.menuItemId]) acc[si.menuItemId] = { name: si.menuItemName, qty: 0, rev: 0 };
      acc[si.menuItemId].qty += si.quantity;
      acc[si.menuItemId].rev += si.revenue;
      return acc;
    }, {} as Record<string, { name: string; qty: number; rev: number }>)
  ).sort((a, b) => b.rev - a.rev);

  const totalItemRev = itemRanking.reduce((a, b) => a + b.rev, 0);
  let cumRev = 0;
  const abcRanking = itemRanking.map(item => {
    cumRev += item.rev;
    const cumPct = totalItemRev > 0 ? (cumRev / totalItemRev) * 100 : 0;
    return { ...item, grade: cumPct <= 70 ? 'A' : cumPct <= 90 ? 'B' : 'C' };
  });

  return (
    <div className="min-h-screen">
      <div className="bg-slate-800 px-4 pt-12 pb-4 border-b border-slate-700">
        <h1 className="text-2xl font-bold text-white">レポート 📈</h1>
        <p className="text-slate-400 text-sm mt-1">売上分析・トレンド</p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* 今月サマリー */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800 rounded-2xl p-4 col-span-2">
            <p className="text-slate-400 text-xs mb-1">今月売上</p>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-bold text-white">¥{thisMonthRev.toLocaleString()}</p>
              {monthDiff !== null && (
                <p className={`text-sm font-bold mb-1 ${monthDiff >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {monthDiff >= 0 ? '↑' : '↓'}{Math.abs(monthDiff)}% 前月比
                </p>
              )}
            </div>
            <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, settings.targetMonthlyRevenue > 0 ? (thisMonthRev / settings.targetMonthlyRevenue) * 100 : 0)}%` }} />
            </div>
            <p className="text-xs text-slate-500 mt-1">目標 ¥{settings.targetMonthlyRevenue.toLocaleString()}</p>
          </div>
          <div className="bg-slate-800 rounded-2xl p-4">
            <p className="text-slate-400 text-xs">今月客数</p>
            <p className="text-xl font-bold text-white">{thisMonthCust}人</p>
          </div>
          <div className="bg-slate-800 rounded-2xl p-4">
            <p className="text-slate-400 text-xs">1日平均</p>
            <p className="text-xl font-bold text-white">¥{(avgDaily / 1000).toFixed(1)}k</p>
          </div>
        </div>

        {/* グラフ */}
        <div className="bg-slate-800 rounded-2xl p-4">
          <div className="flex gap-2 mb-4">
            <button onClick={() => setPeriod('week')} className={`flex-1 py-1.5 rounded-xl text-sm font-bold transition-colors ${period === 'week' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400'}`}>週間</button>
            <button onClick={() => setPeriod('month')} className={`flex-1 py-1.5 rounded-xl text-sm font-bold transition-colors ${period === 'month' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400'}`}>月間</button>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }} formatter={(v) => [`¥${Number(v).toLocaleString()}`, '売上']} />
              <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* ABC分析 */}
        {abcRanking.length > 0 && (
          <div className="bg-slate-800 rounded-2xl p-4">
            <h2 className="font-bold text-white mb-1">メニューABC分析 今月</h2>
            <p className="text-slate-500 text-xs mb-3">A=売上上位70% / B=70〜90% / C=それ以下</p>
            <div className="space-y-2">
              {abcRanking.slice(0, 10).map(item => (
                <div key={item.name} className="flex items-center gap-3">
                  <span className={`text-xs font-bold w-5 ${item.grade === 'A' ? 'text-emerald-400' : item.grade === 'B' ? 'text-yellow-400' : 'text-slate-500'}`}>{item.grade}</span>
                  <span className="text-white text-sm flex-1 truncate">{item.name}</span>
                  <span className="text-slate-400 text-xs">{item.qty}件</span>
                  <span className="text-indigo-400 text-sm font-bold">¥{item.rev.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
