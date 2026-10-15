import React, { useState } from 'react';
import {
  Building2,
  FileText,
  Upload,
  Download,
  CheckCircle2,
  Users,
  ShieldCheck,
  CreditCard,
  Crown,
  FileSpreadsheet,
  ArrowRight
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { useAppStore } from '../store';
import { SubscriptionPlan } from '../types';

export const EnterprisePortal: React.FC = () => {
  const { currentEmployer } = useAppStore();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(
    currentEmployer?.plan || 'contractor_monthly'
  );
  const [csvUploaded, setCsvUploaded] = useState(false);
  const [csvRowsCount, setCsvRowsCount] = useState(0);
  const [disbursementSuccess, setDisbursementSuccess] = useState(false);

  // Generate real client-side GST Tax Invoice PDF
  const handleDownloadGstInvoice = () => {
    const doc = new jsPDF();

    // Invoice Header
    doc.setFontSize(22);
    doc.setTextColor(234, 88, 12); // Saffron
    doc.text('SkillBridge India Technologies Pvt Ltd', 14, 22);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Ministry of Corporate Affairs CIN: U72900MH2024PTC98129', 14, 28);
    doc.text('GSTIN: 27AABCS1429B1Z2 • HSN/SAC: 998519 (Workforce Services)', 14, 33);
    doc.text('Registered Office: Tech Park, Dharampeth, Nagpur, Maharashtra - 440010', 14, 38);

    doc.setDrawColor(200);
    doc.line(14, 42, 196, 42);

    // Bill To
    doc.setFontSize(12);
    doc.setTextColor(30);
    doc.text('TAX INVOICE / ESCROW RECEIPT', 14, 50);

    doc.setFontSize(10);
    doc.text(`Invoice No: SB/INV/2026/0889`, 14, 58);
    doc.text(`Date of Issue: ${new Date().toLocaleDateString('en-IN')}`, 14, 63);
    doc.text(`Billed To: ${currentEmployer?.businessName || 'Sharma Constructions Ltd'}`, 14, 68);
    doc.text(`Client GSTIN: ${currentEmployer?.companyGst || '27AAACA9082P1ZV'}`, 14, 73);
    doc.text(`Location: ${currentEmployer?.district || 'Nagpur'}, Maharashtra`, 14, 78);

    // Table Header
    doc.setFillColor(245, 245, 245);
    doc.rect(14, 85, 182, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Item Description', 16, 90);
    doc.text('Qty / Days', 110, 90);
    doc.text('Rate (INR)', 140, 90);
    doc.text('Amount (INR)', 170, 90);

    // Line items
    doc.setFont('helvetica', 'normal');
    doc.text('1. Electrician Wiring Services (Rameshwar Patil)', 16, 100);
    doc.text('5 Days', 110, 100);
    doc.text('850.00', 140, 100);
    doc.text('4,250.00', 170, 100);

    doc.text('2. SkillBridge Nodal Escrow Facilitation Fee', 16, 108);
    doc.text('1 Contract', 110, 108);
    doc.text('149.00', 140, 108);
    doc.text('149.00', 170, 108);

    doc.text('3. Integrated GST @ 18% (on platform fee)', 16, 116);
    doc.text('18%', 110, 116);
    doc.text('26.82', 140, 116);
    doc.text('26.82', 170, 116);

    doc.line(14, 124, 196, 124);

    // Total
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Total Escrow Disbursed:', 110, 132);
    doc.setTextColor(234, 88, 12);
    doc.text('INR 4,425.82', 165, 132);

    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text('This is a computer-generated tax invoice verified under the IT Act 2000.', 14, 150);
    doc.text('Payment Gateway Architecture: Razorpay Payments Gateway escrow-ready account.', 14, 155);

    doc.save(`SkillBridge_Tax_Invoice_${Date.now()}.pdf`);
  };

  const handleSimulateCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvUploaded(true);
      setCsvRowsCount(12); // Simulated 12 bulk worker requirements parsed
    }
  };

  const handleSimulateRazorpayXDisbursement = () => {
    setDisbursementSuccess(true);
    setTimeout(() => setDisbursementSuccess(false), 3000);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 px-3 py-1 text-xs font-black text-teal-800 dark:bg-teal-950 dark:text-teal-300 mb-1">
            <Building2 className="h-3.5 w-3.5" />
            <span>B2B & Construction Portal</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">
            Enterprise Contractor Portal
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Bulk workforce requisition, GST invoices, RazorpayX instant wage disbursement, and tiered plans.
          </p>
        </div>

        <button
          onClick={handleDownloadGstInvoice}
          className="flex items-center gap-2 rounded-2xl bg-orange-600 px-5 py-3 text-xs font-black text-white shadow-lg hover:bg-orange-500 active:scale-95 transition"
        >
          <Download className="h-4 w-4" />
          <span>Download GST Tax Invoice (PDF)</span>
        </button>
      </div>

      {/* Subscription Plans Tier Matrix */}
      <div className="space-y-4">
        <h3 className="text-xl font-black text-slate-900 dark:text-white">
          Employer Subscription Plans
        </h3>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Free Tier */}
          <div
            className={`rounded-3xl p-6 border transition space-y-4 ${
              selectedPlan === 'free'
                ? 'border-orange-500 bg-orange-50/40 ring-2 ring-orange-500/20 dark:bg-slate-900'
                : 'border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800'
            }`}
          >
            <div>
              <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Household</span>
              <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1">Free Tier</h4>
              <div className="text-sm font-bold text-slate-500">₹0 / month</div>
            </div>

            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-2">✓ Up to 5 worker searches / month</li>
              <li className="flex items-center gap-2">✓ Standard phone contacts</li>
              <li className="flex items-center gap-2">✓ ₹199 platform fee per hire</li>
            </ul>

            <button
              onClick={() => setSelectedPlan('free')}
              className={`w-full rounded-2xl py-2.5 text-xs font-bold transition ${
                selectedPlan === 'free' ? 'bg-orange-600 text-white' : 'border border-slate-300 text-slate-700'
              }`}
            >
              {selectedPlan === 'free' ? 'Current Plan' : 'Select Free'}
            </button>
          </div>

          {/* Contractor Monthly Tier */}
          <div
            className={`relative rounded-3xl p-6 border transition space-y-4 ${
              selectedPlan === 'contractor_monthly'
                ? 'border-orange-600 bg-orange-50/70 ring-4 ring-orange-500/20 dark:bg-slate-900'
                : 'border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800'
            }`}
          >
            <span className="absolute -top-3 right-6 rounded-full bg-orange-600 px-3 py-1 text-[10px] font-black uppercase text-white shadow">
              Most Popular
            </span>
            <div>
              <span className="text-xs font-black text-orange-600 uppercase tracking-wider">Contractor</span>
              <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1">₹499 / mo</h4>
              <div className="text-sm font-bold text-slate-500">Billed monthly recurring (Mock)</div>
            </div>

            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-2">✓ Unlimited candidate searches & map view</li>
              <li className="flex items-center gap-2">✓ AI Voice Job Matching priority</li>
              <li className="flex items-center gap-2">✓ Group hiring up to 10 workers</li>
              <li className="flex items-center gap-2">✓ Discounted ₹149 platform fee per hire</li>
            </ul>

            <button
              onClick={() => setSelectedPlan('contractor_monthly')}
              className={`w-full rounded-2xl py-2.5 text-xs font-black shadow transition ${
                selectedPlan === 'contractor_monthly' ? 'bg-orange-600 text-white' : 'border border-slate-300 text-slate-700'
              }`}
            >
              {selectedPlan === 'contractor_monthly' ? 'Active Plan' : 'Upgrade to Contractor'}
            </button>
          </div>

          {/* Enterprise Tier */}
          <div
            className={`rounded-3xl p-6 border transition space-y-4 ${
              selectedPlan === 'enterprise'
                ? 'border-teal-600 bg-teal-50/50 ring-2 ring-teal-500/20 dark:bg-slate-900'
                : 'border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800'
            }`}
          >
            <div>
              <span className="text-xs font-black text-teal-600 uppercase tracking-wider">Custom Corp</span>
              <h4 className="text-2xl font-black text-slate-900 dark:text-white mt-1">Enterprise</h4>
              <div className="text-sm font-bold text-slate-500">For Developers & Infra Cos</div>
            </div>

            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-2">✓ Multi-seat team manager accounts</li>
              <li className="flex items-center gap-2">✓ Bulk CSV requisition import</li>
              <li className="flex items-center gap-2">✓ Automated RazorpayX wage disbursement</li>
              <li className="flex items-center gap-2">✓ Lowest ₹99 platform fee + API Access</li>
            </ul>

            <button
              onClick={() => setSelectedPlan('enterprise')}
              className={`w-full rounded-2xl py-2.5 text-xs font-bold transition ${
                selectedPlan === 'enterprise' ? 'bg-teal-600 text-white' : 'border border-slate-300 text-slate-700'
              }`}
            >
              {selectedPlan === 'enterprise' ? 'Active Enterprise' : 'Switch to Enterprise'}
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Hiring via CSV Upload */}
      <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-teal-600" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Bulk Requisition via CSV Upload
            </h3>
          </div>
          <span className="text-xs text-slate-400">Deploy dozens of trades across multiple sites</span>
        </div>

        <div className="rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center dark:border-slate-700 space-y-3">
          <Upload className="mx-auto h-8 w-8 text-slate-400" />
          <div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Drop CSV of labor requirements (Skill, City, Days, Headcount, Wage)
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Supports standard SAP, ERP, or Excel CSV exports.
            </p>
          </div>

          <label className="inline-flex items-center gap-2 rounded-2xl bg-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-teal-500 cursor-pointer transition">
            <Upload className="h-4 w-4" />
            <span>Select CSV File</span>
            <input type="file" accept=".csv" onChange={handleSimulateCsvUpload} className="hidden" />
          </label>

          {csvUploaded && (
            <div className="mt-4 rounded-xl bg-teal-50 p-3 text-xs text-teal-900 border border-teal-200 dark:bg-teal-950 dark:text-teal-200 max-w-md mx-auto flex items-center justify-between">
              <span className="font-bold">✓ Parsed {csvRowsCount} bulk workforce orders across 3 sites</span>
              <button
                onClick={() => alert('Bulk orders submitted to escrow queue!')}
                className="rounded-lg bg-teal-700 px-3 py-1 font-bold text-white hover:bg-teal-600"
              >
                Deploy All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Wage Disbursement to Workers (Mock RazorpayX) */}
      <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-emerald-600" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Instant Wage Disbursement (RazorpayX)
            </h3>
          </div>
          <span className="text-xs text-emerald-600 font-bold">24x7 IMPS / UPI Live</span>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200 p-4 space-y-2 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Worker</span>
            <div className="font-bold text-sm text-slate-900 dark:text-white">Rameshwar Patil</div>
            <div className="text-xs text-slate-500">Wiring job #job-01 • ₹4,250</div>
            <button
              onClick={handleSimulateRazorpayXDisbursement}
              className="w-full rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition"
            >
              Disburse ₹4,250 via UPI
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4 space-y-2 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Worker</span>
            <div className="font-bold text-sm text-slate-900 dark:text-white">Santosh Kamble</div>
            <div className="text-xs text-slate-500">Plumbing job #job-02 • ₹2,400</div>
            <span className="inline-block rounded-lg bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              ✓ Disbursed (UTR: 88192019)
            </span>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4 space-y-2 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Worker</span>
            <div className="font-bold text-sm text-slate-900 dark:text-white">Vikram Shinde</div>
            <div className="text-xs text-slate-500">Industrial wiring • ₹1,800</div>
            <span className="inline-block rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              Awaiting Inspection
            </span>
          </div>
        </div>

        {disbursementSuccess && (
          <div className="rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-900 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
            ✓ RazorpayX simulated payout processed. IMPS UTR generated and SMS notification dispatched to worker.
          </div>
        )}
      </div>
    </div>
  );
};
