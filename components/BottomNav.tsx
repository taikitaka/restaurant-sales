'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const tabs = [
  { href: '/', label: 'ダッシュ', icon: '📊' },
  { href: '/sales', label: '売上', icon: '💴' },
  { href: '/menu', label: 'メニュー', icon: '🍽️' },
  { href: '/reservations', label: '予約', icon: '📅' },
  { href: '/reports', label: 'レポート', icon: '📈' },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-slate-900 border-t border-slate-700 z-40 max-w-lg mx-auto">
      <div className="flex">
        {tabs.map(t => {
          const active = t.href === '/' ? pathname === '/' : pathname.startsWith(t.href);
          return (
            <Link key={t.href} href={t.href} className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs transition-colors ${active ? 'text-indigo-400' : 'text-slate-500'}`}>
              <span className="text-xl">{t.icon}</span>
              <span className={active ? 'font-bold' : ''}>{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
