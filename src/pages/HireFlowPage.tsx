import React, { useState } from 'react';
import {
  Briefcase,
  Users,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import { Worker, Job } from '../types';
import { useAppStore } from '../store';
import { jobsRepo } from '../services/db';

interface HireFlowPageProps {
  initialWorker?: Worker;
  onBack: () => void;
  onJobCreated: () => void;
}

export const HireFlowPage: React.FC<HireFlowPageProps> = ({
  initialWorker,
  onBack,
  onJobCreated
}) => {
  const { currentEmployer, openModal } = useAppStore();

  const [workerCount, setWorkerCount] = useState<number>(1);
  const [isGroupJob, setIsGroupJob] = useState<boolean>(false);
  const [skillRequired, setSkillRequired] = useState(initialWorker?.primarySkill || 'Electrician');
  const [durationDays, setDurationDays] = useState<number>(3);
  const [dailyWage, setDailyWage] = useState<number>(initialWorker?.dailyWageExpected || 850);
  const [startDate, setStartDate] = useState('2026-10-18');
  const [description, setDescription] = useState(
    initialWorker
      ? `Residential ${initialWorker.primarySkill.toLowerCase()} work for 3 days in ${initialWorker.district}.`
      : 'General maintenance and wiring work.'
  );

  // Platform fee calculation based on employer plan:
  // Free = ₹199, Contractor = ₹149, Enterprise = ₹99
  const platformFeePerJob =
    currentEmployer?.plan === 'enterprise' ? 99 : currentEmployer?.plan === 'contractor_monthly' ? 149 : 199;

  const totalWage = dailyWage * durationDays * workerCount;
  const totalAmount = totalWage + platformFeePerJob;

  const handleInitiatePayment = (e: React.FormEvent) => {
    e.preventDefault();

    const jobId = `job_${Date.now()}`;
    const newJob: Job = {
      id: jobId,
      employerId: currentEmployer?.id || 'emp-current',
      employerName: currentEmployer?.businessName || currentEmployer?.name || 'Sunil Sharma Builders',
      workerIds: initialWorker ? [initialWorker.id] : ['w-ngp-01'],
      skillRequired,
      description,
      status: 'pending_payment',
      startDate,
      endDate: '2026-10-21',
      durationDays,
      dailyWageInr: dailyWage,
      platformFeeInr: platformFeePerJob,
      totalAmountInr: totalAmount,
      paymentStatus: 'pending',
      paymentIds: {},
      isGroupJob,
      workerCount,
      district: initialWorker?.district || 'Nagpur',
      state: 'Maharashtra',
      createdAt: new Date().toISOString()
    };

    jobsRepo.save(newJob);

    // Open Razorpay Checkout modal
    openModal('razorpay', {
      jobId,
      workerNames: initialWorker ? [initialWorker.name] : ['Craftsman Group'],
      workerIds: newJob.workerIds,
      skill: skillRequired,
      dailyWageInr: dailyWage,
      durationDays,
      totalWageInr: totalWage,
      platformFeeInr: platformFeePerJob,
      totalAmountInr: totalAmount,
      onPaymentSuccess: () => {
        onJobCreated();
      }
    });
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6 animate-fadeIn">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-orange-600 dark:text-slate-400"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back</span>
      </button>

      <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-xl border border-orange-100 dark:bg-slate-900 dark:border-slate-800 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 border-b pb-4 dark:border-slate-800">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Hire Craftsperson & Lock Escrow
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {initialWorker
                ? `Booking verified worker: ${initialWorker.name} (${initialWorker.primarySkill})`
                : 'Direct hire form with live wage calculator'}
            </p>
          </div>
        </div>

        <form onSubmit={handleInitiatePayment} className="space-y-4">
          {/* Group Hire Toggle */}
          <div className="rounded-2xl bg-amber-50/60 p-4 border border-orange-200/60 dark:bg-slate-800/60 dark:border-slate-700 flex items-center justify-between">
            <div>
              <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                <Users className="h-4 w-4 text-orange-600" />
                <span>Group Hiring (Up to 10 Workers)</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Hire a full crew for commercial projects under one single escrow order.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isGroupJob}
                onChange={(e) => {
                  setIsGroupJob(e.target.checked);
                  if (!e.target.checked) setWorkerCount(1);
                  else if (workerCount === 1) setWorkerCount(3);
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600 dark:bg-slate-700" />
            </label>
          </div>

          {isGroupJob && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Number of Workers Needed (कामगारों की संख्या): {workerCount}
              </label>
              <input
                type="range"
                min={2}
                max={10}
                value={workerCount}
                onChange={(e) => setWorkerCount(parseInt(e.target.value))}
                className="w-full h-2 rounded-lg bg-slate-200 accent-orange-600 cursor-pointer"
              />
            </div>
          )}

          {/* Form Fields Grid */}
          <div className="grid sm:grid-cols-2 gap-4 text-xs font-bold text-slate-700 dark:text-slate-300">
            <div>
              <label className="block mb-1">Daily Wage per Worker (₹/दिन)</label>
              <input
                type="number"
                step={50}
                value={dailyWage}
                onChange={(e) => setDailyWage(parseInt(e.target.value) || 800)}
                className="w-full rounded-xl border border-slate-300 p-3 text-sm font-semibold focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block mb-1">Duration in Days (दिनों की संख्या)</label>
              <input
                type="number"
                min={1}
                max={30}
                value={durationDays}
                onChange={(e) => setDurationDays(parseInt(e.target.value) || 1)}
                className="w-full rounded-xl border border-slate-300 p-3 text-sm font-semibold focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block mb-1">Work Start Date (शुरू करने की तिथि)</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 text-sm font-semibold focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block mb-1">Trade Category (हुनर)</label>
              <input
                type="text"
                disabled
                value={skillRequired}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm bg-slate-50 font-semibold dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Job Description / Site Address (काम का विवरण)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-slate-300 p-3 text-xs font-medium focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Live Cost Breakdown */}
          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 space-y-2 text-xs">
            <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
              Live Price Breakdown
            </span>
            <div className="flex justify-between">
              <span>
                Wages (₹{dailyWage} × {durationDays} days × {workerCount} worker{workerCount > 1 ? 's' : ''}):
              </span>
              <span className="font-bold text-slate-900 dark:text-white">₹{totalWage.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Platform Escrow Fee (Nodal Account Guarantee):</span>
              <span className="font-semibold">₹{platformFeePerJob}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between text-sm font-black text-slate-900 dark:text-white">
              <span>Total Payable to Escrow:</span>
              <span className="text-orange-600 dark:text-orange-400">
                ₹{totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 py-4 text-sm font-black text-white shadow-xl hover:shadow-orange-500/25 active:scale-95 transition"
          >
            <span>Proceed to Razorpay Checkout (₹{totalAmount})</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
