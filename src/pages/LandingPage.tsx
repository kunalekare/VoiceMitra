import React from 'react';
import {
  Mic,
  ShieldCheck,
  Briefcase,
  Volume2,
  Users,
  Award,
  Sparkles,
  ArrowRight,
  Star,
  CheckCircle2,
  PhoneCall,
  MessageSquare,
  Lock,
  ChevronRight
} from 'lucide-react';
import { useAppStore } from '../store';
import { CANONICAL_SKILLS } from '../utils/taxonomy';
import { useTranslation, getLocalizedTrade } from '../i18n';

interface LandingPageProps {
  onNavigate: (tab: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { loginAsWorker, loginAsEmployer, openModal, currentLang } = useAppStore();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-orange-50/80 via-amber-50/40 to-transparent pt-10 sm:pt-16 pb-12 sm:pb-20 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Left Column: Headlines & CTAs */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3.5 py-1.5 text-xs font-black text-orange-900 border border-orange-200/80 dark:bg-orange-950/80 dark:text-orange-200 dark:border-orange-800 shadow-sm">
                <span className="flex h-2 w-2 rounded-full bg-orange-600 animate-ping" />
                <span>{t('landing.heroBadge')}</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.15]">
                {t('landing.heroTitle1')}{' '}
                <span className="bg-gradient-to-r from-orange-600 via-amber-600 to-teal-600 bg-clip-text text-transparent">
                  {t('landing.heroTitleHighlight')}
                </span>{' '}
                {t('landing.heroTitle2')}
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto lg:mx-0 font-medium leading-relaxed">
                {t('landing.heroSubtitle')}
              </p>

              {/* Big Dual CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('voice-register')}
                  className="w-full sm:w-auto flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 px-7 py-4 text-base font-black text-white shadow-xl shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-[1.02] active:scale-95 transition"
                >
                  <Mic className="h-5 w-5 animate-pulse" />
                  <span>{t('landing.ctaSpeakRegister')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('employer-dashboard')}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl border-2 border-slate-300 bg-white px-7 py-4 text-base font-black text-slate-800 hover:border-orange-500 hover:text-orange-600 dark:border-slate-700 dark:bg-slate-900 dark:text-white shadow-sm transition"
                >
                  <span>{t('landing.ctaPostJob')}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              {/* 1-Click Quick Demo Access Bar */}
              <div className="pt-4 border-t border-orange-200/60 dark:border-slate-800 text-xs font-semibold text-slate-500 flex flex-wrap items-center justify-center lg:justify-start gap-2">
                <span className="font-bold text-slate-700 dark:text-slate-300">{t('auth.quickLogin')}:</span>
                <button
                  onClick={() => {
                    loginAsWorker('w-ngp-01');
                    onNavigate('worker-dashboard');
                  }}
                  className="rounded-lg bg-orange-100 px-2.5 py-1 text-orange-800 font-bold hover:bg-orange-200 dark:bg-orange-950 dark:text-orange-300 transition"
                >
                  ⚡ {t('auth.demoWorker')}
                </button>
                <button
                  onClick={() => {
                    loginAsEmployer('emp-01');
                    onNavigate('employer-dashboard');
                  }}
                  className="rounded-lg bg-teal-100 px-2.5 py-1 text-teal-800 font-bold hover:bg-teal-200 dark:bg-teal-950 dark:text-teal-300 transition"
                >
                  🏢 {t('auth.demoEmployer')}
                </button>
                <button
                  onClick={() => {
                    useAppStore.getState().loginAsAdmin();
                    onNavigate('admin-dashboard');
                  }}
                  className="rounded-lg bg-slate-200 px-2.5 py-1 text-slate-800 font-bold hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 transition"
                >
                  🛡️ {t('auth.demoAdmin')}
                </button>
              </div>
            </div>

