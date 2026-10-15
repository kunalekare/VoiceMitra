import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  ShieldCheck,
  Calculator,
  Compass,
  KeyRound,
  FileCode
} from 'lucide-react';
import { computeRankingBreakdown, calculateUpdatedReputation, calculateHaversineDistanceKm } from '../utils/ranking';
import { otpService } from '../services/msg91OtpService';
import { Worker } from '../types';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  expected: string;
  received: string;
  durationMs: number;
}

export const UnitTestsPage: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);

  const runAllTests = async () => {
    setRunning(true);
    const testList: TestResult[] = [];

    // SUITE 1: Ranking Algorithm Formula
    // composite = skillMatch*40 + proximity*25 + reputation*20 + experience*10 + availability*5 + KYC bonus (10 if Aadhaar verified), capped at 100.
    {
      const start = performance.now();
      const mockWorker: Worker = {
        id: 'w-test-1',
        phone: '1234567890',
        name: 'Test Worker',
        primarySkill: 'Electrician',
        secondarySkills: [],
        experienceYears: 10,
        languagesSpoken: ['Hindi'],
        district: 'Nagpur',
        state: 'Maharashtra',
        pincode: '440010',
        lat: 21.1458,
        lng: 79.0882,
        aadhaarVerified: true,
        reputationScore: 5.0,
        totalJobs: 25,
        isAvailable: true,
        status: 'active',
        verifiedSkillBadges: ['Aadhaar Verified'],
        createdAt: '2026-01-01'
      };

      // Exact location (0 km) -> proximity = 1.0 * 25 = 25
      // exact skill -> 40
      // rep 5.0 -> 20
      // exp 25/20 -> min(1, 1.25) * 10 = 10
      // avail true -> 5
      // kyc true -> 10
      // Raw sum = 40 + 25 + 20 + 10 + 5 + 10 = 110 -> Capped at 100
      const breakdown = computeRankingBreakdown(mockWorker, 'Electrician', 21.1458, 79.0882);
      const passed = breakdown.compositeScore === 100 && breakdown.kycBonus === 10;
      testList.push({
        suite: 'Ranking Algorithm',
        name: 'Perfect worker score caps at 100 (40+25+20+10+5+10 -> 100)',
        passed,
        expected: 'compositeScore: 100, kycBonus: 10',
        received: `compositeScore: ${breakdown.compositeScore}, kycBonus: ${breakdown.kycBonus}`,
        durationMs: Math.round(performance.now() - start)
      });
    }

    {
      const start = performance.now();
      const mockWorker2: Worker = {
        id: 'w-test-2',
        phone: '1234567890',
        name: 'Distant Worker',
        primarySkill: 'Plumber',
        secondarySkills: [],
        experienceYears: 2,
        languagesSpoken: ['Hindi'],
        district: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        lat: 19.076,
        lng: 72.8777,
        aadhaarVerified: false,
        reputationScore: 4.0,
        totalJobs: 4,
        isAvailable: false,
        status: 'active',
        verifiedSkillBadges: [],
        createdAt: '2026-01-01'
      };

      // Searching in Nagpur for Plumber (dist ~700 km > 50km -> proximity = 0)
      // exact skill -> 40
      // proximity -> 0
      // rep 4/5 -> 16
      // exp 4/20 -> 0.2 * 10 = 2
      // avail false -> 0.5 * 5 = 2.5
      // kyc false -> 0
      // expected sum = 40 + 0 + 16 + 2 + 2.5 + 0 = 60.5
      const breakdown2 = computeRankingBreakdown(mockWorker2, 'Plumber', 21.1458, 79.0882);
      const passed2 = breakdown2.proximityScore === 0 && breakdown2.compositeScore === 60.5;
      testList.push({
        suite: 'Ranking Algorithm',
        name: 'Proximity drops to 0 when distance exceeds 50 km',
        passed: passed2,
        expected: 'proximityScore: 0, compositeScore: 60.5',
        received: `proximityScore: ${breakdown2.proximityScore}, compositeScore: ${breakdown2.compositeScore}`,
        durationMs: Math.round(performance.now() - start)
      });
    }

    // SUITE 2: Reputation Update Formula
    // (oldScore*oldCount + newRating)/(oldCount+1), rounded to 1 decimal.
    {
      const start = performance.now();
      // Worker with 4.5 score over 9 jobs gets a 5.0 review:
      // (4.5 * 9 + 5.0) / 10 = (40.5 + 5) / 10 = 4.55 -> rounds to 4.6
      const { newScore, newCount } = calculateUpdatedReputation(4.5, 9, 5.0);
      const passed = newScore === 4.6 && newCount === 10;
      testList.push({
        suite: 'Reputation Score',
        name: 'Updates weighted average (4.5 * 9 + 5.0)/10 = 4.6',
        passed,
        expected: 'newScore: 4.6, newCount: 10',
        received: `newScore: ${newScore}, newCount: ${newCount}`,
        durationMs: Math.round(performance.now() - start)
      });
    }

    {
      const start = performance.now();
      // First review for brand new worker (old: 5.0, count: 0, received: 4.0):
      // (5.0 * 0 + 4.0) / 1 = 4.0
      const { newScore, newCount } = calculateUpdatedReputation(5.0, 0, 4.0);
      const passed = newScore === 4.0 && newCount === 1;
      testList.push({
        suite: 'Reputation Score',
        name: 'Initial review for new worker computes correctly',
        passed,
        expected: 'newScore: 4.0, newCount: 1',
        received: `newScore: ${newScore}, newCount: ${newCount}`,
        durationMs: Math.round(performance.now() - start)
      });
    }

    // SUITE 3: Haversine Geodesic Distance
    {
      const start = performance.now();
      // Same coordinates = 0 km
      const d0 = calculateHaversineDistanceKm(21.1458, 79.0882, 21.1458, 79.0882);
      const passed = d0 === 0;
      testList.push({
        suite: 'Haversine Calculation',
        name: 'Identical lat/lng returns exactly 0.0 km',
        passed,
        expected: '0 km',
        received: `${d0} km`,
        durationMs: Math.round(performance.now() - start)
      });
    }

    {
      const start = performance.now();
      // Nagpur (21.1458, 79.0882) to Pune (18.5204, 73.8567) is approx 620-630 km geodesic
      const dNagpurPune = calculateHaversineDistanceKm(21.1458, 79.0882, 18.5204, 73.8567);
      const passed = dNagpurPune >= 615 && dNagpurPune <= 635;
      testList.push({
        suite: 'Haversine Calculation',
        name: 'Nagpur to Pune geodesic distance within expected bounds (~622 km)',
        passed,
        expected: '615 km <= d <= 635 km',
        received: `${dNagpurPune} km`,
        durationMs: Math.round(performance.now() - start)
      });
    }

    // SUITE 4: OTP Verification Logic
    {
      const start = performance.now();
      // Test mock OTP 123456
      const res = await otpService.verifyOtp('9822011201', '123456');
      const passed = res.valid === true && !!res.token;
      testList.push({
        suite: 'MSG91 OTP Verification',
        name: 'Mock OTP 123456 authenticates and generates JWT session',
        passed,
        expected: 'valid: true, token generated',
        received: `valid: ${res.valid}, message: ${res.message}`,
        durationMs: Math.round(performance.now() - start)
      });
    }

    {
      const start = performance.now();
      // Send OTP to test attempt countdown
      await otpService.sendOtp('9822099999');
      const badAttempt = await otpService.verifyOtp('9822099999', '000000');
      const passed = badAttempt.valid === false && badAttempt.attemptsLeft === 2;
      testList.push({
        suite: 'MSG91 OTP Verification',
        name: 'Invalid OTP decrements attempts left (3 -> 2)',
        passed,
        expected: 'valid: false, attemptsLeft: 2',
        received: `valid: ${badAttempt.valid}, attemptsLeft: ${badAttempt.attemptsLeft}`,
        durationMs: Math.round(performance.now() - start)
      });
    }

    setResults(testList);
    setRunning(false);
  };

  useEffect(() => {
    runAllTests();
  }, []);

  const totalPassed = results.filter((r) => r.passed).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 px-3 py-1 text-xs font-black text-teal-800 dark:bg-teal-950 dark:text-teal-300 mb-1">
            <Calculator className="h-3.5 w-3.5" />
            <span>Automated In-Browser Test Suite</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">
            Algorithm & Logic Verification
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Validating composite ranking formula, weighted reputation updates, haversine distances, and OTP session limits.
          </p>
        </div>

        <button
          type="button"
          disabled={running}
          onClick={runAllTests}
          className="flex items-center gap-2 rounded-2xl bg-orange-600 px-5 py-2.5 text-xs font-black text-white shadow hover:bg-orange-500 active:scale-95 transition disabled:opacity-50"
        >
          <RotateCcw className={`h-4 w-4 ${running ? 'animate-spin' : ''}`} />
          <span>{running ? 'Running Tests...' : 'Re-run Test Suites'}</span>
        </button>
      </div>

      {/* Summary Scorecard */}
      <div className="rounded-3xl bg-slate-900 text-white p-6 shadow-xl flex items-center justify-between border border-slate-800">
        <div className="space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase">Test Suite Results</span>
          <div className="text-2xl font-black flex items-center gap-2">
            <span>
              {totalPassed} of {results.length} Tests Passed
            </span>
            {totalPassed === results.length && (
              <span className="rounded-full bg-emerald-500/20 px-3 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/30">
                100% Passing
              </span>
            )}
          </div>
        </div>

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg">
          <CheckCircle2 className="h-8 w-8" />
        </div>
      </div>

      {/* Detailed Test Results */}
      <div className="space-y-3">
        {results.map((res, idx) => (
          <div
            key={idx}
            className={`rounded-2xl p-4 border transition ${
              res.passed
                ? 'bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-800'
                : 'bg-red-50 border-red-300 dark:bg-red-950 dark:border-red-800'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                {res.passed ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                )}

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {res.suite}
                    </span>
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {res.name}
                    </span>
                  </div>

                  <div className="font-mono text-[11px] text-slate-500 space-y-0.5">
                    <div>
                      <span className="text-slate-400">Expected: </span>
                      <span className="text-slate-800 dark:text-slate-200">{res.expected}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Received: </span>
                      <span className="text-emerald-600 font-bold">{res.received}</span>
                    </div>
                  </div>
                </div>
              </div>

              <span className="font-mono text-[11px] text-slate-400">{res.durationMs}ms</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
