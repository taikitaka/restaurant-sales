'use client';

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-slate-900 flex flex-col items-center justify-center gap-4 z-50">
      <div className="w-12 h-12 border-4 border-slate-600 border-t-indigo-400 rounded-full animate-spin" />
      <p className="text-slate-300 font-medium">読み込み中...</p>
    </div>
  );
}
