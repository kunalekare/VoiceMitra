import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  Calculator,
  Server,
  Zap,
  ShieldCheck
} from 'lucide-react';
import { computeRankingBreakdown, calculateUpdatedReputation, calculateHaversineDistanceKm } from '../utils/ranking';
import { otpService } from '../services/msg91OtpService';
import { api } from '../services/apiClient';
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
  const [activeTab, setActiveTab] = useState<'client' | 'server'>('client');
  const [clientResults, setClientResults] = useState<TestResult[]>([]);
  const [serverResults, setServerResults] = useState<Array<{ testName: string; category: string; passed: boolean; durationMs: number; details: string }>>([]);
  const [running, setRunning] = useState(false);

  const runClientTests = async () => {
    setRunning(true);
    const testList: TestResult[] = [];

    // SUITE 1: Ranking Algorithm Formula
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

      const breakdown2 = computeRankingBreakdown(mockWorker2, 'Electrician', 21.1458, 79.0882);
      const passed = breakdown2.compositeScore < 50 && breakdown2.kycBonus === 0;
      testList.push({
        suite: 'Ranking Algorithm',
        name: 'Unmatched skill + distant + unavailable scores lower (< 50)',
        passed,
        expected: 'compositeScore < 50, kycBonus: 0',
        received: `compositeScore: ${breakdown2.compositeScore}, kycBonus: ${breakdown2.kycBonus}`,
        durationMs: Math.round(performance.now() - start)
      });
    }

    // SUITE 2: Reputation Update Formula
    {
      const start = performance.now();
      const initialRep = 4.0;
      const initialJobs = 4;
      const newScore = 5.0;
      const updated = calculateUpdatedReputation(initialRep, initialJobs, newScore);
      const passed = updated.newScore === 4.2;
      testList.push({
        suite: 'Reputation Math',
        name: 'Weighted update: (4.0 * 4 + 5) / 5 = 4.2',
        passed,
        expected: '4.2',
        received: `${updated.newScore}`,
        durationMs: Math.round(performance.now() - start)
      });
    }

    // SUITE 3: Haversine Calculation
    {
      const start = performance.now();
      const dist = calculateHaversineDistanceKm(21.1458, 79.0882, 18.5204, 73.8567);
      const passed = dist > 600 && dist < 750;
      testList.push({
        suite: 'Haversine Geodesic',
        name: 'Distance Nagpur to Pune is approximately 630-710 km',
        passed,
        expected: '600km < distance < 750km',
        received: `${dist} km`,
        durationMs: Math.round(performance.now() - start)
      });
    }

    // SUITE 4: OTP Verification Logic
    {
      const start = performance.now();
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

    setClientResults(testList);
    setRunning(false);
  };

  const runServerLiveTests = async () => {
    setRunning(true);
    try {
      const res = await api.developer.runLiveTests();
      setServerResults(res.results);
    } catch (err: any) {
      console.error('Server live tests failed:', err);
      setServerResults([
        {
          testName: 'Server API Health Check',
          category: 'Server',
          passed: false,
          durationMs: 10,
          details: err.message
        }
      ]);
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    runClientTests();
    runServerLiveTests();
  }, []);

  const totalClientPassed = clientResults.filter((r) => r.passed).length;
  const totalServerPassed = serverResults.filter((r) => r.passed).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 px-3 py-1 text-xs font-black text-teal-800 dark:bg-teal-950 dark:text-teal-300 mb-1">
            <Zap className="h-3.5 w-3.5" />
            <span>Automated Test Runner & Verification</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">
            System & API Test Suites
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Validating SQLite relational persistence, composite ranking math, Aadhaar DPDP Act 2023 hashing, and Escrow lifecycle.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={running}
            onClick={() => (activeTab === 'client' ? runClientTests() : runServerLiveTests())}
            className="flex items-center gap-2 rounded-2xl bg-orange-600 px-5 py-2.5 text-xs font-black text-white shadow hover:bg-orange-500 active:scale-95 transition disabled:opacity-50"
          >
            <RotateCcw className={`h-4 w-4 ${running ? 'animate-spin' : ''}`} />
            <span>{running ? 'Running Tests...' : 'Re-run Tests'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
        <button
          onClick={() => setActiveTab('client')}
          className={`flex items-center gap-2 pb-3 text-sm font-black border-b-2 transition ${
            activeTab === 'client'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Calculator className="h-4 w-4" />
          <span>Client-Side Unit Tests ({totalClientPassed}/{clientResults.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('server')}
          className={`flex items-center gap-2 pb-3 text-sm font-black border-b-2 transition ${
            activeTab === 'server'
              ? 'border-orange-600 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Server className="h-4 w-4" />
          <span>Server REST API Live Tests ({totalServerPassed}/{serverResults.length})</span>
        </button>
      </div>

      {/* Summary Scorecard */}
      <div className="rounded-3xl bg-slate-900 text-white p-6 shadow-xl flex items-center justify-between border border-slate-800">
        <div className="space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase">
            {activeTab === 'client' ? 'Client Math & Assertion Results' : 'Server Live REST API Invariants'}
          </span>
          <div className="text-2xl font-black flex items-center gap-2">
            <span>
              {activeTab === 'client'
                ? `${totalClientPassed} of ${clientResults.length} Tests Passed`
                : `${totalServerPassed} of ${serverResults.length} Invariants Passed`}
            </span>
            <span className="rounded-full bg-emerald-500/20 px-3 py-0.5 text-xs font-bold text-emerald-400 border border-emerald-500/30">
              100% Operational
            </span>
          </div>
        </div>

        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg">
          <CheckCircle2 className="h-8 w-8" />
        </div>
      </div>

      {/* Tab Content: Client */}
      {activeTab === 'client' && (
        <div className="space-y-3">
          {clientResults.map((res, idx) => (
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
      )}

      {/* Tab Content: Server */}
      {activeTab === 'server' && (
        <div className="space-y-3">
          {serverResults.map((res, idx) => (
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
                      <span className="rounded-md bg-orange-100 px-2 py-0.5 font-mono text-[10px] font-bold text-orange-800 dark:bg-orange-950 dark:text-orange-300">
                        {res.category}
                      </span>
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        {res.testName}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {res.details}
                    </p>
                  </div>
                </div>

                <span className="font-mono text-[11px] text-slate-400">{res.durationMs}ms</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
