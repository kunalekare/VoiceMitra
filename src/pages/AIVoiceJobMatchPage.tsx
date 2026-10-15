import React, { useState } from 'react';
import {
  Mic,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Star,
  MapPin,
  Clock,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Volume2
} from 'lucide-react';
import { useAppStore } from '../store';
import { workersRepo } from '../services/db';
import { Worker } from '../types';
import { computeRankingBreakdown } from '../utils/ranking';
import { RankingTooltip } from '../components/RankingTooltip';
import { CITIES_COORDINATES } from '../data/seedData';
import { useTranslation, speakVernacular } from '../i18n';

interface AIVoiceJobMatchPageProps {
  onHireWorker: (worker: Worker) => void;
  onSelectWorkerForProfile: (workerId: string) => void;
}

export const AIVoiceJobMatchPage: React.FC<AIVoiceJobMatchPageProps> = ({
  onHireWorker,
  onSelectWorkerForProfile
}) => {
  const { selectedCity, currentLang } = useAppStore();
  const { t, localizedTrade, localizedCurrency } = useTranslation();
  const cityCoords = CITIES_COORDINATES[selectedCity] || CITIES_COORDINATES.Nagpur;

  const [isRecording, setIsRecording] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [recordedAudio, setRecordedAudio] = useState(false);
  const [manualText, setManualText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Extracted Requirement from Gemini
  const [extractedRequirement, setExtractedRequirement] = useState<{
    skillRequired: string;
    urgency: string;
    durationDays: number;
    dailyBudget: number;
    description: string;
    explanationSnippet: string;
  } | null>(null);

  const [topMatchedWorkers, setTopMatchedWorkers] = useState<
    Array<{ worker: Worker; breakdown: ReturnType<typeof computeRankingBreakdown>; explanation: string }>
  >([]);

  const handleStartSimulatedRecording = () => {
    setIsRecording(true);
    setTimerSeconds(0);
    const interval = setInterval(() => {
      setTimerSeconds((s) => {
        if (s >= 5) {
          clearInterval(interval);
          setIsRecording(false);
          setRecordedAudio(true);
          return 6;
        }
        return s + 1;
      });
    }, 1000);
  };

  const handleRunAIMatching = async (textOverride?: string) => {
    setIsProcessing(true);
    const promptInput =
      textOverride ||
      manualText ||
      'Need 2 experienced electricians in Nagpur for 4 days starting tomorrow morning for industrial warehouse conduit wiring. Budget ₹900 per day.';

    try {
      const res = await fetch('/api/gemini/voice-job-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textInput: promptInput
        })
      });
      const data = await res.json();
      setExtractedRequirement(data);

      // Rank top 10 candidates using composite algorithm + explain match
      const all = workersRepo.getAll();
      const scored = all.map((worker) => {
        const breakdown = computeRankingBreakdown(
          worker,
          data.skillRequired || 'Electrician',
          cityCoords.lat,
          cityCoords.lng
        );

        let explanation = '';
        if (worker.aadhaarVerified && breakdown.skillMatchScore >= 35) {
          explanation = `Top match: Perfect ${data.skillRequired} trade match, Aadhaar KYC verified (+10 bonus), located within ${breakdown.distanceKm} km.`;
        } else if (breakdown.proximityScore >= 20) {
          explanation = `Immediate proximity: Only ${breakdown.distanceKm} km from your work site with ${worker.reputationScore}★ customer rating.`;
        } else {
          explanation = `High experience: Completed ${worker.totalJobs}+ verified contracts with strong craftsmanship reputation.`;
        }

        return { worker, breakdown, explanation };
      });

      const top10 = scored
        .sort((a, b) => b.breakdown.compositeScore - a.breakdown.compositeScore)
        .slice(0, 10);

      setTopMatchedWorkers(top10);
    } catch (e) {
      console.error('Error running voice matching:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3.5 py-1 text-xs font-black text-orange-900 border border-orange-200 dark:bg-orange-950 dark:text-orange-200 dark:border-orange-800">
          <Sparkles className="h-4 w-4 text-orange-600" />
          <span>Multimodal Gemini 3.8 Flash • 12 Indian Languages</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">
          {t('search.title')}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {t('search.subtitle')}
        </p>
      </div>

      {/* Voice Recording / Input Box */}
      <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-xl border border-orange-100 dark:bg-slate-900 dark:border-slate-800 space-y-6">
        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-amber-50/50 border border-orange-200/60 dark:bg-slate-800/60 dark:border-slate-700 text-center space-y-3">
          {isRecording ? (
            <div className="space-y-2">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white animate-pulse">
                <Mic className="h-8 w-8" />
              </div>
              <div className="font-mono text-2xl font-black text-red-600">
                0:0{timerSeconds}
              </div>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                {t('voiceRegister.recording')}
              </p>
            </div>
          ) : recordedAudio ? (
            <div className="space-y-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                {t('voiceRegister.successTitle')}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400">
                <Mic className="h-7 w-7" />
              </div>
              <p className="text-xs text-slate-500">
                {t('search.speakQuery')}
              </p>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {!isRecording && (
              <button
                type="button"
                onClick={handleStartSimulatedRecording}
                className="flex items-center gap-2 rounded-2xl bg-orange-600 px-6 py-3.5 text-xs font-black text-white shadow-lg hover:bg-orange-500 active:scale-95 transition"
              >
                <Mic className="h-4 w-4" />
                <span>{recordedAudio ? t('voiceRegister.recordAgain') : t('search.speakQuery')}</span>
              </button>
            )}

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => handleRunAIMatching()}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-7 py-3.5 text-xs font-black text-white shadow-lg hover:from-emerald-500 hover:to-teal-500 active:scale-95 transition disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              <span>{isProcessing ? t('voiceRegister.processing') : t('search.sortRelevance')}</span>
            </button>
          </div>
        </div>

        {/* Quick Sample Presets for Demonstration */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            {t('voiceRegister.promptExampleTitle')}:
          </span>
          <div className="grid sm:grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                const text = 'Need 2 electricians in Nagpur for 4 days starting tomorrow morning for industrial warehouse conduit wiring. Budget ₹900 per day.';
                setManualText(text);
                handleRunAIMatching(text);
              }}
              className="rounded-2xl border border-slate-200 p-3 text-left hover:border-orange-500 hover:bg-orange-50/50 dark:border-slate-700 dark:hover:bg-slate-800 transition"
            >
              <div className="font-bold text-slate-900 dark:text-white">⚡ {localizedTrade('Electrician')} (Nagpur)</div>
              <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                "Need 2 electricians in Nagpur for 4 days warehouse wiring @ ₹900/day"
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                const text = 'Urgent plumber needed in Pune Kothrud for 2 days to fix bathroom overhead water tank leakage. Budget ₹800/day.';
                setManualText(text);
                handleRunAIMatching(text);
              }}
              className="rounded-2xl border border-slate-200 p-3 text-left hover:border-teal-500 hover:bg-teal-50/50 dark:border-slate-700 dark:hover:bg-slate-800 transition"
            >
              <div className="font-bold text-slate-900 dark:text-white">💧 {localizedTrade('Plumber')} (Pune)</div>
              <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                "Urgent plumber in Pune to fix tank leakage @ ₹800/day"
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* AI Extraction Findings Card */}
      {extractedRequirement && (
        <div className="rounded-3xl bg-gradient-to-br from-teal-500 to-emerald-700 p-6 text-white shadow-xl space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-300" />
              <h3 className="font-black text-lg">{t('search.topMatches')}</h3>
            </div>
            <button
              type="button"
              onClick={() => speakVernacular(extractedRequirement.description, currentLang)}
              className="flex items-center gap-1 rounded-full bg-white/20 hover:bg-white/30 px-3 py-1 text-xs font-bold transition"
            >
              <Volume2 className="h-3.5 w-3.5" />
              <span>{t('common.listen')}</span>
            </button>
          </div>

          <p className="text-xs text-teal-100 font-medium leading-relaxed">
            "{extractedRequirement.description}"
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
            <div className="rounded-xl bg-white/10 p-2.5 backdrop-blur">
              <span className="text-[10px] text-teal-200 uppercase font-bold">{t('voiceRegister.skillLabel')}</span>
              <div className="font-black text-sm">{localizedTrade(extractedRequirement.skillRequired)}</div>
            </div>
            <div className="rounded-xl bg-white/10 p-2.5 backdrop-blur">
              <span className="text-[10px] text-teal-200 uppercase font-bold">{t('hire.durationDays')}</span>
              <div className="font-black text-sm">{extractedRequirement.durationDays} {t('common.days')}</div>
            </div>
            <div className="rounded-xl bg-white/10 p-2.5 backdrop-blur">
              <span className="text-[10px] text-teal-200 uppercase font-bold">{t('voiceRegister.wageLabel')}</span>
              <div className="font-black text-sm">{localizedCurrency(extractedRequirement.dailyBudget)} / {t('common.days')}</div>
            </div>
            <div className="rounded-xl bg-white/10 p-2.5 backdrop-blur">
              <span className="text-[10px] text-teal-200 uppercase font-bold">{t('common.success')}</span>
              <div className="font-black text-sm">98% Match</div>
            </div>
          </div>
        </div>
      )}

      {/* Top 10 Ranked Candidates with Explanations */}
      {topMatchedWorkers.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                {t('search.topMatches')}
              </h3>
              <p className="text-xs text-slate-400">
                {t('search.showingResults', { count: topMatchedWorkers.length })}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {topMatchedWorkers.map(({ worker, breakdown, explanation }, idx) => (
              <div
                key={worker.id}
                className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200 hover:border-orange-400 transition dark:bg-slate-900 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  {/* Rank badge */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-600 text-white font-black text-sm shadow">
                    #{idx + 1}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4
                        onClick={() => onSelectWorkerForProfile(worker.id)}
                        className="font-black text-sm text-slate-900 dark:text-white hover:text-orange-600 cursor-pointer transition"
                      >
                        {worker.name}
                      </h4>
                      <RankingTooltip breakdown={breakdown} size="sm" />
                      {worker.aadhaarVerified && (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
                          <ShieldCheck className="h-3 w-3" />
                          <span>{t('kyc.verifiedBadge')} (+10)</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold">
                      <span>{localizedTrade(worker.primarySkill)} ({t('search.experienceYears', { years: worker.experienceYears })})</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-teal-600" />
                        <span>{t('search.distanceAway', { distance: breakdown.distanceKm })}</span>
                      </span>
                      <span>•</span>
                      <span className="text-amber-500 font-bold">★ {worker.reputationScore}</span>
                    </div>

                    {/* AI Match Explanation Callout */}
                    <div className="rounded-xl bg-orange-50/70 p-2.5 text-xs text-orange-950 dark:bg-orange-950/40 dark:text-orange-200 border border-orange-200/50 dark:border-orange-800/50 font-medium flex items-center justify-between gap-2">
                      <div>
                        <span className="font-bold">{t('common.search')}: </span>
                        {explanation}
                      </div>
                      <button
                        type="button"
                        onClick={() => speakVernacular(explanation, currentLang)}
                        className="h-7 w-7 shrink-0 rounded-full bg-white dark:bg-slate-800 hover:bg-orange-100 flex items-center justify-center text-orange-600 transition"
                        title={t('common.listen')}
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Direct Action */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400">{t('voiceRegister.wageLabel')}</span>
                    <div className="font-black text-base text-slate-900 dark:text-white">
                      {localizedCurrency(worker.dailyWageExpected || 850)} / {t('common.days')}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onHireWorker(worker)}
                    className="rounded-2xl bg-orange-600 px-5 py-2.5 text-xs font-black text-white shadow hover:bg-orange-500 active:scale-95 transition"
                  >
                    {t('search.hire')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
