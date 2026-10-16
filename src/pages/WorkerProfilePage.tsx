import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Star,
  MapPin,
  Clock,
  Award,
  Sparkles,
  Phone,
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  Share2,
  Calendar
} from 'lucide-react';
import { Worker, Review } from '../types';
import { VoicePlayer } from '../components/VoicePlayer';
import { reviewsRepo, workersRepo } from '../services/db';
import { computeRankingBreakdown } from '../utils/ranking';
import { RankingTooltip } from '../components/RankingTooltip';
import { useTranslation, formatCurrency, getLocalizedTrade } from '../i18n';

interface WorkerProfilePageProps {
  workerId: string;
  onBack: () => void;
  onHireWorker: (worker: Worker) => void;
}

export const WorkerProfilePage: React.FC<WorkerProfilePageProps> = ({
  workerId,
  onBack,
  onHireWorker
}) => {
  const { t, currentLang } = useTranslation();
  const worker = workersRepo.getById(workerId) || workersRepo.getAll()[0];
  const [reviews, setReviews] = useState<Review[]>([]);
  const [llmSummary, setLlmSummary] = useState<{ english?: string; hindi?: string } | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    if (worker) {
      const revs = reviewsRepo.getByWorkerId(worker.id);
      setReviews(revs);

      // Fetch or generate Gemini LLM summary
      setLoadingSummary(true);
      fetch('/api/gemini/worker-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: worker.name,
          skill: worker.primarySkill,
          experienceYears: worker.experienceYears,
          totalJobs: worker.totalJobs,
          rating: worker.reputationScore,
          badges: worker.verifiedSkillBadges,
          city: worker.district
        })
      })
        .then((res) => res.json())
        .then((data) => {
          setLlmSummary({
            english: data.summaryEnglish,
            hindi: data.summaryHindi
          });
        })
        .catch(() => {
          setLlmSummary({
            english: `${worker.name} is a highly rated ${worker.primarySkill} in ${worker.district} with ${worker.experienceYears} years of proven trade craftsmanship and verified credentials.`,
            hindi: `${worker.name} ${worker.district} के एक अनुभवी और सत्यापित ${worker.primarySkill} हैं।`
          });
        })
        .finally(() => setLoadingSummary(false));
    }
  }, [worker]);

  if (!worker) return <div className="p-8 text-center">{t('common.loading')}</div>;

  const ranking = computeRankingBreakdown(worker, worker.primarySkill);
  const localizedTrade = getLocalizedTrade(worker.primarySkill, currentLang);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 space-y-6 animate-fadeIn">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-orange-600 dark:text-slate-400"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>{t('common.back')}</span>
      </button>

      {/* Hero Header Card */}
      <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <img
              src={worker.profilePicUrl}
              alt={worker.name}
              className="h-24 w-24 rounded-3xl object-cover ring-4 ring-orange-100 shadow-md"
            />
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                  {worker.name}
                </h1>
                <RankingTooltip breakdown={ranking} size="sm" />
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                <span className="font-bold text-orange-600 dark:text-orange-400">
                  {localizedTrade}
                </span>
                <span>•</span>
                <span>{t('workerProfile.yearsOfExperience', { years: worker.experienceYears })}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{worker.district}, {worker.state} ({worker.pincode})</span>
                </span>
              </div>

              {/* Verified Badges */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {worker.verifiedSkillBadges.map((badge, idx) => (
                  <span
                    key={idx}
                    className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                  >
                    <ShieldCheck className="h-3 w-3 text-emerald-600" />
                    <span>{badge}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing & CTA */}
          <div className="flex flex-col items-start sm:items-end gap-2 w-full sm:w-auto">
            <div className="text-left sm:text-right">
              <span className="text-xs text-slate-400">{t('voiceRegister.wageRate')}</span>
              <div className="text-2xl font-black text-slate-900 dark:text-white">
                {formatCurrency(worker.dailyWageExpected || 850, currentLang)}
                <span className="text-xs font-normal text-slate-500"> / {t('common.days')}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onHireWorker(worker)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 px-7 py-3.5 text-sm font-black text-white shadow-lg hover:shadow-orange-500/25 active:scale-95 transition"
            >
              <Briefcase className="h-4 w-4" />
              <span>{t('workerProfile.hireNow')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Verified Voice Profile Player */}
      <VoicePlayer
        transcript={worker.voiceTranscript}
        audioUrl={worker.voiceProfileUrl}
        workerName={worker.name}
        skillName={localizedTrade}
      />

      {/* Gemini AI Generated Summary */}
      <div className="rounded-3xl bg-gradient-to-br from-amber-50/60 to-orange-50/40 p-6 border border-orange-200 dark:bg-slate-900 dark:border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-orange-900 dark:text-orange-300">
          <Sparkles className="h-4 w-4 text-orange-600" />
          <span>{t('workerProfile.verifiedCredentials')}</span>
        </div>

        {loadingSummary ? (
          <div className="py-2 text-xs text-slate-400 font-medium animate-pulse">
            {t('common.loading')}
          </div>
        ) : (
          <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            {currentLang === 'en' ? (
              llmSummary?.english && <p className="font-medium">{llmSummary.english}</p>
            ) : (
              llmSummary?.hindi && (
                <p className="font-serif text-slate-600 dark:text-slate-400 italic">
                  "{llmSummary.hindi}"
                </p>
              )
            )}
            {!llmSummary?.english && !llmSummary?.hindi && (
              <p className="font-medium">
                {worker.name} • {localizedTrade} • {worker.district}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Secondary Skills & Languages */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {t('workerProfile.skillBadges')}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {worker.secondarySkills && worker.secondarySkills.length > 0 ? (
              worker.secondarySkills.map((sk, idx) => (
                <span
                  key={idx}
                  className="rounded-xl bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                >
                  {getLocalizedTrade(sk, currentLang)}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400">{localizedTrade}</span>
            )}
          </div>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800 space-y-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {t('nav.language')}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {worker.languagesSpoken.map((lang, idx) => (
              <span
                key={idx}
                className="rounded-xl bg-orange-50 px-3 py-1 text-xs font-bold text-orange-800 border border-orange-200 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-800"
              >
                {lang}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Customer Reviews & Audio Testimonials */}
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              {t('workerProfile.reviewsAndRatings', { count: reviews.length })}
            </h3>
            <p className="text-xs text-slate-400">{t('common.ratings')}</p>
          </div>
          <div className="flex items-center gap-1 font-black text-lg text-amber-500">
            <Star className="h-5 w-5 fill-current" />
            <span>{worker.reputationScore}</span>
          </div>
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            {t('common.ratings')} (5.0★)
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {rev.employerName}
                  </span>
                  <div className="flex items-center text-amber-500 text-xs font-bold">
                    {'★'.repeat(rev.rating)}
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  "{rev.textReview || (rev as any).comment}"
                </p>

                <div className="text-[10px] text-slate-400">
                  {new Date(rev.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