            {/* Right Column: Interactive Voice Simulator Card */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800 border-2 border-orange-200/70 dark:border-orange-900/50">
                <div className="flex items-center justify-between pb-4 border-b dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {t('voiceRegister.pageTitle')}
                    </span>
                  </div>
                  <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-[10px] font-bold text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                    Gemini 3.8 Flash
                  </span>
                </div>

                {/* Spoken Quote Preview */}
                <div className="my-5 rounded-2xl bg-amber-50/70 p-4 border border-orange-200/60 dark:bg-slate-800/80 dark:border-slate-700 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-orange-900 dark:text-orange-300">
                    <Volume2 className="h-4 w-4 text-orange-600" />
                    <span>{t('voiceRegister.promptExampleTitle')}</span>
                  </div>
                  <p className="font-serif text-sm italic text-slate-800 dark:text-slate-200 leading-relaxed">
                    "{t('voiceRegister.promptExample')}"
                  </p>
                </div>

                {/* AI Extracted Highlights */}
                <div className="space-y-2 rounded-2xl bg-slate-50 p-3.5 text-xs font-mono dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {t('voiceRegister.confirmTitle')}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('voiceRegister.nameLabel')}:</span>
                    <span className="font-bold text-slate-900 dark:text-white">Rameshwar Patil</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('voiceRegister.skillLabel')}:</span>
                    <span className="font-bold text-orange-600 dark:text-orange-400">{getLocalizedTrade('Electrician', currentLang)} (98%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('voiceRegister.expLabel')}:</span>
                    <span className="font-bold text-slate-900 dark:text-white">9 {t('voiceRegister.expYearsUnit')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('voiceRegister.locationLabel')}:</span>
                    <span className="font-bold text-teal-600">Nagpur</span>
                  </div>
                </div>

