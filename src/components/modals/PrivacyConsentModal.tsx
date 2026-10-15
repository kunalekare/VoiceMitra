import React, { useState } from 'react';
import { X, ShieldCheck, Check, Trash2, Lock, FileText, AlertCircle } from 'lucide-react';
import { useAppStore } from '../../store';

export const PrivacyConsentModal: React.FC = () => {
  const { closeModal } = useAppStore();
  const [dataDeleted, setDataDeleted] = useState(false);
  const [purposes, setPurposes] = useState({
    voiceMatch: true,
    employerContact: true,
    paymentEscrow: true,
    governmentAudit: true
  });

  const handleDeleteAllData = () => {
    setDataDeleted(true);
    setTimeout(() => {
      closeModal();
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-fadeIn">
        <button
          onClick={closeModal}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400">
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Data Privacy & DPDP Act 2023 Consent
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              India Digital Personal Data Protection Act Compliance
            </p>
          </div>
        </div>

        {dataDeleted ? (
          <div className="text-center py-6 space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Check className="h-8 w-8" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Data Deletion Request Processed
            </h4>
            <p className="text-xs text-slate-500">
              Your voice recordings, session tokens, and KYC hashes have been purged per the DPDP Act right to be forgotten.
            </p>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            <div className="rounded-2xl bg-amber-50 p-3.5 text-amber-900 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 leading-relaxed">
              <strong>Statutory Disclosure:</strong> SkillBridge acts as a Data Fiduciary. We do not store raw Aadhaar numbers or biometrics. Voice recordings are processed in encrypted temporary memory solely for job matching and trade transcription.
            </div>

            <div className="space-y-2.5">
              <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                Consent Purposes (You can toggle any at will):
              </span>

              <label className="flex items-start gap-2.5 p-2 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={purposes.voiceMatch}
                  onChange={(e) => setPurposes({ ...purposes, voiceMatch: e.target.checked })}
                  className="mt-0.5 rounded text-orange-600 focus:ring-orange-500"
                />
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">Voice Processing for AI Job Matching</div>
                  <div className="text-[11px] text-slate-500">Transcribes your trade description into canonical skills for employers.</div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={purposes.employerContact}
                  onChange={(e) => setPurposes({ ...purposes, employerContact: e.target.checked })}
                  className="mt-0.5 rounded text-orange-600 focus:ring-orange-500"
                />
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">Employer Hiring & Phone Connect</div>
                  <div className="text-[11px] text-slate-500">Allows confirmed employers to contact you via WhatsApp or phone call.</div>
                </div>
              </label>

              <label className="flex items-start gap-2.5 p-2 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={purposes.paymentEscrow}
                  onChange={(e) => setPurposes({ ...purposes, paymentEscrow: e.target.checked })}
                  className="mt-0.5 rounded text-orange-600 focus:ring-orange-500"
                />
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">RBI-Compliant Wage Escrow & RazorpayX Disbursal</div>
                  <div className="text-[11px] text-slate-500">Secures your daily wages in bank escrow before work commences.</div>
                </div>
              </label>
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={handleDeleteAllData}
                className="flex items-center gap-1.5 text-red-600 hover:text-red-700 font-bold transition"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete My Data (Right to be Forgotten)</span>
              </button>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-2xl bg-orange-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-orange-500 transition"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
