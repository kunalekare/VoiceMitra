import React, { useState } from 'react';
import { RankingBreakdown } from '../types';
import { Info, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../i18n';

interface RankingTooltipProps {
  breakdown: RankingBreakdown;
  size?: 'sm' | 'md' | 'lg';
}

export const RankingTooltip: React.FC<RankingTooltipProps> = ({ breakdown, size = 'md' }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'bg-emerald-500 text-white dark:bg-emerald-600';
    if (score >= 70) return 'bg-teal-500 text-white dark:bg-teal-600';
    if (score >= 50) return 'bg-amber-500 text-white dark:bg-amber-600';
    return 'bg-slate-400 text-white';
  };

  const getScoreBorder = (score: number) => {
    if (score >= 85) return 'border-emerald-500/30';
    if (score >= 70) return 'border-teal-500/30';
    return 'border-amber-500/30';
  };

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold shadow-sm transition hover:scale-105 ${getScoreColor(
          breakdown.compositeScore
        )} ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
        aria-label={`${t('search.compositeScore')}: ${breakdown.compositeScore}%`}
      >
        <span>{breakdown.compositeScore}% {t('search.skillMatch')}</span>
        <Info className="w-3.5 h-3.5 opacity-80 group-hover:opacity-100" />
      </button>

      {isOpen && (
        <div
          className={`absolute left-0 top-full mt-2 z-50 w-72 rounded-xl bg-white p-3.5 text-xs text-slate-800 shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-800 border ${getScoreBorder(
            breakdown.compositeScore
          )}`}
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
        >
          <div className="flex items-center justify-between border-b pb-2 mb-2 dark:border-slate-800">
            <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1">
              {t('search.compositeScore')}
            </span>
            <span
              className={`px-2 py-0.5 rounded font-black text-xs ${getScoreColor(
                breakdown.compositeScore
              )}`}
            >
              {breakdown.compositeScore}/100
            </span>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5 leading-snug">
            {t('landing.rankingTitle')}
          </p>

          <div className="space-y-1.5 font-medium">
            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-300">{t('search.skillMatch')} (40%):</span>
              <span className="font-bold text-orange-600 dark:text-orange-400">
                {breakdown.skillMatchScore} / 40
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-300">
                {t('common.distance')} ({breakdown.distanceKm} km) (25%):
              </span>
              <span className="font-bold text-teal-600 dark:text-teal-400">
                {breakdown.proximityScore} / 25
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-300">{t('common.ratings')} (20%):</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                {breakdown.reputationScore} / 20
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-300">{t('search.experience', { years: breakdown.experienceScore })}:</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {breakdown.experienceScore} / 10
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-600 dark:text-slate-300">{t('search.availableOnly')}:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {breakdown.availabilityScore} / 5
              </span>
            </div>

            <div className="flex justify-between items-center pt-1 border-t dark:border-slate-800">
              <span className="text-slate-700 dark:text-slate-200 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                {t('kyc.modalTitle')}:
              </span>
              <span
                className={`font-bold ${
                  breakdown.kycBonus > 0 ? 'text-emerald-600' : 'text-slate-400'
                }`}
              >
                +{breakdown.kycBonus} pts
              </span>
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t text-[10px] text-slate-400 dark:border-slate-800 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-teal-500 shrink-0" />
            <span>{t('common.verified')}</span>
          </div>
        </div>
      )}
    </div>
  );
};
