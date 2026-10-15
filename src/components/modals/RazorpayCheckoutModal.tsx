import React, { useState } from 'react';
import { X, ShieldCheck, CreditCard, Building, Smartphone, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAppStore } from '../../store';
import { razorpayService } from '../../services/razorpayService';
import { jobsRepo, notificationsRepo, auditLogsRepo } from '../../services/db';
import { useTranslation, formatCurrency } from '../../i18n';

interface RazorpayModalData {
  jobId: string;
  workerNames: string[];
  workerIds: string[];
  skill: string;
  dailyWageInr: number;
  durationDays: number;
  totalWageInr: number;
  platformFeeInr: number;
  totalAmountInr: number;
  onPaymentSuccess?: () => void;
}

export const RazorpayCheckoutModal: React.FC = () => {
  const { modalData, closeModal, refreshUserData } = useAppStore();
  const { t, currentLang } = useTranslation();
  const data = modalData as RazorpayModalData | undefined;

  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [selectedUpiApp, setSelectedUpiApp] = useState<'gpay' | 'phonepe' | 'paytm' | 'qr'>('gpay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'checkout' | 'success' | 'failure'>('checkout');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!data) return null;

  const handleSimulatePayment = async (forceOutcome: 'success' | 'failure' = 'success') => {
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // 1. Create Razorpay order
      const order = await razorpayService.createOrder({
        jobId: data.jobId,
        employerId: 'emp-current',
        amountInr: data.totalAmountInr,
        platformFeeInr: data.platformFeeInr,
        wageAmountInr: data.totalWageInr
      });

      // Simulated network payment gateway delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      if (forceOutcome === 'failure') {
        throw new Error(t('errors.paymentFailed'));
      }

      // 2. Simulated HMAC-SHA256 signature verification
      const paymentId = `pay_rzp_${Date.now()}`;
      const signature = `sig_mock_${Math.random().toString(36).substr(2, 10)}`;

      const verification = await razorpayService.verifyPaymentSignature({
        orderId: order.orderId,
        paymentId,
        signature
      });

      if (!verification.verified) {
        throw new Error(t('payment.verifySignature'));
      }

      // 3. Update database job status to 'in_progress' and lock escrow
      jobsRepo.updateStatus(data.jobId, 'in_progress');

      // 4. Record audit log
      auditLogsRepo.log({
        id: `aud-${Date.now()}`,
        userId: 'emp-current',
        userRole: 'employer',
        action: 'ESCROW_DEPOSIT_LOCKED',
        resourceType: 'job',
        resourceId: data.jobId,
        payloadHash: signature,
        status: 'success'
      });

      // 5. Notify assigned workers
      data.workerIds.forEach((wId) => {
        notificationsRepo.addNotification({
          id: `notif-${Date.now()}-${wId}`,
          userId: wId,
          type: 'wage_escrow_locked',
          title: t('payment.escrowBadge'),
          message: `${formatCurrency(data.totalWageInr, currentLang)} • ${t('payment.escrowLocked')}`,
          read: false
        });
      });

      refreshUserData();
      setPaymentStatus('success');

      if (data.onPaymentSuccess) {
        data.onPaymentSuccess();
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : t('errors.paymentFailed'));
      setPaymentStatus('failure');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-fadeIn">
        <button
          onClick={closeModal}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label={t('common.close')}
        >
          <X className="h-5 w-5" />
        </button>

        {paymentStatus === 'checkout' && (
          <div className="space-y-4">
            {/* Header with Razorpay trusted badge */}
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-lg">
                  R
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {t('payment.checkoutTitle')}
                  </h3>
                  <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>{t('payment.escrowBadge')}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400">{t('payment.totalAmount')}</span>
                <div className="text-xl font-black text-slate-900 dark:text-white">
                  {formatCurrency(data.totalAmountInr, currentLang)}
                </div>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="rounded-2xl bg-amber-50/60 p-3.5 text-xs text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 border border-orange-200/50 dark:border-slate-700 space-y-1.5">
              <div className="flex justify-between">
                <span>{t('payment.wageAmount')} ({data.workerNames.join(', ')} • {data.durationDays} {t('common.days')}):</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(data.totalWageInr, currentLang)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>{t('payment.platformFeeAmount')}:</span>
                <span className="font-semibold">{formatCurrency(data.platformFeeInr, currentLang)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-orange-200/80 dark:border-slate-700 font-black text-sm text-slate-900 dark:text-white">
                <span>{t('payment.totalAmount')}:</span>
                <span className="text-orange-600 dark:text-orange-400">{formatCurrency(data.totalAmountInr, currentLang)}</span>
              </div>
            </div>

            {/* Payment Method Selector Tabs */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`flex flex-col items-center gap-1 rounded-2xl border p-2.5 text-xs font-bold transition ${
                  paymentMethod === 'upi'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400'
                }`}
              >
                <Smartphone className="h-4 w-4" />
                <span>UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`flex flex-col items-center gap-1 rounded-2xl border p-2.5 text-xs font-bold transition ${
                  paymentMethod === 'card'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400'
                }`}
              >
                <CreditCard className="h-4 w-4" />
                <span>{t('payment.payWithCard')}</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('netbanking')}
                className={`flex flex-col items-center gap-1 rounded-2xl border p-2.5 text-xs font-bold transition ${
                  paymentMethod === 'netbanking'
                    ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400'
                }`}
              >
                <Building className="h-4 w-4" />
                <span>{t('payment.payWithNetbanking')}</span>
              </button>
            </div>

            {/* UPI Options */}
            {paymentMethod === 'upi' && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {t('payment.payWithUpi')}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'gpay', name: 'Google Pay', icon: '🟢' },
                    { id: 'phonepe', name: 'PhonePe', icon: '🟣' },
                    { id: 'paytm', name: 'Paytm UPI', icon: '🔵' },
                    { id: 'qr', name: 'Scan UPI QR', icon: '📷' }
                  ].map((app) => (
                    <button
                      key={app.id}
                      type="button"
                      onClick={() => setSelectedUpiApp(app.id as typeof selectedUpiApp)}
                      className={`flex items-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition ${
                        selectedUpiApp === app.id
                          ? 'border-blue-600 bg-blue-50/80 text-blue-900 dark:bg-blue-950 dark:text-blue-200'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="text-base">{app.icon}</span>
                      <span>{app.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {paymentMethod === 'card' && (
              <div className="space-y-2 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">{t('payment.payWithCard')}</label>
                  <input
                    type="text"
                    disabled
                    value="•••• •••• •••• 4444 (Test Visa)"
                    className="w-full mt-1 rounded-xl border border-slate-300 p-2.5 bg-slate-50 font-mono dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>
              </div>
            )}

            {paymentMethod === 'netbanking' && (
              <div className="text-xs space-y-2">
                <span className="font-bold text-slate-700 dark:text-slate-300">{t('payment.payWithNetbanking')}</span>
                <div className="grid grid-cols-2 gap-2">
                  {['HDFC Bank', 'State Bank of India', 'ICICI Bank', 'Axis Bank'].map((bank) => (
                    <div key={bank} className="rounded-xl border border-slate-200 p-2.5 font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-300 bg-slate-50/50">
                      🏦 {bank}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Test Payment Action Buttons */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleSimulatePayment('success')}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3.5 text-sm font-black text-white shadow-lg hover:bg-blue-500 active:scale-95 transition disabled:opacity-50"
              >
                <span>{isProcessing ? t('common.loading') : `${t('common.submit')} ${formatCurrency(data.totalAmountInr, currentLang)}`}</span>
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleSimulatePayment('failure')}
                className="w-full text-center text-xs font-semibold text-slate-400 hover:text-red-500 transition py-1"
              >
                {t('common.retry')}
              </button>
            </div>
          </div>
        )}

        {paymentStatus === 'success' && (
          <div className="text-center space-y-4 py-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 animate-bounce">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div>
              <h4 className="text-xl font-black text-slate-900 dark:text-white">
                {t('payment.paymentSuccess')}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                {formatCurrency(data.totalWageInr, currentLang)} • {t('payment.escrowLocked')}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-3 text-xs text-left dark:bg-slate-800 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">{t('payment.transactionId')}:</span>
                <span className="font-mono font-bold">pay_SB_{Date.now().toString().slice(-8)}</span>
              </div>
            </div>

            <button
              onClick={closeModal}
              className="w-full rounded-2xl bg-emerald-600 py-3.5 text-sm font-black text-white shadow hover:bg-emerald-500 transition"
            >
              {t('common.close')}
            </button>
          </div>
        )}

        {paymentStatus === 'failure' && (
          <div className="text-center space-y-4 py-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400">
              <AlertTriangle className="h-8 w-8" />
            </div>

            <div>
              <h4 className="text-xl font-black text-slate-900 dark:text-white">
                {t('errors.paymentFailed')}
              </h4>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                {errorMessage || t('errors.paymentFailed')}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setPaymentStatus('checkout')}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-blue-600 py-3 text-xs font-bold text-white shadow hover:bg-blue-500 transition"
              >
                <RefreshCw className="h-4 w-4" />
                <span>{t('common.retry')}</span>
              </button>
              <button
                onClick={closeModal}
                className="rounded-2xl border border-slate-300 px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
