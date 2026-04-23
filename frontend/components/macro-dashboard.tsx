'use client';

import type { ReactNode } from 'react';
import { mockMacroDashboard as macroData } from '../../lib/macro-data';

type TrendTone = 'up' | 'down' | 'flat';

function TrendIcon({ tone }: { tone: TrendTone }) {
  if (tone === 'up') return <span className="text-emerald-300">↗</span>;
  if (tone === 'down') return <span className="text-rose-300">↘</span>;
  return <span className="text-slate-400">•</span>;
}

function Badge({ children, tone = 'slate' }: { children: ReactNode; tone?: 'slate' | 'green' | 'amber' | 'blue' }) {
  const tones: Record<typeof tone, string> = {
    slate: 'bg-white/10 text-white',
    green: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    amber: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    blue: 'bg-blue-500/15 text-blue-300 border border-blue-500/30'
  };

  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-white/10 bg-slate-950/55 shadow-glow ${className}`}>{children}</div>;
}

function CardHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`border-b border-white/10 px-5 py-4 ${className}`}>{children}</div>;
}

function CardContent({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`px-5 py-4 ${className}`}>{children}</div>;
}

function Separator() {
  return <div className="h-px w-full bg-white/10" />;
}

export function MacroDashboard() {
  const commentary = macroData.commentary;

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-6 md:px-8">
      <section className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
        <Card className="bg-gradient-to-br from-slate-950/80 to-slate-900/50">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-3">
              <Badge tone="blue">{macroData.meta.mode === 'live' ? 'canlı veri' : 'mock öncelikli'}</Badge>
              <Badge tone="green">Poke yorum paketi</Badge>
              <Badge tone="amber">saatlik likidite yapısı</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-300">Makro Strateji Paneli</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-5xl">ABD + TR makro, likidite ve yorum tek panelde</h1>
            </div>
            <p className="max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
              Sayfa mock_data.json önceliğiyle kuruludur; canlı FRED ve TCMB/EVDS bağlayıcıları arayüz sözleşmesini değiştirmeden eklenebilir.
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              <Metric label="Durum" value={macroData.meta.mode === 'live' ? 'canlı veri' : 'mock öncelikli'} icon={<span className="text-slate-300">M</span>} />
              <Metric label="ABD kaynakları" value={`${macroData.sourceRoadmap.us.length}`} icon={<span className="text-slate-300">ABD</span>} />
              <Metric label="TR kaynakları" value={`${macroData.sourceRoadmap.tr.length}`} icon={<span className="text-slate-300">TR</span>} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Poke yorum paketi</p>
                <h2 className="text-xl font-semibold">{commentary.headline}</h2>
              </div>
              <Badge tone="green">{commentary.stance}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {commentary.bullets.map((item: string) => (
              <div key={item} className="flex gap-3 text-sm text-slate-300">
                <span className="mt-0.5 shrink-0 text-blue-300">•</span>
                <p>{item}</p>
              </div>
            ))}
            <Separator />
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-200">Takip noktaları</p>
              <ul className="space-y-2 text-sm text-slate-300">
                {commentary.watchpoints.map((item: string) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <Separator />
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-200">Kaynak notları</p>
              <ul className="space-y-2 text-sm text-slate-300">
                {commentary.sourceNotes.map((item: string) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <MacroTable title="ABD makro verisi" subtitle="FRED öncelikli yapı" points={macroData.usMacro} />
        <MacroTable title="TR makro verisi" subtitle="TCMB EVDS ve BIST yapısı" points={macroData.trMacro} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Likidite rejimi</p>
                <h3 className="text-xl font-semibold">Saatlik fiyat / likidite yapısı</h3>
              </div>
              <Badge tone="blue">{macroData.liquidity.current.riskAppetite === "neutral-to-positive" ? "nötr-olumlu" : macroData.liquidity.current.riskAppetite}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-4">
              <SmallMetric label="BIST ciro" value={macroData.liquidity.current.bistTurnover.toLocaleString('en-US')} />
              <SmallMetric label="Serbest dolaşım hızı" value={macroData.liquidity.current.freeFloatVelocity.toFixed(2)} />
              <SmallMetric label="USD/TRY" value={macroData.liquidity.current.usdTry.toFixed(2)} />
              <SmallMetric label="Risk rejimi" value={macroData.liquidity.current.riskAppetite === 'neutral-to-positive' ? 'nötr-olumlu' : macroData.liquidity.current.riskAppetite} />
            </div>
            <Separator />
            <div className="grid gap-3 pt-4 md:grid-cols-4">
              {macroData.liquidity.hourlySeries.map((slice: (typeof macroData.liquidity.hourlySeries)[number]) => (
                <div key={slice.time} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{slice.time}</span>
                    <TrendIcon tone={slice.price > 9400 ? 'up' : 'flat'} />
                  </div>
                  <p className="mt-3 text-2xl font-semibold">{slice.price.toLocaleString('en-US', { maximumFractionDigits: 1 })}</p>
                  <p className="mt-1 text-sm text-slate-300">Likidite {slice.liquidity.toFixed(2)}</p>
                  <p className="mt-2 text-xs text-slate-400">{slice.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <p className="text-sm text-slate-400">Kaynak yol haritası</p>
            <h3 className="text-xl font-semibold">Daha sonra etkinleştirilecek canlı bağlayıcılar</h3>
          </CardHeader>
          <CardContent className="space-y-5 text-sm text-slate-300">
            <SourceBlock title="ABD" items={macroData.sourceRoadmap.us} />
            <SourceBlock title="TR" items={macroData.sourceRoadmap.tr} />
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-xs leading-5 text-slate-400">
              API anahtarları yalnızca ortam değişkenlerinde tutulur. Bu iskelet, canlı sağlayıcıları veri soyutlamasının arkasında tutarak arayüzü kararlı bırakır.
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function Metric({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

function MacroTable({ title, subtitle, points }: { title: string; subtitle: string; points: typeof macroData.usMacro }) {
  return (
    <Card>
      <CardHeader>
        <p className="text-sm text-slate-400">{subtitle}</p>
        <h3 className="text-xl font-semibold">{title}</h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {points.map((point: (typeof macroData.usMacro)[number]) => (
            <div key={point.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm">
              <div>
                <p className="font-medium text-white">{point.label}</p>
                <p className="text-xs text-slate-400">{point.source} • {point.seriesId}</p>
              </div>
              <div className="flex items-center gap-3">
                <TrendIcon tone={point.direction} />
                <span className="min-w-24 text-right font-semibold">{point.value.toFixed(2)} {point.unit}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SourceBlock({ title, items }: { title: string; items: { provider: string; use: string }[] }) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-white">{title}</p>
      <div className="space-y-2">
        {items.map((item: { provider: string; use: string }) => (
          <div key={item.provider} className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <p className="font-medium text-white">{item.provider}</p>
            <p className="text-xs leading-5 text-slate-400">{item.use}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
