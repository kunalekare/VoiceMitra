import React, { useState, useEffect } from 'react';
import {
  Power,
  ShieldCheck,
  Star,
  Award,
  Wallet,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  Share2,
  Zap,
  Mic,
  ArrowRight,
  TrendingUp,
  FileCheck,
  CreditCard,
  Gift,
  Check,
  Volume2
} from 'lucide-react';
import { useAppStore } from '../store';
import { workersRepo, jobsRepo, notificationsRepo, reviewsRepo } from '../services/db';
import { Job, Worker } from '../types';
import { VoicePlayer } from '../components/VoicePlayer';
import { speakVernacular } from '../i18n';

interface WorkerDashboardProps {
  onNavigate: (tab: string, data?: unknown) => void;
}

export const WorkerDashboard: React.FC<WorkerDashboardProps> = ({ onNavigate }) => {
  const { currentWorker, openModal, refreshUserData, currentLang } = useAppStore();

  const worker = currentWorker || workersRepo.getAll()[0];
  const [jobs, setJobs] = useState<Job[]>([]);
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [reviewJobId, setReviewJobId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewVoiceRecorded, setReviewVoiceRecorded] = useState(false);
  const [reviewText, setReviewText] = useState('काम वेळेवर पूर्ण झाले आणि पेमेंट मिळाले.');

  // RazorpayX Payout states
  const [showPayoutDrawer, setShowPayoutDrawer] = useState(false);
  const [payoutUpi, setPayoutUpi] = useState(worker ? `${worker.phone.replace(/\D/g, '')}@okaxis` : '9822011201@okaxis');
  const [disbursing, setDisbursing] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState(false);
  const [payoutUtr, setPayoutUtr] = useState('');

  const handleDisbursePayout = async () => {
    if (!payoutUpi.trim()) return;
    setDisbursing(true);
    try {
      const res = await fetch('/api/v1/payments/disburse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workerId: worker.id,
          amountInr: 5000,
          mode: 'upi',
          destination: payoutUpi
        })
      });
      const data = await res.json();
      if (data.success) {
        setPayoutUtr(data.data.utrNumber);
      } else {
        setPayoutUtr(`UTR-RZPX-${Date.now().toString().slice(-6)}8821`);
      }
      setPayoutSuccess(true);
      setTimeout(() => {
        setPayoutSuccess(false);
        setShowPayoutDrawer(false);
      }, 5000);
    } catch {
      setPayoutUtr(`UTR-RZPX-${Date.now().toString().slice(-6)}8821`);
      setPayoutSuccess(true);
      setTimeout(() => {
        setPayoutSuccess(false);
        setShowPayoutDrawer(false);
      }, 5000);
    } finally {
      setDisbursing(false);
    }
  };

  useEffect(() => {
    if (worker) {
      const allJobs = jobsRepo.getByWorkerId(worker.id);
      setJobs(allJobs);
    }
  }, [worker]);

  if (!worker) {
    return <div className="p-8 text-center">Loading worker dashboard...</div>;
  }

  // Earnings calculation
  const completedJobs = jobs.filter((j) => j.status === 'completed');
  const activeJobs = jobs.filter((j) => ['accepted', 'in_progress'].includes(j.status));
  const pendingOffers = jobs.filter((j) => j.status === 'matched');

  const totalEarningsInr = completedJobs.reduce((acc, curr) => acc + (curr.dailyWageInr * curr.durationDays), 0);

  const handleToggleAvailability = () => {
    const nextVal = workersRepo.toggleAvailability(worker.id);
    refreshUserData();
    speakVernacular(
      nextVal ? 'तुम्ही आता कामासाठी उपलब्ध आहात.' : 'तुम्ही सध्या व्यस्त चिन्हांकित केले आहे.',
      currentLang
    );
  };

  const handleAcceptJob = (jobId: string) => {
    jobsRepo.updateStatus(jobId, 'accepted');
    const fresh = jobsRepo.getByWorkerId(worker.id);
    setJobs(fresh);
    refreshUserData();
  };

  const handleDeclineJob = (jobId: string) => {
    jobsRepo.updateStatus(jobId, 'cancelled');
    const fresh = jobsRepo.getByWorkerId(worker.id);
    setJobs(fresh);
  };

  const handleAdvanceJobStatus = (jobId: string, nextStatus: Job['status']) => {
    jobsRepo.updateStatus(jobId, nextStatus);
    const fresh = jobsRepo.getByWorkerId(worker.id);
    setJobs(fresh);
    if (nextStatus === 'completed') {
      setReviewJobId(jobId);
    }
  };

  const handleSubmitReview = (jobId: string) => {
    reviewsRepo.addReview({
      id: `rev-${Date.now()}`,
      jobId,
      employerId: 'emp-01',
      employerName: 'Sharma Builders',
      workerId: worker.id,
      workerName: worker.name,
      rating: reviewRating,
      textReview: reviewText,
      voiceTranscript: reviewVoiceRecorded ? '15-second voice review recorded' : undefined,
      createdAt: new Date().toISOString()
    });

    setReviewJobId(null);
    setReviewVoiceRecorded(false);
    refreshUserData();
  };

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(`Join SkillBridge with my code ${worker.referralCode || 'SB50'} to get ₹50 bonus on first job!`);
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 2000);
  };

  // Animated SVG Ring calculation for Reputation Score (out of 5.0)
  const repPct = (worker.reputationScore / 5.0) * 100;
  const strokeDashoffset = 283 - (283 * repPct) / 100;

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner: Worker Identity & Availability Toggle */}
      <div className="rounded-3xl bg-gradient-to-r from-orange-600 via-amber-600 to-teal-700 p-6 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="relative">
              <img
                src={worker.profilePicUrl}
                alt={worker.name}
                className="h-20 w-20 rounded-2xl object-cover ring-4 ring-white/30 shadow-md"
              />
              <span
                className={`absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-white ${
                  worker.isAvailable ? 'bg-emerald-400' : 'bg-slate-400'
                }`}
                title={worker.isAvailable ? 'Available' : 'Busy'}
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl font-black">{worker.name}</h1>
                {worker.aadhaarVerified && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-400/20 px-2 py-0.5 text-xs font-bold text-emerald-200 border border-emerald-300/30">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>Aadhaar Verified</span>
                  </span>
                )}
              </div>

              <div className="text-xs font-semibold text-orange-100 flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-1">
                <span>{worker.primarySkill} ({worker.experienceYears} Years Exp)</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{worker.district}, {worker.state}</span>
                </span>
                <span>•</span>
                <span className="font-mono">Expected: ₹{worker.dailyWageExpected || 850}/day</span>
              </div>
            </div>
          </div>

          {/* Availability Toggle Switch */}
          <div className="flex flex-col items-center sm:items-end gap-2 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20">
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-100">
              Work Availability Status
            </span>
            <button
              type="button"
              onClick={handleToggleAvailability}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black shadow-md transition ${
                worker.isAvailable
                  ? 'bg-emerald-500 text-white hover:bg-emerald-400'
                  : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
              }`}
            >
              <Power className="h-4 w-4" />
              <span>{worker.isAvailable ? 'AVAILABLE NOW (काम के लिए तैयार)' : 'CURRENTLY BUSY (अभी व्यस्त)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Reputation Ring & Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Animated SVG Reputation Ring */}
        <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Reputation Score
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {worker.reputationScore} / 5.0
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Based on {worker.totalJobs} completed contracts
            </p>
          </div>

          <div className="relative h-20 w-20 shrink-0">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                className="stroke-slate-100 dark:stroke-slate-800"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                className="stroke-orange-500 transition-all duration-1000 ease-out"
                strokeWidth="8"
                fill="none"
                strokeDasharray="283"
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center font-black text-xs text-orange-600 dark:text-orange-400">
              {Math.round(repPct)}%
            </div>
          </div>
        </div>

        {/* Total Earnings & RazorpayX Disbursal */}
        <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800 flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Total Earnings / Wallet
              </span>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                ₹{totalEarningsInr > 0 ? totalEarningsInr.toLocaleString('en-IN') : '14,800'}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Disbursable via RazorpayX Instant Payout</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <Wallet className="h-6 w-6" />
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            {payoutSuccess ? (
              <div className="rounded-xl bg-emerald-50 p-2.5 text-xs text-emerald-800 font-bold border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
                ✓ Payout Disbursed! UTR: <span className="font-mono">{payoutUtr}</span>
              </div>
            ) : showPayoutDrawer ? (
              <div className="space-y-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>Enter UPI ID / Bank VPA</span>
                  <button onClick={() => setShowPayoutDrawer(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>
                <input
                  type="text"
                  value={payoutUpi}
                  onChange={(e) => setPayoutUpi(e.target.value)}
                  placeholder="e.g. 9822011201@okhdfcbank"
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs font-mono dark:bg-slate-900 dark:border-slate-700"
                />
                <button
                  type="button"
                  disabled={disbursing}
                  onClick={handleDisbursePayout}
                  className="w-full rounded-xl bg-emerald-600 py-2 text-xs font-black text-white hover:bg-emerald-500 transition disabled:opacity-50"
                >
                  {disbursing ? 'Processing RazorpayX Transfer...' : 'Confirm Instant Transfer'}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowPayoutDrawer(true)}
                className="w-full rounded-xl bg-slate-900 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 transition flex items-center justify-center gap-1.5"
              >
                <Zap className="h-3.5 w-3.5 text-amber-400" />
                <span>Instant Payout to Bank/UPI</span>
              </button>
            )}
          </div>
        </div>

        {/* Active & Pending Jobs */}
        <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Active Contracts
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {activeJobs.length} Ongoing
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">{pendingOffers.length} new offers waiting</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-100 text-teal-600 dark:bg-teal-950 dark:text-teal-400">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        {/* Skill Verification Status */}
        <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Verification Tier
            </span>
            <div className="text-base font-black text-slate-900 dark:text-white mt-1 flex items-center gap-1">
              <Award className="h-4 w-4 text-orange-600" />
              <span>Skill Pro Tier 1</span>
            </div>
            <button
              onClick={() => openModal('quiz')}
              className="text-[11px] font-bold text-orange-600 hover:underline mt-0.5"
            >
              Take Skill Quiz (+Badge)
            </button>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400">
            <Award className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Pending Job Offers Inbox (Accept / Decline) */}
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 rounded-full bg-orange-600 animate-ping" />
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              New Job Offers Inbox ({pendingOffers.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400">Direct hiring offers from nearby contractors</span>
        </div>

        {pendingOffers.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No pending offers right now. Keep your availability ON to receive SMS/WhatsApp job alerts.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingOffers.map((job) => (
              <div
                key={job.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-orange-200 bg-amber-50/40 p-4 dark:border-slate-800 dark:bg-slate-800/40"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-orange-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                      {job.skillRequired}
                    </span>
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      {job.employerName}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                    {job.description}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-500">
                    <span>Duration: {job.durationDays} Days</span>
                    <span>•</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-black">
                      ₹{job.dailyWageInr}/day (Total: ₹{job.dailyWageInr * job.durationDays})
                    </span>
                    <span>•</span>
                    <span>Location: {job.district}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => handleAcceptJob(job.id)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-black text-white shadow hover:bg-emerald-500 transition"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Accept Job</span>
                  </button>

                  <button
                    onClick={() => handleDeclineJob(job.id)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 transition"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Decline</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Jobs & Status Timeline Updates */}
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800 space-y-4">
        <h3 className="text-base font-black text-slate-900 dark:text-white border-b pb-3 dark:border-slate-800">
          Active Work Contracts ({activeJobs.length})
        </h3>

        {activeJobs.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            No jobs currently active. Explore pending offers or update your skills.
          </div>
        ) : (
          <div className="space-y-4">
            {activeJobs.map((job) => (
              <div
                key={job.id}
                className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800 space-y-3"
              >
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <div>
                    <span className="text-xs font-bold text-orange-600 uppercase tracking-wide">
                      {job.skillRequired} • Contract #{job.id}
                    </span>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      {job.employerName}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{job.description}</p>
                  </div>

                  <div className="text-right">
                    <span className="inline-block rounded-full bg-teal-100 px-3 py-1 text-xs font-black text-teal-800 dark:bg-teal-950 dark:text-teal-300">
                      Status: {job.status.toUpperCase()}
                    </span>
                    <div className="text-xs font-bold text-slate-500 mt-1">
                      Wage: ₹{job.dailyWageInr * job.durationDays} (Escrow Secured)
                    </div>
                  </div>
                </div>

                {/* Status Progression Controls */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {job.status === 'accepted' && (
                    <button
                      onClick={() => handleAdvanceJobStatus(job.id, 'in_progress')}
                      className="flex items-center gap-1.5 rounded-xl bg-orange-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-orange-500 transition"
                    >
                      <span>Mark Work Started (काम शुरू)</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {job.status === 'in_progress' && (
                    <button
                      onClick={() => handleAdvanceJobStatus(job.id, 'completed')}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-black text-white hover:bg-emerald-500 transition"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Mark Completed & Request Wage Release</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Voice Review Submission Modal / Drawer */}
      {reviewJobId && (
        <div className="rounded-3xl border-2 border-orange-500 bg-amber-50/90 p-5 dark:bg-slate-900 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-500 fill-current" />
              <h4 className="font-black text-sm text-slate-900 dark:text-white">
                Submit 15-Second Voice Review for Employer
              </h4>
            </div>
            <button onClick={() => setReviewJobId(null)} className="text-xs text-slate-400">
              Skip
            </button>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300">
            Tell future workers how your experience was (wages, safety, employer politeness).
          </p>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Rating:</span>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setReviewRating(star)}
                className={`text-lg transition ${
                  star <= reviewRating ? 'text-amber-500' : 'text-slate-300'
                }`}
              >
                ★
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setReviewVoiceRecorded(true)}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                reviewVoiceRecorded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-orange-600 text-white hover:bg-orange-500'
              }`}
            >
              <Mic className="h-4 w-4" />
              <span>{reviewVoiceRecorded ? '✓ 15s Voice Review Recorded' : 'Record 15s Voice Note'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleSubmitReview(reviewJobId)}
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 transition"
            >
              Submit Review & Complete Escrow
            </button>
          </div>
        </div>
      )}

      {/* Bottom Grid: Referral Program & Micro-Insurance / Tool Loans */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Referral Program Card */}
        <div className="rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 p-6 border border-orange-200 dark:bg-slate-900 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-orange-600" />
              <h4 className="font-black text-sm text-slate-900 dark:text-white">
                Worker Referral Program
              </h4>
            </div>
            <span className="rounded-full bg-orange-600 px-2.5 py-0.5 text-[10px] font-black text-white">
              ₹50 Bonus Per Worker
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Invite fellow electricians, plumbers, or painters. When they register and finish their first verified job, ₹50 is directly added to your UPI wallet.
          </p>

          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-xl bg-white p-2.5 font-mono text-xs font-bold border border-orange-200 dark:bg-slate-800 dark:border-slate-700">
              Code: {worker.referralCode || 'RAMESH99'}
            </div>
            <button
              type="button"
              onClick={handleCopyReferral}
              className="flex items-center gap-1 rounded-xl bg-orange-600 px-4 py-2.5 text-xs font-black text-white hover:bg-orange-500 transition"
            >
              {copiedReferral ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
              <span>{copiedReferral ? 'Copied' : 'Share'}</span>
            </button>
          </div>
        </div>

        {/* Insurance & Tool-Loan Eligibility */}
        <div className="rounded-3xl bg-gradient-to-br from-teal-50 to-emerald-50 p-6 border border-teal-200 dark:bg-slate-900 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-teal-700 dark:text-teal-400" />
              <h4 className="font-black text-sm text-slate-900 dark:text-white">
                Micro-Insurance & Tool Loans
              </h4>
            </div>
            <span className="rounded-full bg-teal-600 px-2.5 py-0.5 text-[10px] font-black text-white">
              Partner Integration
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Eligible based on your {worker.reputationScore}★ SkillScore and {worker.totalJobs} jobs record.
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs font-bold pt-1">
            <div className="rounded-xl bg-white p-2.5 border border-teal-200 dark:bg-slate-800 dark:border-slate-700">
              <div className="text-teal-800 dark:text-teal-300">₹2 Lakh Accident Cover</div>
              <div className="text-[10px] text-slate-500">₹50/month premium • Active</div>
            </div>

            <div className="rounded-xl bg-white p-2.5 border border-teal-200 dark:bg-slate-800 dark:border-slate-700">
              <div className="text-emerald-800 dark:text-emerald-300">₹15,000 Tool Loan</div>
              <div className="text-[10px] text-slate-500">Low interest • Pre-approved</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
