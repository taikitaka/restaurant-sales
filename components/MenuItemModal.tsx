'use client';

import { useState } from 'react';
import type { MenuItem } from '@/lib/types';
import { useApp } from '@/lib/context';
import { toast } from 'sonner';

const CATEGORIES = ['前菜', 'メイン', 'パスタ・ご飯', 'デザート', 'ドリンク', 'その他'];

type Props = { item?: MenuItem; onClose: () => void };

export function MenuItemModal({ item, onClose }: Props) {
  const { addMenuItem, updateMenuItem, deleteMenuItem } = useApp();
  const [name, setName] = useState(item?.name ?? '');
  const [category, setCategory] = useState(item?.category ?? 'メイン');
  const [price, setPrice] = useState(item?.price.toString() ?? '');
  const [isActive, setIsActive] = useState(item?.isActive ?? true);

  async function handleSave() {
    if (!name.trim()) return toast.error('メニュー名を入力してください');
    const data = { name, category, price: Number(price) || 0, isActive };
    if (item) {
      await updateMenuItem({ ...item, ...data });
      toast.success('更新しました');
    } else {
      await addMenuItem(data);
      toast.success('メニューを追加しました');
    }
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end" onClick={onClose}>
      <div className="bg-slate-800 w-full max-w-lg mx-auto rounded-t-3xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto" />
        <h2 className="text-lg font-bold text-white text-center">{item ? 'メニューを編集' : 'メニューを追加'}</h2>

        <div>
          <label className="text-sm text-slate-400">メニュー名 *</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="パスタカルボナーラ" className="mt-1 w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div>
          <label className="text-sm text-slate-400">カテゴリ</label>
          <div className="mt-1 flex flex-wrap gap-2">
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)} className={`px-3 py-1 rounded-full text-sm border transition-colors ${category === c ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-600 text-slate-300'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm text-slate-400">価格 (¥)</label>
          <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="1200" className="mt-1 w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-lg font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setIsActive(!isActive)} className={`w-12 h-6 rounded-full transition-colors ${isActive ? 'bg-indigo-600' : 'bg-slate-600'} relative`}>
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isActive ? 'left-7' : 'left-1'}`} />
          </button>
          <span className="text-slate-300 text-sm">{isActive ? '提供中' : '停止中'}</span>
        </div>

        <button onClick={handleSave} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-2xl text-lg transition-colors">
          {item ? '更新する' : '追加する'}
        </button>
        {item && (
          <button onClick={async () => { await deleteMenuItem(item.id); toast.success('削除しました'); onClose(); }} className="w-full text-red-400 text-sm py-2">
            削除する
          </button>
        )}
      </div>
    </div>
  );
}
