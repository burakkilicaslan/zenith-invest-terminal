'use client';

import { useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MacroDashboard } from './macro-dashboard';

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'rounded-full border border-blue-500/60 bg-blue-500/15 px-4 py-2 text-sm font-semibold text-blue-300'
          : 'rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10'
      }
    >
      {children}
    </button>
  );
}

export default function TabShell() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tab = useMemo(() => {
    const t = searchParams.get('tab');
    return t === 'hisse' ? 'hisse' : 'makro';
  }, [searchParams]);

  const goMakro = () => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.delete('tab');
    const qs = params.toString();
    router.push(qs ? `?${qs}` : '?');
  };

  const goHisse = () => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    params.set('tab', 'hisse');
    router.push(`?${params.toString()}`);
  };

  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm text-slate-300">EPIC2</p>
            <h1 className="text-2xl font-semibold text-white">Hisse Analiz Motoru</h1>
          </div>
          <div className="flex items-center gap-3">
            <TabButton active={tab === 'makro'} onClick={goMakro}>
              Makro
            </TabButton>
            <TabButton active={tab === 'hisse'} onClick={goHisse}>
              Hisse Bazlı Arama
            </TabButton>
          </div>
        </div>
      </div>

      {tab === 'makro' ? (
        <MacroDashboard />
      ) : (
        <div className="mx-auto max-w-7xl px-4 pb-10 md:px-8">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="text-sm font-semibold text-slate-200">Hisse Bazlı Arama (skeleton)</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-44 animate-pulse rounded-xl bg-white/5" />
              ))}
            </div>
            <div className="mt-4 h-24 animate-pulse rounded-xl bg-white/5" />
          </div>
        </div>
      )}
    </div>
  );
}
