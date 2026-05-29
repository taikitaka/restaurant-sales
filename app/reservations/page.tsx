'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context';
import { ReservationModal } from '@/components/ReservationModal';
import { RESERVATION_STATUS, STATUS_COLORS } from '@/lib/types';
import type { Reservation } from '@/lib/types';

const HOURS = Array.from({ length: 13 }, (_, i) => i + 10);

export default function ReservationsPage() {
  const { reservations, settings, updateReservation } = useApp();
  const [selected, setSelected] = useState<Reservation | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [viewDate, setViewDate] = useState(new Date().toISOString().slice(0, 10));
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');

  const today = new Date().toISOString().slice(0, 10);
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() + (i - 1) * 86400000);
    return d.toISOString().slice(0, 10);
  });

  const dayReservations = reservations.filter(r => r.date === viewDate && r.status !== 'cancelled');

  async function quickStatus(r: Reservation, status: Reservation['status']) {
    await updateReservation({ ...r, status });
  }

  return (
    <div className="min-h-screen">
      <div className="bg-slate-800 px-4 pt-12 pb-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">予約管理 📅</h1>
          <div className="flex gap-1">
            <button onClick={() => setViewMode('timeline')} className={`px-3 py-1 rounded-lg text-xs font-bold ${viewMode === 'timeline' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}>タイムライン</button>
            <button onClick={() => setViewMode('list')} className={`px-3 py-1 rounded-lg text-xs font-bold ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}>リスト</button>
          </div>
        </div>
        {/* 日付ナビ */}
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {dates.map(d => {
            const cnt = reservations.filter(r => r.date === d && r.status !== 'cancelled').length;
            const isToday = d === today;
            return (
              <button key={d} onClick={() => setViewDate(d)} className={`flex flex-col items-center min-w-[52px] py-2 px-2 rounded-xl transition-colors ${viewDate === d ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                <span className="text-xs">{isToday ? '今日' : d.slice(5).replace('-', '/')}</span>
                <span className={`text-lg font-bold ${cnt > 0 ? '' : 'opacity-30'}`}>{cnt}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-4">
        {viewMode === 'timeline' ? (
          <div className="bg-slate-800 rounded-2xl p-4 overflow-x-auto">
            <div className="flex gap-1 min-w-max">
              {/* 時間軸 */}
              <div className="flex flex-col gap-0 pt-6 pr-2">
                {HOURS.map(h => (
                  <div key={h} className="h-12 flex items-start">
                    <span className="text-slate-500 text-xs w-8">{h}:00</span>
                  </div>
                ))}
              </div>
              {/* 予約ブロック */}
              <div className="relative flex-1" style={{ minWidth: '260px' }}>
                {/* 時間グリッド */}
                {HOURS.map(h => (
                  <div key={h} className="h-12 border-t border-slate-700/50" />
                ))}
                {/* 現在時刻ライン */}
                {viewDate === today && (() => {
                  const now = new Date();
                  const mins = (now.getHours() - 10) * 60 + now.getMinutes();
                  if (mins < 0 || mins > HOURS.length * 60) return null;
                  return <div className="absolute left-0 right-0 border-t-2 border-red-500 z-10" style={{ top: `${(mins / 60) * 48}px` }}><span className="bg-red-500 text-white text-xs px-1 rounded">NOW</span></div>;
                })()}
                {/* 予約カード */}
                {dayReservations.map(r => {
                  const [h, m] = r.time.split(':').map(Number);
                  const top = ((h - 10) * 60 + m) / 60 * 48;
                  const height = 44;
                  return (
                    <div key={r.id} onClick={() => setSelected(r)} className="absolute left-0 right-0 mx-1 rounded-lg px-2 py-1 cursor-pointer z-20 overflow-hidden" style={{ top: `${top}px`, height: `${height}px`, backgroundColor: `${STATUS_COLORS[r.status]}33`, borderLeft: `3px solid ${STATUS_COLORS[r.status]}` }}>
                      <p className="text-white text-xs font-bold truncate">{r.time} {r.name}</p>
                      <p className="text-slate-300 text-xs">{r.guests}名{r.tableNo ? ` #${r.tableNo}` : ''}</p>
                    </div>
                  );
                })}
              </div>
            </div>
            {dayReservations.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-8">この日の予約なし</p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {dayReservations.length === 0 ? (
              <div className="bg-slate-800 rounded-2xl p-8 text-center">
                <p className="text-slate-500">この日の予約なし</p>
              </div>
            ) : (
              dayReservations.map(r => (
                <div key={r.id} className="bg-slate-800 rounded-2xl p-4" onClick={() => setSelected(r)}>
                  <div className="flex items-center gap-3">
                    <div className="text-center min-w-[48px]">
                      <p className="text-indigo-400 font-mono font-bold">{r.time}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-bold">{r.name}</p>
                      <p className="text-slate-400 text-sm">{r.guests}名{r.tableNo ? ` · テーブル${r.tableNo}` : ''}{r.note ? ` · ${r.note}` : ''}</p>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <span className="text-xs px-2 py-0.5 rounded-lg font-medium" style={{ color: STATUS_COLORS[r.status], backgroundColor: `${STATUS_COLORS[r.status]}22` }}>
                        {RESERVATION_STATUS[r.status]}
                      </span>
                    </div>
                  </div>
                  {/* クイックステータス変更 */}
                  {(r.status === 'confirmed' || r.status === 'pending') && (
                    <div className="mt-2 flex gap-2" onClick={e => e.stopPropagation()}>
                      <button onClick={() => quickStatus(r, 'seated')} className="flex-1 bg-emerald-500/20 text-emerald-400 text-xs py-1.5 rounded-lg font-bold">着席</button>
                      <button onClick={() => quickStatus(r, 'cancelled')} className="flex-1 bg-red-500/20 text-red-400 text-xs py-1.5 rounded-lg font-bold">キャンセル</button>
                    </div>
                  )}
                  {r.status === 'seated' && (
                    <div className="mt-2" onClick={e => e.stopPropagation()}>
                      <button onClick={() => quickStatus(r, 'done')} className="w-full bg-purple-500/20 text-purple-400 text-xs py-1.5 rounded-lg font-bold">会計済みにする</button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <button onClick={() => setShowAdd(true)} className="fixed bottom-24 right-4 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-lg text-2xl flex items-center justify-center active:scale-90 transition-transform">
        +
      </button>

      {selected && <ReservationModal reservation={selected} onClose={() => setSelected(null)} />}
      {showAdd && <ReservationModal defaultDate={viewDate} onClose={() => setShowAdd(false)} />}
    </div>
  );
}
