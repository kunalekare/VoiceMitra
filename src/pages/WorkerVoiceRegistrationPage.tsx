import React, { useState } from 'react';
import {
  Mic,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Award,
  Video,
  Upload,
  User,
  MapPin,
  Clock,
  Wrench,
  RotateCcw,
  Volume2
} from 'lucide-react';
import { AudioVoiceRecorder } from '../components/AudioVoiceRecorder';
import { VoiceRegistrationResult, Worker } from '../types';
import { CANONICAL_SKILLS, normalizeSkill } from '../utils/taxonomy';
import { workersRepo } from '../services/db';
import { useAppStore } from '../store';
import { useTranslation, getLocalizedTrade, speakVernacular } from '../i18n';

interface WorkerVoiceRegistrationPageProps {
  onSuccessNavigate: (tab: string) => void;
}

export const WorkerVoiceRegistrationPage: React.FC<WorkerVoiceRegistrationPageProps> = ({
  onSuccessNavigate
}) => {
  const { currentWorker, currentLang, loginAsWorker, openModal } = useAppStore();
  const { t, localizedTrade, localizedCurrency } = useTranslation();

  const [step, setStep] = useState<'record' | 'confirm' | 'complete'>('record');
  const [extractedData, setExtractedData] = useState<VoiceRegistrationResult | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | undefined>(undefined);

  // Editable confirmation form fields
  const [fullName, setFullName] = useState('');
  const [primarySkill, setPrimarySkill] = useState('Electrician');
  const [secondarySkills, setSecondarySkills] = useState<string[]>([]);
  const [experienceYears, setExperienceYears] = useState(5);
  const [locationCity, setLocationCity] = useState('Nagpur');
  const [dailyWage, setDailyWage] = useState(850);
  const [phone, setPhone] = useState(currentWorker?.phone || '+91 98220 11201');
  const [portfolioVideoName, setPortfolioVideoName] = useState<string | null>(null);

  const handleVoiceSuccess = (result: VoiceRegistrationResult, audioUrl?: string) => {
    setExtractedData(result);
    setRecordedAudioUrl(audioUrl);

    setFullName(result.name || 'कारीगर');
    setPrimarySkill(result.primarySkill || 'Electrician');
    setSecondarySkills(result.secondarySkills || []);
    setExperienceYears(result.experienceYears || 5);
    setLocationCity(result.location || 'Nagpur');

    // Auto set typical wage based on canonical skill
    const foundSkill = CANONICAL_SKILLS.find((s) => s.canonical === result.primarySkill);
    if (foundSkill) {
      setDailyWage(foundSkill.baseDailyWageInr);
    }

    setStep('confirm');
  };

  const handleSaveProfile = async () => {
    const canonicalNormalized = normalizeSkill(primarySkill).canonical;

    const newWorkerId = currentWorker?.id || `w-reg-${Date.now()}`;
    const newWorker: Worker = {
      id: newWorkerId,
      phone,
      name: fullName,
      primarySkill: canonicalNormalized,
      secondarySkills,
      experienceYears: Number(experienceYears) || 1,
      languagesSpoken: ['Hindi', 'Marathi', 'English'],
      district: locationCity,
      state: 'Maharashtra',
      pincode: '440001',
      lat: 21.1458,
      lng: 79.0882,
      voiceTranscript: extractedData?.transcript || 'Registered via voice registration flow.',
      voiceProfileUrl: recordedAudioUrl,
      profilePicUrl:
        currentWorker?.profilePicUrl ||
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&auto=format&fit=crop&q=80',
      aadhaarVerified: currentWorker?.aadhaarVerified || false,
      reputationScore: 5.0,
      totalJobs: currentWorker?.totalJobs || 0,
      isAvailable: true,
      status: 'active',
      verifiedSkillBadges: currentWorker?.verifiedSkillBadges || ['Voice Registered'],
      portfolioVideoUrl: portfolioVideoName ? `portfolio_${portfolioVideoName}` : undefined,
      createdAt: new Date().toISOString(),
      dailyWageExpected: Number(dailyWage) || 850
    };

    // 1. Save in reactive client repository
    workersRepo.save(newWorker);
    loginAsWorker(newWorkerId);

    // 2. Persist to SQLite backend database
    try {
      await fetch('/api/v1/workers/voice-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: newWorkerId,
          phone,
          languageCode: currentLang,
          overrideData: {
            id: newWorkerId,
            name: fullName,
            primarySkill: canonicalNormalized,
            secondarySkills,
            experienceYears: Number(experienceYears) || 1,
            district: locationCity,
            dailyWageExpected: Number(dailyWage) || 850
          }
        })
      });
    } catch (syncErr) {
      console.warn('Backend SQLite sync warning:', syncErr);
    }

    setStep('complete');
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Stepper Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-md mx-auto mb-2 text-xs font-bold text-slate-500">
          <span className={step === 'record' ? 'text-orange-600' : 'text-slate-400'}>
            1. {t('voiceRegister.step1')}
          </span>
          <span className={step === 'confirm' ? 'text-orange-600' : 'text-slate-400'}>
            2. {t('voiceRegister.step2')}
          </span>
          <span className={step === 'complete' ? 'text-orange-600' : 'text-slate-400'}>
            3. {t('voiceRegister.step3')}
          </span>
        </div>
        <div className="h-2 w-full max-w-md mx-auto rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-orange-600 transition-all duration-300"
            style={{
              width: step === 'record' ? '33%' : step === 'confirm' ? '66%' : '100%'
            }}
          />
        </div>
      </div>

      {/* Step 1: Voice Recorder */}
      {step === 'record' && (
        <div className="space-y-6">
          <AudioVoiceRecorder onSuccess={handleVoiceSuccess} languageCode={currentLang} />

          {/* Tips for informal workers */}
          <div className="rounded-2xl bg-amber-50/70 p-4 border border-orange-200/50 text-xs text-slate-700 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-300">
            <span className="font-bold text-orange-950 dark:text-orange-300 block mb-1">
              💡 {t('voiceRegister.promptExampleTitle')}:
            </span>
            <p className="text-slate-600 dark:text-slate-400 italic">
              "{t('voiceRegister.promptExample')}"
            </p>
          </div>
        </div>
      )}

      {/* Step 2: Confirm & Edit Profile Details */}
      {step === 'confirm' && (
        <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-xl border border-orange-100 dark:bg-slate-900 dark:border-slate-800 space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between border-b pb-4 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600 font-bold">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  {t('voiceRegister.confirmTitle')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t('voiceRegister.confirmSubtitle')}
                </p>
              </div>
            </div>

            <button
              onClick={() => setStep('record')}
              className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-orange-600"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>{t('voiceRegister.recordAgain')}</span>
            </button>
          </div>

          {/* Form fields */}
          <div className="grid sm:grid-cols-2 gap-4 text-xs font-bold text-slate-700 dark:text-slate-300">
            <div>
              <label className="block mb-1">{t('voiceRegister.nameLabel')}</label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 text-sm font-semibold focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1">{t('voiceRegister.skillLabel')}</label>
              <div className="relative">
                <Wrench className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <select
                  value={primarySkill}
                  onChange={(e) => {
                    setPrimarySkill(e.target.value);
                    const s = CANONICAL_SKILLS.find((x) => x.canonical === e.target.value);
                    if (s) setDailyWage(s.baseDailyWageInr);
                  }}
                  className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 text-sm font-semibold focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >
                  {CANONICAL_SKILLS.map((sk) => (
                    <option key={sk.canonical} value={sk.canonical}>
                      {getLocalizedTrade(sk.canonical, currentLang)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block mb-1">{t('voiceRegister.expLabel')}</label>
              <div className="relative">
                <Clock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="number"
                  min={1}
                  max={40}
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(parseInt(e.target.value) || 1)}
                  className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 text-sm font-semibold focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1">{t('voiceRegister.locationLabel')}</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={locationCity}
                  onChange={(e) => setLocationCity(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 text-sm font-semibold focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1">{t('voiceRegister.wageLabel')} (₹)</label>
              <input
                type="number"
                step={50}
                value={dailyWage}
                onChange={(e) => setDailyWage(parseInt(e.target.value) || 800)}
                className="w-full rounded-xl border border-slate-300 p-3 text-sm font-semibold focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block mb-1">{t('voiceRegister.phoneLabel')}</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 text-sm font-semibold focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Optional 30s portfolio video upload */}
          <div className="rounded-2xl border border-dashed border-slate-300 p-4 dark:border-slate-700 text-xs text-center space-y-2">
            <Video className="mx-auto h-6 w-6 text-slate-400" />
            <div className="font-bold text-slate-700 dark:text-slate-300">
              {t('voiceRegister.videoPortfolio')}
            </div>
            <p className="text-[11px] text-slate-500">
              {t('voiceRegister.videoPortfolioHint')}
            </p>
            <label className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2 font-bold text-slate-700 hover:bg-slate-200 cursor-pointer dark:bg-slate-800 dark:text-slate-300">
              <Upload className="h-3.5 w-3.5" />
              <span>{portfolioVideoName ? portfolioVideoName : t('voiceRegister.videoPortfolio')}</span>
              <input
                type="file"
                accept="video/*,image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setPortfolioVideoName(e.target.files[0].name);
                  }
                }}
              />
            </label>
          </div>

          {/* Confirm Button */}
          <button
            type="button"
            onClick={handleSaveProfile}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 py-4 text-base font-black text-white shadow-lg hover:bg-orange-500 active:scale-95 transition"
          >
            <CheckCircle2 className="h-5 w-5" />
            <span>{t('voiceRegister.saveButton')}</span>
          </button>
        </div>
      )}

      {/* Step 3: Success Confirmation Card */}
      {step === 'complete' && (
        <div className="rounded-3xl bg-white p-8 text-center shadow-xl border border-orange-100 dark:bg-slate-900 dark:border-slate-800 space-y-6 animate-fadeIn">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 animate-bounce">
            <CheckCircle2 className="h-10 w-10" />
          </div>

          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {t('voiceRegister.successTitle')}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-md mx-auto">
              {t('voiceRegister.successSubtitle')}
            </p>
          </div>

          {/* Localized Profile Summary Card with Audio Playback */}
          <div className="rounded-2xl border border-orange-200 bg-orange-50/50 p-5 dark:border-slate-700 dark:bg-slate-800/80 text-left space-y-3 max-w-md mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t('voiceRegister.nameLabel')}</span>
                <div className="text-base font-black text-slate-900 dark:text-white">{fullName}</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const summaryText = `${fullName}, ${localizedTrade(primarySkill)}, ${experienceYears} ${t('voiceRegister.expYearsUnit')}, ${locationCity}, ${localizedCurrency(dailyWage)} / ${t('common.days')}`;
                  speakVernacular(summaryText, currentLang);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-orange-600 text-white px-3 py-1.5 text-xs font-bold hover:bg-orange-700 transition"
                title={t('voiceRegister.listenSummary')}
              >
                <Volume2 className="h-4 w-4" />
                <span>{t('common.listen')}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-orange-100 dark:border-slate-700 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">{t('voiceRegister.skillLabel')}</span>
                <span className="font-bold text-orange-700 dark:text-orange-400 text-sm">
                  {localizedTrade(primarySkill)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">{t('voiceRegister.wageLabel')}</span>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {localizedCurrency(dailyWage)} / {t('common.days')}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">{t('voiceRegister.expLabel')}</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {experienceYears} {t('voiceRegister.expYearsUnit')}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">{t('voiceRegister.locationLabel')}</span>
                <span className="font-bold text-slate-900 dark:text-white">{locationCity}</span>
              </div>
            </div>

            {recordedAudioUrl && (
              <div className="pt-2 border-t border-orange-100 dark:border-slate-700">
                <span className="text-[11px] text-slate-500 block mb-1">{t('voiceRegister.originalScript')}</span>
                <audio controls src={recordedAudioUrl} className="w-full h-8" />
              </div>
            )}
          </div>

          {/* Action Cards */}
          <div className="grid sm:grid-cols-2 gap-3 text-left max-w-lg mx-auto">
            <button
              onClick={() => openModal('aadhaar')}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50 text-emerald-950 border border-emerald-200 hover:bg-emerald-100 transition dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800"
            >
              <ShieldCheck className="h-6 w-6 text-emerald-600 shrink-0" />
              <div>
                <div className="font-black text-xs">{t('kyc.modalTitle')}</div>
                <div className="text-[10px] text-emerald-700 dark:text-emerald-300">{t('kyc.verifiedBadge')}</div>
              </div>
            </button>

            <button
              onClick={() => openModal('quiz')}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-orange-50 text-orange-950 border border-orange-200 hover:bg-orange-100 transition dark:bg-orange-950/60 dark:text-orange-200 dark:border-orange-800"
            >
              <Award className="h-6 w-6 text-orange-600 shrink-0" />
              <div>
                <div className="font-black text-xs">{t('quiz.modalTitle')}</div>
                <div className="text-[10px] text-orange-700 dark:text-orange-300">{t('quiz.modalSubtitle')}</div>
              </div>
            </button>
          </div>

          <button
            onClick={() => onSuccessNavigate('worker-dashboard')}
            className="flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-8 py-3.5 text-sm font-black text-white shadow-lg hover:bg-orange-500 transition mx-auto"
          >
            <span>{t('voiceRegister.viewDashboard')}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};
