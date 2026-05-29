'use client';

import { useState } from 'react';
import { useApp } from '@/lib/context';
import { ReservationModal } from '@/components/ReservationModal';
import { RESERVATION_STATUS, STATUS_COLORS } from '@/lib/types';
import type { Reservation } from '@/lib/types';

const HOURS = Array.from({ length: 13 }, (_, i) => i + 10);
const SLOT_H = 48; // px per hour
const DURATION_MIN = 90; // 予約の想定滞在時間

// 重なり検出 → カラム割り当て
function assignColumns(reservations: Reservation[]): Map<string, { col: number; totalCols: number }> {
  const sorted = [...reservations].sort((a, b) => a.time.localeCompare(b.time));
  const result = new Map<string, { col: number; totalCols: number }>();
  const groups: Reservation[][] = [];

  for (const r of sorted) {
    const [rh, rm] = r.time.split(':').map(Number);
    const rStart = rh * 60 + rm;
    const rEnd = rStart + DURATION_MIN;
    let placed = false;
    for (const group of groups) {
      const lastEnd = Math.max(...group.map(g => {
        const [gh, gm] = g.time.split(':').map(Number);
        return gh * 60 + gm + DURATION_MIN;
      }));
      if (rStart < lastEnd) {
        group.push(r);
        placed = true;
        break;
      }
    }
    if (!placed) groups.push([r]);
  }

  for (const group of groups) {
    const cols: Reservation[][] = [];
    for (const r of group) {
      const [rh, rm] = r.time.split(':').map(Number);
      const rStart = rh * 60 + rm;
      const rEnd = rStart + DURATION_MIN;
      let colIdx = 0;
      while (true) {
        if (!cols[colIdx]) { cols[colIdx] = [r]; break; }
        const conflict = cols[colIdx].some(existing => {
          const [eh, em] = existing.time.split(':').map(Number);
          const eStart = eh * 60 + em;
          const eEnd = eStart + DURATION_MIN;
          return rStart < eEnd && rEnd > eStart;
        });
        if (!conflict) { cols[colIdx].push(r); break; }
        colIdx++;
      }
    }
    const totalCols = cols.length;
    cols.forEach((col, ci) => col.forEach(r => result.set(r.id, { col: ci, totalCols })));
  }
  return result;
}

// テーブルマップ用: 席の状態を集計
function getTableStatus(reservations: Reservation[], tables: string[]) {
  return tables.map(t => {
    const res = reservations.filter(r => r.tableNo === t && r.status !== 'cancelled');
    const active = res.find(r => r.status === 'seated');
    const next = res.find(r => r.status === 'confirmed' || r.status === 'pending');
    return { table: t, active, next };
  });
}

