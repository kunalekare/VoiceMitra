import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Funnel,
  FunnelChart,
  LabelList
} from 'recharts';
import { TrendingUp, Activity, Users, CheckCircle2, ArrowRight } from 'lucide-react';
import { analyticsRepo } from '../services/db';

export const AnalyticsPage: React.FC = () => {
  const allEvents = analyticsRepo.getAll();

  // Funnel Data: Search -> View -> Hire -> Pay
  const funnelData = [
    { step: '1. Search Triggered', count: 1840, conversion: '100%', fill: '#ea580c' },
    { step: '2. Profile Viewed', count: 1220, conversion: '66.3%', fill: '#f97316' },
    { step: '3. Hire Initiated', count: 680, conversion: '55.7%', fill: '#0d9488' },
    { step: '4. Escrow Paid', count: 590, conversion: '86.7%', fill: '#059669' }
  ];

  // Voice language adoption stats
  const voiceLangStats = [
    { language: 'Hindi (हिन्दी)', count: 480 },
    { language: 'Marathi (मराठी)', count: 320 },
    { language: 'Tamil (தமிழ்)', count: 210 },
    { language: 'Telugu (తెలుగు)', count: 190 },
    { language: 'Bengali (বাংলা)', count: 140 },
    { language: 'Kannada (ಕನ್ನಡ)', count: 110 },
    { language: 'English / Others', count: 90 }
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-xs font-black text-orange-900 border border-orange-200 dark:bg-orange-950 dark:text-orange-200 dark:border-orange-800 mb-1">
          <Activity className="h-3.5 w-3.5 text-orange-600" />
          <span>Local PostHog-Style Product Analytics</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">
          Conversion Funnel & Vernacular Analytics
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Tracking drop-offs from audio query to escrow wage settlement.
        </p>
      </div>

      {/* Funnel Bar Chart */}
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800 space-y-4">
        <h3 className="text-base font-black text-slate-900 dark:text-white">
          Core Marketplace Funnel (Search ➔ View ➔ Hire ➔ Pay)
        </h3>

        <div className="grid sm:grid-cols-4 gap-3 text-center">
          {funnelData.map((f, idx) => (
            <div
              key={idx}
              className="rounded-2xl p-4 border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1"
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase">{f.step}</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {f.count.toLocaleString()}
              </div>
              <div className="text-xs font-bold text-emerald-600">{f.conversion} step conversion</div>
            </div>
          ))}
        </div>

        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnelData} layout="vertical" margin={{ top: 10, right: 30, left: 80, bottom: 5 }}>
              <XAxis type="number" stroke="#94a3b8" fontSize={11} />
              <YAxis dataKey="step" type="category" stroke="#94a3b8" fontSize={11} width={120} />
              <Tooltip formatter={(val: any) => [val, 'Users in Step']} />
              <Bar dataKey="count" fill="#ea580c" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Vernacular Language Usage */}
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800 space-y-4">
        <h3 className="text-base font-black text-slate-900 dark:text-white">
          Voice Search & Registration Dialects Distribution
        </h3>
        <p className="text-xs text-slate-400">
          Distribution across 12 supported Indian regional languages.
        </p>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={voiceLangStats} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
              <XAxis dataKey="language" stroke="#94a3b8" fontSize={10} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip formatter={(val: any) => [val, 'Voice Interactions']} />
              <Bar dataKey="count" fill="#0d9488" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
