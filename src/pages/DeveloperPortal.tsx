import React, { useState } from 'react';
import {
  Key,
  Code,
  Copy,
  Check,
  Plus,
  Trash2,
  Terminal,
  Play,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { apiKeysRepo } from '../services/db';
import { api } from '../services/apiClient';
import { ApiKey } from '../types';

export const DeveloperPortal: React.FC = () => {
  const [keys, setKeys] = useState<any[]>(() => apiKeysRepo.getAll());
  const [newKeyName, setNewKeyName] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [justGeneratedKey, setJustGeneratedKey] = useState<string | null>(null);

  // Interactive Test Console State
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('/api/v1/workers/search');
  const [testParamSkill, setTestParamSkill] = useState('Electrician');
  const [testParamCity, setTestParamCity] = useState('Nagpur');
  const [testConsoleOutput, setTestConsoleOutput] = useState<string | null>(null);
  const [executing, setExecuting] = useState(false);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    try {
      const created = await api.developer.createKey(newKeyName.trim());
      setJustGeneratedKey(created.apiKey);
      setKeys((prev) => [created, ...prev]);
      setNewKeyName('');
    } catch {
      const local = apiKeysRepo.createKey(newKeyName.trim());
      setKeys(apiKeysRepo.getAll());
      setNewKeyName('');
    }
  };

  const handleRevokeKey = async (id: string) => {
    try {
      await api.developer.revokeKey(id);
    } catch {}
    apiKeysRepo.revokeKey(id);
    setKeys((prev) => prev.filter((k) => k.id !== id));
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleExecuteApiTest = async () => {
    setExecuting(true);
    setTestConsoleOutput('Calling live SkillBridge backend...');
    try {
      if (selectedEndpoint === '/api/v1/workers/search') {
        const res = await api.workers.search({ skill: testParamSkill, district: testParamCity, limit: 5 });
        setTestConsoleOutput(JSON.stringify(res, null, 2));
      } else if (selectedEndpoint === '/api/v1/admin/metrics') {
        const res = await api.admin.getMetrics();
        setTestConsoleOutput(JSON.stringify(res, null, 2));
      } else {
        const res = await fetch(selectedEndpoint);
        const data = await res.json();
        setTestConsoleOutput(JSON.stringify(data, null, 2));
      }
    } catch (err: any) {
      setTestConsoleOutput(JSON.stringify({ error: err.message }, null, 2));
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 px-3 py-1 text-xs font-black text-teal-800 dark:bg-teal-950 dark:text-teal-300 mb-1">
          <Terminal className="h-3.5 w-3.5" />
          <span>Open Workforce REST APIs (v1)</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white">
          Developer & B2B API Portal
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Integrate SkillBridge voice-registered trade workers directly into construction ERPs, smart city dashboards, or enterprise payroll.
        </p>
      </div>

      {/* API Key Management */}
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-orange-600" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              API Keys & Rate Limits
            </h3>
          </div>
          <span className="text-xs text-slate-400">Standard Tier: 120 req/min</span>
        </div>

        {/* Create Key Form */}
        <form onSubmit={handleCreateKey} className="flex gap-2">
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Key label e.g. InfraSite ERP Integration..."
            className="flex-1 rounded-2xl border border-slate-300 p-3 text-xs font-semibold focus:border-orange-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-2xl bg-orange-600 px-5 py-3 text-xs font-black text-white hover:bg-orange-500 transition shadow"
          >
            <Plus className="h-4 w-4" />
            <span>Generate Key</span>
          </button>
        </form>

        {/* Existing Keys Table */}
        <div className="space-y-2 pt-2">
          {keys.map((k) => (
            <div
              key={k.id}
              className="flex items-center justify-between rounded-2xl border border-slate-200 p-3.5 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs"
            >
              <div>
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <span>{k.name}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] uppercase ${
                      k.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {k.status}
                  </span>
                </div>
                <div className="font-mono text-slate-500 mt-1 flex items-center gap-2">
                  <span>{k.keySecretMasked}</span>
                  <button
                    onClick={() => handleCopy(k.keySecretMasked, k.id)}
                    className="text-orange-600 hover:text-orange-700"
                    title="Copy Key"
                  >
                    {copiedKey === k.id ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 text-slate-500">
                <div className="text-right">
                  <div className="font-bold text-slate-900 dark:text-white">{k.totalRequests} reqs</div>
                  <div className="text-[10px]">Limit: {k.rateLimitPerMinute}/min</div>
                </div>

                {k.status === 'active' && (
                  <button
                    onClick={() => handleRevokeKey(k.id)}
                    className="rounded-xl border border-red-200 p-2 text-red-600 hover:bg-red-50"
                    title="Revoke Key"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive REST API Documentation & Test Console */}
      <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Code className="h-5 w-5 text-teal-600" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Interactive Swagger-Style REST Console
            </h3>
          </div>
          <span className="text-xs text-slate-400">Base URL: https://api.skillbridge.in</span>
        </div>

        {/* Endpoint Selector Tabs */}
        <div className="flex flex-wrap gap-1.5 text-xs font-mono font-bold">
          {[
            { path: '/api/v1/workers/search', method: 'GET', desc: 'Search & Ranking' },
            { path: '/api/v1/admin/metrics', method: 'GET', desc: 'Platform KPIs' },
            { path: '/health', method: 'GET', desc: 'Server Health' },
            { path: '/api/v1/jobs/hire', method: 'POST', desc: 'Create Escrow Job' },
            { path: '/api/v1/payments/disburse', method: 'POST', desc: 'Disburse Wages' },
            { path: '/api/v1/kyc/aadhaar/verify', method: 'POST', desc: 'Aadhaar Hash Verification' }
          ].map((ep) => (
            <button
              key={ep.path}
              onClick={() => setSelectedEndpoint(ep.path)}
              className={`rounded-xl px-3 py-2 transition flex items-center gap-1.5 ${
                selectedEndpoint === ep.path
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <span className="text-[10px] text-emerald-400 font-bold">{ep.method}</span>
              <span>{ep.path}</span>
            </button>
          ))}
        </div>

        {/* Parameters for /api/v1/search */}
        {selectedEndpoint === '/api/v1/search' && (
          <div className="grid sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                skill (query param)
              </label>
              <input
                type="text"
                value={testParamSkill}
                onChange={(e) => setTestParamSkill(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2 text-xs font-mono dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                city (query param)
              </label>
              <input
                type="text"
                value={testParamCity}
                onChange={(e) => setTestParamCity(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-2 text-xs font-mono dark:border-slate-700 dark:bg-slate-900"
              />
            </div>
          </div>
        )}

        <button
          onClick={handleExecuteApiTest}
          className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-2.5 text-xs font-black text-white hover:bg-emerald-500 transition shadow"
        >
          <Play className="h-4 w-4 fill-current" />
          <span>Execute Mock Request ({selectedEndpoint})</span>
        </button>

        {/* Response JSON Output Console */}
        {testConsoleOutput && (
          <div className="rounded-2xl bg-slate-950 p-4 font-mono text-xs text-emerald-400 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-[10px] border-b border-slate-800 pb-1 mb-2">
              <span>RESPONSE: HTTP 200 OK</span>
              <span>application/json</span>
            </div>
            <pre className="overflow-x-auto leading-relaxed">{testConsoleOutput}</pre>
          </div>
        )}
      </div>
    </div>
  );
};