export default function ReservationsPage() {
  const { reservations, settings, updateReservation } = useApp();
  const [selected, setSelected] = useState<Reservation | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [viewDate, setViewDate] = useState(new Date().toISOString().slice(0, 10));
  const [viewMode, setViewMode] = useState<'timeline' | 'list' | 'floor'>('timeline');
  const [courseDuration, setCourseDuration] = useState(90);

  const today = new Date().toISOString().slice(0, 10);
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() + (i - 1) * 86400000);
    return d.toISOString().slice(0, 10);
  });

  const dayReservations = reservations.filter(r => r.date === viewDate && r.status !== 'cancelled');
  const colMap = assignColumns(dayReservations);

  // テーブル一覧を予約データから自動生成
  const allTables = Array.from(new Set(
    reservations.filter(r => r.tableNo).map(r => r.tableNo!)
  )).sort();

  const tableStatuses = getTableStatus(dayReservations, allTables);

  async function quickStatus(r: Reservation, status: Reservation['status']) {
    await updateReservation({ ...r, status });
  }

  return (
    <div className="min-h-screen">
      <div className="bg-slate-800 px-4 pt-12 pb-4 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">予約管理 📅</h1>
          <div className="flex gap-1">
            <button onClick={() => setViewMode('timeline')} className={`px-2 py-1 rounded-lg text-xs font-bold ${viewMode === 'timeline' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}>タイムライン</button>
            <button onClick={() => setViewMode('floor')} className={`px-2 py-1 rounded-lg text-xs font-bold ${viewMode === 'floor' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}>席状況</button>
            <button onClick={() => setViewMode('list')} className={`px-2 py-1 rounded-lg text-xs font-bold ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}>リスト</button>
          </div>
        </div>
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

        {/* ===== タイムライン ===== */}
        {viewMode === 'timeline' && (
          <div className="bg-slate-800 rounded-2xl p-4 overflow-x-auto">
            <div className="flex gap-1" style={{ minWidth: '280px' }}>
              {/* 時間軸 */}
              <div className="flex flex-col pt-0 pr-2 shrink-0">
                {HOURS.map(h => (
                  <div key={h} className="flex items-start" style={{ height: `${SLOT_H}px` }}>
                    <span className="text-slate-500 text-xs w-10">{h}:00</span>
                  </div>
                ))}
              </div>

              {/* グリッド＋予約ブロック */}
              <div className="relative flex-1">
                {HOURS.map(h => (
                  <div key={h} className="border-t border-slate-700/50" style={{ height: `${SLOT_H}px` }} />
                ))}

                {/* 現在時刻ライン */}
                {viewDate === today && (() => {
                  const now = new Date();
                  const mins = (now.getHours() - 10) * 60 + now.getMinutes();
                  if (mins < 0 || mins > HOURS.length * 60) return null;
                  return (
                    <div className="absolute left-0 right-0 border-t-2 border-red-500 z-10 pointer-events-none" style={{ top: `${(mins / 60) * SLOT_H}px` }}>
                      <span className="bg-red-500 text-white text-xs px-1 rounded">NOW</span>
                    </div>
                  );
                })()}

                {/* 予約カード（重なり解消） */}
                {dayReservations.map(r => {
                  const [h, m] = r.time.split(':').map(Number);
                  const top = ((h - 10) * 60 + m) / 60 * SLOT_H;
                  const height = (courseDuration / 60) * SLOT_H - 4;
                  const layout = colMap.get(r.id) ?? { col: 0, totalCols: 1 };
                  const colW = 100 / layout.totalCols;
                  return (
                    <div
                      key={r.id}
                      onClick={() => setSelected(r)}
                      className="absolute rounded-lg px-2 py-1 cursor-pointer z-20 overflow-hidden"
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        left: `${layout.col * colW}%`,
                        width: `${colW - 1}%`,
                        backgroundColor: `${STATUS_COLORS[r.status]}33`,
                        borderLeft: `3px solid ${STATUS_COLORS[r.status]}`,
                      }}
                    >
                      <p className="text-white text-xs font-bold truncate">{r.time} {r.name}</p>
                      <p className="text-slate-300 text-xs">{r.guests}名{r.tableNo ? ` #${r.tableNo}` : ''}</p>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* コース時間設定 */}
            <div className="mt-3 flex items-center gap-2 border-t border-slate-700 pt-3">
              <span className="text-slate-400 text-xs">滞在想定</span>
              {[60, 90, 120, 150].map(m => (
                <button key={m} onClick={() => setCourseDuration(m)} className={`px-2 py-1 rounded-lg text-xs ${courseDuration === m ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400'}`}>{m}分</button>
              ))}
            </div>
            {dayReservations.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-8">この日の予約なし</p>
            )}
          </div>
        )}

        {/* ===== 席状況フロアマップ ===== */}
        {viewMode === 'floor' && (
          <div className="space-y-4">
            {/* 凡例 */}
            <div className="flex gap-3 flex-wrap">
              {[
                { color: '#10b981', label: '着席中' },
                { color: '#3b82f6', label: '予約確定' },
                { color: '#f59e0b', label: '仮予約' },
                { color: '#8b5cf6', label: '会計済' },
                { color: '#334155', label: '空席' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm" style={{ background: l.color }} />
                  <span className="text-slate-400 text-xs">{l.label}</span>
                </div>
              ))}
            </div>

            {/* テーブルグリッド */}
            {allTables.length === 0 ? (
              <div className="bg-slate-800 rounded-2xl p-8 text-center">
                <p className="text-slate-500 text-sm">テーブル番号が設定されている予約がありません</p>
                <p className="text-slate-600 text-xs mt-1">予約追加時にテーブルNo.を入力してください</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {tableStatuses.map(({ table, active, next }) => {
                  const color = active ? STATUS_COLORS.seated : next ? STATUS_COLORS[next.status] : '#334155';
                  const res = active ?? next;
                  return (
                    <div
                      key={table}
                      onClick={() => res && setSelected(res)}
                      className="rounded-2xl p-3 text-center cursor-pointer active:scale-95 transition-transform"
                      style={{ background: `${color}22`, border: `2px solid ${color}` }}
                    >
                      <p className="text-white font-bold text-lg">#{table}</p>
                      {res ? (
                        <>
                          <p className="text-slate-300 text-xs truncate mt-1">{res.name}</p>
                          <p className="text-slate-400 text-xs">{res.guests}名</p>
                          <p className="text-xs font-bold mt-1" style={{ color }}>{RESERVATION_STATUS[res.status]}</p>
                          {res.note && <p className="text-slate-500 text-xs mt-0.5 truncate">{res.note}</p>}
                        </>
                      ) : (
                        <p className="text-slate-600 text-xs mt-1">空席</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* 空席サマリー */}
            <div className="bg-slate-800 rounded-2xl p-4">
              <div className="flex justify-around text-center">
                <div>
                  <p className="text-2xl font-bold text-emerald-400">{tableStatuses.filter(t => t.active).length}</p>
                  <p className="text-slate-400 text-xs">着席中</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-400">{tableStatuses.filter(t => !t.active && t.next).length}</p>
                  <p className="text-slate-400 text-xs">予約あり</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-400">{tableStatuses.filter(t => !t.active && !t.next).length}</p>
                  <p className="text-slate-400 text-xs">空席</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== リスト ===== */}
        {viewMode === 'list' && (
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
                    <span className="text-xs px-2 py-0.5 rounded-lg font-medium" style={{ color: STATUS_COLORS[r.status], backgroundColor: `${STATUS_COLORS[r.status]}22` }}>
                      {RESERVATION_STATUS[r.status]}
                    </span>
                  </div>
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
