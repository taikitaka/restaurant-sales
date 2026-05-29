import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/lib/context';
import { BottomNav } from '@/components/BottomNav';
import { ClientShell } from '@/components/ClientShell';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: '売上管理',
  description: '飲食店向け売上・予約管理システム',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-slate-950">
        <AppProvider>
          <ClientShell>
            <main className="pb-20 max-w-lg mx-auto">
              {children}
            </main>
            <BottomNav />
          </ClientShell>
          <Toaster position="top-center" richColors />
        </AppProvider>
      </body>
    </html>
  );
}
