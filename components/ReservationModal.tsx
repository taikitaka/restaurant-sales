'use client';

import { useState } from 'react';
import type { Reservation } from '@/lib/types';
import { RESERVATION_STATUS } from '@/lib/types';
import { useApp } from '@/lib/context';
import { toast } from 'sonner';

type Props = { reservation?: Reservation; defaultDate?: string; onClose: () => void };

export function ReservationModal({ reservation, defaultDate, onClose }: Props) {
  const { addReservation, updateReservation, deleteReservation } = useApp();
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(reservation?.date ?? defaultDate ?? today);
  const [time, setTime] = useState(reservation?.time ?? '18:00');
  const [name, setName] = useState(reservation?.name ?? '');
  const [guests, setGuests] = useState(reservation?.guests.toString() ?? '2');
  const [tableNo, setTableNo] = useState(reservation?.tableNo ?? '');
  const [status, setStatus] = useState<Reservation['status']>(reservation?.status ?? 'confirmed');
  const [phone, setPhone] = useState(reservation?.phone ?? '');
  const [note, setNote] = useState(reservation?.note ?? '');

  async function handleSave() {
    if (!name.trim()) return toast.error('お客様名を入力してください');
    const data = { date, time, name, guests: Number(guests) || 1, tableNo: tableNo || undefined, status, phone: phone || undefined, note: note || undefined };
    if (reservation) {
      await updateReservation({ ...reservation, ...data });
      toast.success('予約を更新しました');
    } else {
      await addReservation(data);
      toast.success('予約を追加しました');
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={onClose}>
      <div className="bg-slate-800 w-full max-w-lg mx-auto rounded-t-3xl p-6 space-y-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto" />
        <h2 className="text-lg font-bold text-white text-center">{reservation ? '予約を編集' : '予約を追加'}</h2>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-sm text-slate-400">日付</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="mt-1 w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex-1">
            <label className="text-sm text-slate-400">時間</label>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} className="mt-1 w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <div>
          <label className="text-sm text-slate-400">お客様名 *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="山田 太郎 様" className="mt-1 w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-sm text-slate-400">人数</label>
            <input type="number" value={guests} onChange={e => setGuests(e.target.value)} min="1" className="mt-1 w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex-1">
            <label className="text-sm text-slate-400">テーブルNo.</label>
            <input value={tableNo} onChange={e => setTableNo(e.target.value)} placeholder="A1" className="mt-1 w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>

        <div>
          <label className="text-sm text-slate-400">ステータス</label>
          <div className="mt-1 grid grid-cols-3 gap-2">
            {(Object.keys(RESERVATION_STATUS) as Reservation['status'][]).map(s => (
              <button key={s} onClick={() => setStatus(s)} className={`py-2 rounded-xl text-xs font-medium transition-colors ${status === s ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                {RESERVATION_STATUS[s]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm text-slate-400">電話番号（任意）</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="090-0000-0000" className="mt-1 w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
        </div>

        <div>
          <label className="text-sm text-slate-400">備考（任意）</label>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="アレルギー、席のご希望..." className="mt-1 w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm" />
        </div>

        <button onClick={handleSave} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-2xl text-lg transition-colors">
          {reservation ? '更新する' : '予約を追加'}
        </button>
        {reservation && (
          <button onClick={async () => { await deleteReservation(reservation.id); toast.success('削除しました'); onClose(); }} className="w-full text-red-400 text-sm py-2">
            削除する
          </button>
        )}
      </div>
    </div>
  );
}
