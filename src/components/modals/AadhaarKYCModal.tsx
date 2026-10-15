import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, Award, FileText, ArrowRight, Lock } from 'lucide-react';
import { useAppStore } from '../../store';
import { aadhaarDigiLockerService, DigiLockerCertificate } from '../../services/aadhaarDigiLockerService';
import { workersRepo } from '../../services/db';
import { useTranslation } from '../../i18n';

export const AadhaarKYCModal: React.FC = () => {
  const { currentWorker, closeModal, refreshUserData } = useAppStore();
  const { t } = useTranslation();
  const [step, setStep] = useState<'input' | 'otp' | 'success'>('input');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [maskedNumber, setMaskedNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [certificates, setCertificates] = useState<DigiLockerCertificate[]>([]);

  if (!currentWorker) return null;

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (aadhaarNumber.replace(/\D/g, '').length !== 12) {
      setError('Please enter a valid 12-digit Aadhaar number.');
      return;
    }
    setLoading(true);
    try {
      const res = await aadhaarDigiLockerService.requestAadhaarOtp(aadhaarNumber);
      setMaskedNumber(res.maskedNumber);
      setStep('otp');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to request OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await aadhaarDigiLockerService.verifyAadhaarOtp(aadhaarNumber, otp);
      
      // Call live server endpoint for backend persistence and audit log
      try {
        await fetch('/api/v1/kyc/aadhaar/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workerId: currentWorker.id,
            aadhaarNumber,
            otp
          })
        });
      } catch (e) {
        console.warn('Backend KYC sync warning:', e);
      }

      // Fetch DigiLocker certificates
      const certs = await aadhaarDigiLockerService.fetchDigiLockerCertificates(currentWorker.phone);
      setCertificates(certs);

      // Update worker in db (NEVER store raw number, only hash)
      const updated = {
        ...currentWorker,
        aadhaarVerified: true,
        aadhaarHash: result.aadhaarHash,
        status: 'active' as const,
        verifiedSkillBadges: Array.from(
          new Set([...currentWorker.verifiedSkillBadges, 'Aadhaar Verified', 'ITI Certified', 'SkillBridge Verified Pro'])
        )
      };
      workersRepo.save(updated);
      refreshUserData();
      setStep('success');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800 animate-fadeIn">
        <button
          onClick={closeModal}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              {t('kyc.modalTitle')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('kyc.modalSubtitle')}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Step 1: Input Aadhaar */}
        {step === 'input' && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('kyc.aadhaarLabel')}
              </label>
              <input
                type="text"
                maxLength={12}
                value={aadhaarNumber}
                onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, ''))}
                placeholder={t('kyc.aadhaarPlaceholder')}
                className="w-full rounded-2xl border border-slate-300 p-3.5 text-base font-mono font-bold tracking-widest focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div className="rounded-2xl bg-amber-50/70 p-3 text-[11px] leading-relaxed text-amber-900 dark:bg-slate-800 dark:text-amber-300 border border-amber-200/60 dark:border-slate-700 flex items-start gap-2">
              <Lock className="h-4 w-4 shrink-0 text-amber-700 dark:text-amber-400 mt-0.5" />
              <span>
                {t('kyc.dpdpNotice')}
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-sm font-black text-white shadow-lg hover:bg-emerald-500 transition disabled:opacity-50"
            >
              <span>{loading ? t('common.loading') : t('kyc.sendOtp')}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="text-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60">
              <span className="text-xs text-slate-500">{t('auth.enterOtp')}:</span>
              <div className="font-mono font-bold text-base text-slate-900 dark:text-white">{maskedNumber}</div>
              <span className="text-[11px] text-emerald-600 font-semibold">(Test Demo OTP: 123456)</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('kyc.enterOtp')}
              </label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full text-center rounded-2xl border border-slate-300 p-3 text-2xl font-mono font-black tracking-widest focus:border-emerald-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-sm font-black text-white shadow-lg hover:bg-emerald-500 transition disabled:opacity-50"
            >
              <span>{loading ? t('common.loading') : t('kyc.verifyAadhaar')}</span>
              <CheckCircle2 className="h-4 w-4" />
            </button>
          </form>
        )}

        {/* Step 3: Success & DigiLocker Certificates */}
        {step === 'success' && (
          <div className="space-y-4 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 animate-bounce">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div>
              <h4 className="text-lg font-black text-slate-900 dark:text-white">
                {t('kyc.verifiedSuccess')}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {t('kyc.verifiedBadge')}
              </p>
            </div>

            {/* DigiLocker Fetched Badges */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left dark:border-slate-800 dark:bg-slate-800/60 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                <Award className="h-4 w-4" />
                <span>{t('kyc.digilockerTitle')}</span>
              </div>
              {certificates.map((cert, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs border-t pt-2 dark:border-slate-700">
                  <FileText className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200">{cert.title}</div>
                    <div className="text-[10px] text-slate-500">{cert.issuer} • #{cert.certificateNumber}</div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={closeModal}
              className="w-full rounded-2xl bg-orange-600 py-3 text-sm font-bold text-white shadow hover:bg-orange-500 transition"
            >
              {t('common.close')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
