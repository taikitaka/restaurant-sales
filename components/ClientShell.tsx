'use client';

import { useApp } from '@/lib/context';
import { LoadingScreen } from './LoadingScreen';

export function ClientShell({ children }: { children: React.ReactNode }) {
  const { loading } = useApp();
  if (loading) return <LoadingScreen />;
  return <>{children}</>;
}
