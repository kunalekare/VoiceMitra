import React, { useState } from 'react';
import { ShieldCheck, FileText, UserCheck, AlertTriangle, ArrowLeft, Mail, MapPin, Phone, CheckCircle2 } from 'lucide-react';

interface LegalCompliancePageProps {
  initialTab?: 'terms' | 'privacy' | 'grievance' | 'sandbox-disclaimer';
  onBack?: () => void;
}

export const LegalCompliancePage: React.FC<LegalCompliancePageProps> = ({
  initialTab = 'privacy',
  onBack
}) => {
  const [activeTab, setActiveTab] = useState<'terms' | 'privacy' | 'grievance' | 'sandbox-disclaimer'>(initialTab);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-orange-200/80 pb-6 dark:border-slate-800">
        <div>
          {onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 text-xs font-bold text-orange-600 hover:text-orange-700 dark:text-orange-400 mb-2 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to platform</span>
            </button>
          )}
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-orange-600" />
            Compliance, Terms & Privacy
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Statutory disclosures under DPDP Act 2023, Information Technology Rules 2021, and Sandbox Operating Rules
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex flex-wrap gap-2 bg-orange-100/50 p-1.5 rounded-2xl dark:bg-slate-800">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'privacy'
                ? 'bg-white dark:bg-slate-900 text-orange-600 shadow'
                : 'text-slate-600 dark:text-slate-300 hover:text-orange-600'
            }`}
          >
            Privacy Policy (DPDP)
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'terms'
                ? 'bg-white dark:bg-slate-900 text-orange-600 shadow'
                : 'text-slate-600 dark:text-slate-300 hover:text-orange-600'
            }`}
          >
            Terms of Service
          </button>
          <button
            onClick={() => setActiveTab('grievance')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'grievance'
                ? 'bg-white dark:bg-slate-900 text-orange-600 shadow'
                : 'text-slate-600 dark:text-slate-300 hover:text-orange-600'
            }`}
          >
            Grievance Officer
          </button>
          <button
            onClick={() => setActiveTab('sandbox-disclaimer')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'sandbox-disclaimer'
                ? 'bg-white dark:bg-slate-900 text-orange-600 shadow'
                : 'text-slate-600 dark:text-slate-300 hover:text-orange-600'
            }`}
          >
            Sandbox Disclosures
          </button>
        </div>
      </div>

      {/* Tab 1: Privacy Policy under DPDP Act 2023 */}
      {activeTab === 'privacy' && (
        <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-orange-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            <FileText className="h-4 w-4" />
            Digital Personal Data Protection Act, 2023 (DPDP) Policy
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            1. Data Fiduciary Notice & Principles
          </h2>
          <p>
            SkillBridge Technologies acts as a <strong>Data Fiduciary</strong> under India's Digital Personal Data Protection Act, 2023. We collect personal data (phone numbers, full names, trade skill descriptions, district locations, and voice recordings) exclusively for lawful specified purposes: facilitating direct match-making and wage disbursement between informal workers and prospective employers.
          </p>

          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            2. Voice Processing & Speech-to-Text Consent
          </h3>
          <p>
            When a worker uses the Voice Registration or employer uses the Voice Job Match feature, temporary audio snippets are processed via server-side Google Gemini APIs. The audio is used solely to transcribe trade skills and extract structured entities (trade, experience, city). SkillBridge does not use biometric voiceprints for user surveillance or third-party marketing.
          </p>

          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            3. Absolute Ban on Raw Aadhaar Storage
          </h3>
          <p>
            In strict compliance with Aadhaar Act Regulations and UIDAI guidelines, SkillBridge <strong>never stores 12-digit Aadhaar numbers, biometric fingerprint templates, or iris scans</strong>. During e-KYC sandbox verification, only the last 4 digits (e.g. XXXX-XXXX-9021), an encrypted reference ID, and a server-side HMAC peppered hash for duplicate prevention are retained.
          </p>

          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            4. Data Principal Rights (Erasure, Correction, Export)
          </h3>
          <p>
            Under Section 11 of the DPDP Act 2023, you have the statutory right to withdraw consent and request complete erasure of your profile. Clicking <em>"Delete My Data"</em> in the Privacy Settings immediately anonymizes your personal identifiers across active databases while preserving mandatory financial transaction records in the double-entry escrow ledger as required by tax and anti-money-laundering regulations.
          </p>
        </div>
      )}

      {/* Tab 2: Terms of Service */}
      {activeTab === 'terms' && (
        <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-orange-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
            <FileText className="h-4 w-4" />
            Terms of Service & Marketplace Guidelines
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            1. Nature of the Platform
          </h2>
          <p>
            SkillBridge provides a technology marketplace matching independent informal workers (electricians, plumbers, masons, painters, carpenters, and allied trades) with employers, contractors, and households. SkillBridge is not an employer, contractor, or employment agency. Independent workers set their trade availability and negotiate their terms freely.
          </p>

          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            2. Escrow-Style Held Payments (Sandbox Mode Notice)
          </h3>
          <p>
            The platform provides escrow-style held payment workflows where employers fund the booking before work commences. In this demo/sandbox environment, payment orders, HMAC signature verification, and RazorpayX payouts are simulated for safety. In production deployments, real escrow requires a licensed RBI-authorized payment aggregator partner (e.g., Razorpay Escrow / ICICI Escrow).
          </p>

          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            3. Worker Fair Wage Commitment
          </h3>
          <p>
            SkillBridge adheres to transparent minimum daily wage benchmarks in accordance with the Code on Wages, 2019. Platform fees are capped at a nominal 5% to prevent predatory commission deductions on informal workers.
          </p>

          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            4. Dispute Resolution Process
          </h3>
          <p>
            In the event of uncompleted work or trade discrepancies, either party may initiate a dispute. During an active dispute, escrow funds are frozen until our mediation desk investigates evidence and issues a fair refund or release decision.
          </p>
        </div>
      )}

      {/* Tab 3: Statutory Grievance Officer */}
      {activeTab === 'grievance' && (
        <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-orange-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            <UserCheck className="h-4 w-4" />
            Statutory Grievance Redressal Mechanism
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Grievance Officer Details (IT Rules 2021 & DPDP Act 2023)
          </h2>
          <p>
            In accordance with the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, and the Digital Personal Data Protection Act, 2023, the details of the designated Grievance Officer are published below:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
            <div className="p-5 rounded-2xl bg-amber-50 dark:bg-slate-800 border border-orange-200/80 dark:border-slate-700 space-y-2">
              <div className="text-xs font-bold uppercase text-slate-500">Designated Grievance Officer</div>
              <div className="text-base font-black text-slate-900 dark:text-white">Mr. Rajeshwar Sharma</div>
              <div className="text-xs text-orange-600 dark:text-orange-400 font-semibold">Head of Trust, Safety & Compliance</div>
              <div className="pt-2 text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span>grievance-officer@skillbridge.in</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span>+91 (080) 4719-0099 (Mon-Fri 10:00 - 18:00 IST)</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>SkillBridge Technologies Pvt. Ltd., Tech Park Phase 2, Civil Lines, Nagpur, MH 440001, India</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-teal-50 dark:bg-slate-800 border border-teal-200/80 dark:border-slate-700 space-y-3">
              <div className="text-xs font-bold uppercase text-slate-500">Service Level Commitment</div>
              <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                  <span><strong>Acknowledgement:</strong> Grievances will be acknowledged within 24 hours of ticket receipt.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                  <span><strong>Resolution:</strong> Complaints will be investigated and resolved within 15 calendar days.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                  <span><strong>Appeals:</strong> Grievance appeals may be escalated to the Data Protection Board of India.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Sandbox & Simulation Disclosures */}
      {activeTab === 'sandbox-disclaimer' && (
        <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-orange-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            Integrations & Simulated Services Notice
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Honest Disclosure on Sandbox vs Live Mode
          </h2>
          <p>
            To provide a fully functional testbed without incurring external carrier costs or requiring private credential access, specific third-party integrations operate in a high-fidelity <strong>sandbox simulation mode</strong> by default:
          </p>

          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <span className="font-bold text-slate-900 dark:text-white">Aadhaar e-KYC & DigiLocker:</span> Simulated verification sandbox. Replaces live UIDAI API calls with realistic NCVT ITI certificate mocks. Raw 12-digit Aadhaar numbers are never collected or stored.
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <span className="font-bold text-slate-900 dark:text-white">Escrow Payment Gateway:</span> Escrow-style held payment simulator with integer paise double-entry accounting. Live Razorpay orders and webhook signature verification trigger automatically when <code>RAZORPAY_KEY_ID</code> and <code>RAZORPAY_KEY_SECRET</code> environment variables are supplied.
            </div>
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <span className="font-bold text-slate-900 dark:text-white">WhatsApp & Phone IVR:</span> Interactive simulator modals dispatching real webhook payloads to <code>/api/v1/webhooks/*</code>, preserving conversational state in SQLite. Real Meta WhatsApp Cloud API and Exotel IVR can be connected without backend restructuring.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