                {/* Action Trigger in Card */}
                <button
                  type="button"
                  onClick={() => onNavigate('voice-register')}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 py-3 text-xs font-black text-white shadow-md hover:bg-orange-500 transition"
                >
                  <Mic className="h-4 w-4" />
                  <span>{t('voiceRegister.tapToSpeak')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step Process: Speak -> Get Verified -> Get Hired */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-black uppercase tracking-widest text-orange-600 dark:text-orange-400">
            {t('landing.heroBadge')}
          </span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
            {t('landing.trustedHeading')}
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {t('landing.trustedSubtitle')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="relative rounded-3xl bg-white p-7 shadow-lg border border-orange-100 dark:bg-slate-900 dark:border-slate-800 transition hover:-translate-y-1">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400">
              <Mic className="h-7 w-7" />
            </div>
            <span className="text-xs font-black text-orange-600 tracking-wider uppercase">01</span>
            <h3 className="mt-1 text-xl font-black text-slate-900 dark:text-white">{t('landing.step1Title')}</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {t('landing.step1Desc')}
            </p>
          </div>

          {/* Step 2 */}
          <div className="relative rounded-3xl bg-white p-7 shadow-lg border border-orange-100 dark:bg-slate-900 dark:border-slate-800 transition hover:-translate-y-1">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <span className="text-xs font-black text-teal-600 tracking-wider uppercase">02</span>
            <h3 className="mt-1 text-xl font-black text-slate-900 dark:text-white">{t('landing.step2Title')}</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {t('landing.step2Desc')}
            </p>
          </div>

          {/* Step 3 */}
          <div className="relative rounded-3xl bg-white p-7 shadow-lg border border-orange-100 dark:bg-slate-900 dark:border-slate-800 transition hover:-translate-y-1">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
              <Briefcase className="h-7 w-7" />
            </div>
            <span className="text-xs font-black text-amber-600 tracking-wider uppercase">03</span>
            <h3 className="mt-1 text-xl font-black text-slate-900 dark:text-white">{t('landing.step3Title')}</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              {t('landing.step3Desc')}
            </p>
          </div>
        </div>
      </section>

      {/* Metrics & Impact Counter */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-[36px] bg-gradient-to-r from-orange-600 via-amber-600 to-teal-700 p-8 sm:p-12 text-white shadow-2xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-black tracking-tight">500M+</div>
              <div className="mt-1 text-xs font-semibold text-orange-100 uppercase tracking-wider">
                {t('landing.statsWorkers')}
              </div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black tracking-tight">12</div>
              <div className="mt-1 text-xs font-semibold text-orange-100 uppercase tracking-wider">
                {t('landing.statsJobs')}
              </div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black tracking-tight">40+</div>
              <div className="mt-1 text-xs font-semibold text-orange-100 uppercase tracking-wider">
                {t('landing.statsWage')}
              </div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-black tracking-tight">₹0</div>
              <div className="mt-1 text-xs font-semibold text-orange-100 uppercase tracking-wider">
                {t('landing.statsRating')}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Trades Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {t('landing.tradesHeading')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('landing.tradesSubtitle')}
            </p>
          </div>
          <button
            onClick={() => onNavigate('employer-dashboard')}
            className="flex items-center gap-1.5 text-xs font-black text-orange-600 hover:text-orange-700 transition"
          >
            <span>{t('landing.tradesHeading')}</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {CANONICAL_SKILLS.slice(0, 6).map((skill, idx) => (
            <div
              key={idx}
              onClick={() => onNavigate('employer-dashboard')}
              className="group cursor-pointer rounded-2xl bg-white p-4 shadow-sm border border-slate-200/80 hover:border-orange-500 hover:shadow-md transition text-center dark:bg-slate-900 dark:border-slate-800"
            >
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition dark:bg-slate-800">
                <span className="text-xl">
                  {skill.canonical === 'Electrician' ? '⚡' :
                   skill.canonical === 'Plumber' ? '💧' :
                   skill.canonical === 'Mason' ? '🧱' :
                   skill.canonical === 'Painter' ? '🎨' :
                   skill.canonical === 'Carpenter' ? '🪚' : '🛠️'}
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">{getLocalizedTrade(skill.canonical, currentLang)}</h4>
              <span className="mt-2 inline-block text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                ₹{skill.baseDailyWageInr} / {t('common.days')}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Multimodal Channels Callout (WhatsApp & IVR) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-slate-900 text-white p-8 sm:p-12 border border-slate-800 relative overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-4">
              <span className="text-xs font-black uppercase tracking-wider text-teal-400">
                Inclusive Non-Smartphone Access
              </span>
              <h3 className="text-2xl sm:text-3xl font-black leading-tight">
                Works on Feature Phones via IVR & WhatsApp
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                40% of informal workers in India do not use web browsers. SkillBridge operates seamlessly through automated IVR phone trees and WhatsApp interactive voice bots.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => openModal('whatsapp')}
                  className="flex items-center gap-2 rounded-2xl bg-[#00a884] px-5 py-3 text-xs font-black text-white shadow-lg hover:bg-[#00a884]/90 transition"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Test WhatsApp Bot</span>
                </button>

                <button
                  type="button"
                  onClick={() => openModal('ivr')}
                  className="flex items-center gap-2 rounded-2xl bg-orange-600 px-5 py-3 text-xs font-black text-white shadow-lg hover:bg-orange-500 transition"
                >
                  <PhoneCall className="h-4 w-4" />
                  <span>Test Phone IVR Dialpad</span>
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-800/80 p-5 border border-slate-700 space-y-3 text-xs">
              <div className="flex items-center gap-2 font-bold text-amber-400">
                <ShieldCheck className="h-4 w-4" />
                <span>Regulatory & Trust Highlights:</span>
              </div>
              <ul className="space-y-2 text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>DPDP Act 2023 Compliant:</strong> Never stores plain 12-digit Aadhaar numbers. Zero biometric storage.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Escrow Protection (Sandbox):</strong> Wages held in escrow-style ledger before work starts. (Live escrow requires RBI-authorized partner).</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>DigiLocker Verification (Simulated):</strong> Verifiable trade credential checking against NCVT ITI standards.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
