import React, { useState, useEffect } from 'react';
import { Phone, Lock, ArrowRight, ShieldCheck, UserCheck, Briefcase, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { useAppStore } from '../store';
import { otpService } from '../services/msg91OtpService';
import { UserRole, EmployerType } from '../types';
import { useTranslation } from '../i18n';

interface AuthPageProps {
  onSuccessNavigate: (tab: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccessNavigate }) => {
  const { loginWithPhone, loginAsWorker, loginAsEmployer, loginAsAdmin } = useAppStore();
  const { t } = useTranslation();

  const [step, setStep] = useState<'phone' | 'otp' | 'role_select'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('worker');
  const [selectedEmployerType, setSelectedEmployerType] = useState<EmployerType>('contractor');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((t) => t - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const clean = phoneNumber.replace(/\D/g, '');
    if (clean.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await otpService.sendOtp(clean);
      if (res.success) {
        setResendTimer(res.resendTimerSeconds);
        setStep('otp');
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await otpService.verifyOtp(phoneNumber, otp);
      if (res.valid) {
        // Next step: role selection
        setStep('role_select');
      } else {
        setErrorMessage(res.message);
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'OTP verification error');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteLogin = () => {
    loginWithPhone(phoneNumber, selectedRole);
    if (selectedRole === 'worker') {
      onSuccessNavigate('worker-dashboard');
    } else if (selectedRole === 'employer') {
      onSuccessNavigate('employer-dashboard');
    } else {
      onSuccessNavigate('admin-dashboard');
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-orange-100 dark:bg-slate-900 dark:border-slate-800 animate-fadeIn">
        {/* Brand Banner */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white font-black text-2xl shadow-lg shadow-orange-500/25">
            SB
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            {step === 'role_select' ? t('auth.selectRole') : t('auth.loginTitle')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {step === 'role_select'
              ? t('auth.selectRole')
              : t('auth.loginSubtitle')}
          </p>
        </div>

        {errorMessage && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Step 1: Phone input */}
        {step === 'phone' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('auth.phoneLabel')}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3.5 text-sm font-bold text-slate-400">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder={t('auth.phonePlaceholder')}
                  className="w-full rounded-2xl border border-slate-300 py-3.5 pl-14 pr-4 text-base font-bold tracking-wider focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 py-3.5 text-sm font-black text-white shadow-lg hover:bg-orange-500 active:scale-95 transition disabled:opacity-50"
            >
              <span>{loading ? t('common.loading') : t('auth.sendOtp')}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        )}

        {/* Step 2: OTP verification */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="rounded-2xl bg-amber-50 p-3 text-center text-xs text-amber-900 border border-amber-200 dark:bg-slate-800 dark:text-amber-300">
              {t('auth.otpSubtitle', { phone: `+91 ${phoneNumber}` })} <strong>(Demo OTP: 123456)</strong>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('auth.enterOtp')}
              </label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full text-center rounded-2xl border border-slate-300 p-3 text-2xl font-mono font-black tracking-widest focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 6}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-sm font-black text-white shadow-lg hover:bg-emerald-500 active:scale-95 transition disabled:opacity-50"
            >
              <span>{loading ? t('common.loading') : t('auth.verifyOtp')}</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <div className="text-center pt-2">
              {resendTimer > 0 ? (
                <span className="text-xs text-slate-400">{t('auth.resendCooldown', { seconds: resendTimer })}</span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="inline-flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>{t('auth.resendOtp')}</span>
                </button>
              )}
            </div>
          </form>
        )}

        {/* Step 3: Role Selection (First Login) */}
        {step === 'role_select' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setSelectedRole('worker')}
                className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${
                  selectedRole === 'worker'
                    ? 'border-orange-500 bg-orange-50/60 dark:bg-orange-950/40 text-orange-950 dark:text-white ring-2 ring-orange-500/30'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-600 text-white font-bold">
                  ⚡
                </div>
                <div>
                  <div className="font-black text-sm">{t('auth.roleWorker')}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Electrician, plumber, mason, carpenter, painter, or driver seeking verified jobs.
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('employer')}
                className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${
                  selectedRole === 'employer'
                    ? 'border-teal-500 bg-teal-50/60 dark:bg-teal-950/40 text-teal-950 dark:text-white ring-2 ring-teal-500/30'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white font-bold">
                  🏢
                </div>
                <div>
                  <div className="font-black text-sm">{t('auth.roleEmployer')}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Hiring informal trade workers for households, construction sites, or enterprises.
                  </div>
                </div>
              </button>
            </div>

            {selectedRole === 'employer' && (
              <div className="space-y-1.5 pt-2 border-t dark:border-slate-800">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Select Employer Category:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {[
                    { id: 'household', label: '🏠 Household' },
                    { id: 'contractor', label: '🏗️ Contractor' },
                    { id: 'small_business', label: '🏪 Small Business' },
                    { id: 'enterprise', label: '🏢 Enterprise' }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedEmployerType(cat.id as EmployerType)}
                      className={`rounded-xl border p-2 text-left font-bold transition ${
                        selectedEmployerType === cat.id
                          ? 'border-teal-600 bg-teal-50 text-teal-900 dark:bg-teal-950 dark:text-teal-200'
                          : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleCompleteLogin}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-600 py-3.5 text-sm font-black text-white shadow-lg hover:bg-orange-500 active:scale-95 transition"
            >
              <span>{t('common.submit')}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* 1-Click Demo Logins Section */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider justify-center">
            <Sparkles className="h-3.5 w-3.5 text-orange-500" />
            <span>{t('auth.quickLogin')}</span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => {
                loginAsWorker('w-ngp-01');
                onSuccessNavigate('worker-dashboard');
              }}
              className="flex items-center justify-between rounded-xl bg-orange-50 px-3.5 py-2.5 text-xs font-bold text-orange-900 border border-orange-200 hover:bg-orange-100 dark:bg-orange-950/60 dark:text-orange-200 dark:border-orange-800 transition"
            >
              <span>⚡ {t('auth.demoWorker')}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                loginAsEmployer('emp-01');
                onSuccessNavigate('employer-dashboard');
              }}
              className="flex items-center justify-between rounded-xl bg-teal-50 px-3.5 py-2.5 text-xs font-bold text-teal-900 border border-teal-200 hover:bg-teal-100 dark:bg-teal-950/60 dark:text-teal-200 dark:border-teal-800 transition"
            >
              <span>🏢 {t('auth.demoEmployer')}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                loginAsAdmin();
                onSuccessNavigate('admin-dashboard');
              }}
              className="flex items-center justify-between rounded-xl bg-slate-100 px-3.5 py-2.5 text-xs font-bold text-slate-800 border border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 transition"
            >
              <span>🛡️ {t('auth.demoAdmin')}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
