import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Star,
  Mic,
  ShieldCheck,
  FileText,
  DollarSign,
  ArrowRight,
  Filter
} from 'lucide-react';
import { useAppStore } from '../store';
import { jobsRepo, reviewsRepo, disputesRepo, workersRepo } from '../services/db';
import { Job } from '../types';

export const EmployerJobsPage: React.FC = () => {
  const { currentEmployer, refreshUserData } = useAppStore();
  const employerId = currentEmployer?.id || 'emp-01';

  const [jobs, setJobs] = useState<Job[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [reviewModalJobId, setReviewModalJobId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('Excellent electrical wiring and very polite craftsman.');
  const [voiceRecorded, setVoiceRecorded] = useState(false);

  // Dispute state
  const [disputeJobId, setDisputeJobId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState('');

  useEffect(() => {
    const list = jobsRepo.getByEmployerId(employerId);
    setJobs(list);
  }, [employerId]);

  const filteredJobs = jobs.filter((j) => {
    if (filterStatus === 'all') return true;
    return j.status === filterStatus;
  });

  const handleMarkComplete = (jobId: string) => {
    jobsRepo.updateStatus(jobId, 'completed');
    const fresh = jobsRepo.getByEmployerId(employerId);
    setJobs(fresh);
    setReviewModalJobId(jobId);
    refreshUserData();
  };

  const handleCancelJob = (jobId: string) => {
    jobsRepo.updateStatus(jobId, 'cancelled');
    const fresh = jobsRepo.getByEmployerId(employerId);
    setJobs(fresh);
  };

  const handleSaveReview = (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;

    reviewsRepo.addReview({
      id: `rev-${Date.now()}`,
      jobId,
      employerId: job.employerId,
      employerName: job.employerName,
      workerId: job.workerIds[0] || 'w-ngp-01',
      workerName: 'Verified Craftsman',
      rating,
      textReview: reviewText,
      voiceTranscript: voiceRecorded ? 'Voice review: काम उत्तम दर्जाचे झाले.' : undefined,
      createdAt: new Date().toISOString()
    });

    setReviewModalJobId(null);
    setVoiceRecorded(false);
    refreshUserData();
  };

  const handleRaiseDispute = (jobId: string) => {
    if (!disputeReason.trim()) return;

    disputesRepo.save({
      id: `disp-${Date.now()}`,
      jobId,
      raisedBy: 'employer',
      raisedByName: currentEmployer?.businessName || currentEmployer?.name || 'Employer',
      reason: disputeReason,
      status: 'open',
      createdAt: new Date().toISOString()
    });

    jobsRepo.updateStatus(jobId, 'disputed');
    const fresh = jobsRepo.getByEmployerId(employerId);
    setJobs(fresh);
    setDisputeJobId(null);
    setDisputeReason('');
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            Manage Hires & Escrow Contracts
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track active jobs, release escrow payments upon inspection, and submit ratings.
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex items-center gap-1.5 text-xs font-bold">
          {['all', 'accepted', 'in_progress', 'completed', 'disputed'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`rounded-xl px-3 py-1.5 capitalize transition ${
                filterStatus === status
                  ? 'bg-orange-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {filteredJobs.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 p-12 text-center dark:border-slate-800 space-y-2">
          <Briefcase className="mx-auto h-8 w-8 text-slate-400" />
          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            No jobs found for this filter
          </h4>
          <p className="text-xs text-slate-400">
            Find and hire workers from the search dashboard to start new contracts.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <div
              key={job.id}
              className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800 space-y-4"
            >
              {/* Job Top Row */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-orange-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                      {job.skillRequired}
                    </span>
                    <span className="font-mono text-xs text-slate-400">#{job.id}</span>
                    <span className="text-xs text-slate-500">• {job.district}</span>
                  </div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {job.description}
                  </h3>
                </div>

                <div className="text-left sm:text-right">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider ${
                      job.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : job.status === 'disputed'
                        ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                        : 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
                    }`}
                  >
                    {job.status.replace('_', ' ')}
                  </span>
                  <div className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                    Escrow Locked: ₹{job.totalAmountInr}
                  </div>
                </div>
              </div>

              {/* Timeline Progress Tracker */}
              <div className="py-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1.5">
                  <span className="text-orange-600">1. Escrow Funded</span>
                  <span className={job.status !== 'pending_payment' ? 'text-orange-600' : ''}>
                    2. Worker Accepted
                  </span>
                  <span
                    className={
                      ['in_progress', 'completed'].includes(job.status) ? 'text-orange-600' : ''
                    }
                  >
                    3. Work in Progress
                  </span>
                  <span className={job.status === 'completed' ? 'text-emerald-600' : ''}>
                    4. Completed & Paid
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-orange-600 transition-all duration-300"
                    style={{
                      width:
                        job.status === 'completed'
                          ? '100%'
                          : job.status === 'in_progress'
                          ? '75%'
                          : job.status === 'accepted'
                          ? '50%'
                          : '25%'
                    }}
                  />
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-3 text-slate-500">
                  <span>Start: {job.startDate}</span>
                  <span>•</span>
                  <span>Duration: {job.durationDays} Days</span>
                  <span>•</span>
                  <span>₹{job.dailyWageInr}/day</span>
                </div>

                <div className="flex items-center gap-2">
                  {['accepted', 'in_progress'].includes(job.status) && (
                    <button
                      type="button"
                      onClick={() => handleMarkComplete(job.id)}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 font-black text-white hover:bg-emerald-500 transition shadow"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Mark Work Complete & Release Escrow</span>
                    </button>
                  )}

                  {job.status === 'completed' && !job.employerReviewScore && (
                    <button
                      type="button"
                      onClick={() => setReviewModalJobId(job.id)}
                      className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3.5 py-2 font-bold text-white hover:bg-amber-400 transition"
                    >
                      <Star className="h-4 w-4 fill-current" />
                      <span>Leave Review</span>
                    </button>
                  )}

                  {['accepted', 'in_progress'].includes(job.status) && (
                    <button
                      type="button"
                      onClick={() => setDisputeJobId(job.id)}
                      className="flex items-center gap-1 rounded-xl border border-red-200 px-3 py-2 font-bold text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/40"
                    >
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <span>Raise Dispute</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {reviewModalJobId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Rate Worker Craftsman & Release Escrow
            </h3>
            <p className="text-xs text-slate-500">
              Your feedback updates the worker's reputation score via the formula.
            </p>

            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setRating(s)}
                  className={`text-2xl transition ${
                    s <= rating ? 'text-amber-500' : 'text-slate-300'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Written Review
              </label>
              <textarea
                rows={3}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-medium dark:border-slate-700 dark:bg-slate-800"
              />
            </div>

            <button
              type="button"
              onClick={() => setVoiceRecorded(!voiceRecorded)}
              className={`flex w-full items-center justify-center gap-1.5 rounded-xl border p-2.5 text-xs font-bold transition ${
                voiceRecorded ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'border-slate-300 text-slate-700'
              }`}
            >
              <Mic className="h-4 w-4 text-orange-600" />
              <span>{voiceRecorded ? '✓ 15s Voice Note Attached' : 'Record 15s Voice Review'}</span>
            </button>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => handleSaveReview(reviewModalJobId)}
                className="flex-1 rounded-2xl bg-orange-600 py-3 text-xs font-bold text-white hover:bg-orange-500 transition shadow"
              >
                Submit & Close
              </button>
              <button
                onClick={() => setReviewModalJobId(null)}
                className="rounded-2xl border border-slate-300 px-4 py-3 text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {disputeJobId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-black text-red-600 flex items-center gap-1.5">
              <AlertTriangle className="h-5 w-5" />
              <span>Raise Job Dispute to Mediation</span>
            </h3>
            <p className="text-xs text-slate-500">
              Escrow funds will be held in freeze until our mediator reviews evidence.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Reason for Dispute
              </label>
              <textarea
                rows={3}
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
                placeholder="e.g. Worker did not report on site, work left incomplete, quality defects..."
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-medium dark:border-slate-700 dark:bg-slate-800"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => handleRaiseDispute(disputeJobId)}
                className="flex-1 rounded-2xl bg-red-600 py-3 text-xs font-bold text-white hover:bg-red-500 transition"
              >
                Lock Escrow & Submit Dispute
              </button>
              <button
                onClick={() => setDisputeJobId(null)}
                className="rounded-2xl border border-slate-300 px-4 py-3 text-xs font-bold text-slate-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
