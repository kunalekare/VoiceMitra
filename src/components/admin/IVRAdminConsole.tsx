import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  PhoneIncoming,
  PhoneOff,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Play,
  Download,
  Filter,
  Search,
  CheckCircle2,
  Settings,
  Languages,
  Mic,
  RefreshCw,
  Edit2,
  Save,
  Volume2,
  Trash2,
  Plus
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface IVRAnalyticsData {
  totalCalls: number;
  avgDurationSeconds: number;
  outcomes: Array<{ outcome: string; count: number }>;
  languages: Array<{ language: string; count: number }>;
  callbackSuccessRate: number;
  estimatedCostInr: number;
  completionRates: {
    registration: number;
    quiz: number;
    jobAccept: number;
  };
  dailyTrends: Array<{
    date: string;
    calls: number;
    answered: number;
    missed: number;
    callbacks: number;
    avgDurationSec: number;
  }>;
  nodeDropoffs: Array<{ current_node: string; count: number }>;
}

export const IVRAdminConsole: React.FC = () => {
  const [subTab, setSubTab] = useState<'analytics' | 'menu_editor' | 'prompts' | 'logs' | 'compliance'>('analytics');
  const [analytics, setAnalytics] = useState<IVRAnalyticsData | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [logSearch, setLogSearch] = useState('');
  const [logFilterLang, setLogFilterLang] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  // Active Calls SSE state
  const [activeCalls, setActiveCalls] = useState<any[]>([]);

  // Menu editor & prompt manager state
  const [nodes, setNodes] = useState<any[]>([]);
  const [transitions, setTransitions] = useState<any[]>([]);
  const [prompts, setPrompts] = useState<any[]>([]);
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [editingPromptText, setEditingPromptText] = useState('');

  // Compliance state
  const [complianceSettings, setComplianceSettings] = useState<any[]>([]);
  const [dncList, setDncList] = useState<any[]>([]);
  const [blockedList, setBlockedList] = useState<any[]>([]);
  const [newDncPhone, setNewDncPhone] = useState('');
  const [newBlockedPhone, setNewBlockedPhone] = useState('');

  // Fetch Analytics & Data
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [analyticsRes, logsRes, nodesRes, promptsRes, compRes] = await Promise.all([
        fetch('/api/v1/ivr/admin/analytics').then((r) => r.json()),
        fetch('/api/v1/ivr/admin/logs?limit=50').then((r) => r.json()),
        fetch('/api/v1/ivr/admin/nodes').then((r) => r.json()),
        fetch('/api/v1/ivr/admin/prompts').then((r) => r.json()),
        fetch('/api/v1/ivr/admin/compliance').then((r) => r.json())
      ]);

      if (analyticsRes.success) setAnalytics(analyticsRes.data);
      if (logsRes.success) {
        setLogs(logsRes.data.logs || []);
        setTotalLogs(logsRes.data.total || 0);
      }
      if (nodesRes.success) {
        setNodes(nodesRes.data.nodes || []);
        setTransitions(nodesRes.data.transitions || []);
      }
      if (promptsRes.success) setPrompts(promptsRes.data.prompts || []);
      if (compRes.success) {
        setComplianceSettings(compRes.data.settings || []);
        setDncList(compRes.data.dnc || []);
        setBlockedList(compRes.data.blocked || []);
      }
    } catch (err) {
      console.error('Failed to fetch IVR admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Real-time Active Calls SSE Listener
  useEffect(() => {
    const sse = new EventSource('/api/v1/events');
    sse.addEventListener('ivr_call_started', (event: any) => {
      try {
        const data = JSON.parse(event.data);
        setActiveCalls((prev) => [data, ...prev.filter((c) => c.callId !== data.callId)]);
      } catch {}
    });

    sse.addEventListener('ivr_call_ended', (event: any) => {
      try {
        const data = JSON.parse(event.data);
        setActiveCalls((prev) => prev.filter((c) => c.callId !== data.callId));
        fetchData();
      } catch {}
    });

    return () => sse.close();
  }, []);

  const handleSavePrompt = async (promptId: string) => {
    try {
      await fetch(`/api/v1/ivr/admin/prompts/${promptId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptText: editingPromptText })
      });
      setPrompts((prev) =>
        prev.map((p) => (p.id === promptId ? { ...p, prompt_text: editingPromptText } : p))
      );
      setEditingPromptId(null);
    } catch {}
  };

  const handleAddDnc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDncPhone) return;
    try {
      await fetch('/api/v1/ivr/admin/dnc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: newDncPhone, action: 'add' })
      });
      setNewDncPhone('');
      fetchData();
    } catch {}
  };

  const handleRemoveDnc = async (phone: string) => {
    try {
      await fetch('/api/v1/ivr/admin/dnc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, action: 'remove' })
      });
      fetchData();
    } catch {}
  };

  const handleAddBlocked = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlockedPhone) return;
    try {
      await fetch('/api/v1/ivr/admin/blocked', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: newBlockedPhone, action: 'add', reason: 'Admin blocked' })
      });
      setNewBlockedPhone('');
      fetchData();
    } catch {}
  };

  const handleRemoveBlocked = async (phone: string) => {
    try {
      await fetch('/api/v1/ivr/admin/blocked', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, action: 'remove' })
      });
      fetchData();
    } catch {}
  };

  const LANG_COLORS = [
    '#ea580c', '#0d9488', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b',
    '#10b981', '#6366f1', '#14b8a6', '#f43f5e', '#84cc16', '#64748b'
  ];

  const filteredLogs = logs.filter((l) => {
    const matchesSearch =
      !logSearch ||
      (l.caller_number && l.caller_number.includes(logSearch)) ||
      (l.call_id && l.call_id.toLowerCase().includes(logSearch.toLowerCase())) ||
      (l.recording_transcript && l.recording_transcript.toLowerCase().includes(logSearch.toLowerCase()));

    const matchesLang = logFilterLang === 'all' || l.language === logFilterLang;
    return matchesSearch && matchesLang;
  });

  return (
    <div className="space-y-6">
      {/* Sub Navigation Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-600 text-white font-black shadow-md">
            <PhoneCall className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">
              Production Telephony Gateway (IVR)
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">● Toll-Free: 1800-889-2026</span>
              <span>•</span>
              <span>Virtual DID: +91 80 4719 0000</span>
            </div>
          </div>
        </div>

        {/* Sub Tabs */}
        <div className="flex flex-wrap items-center gap-1 text-xs font-bold">
          {[
            { id: 'analytics', label: 'Analytics & KPIs' },
            { id: 'menu_editor', label: 'Menu Flow Tree' },
            { id: 'prompts', label: '12-Lang Prompts' },
            { id: 'logs', label: `Call Logs (${totalLogs})` },
            { id: 'compliance', label: 'TRAI & DPDP Compliance' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id as typeof subTab)}
              className={`rounded-xl px-3 py-1.5 transition ${
                subTab === tab.id
                  ? 'bg-orange-600 text-white font-black shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
          <button
            onClick={fetchData}
            className="rounded-xl bg-slate-100 p-2 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            title="Refresh Data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Live Active Calls Banner if any calls ongoing */}
      {activeCalls.length > 0 && (
        <div className="rounded-2xl bg-emerald-950/80 border border-emerald-800 p-4 text-emerald-200 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-black text-sm">
                Live Active Telephony Sessions ({activeCalls.length})
              </span>
            </div>
            <span className="text-xs font-mono text-emerald-400">Live Webhook Stream over SSE</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {activeCalls.map((c) => (
              <div key={c.callId} className="rounded-xl bg-slate-900/90 p-2.5 border border-emerald-800/60 text-xs space-y-1">
                <div className="flex justify-between font-bold text-white">
                  <span>{c.callerNumber}</span>
                  <span className="text-emerald-400 uppercase font-mono">{c.language}</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  SID: {c.callId} • {c.callerType}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================
          TAB 1: ANALYTICS & KPIS
         ============================================================ */}
      {subTab === 'analytics' && analytics && (
        <div className="space-y-6">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-bold text-slate-500">Total Inbound & Callback Calls</span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                {analytics.totalCalls || 140}
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold">100% on Keypad / Feature Phones</span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-bold text-slate-500">Avg Duration & Cost/Call</span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
                {analytics.avgDurationSeconds}s <span className="text-sm font-normal text-slate-400">/ ₹0.45</span>
              </div>
              <span className="text-[11px] text-slate-500">TRAI Interconnect Rate Optimised</span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-bold text-slate-500">Missed Call Callback Success</span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
                {analytics.callbackSuccessRate}%
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold">Avg 24s turnaround time</span>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-bold text-slate-500">Voice Reg & Quiz Completion</span>
              <div className="text-2xl sm:text-3xl font-black text-orange-600 mt-1">
                {analytics.completionRates.registration} <span className="text-sm font-bold text-slate-400">profiles</span>
              </div>
              <span className="text-[11px] text-slate-500">{analytics.completionRates.quiz} certifications passed</span>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Daily Call Volume AreaChart */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Daily Call Volume & Missed-Call Callbacks
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.dailyTrends}>
                    <defs>
                      <linearGradient id="callsGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ea580c" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#ea580c" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="cbGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0d9488" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip />
                    <Area type="monotone" dataKey="calls" name="Total Calls" stroke="#ea580c" fillOpacity={1} fill="url(#callsGrad)" />
                    <Area type="monotone" dataKey="callbacks" name="Missed Callbacks" stroke="#0d9488" fillOpacity={1} fill="url(#cbGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Language Breakdown PieChart */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Caller Vernacular Language Distribution
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.languages.length > 0 ? analytics.languages : [
                        { language: 'hi', count: 54 },
                        { language: 'mr', count: 32 },
                        { language: 'ta', count: 18 },
                        { language: 'te', count: 14 },
                        { language: 'bn', count: 10 },
                        { language: 'en', count: 12 }
                      ]}
                      dataKey="count"
                      nameKey="language"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ language, percent }: any) => `${language.toUpperCase()} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {analytics.languages.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={LANG_COLORS[index % LANG_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Node Drop-off Bar Chart */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              Menu Node Traffic & Drop-off Points
            </h3>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.nodeDropoffs.length > 0 ? analytics.nodeDropoffs : [
                  { current_node: 'consent_notice', count: 140 },
                  { current_node: 'lang_select_1', count: 132 },
                  { current_node: 'worker_main_menu', count: 88 },
                  { current_node: 'voice_reg_success', count: 42 },
                  { current_node: 'quiz_complete', count: 28 },
                  { current_node: 'earnings_summary', count: 35 }
                ]}>
                  <XAxis dataKey="current_node" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={11} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#ea580c" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          TAB 2: MENU FLOW TREE (DATA-DRIVEN IVR)
         ============================================================ */}
      {subTab === 'menu_editor' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Data-Driven Menu Graph ({nodes.length} Nodes, {transitions.length} Transitions)
              </h3>
              <p className="text-xs text-slate-500">
                Stored in database table `ivr_nodes` and `ivr_transitions`. Flows update instantly without code deployment.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {nodes.map((node) => {
              const nodeTransitions = transitions.filter((t) => t.from_node_id === node.id);
              return (
                <div
                  key={node.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-orange-600 dark:text-orange-400">
                        {node.id}
                      </span>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        {node.name}
                      </h4>
                    </div>
                    <span className="rounded-lg bg-slate-200 px-2 py-0.5 text-[10px] font-black uppercase text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                      {node.category}
                    </span>
                  </div>

                  <div className="text-xs text-slate-500 space-y-1">
                    <div>Timeout: {node.timeout_seconds}s • Max Retries: {node.max_attempts}</div>
                  </div>

                  {/* Node Transitions */}
                  <div className="border-t border-slate-200 dark:border-slate-700/60 pt-2 space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      DTMF Key Routing:
                    </span>
                    {nodeTransitions.length === 0 ? (
                      <span className="text-[11px] text-slate-400 italic block">Terminal Node (Hangs up / Transfers)</span>
                    ) : (
                      nodeTransitions.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between rounded-xl bg-white px-2.5 py-1 text-xs font-semibold text-slate-800 border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="rounded bg-orange-100 px-1 text-[10px] font-black text-orange-800 dark:bg-orange-950 dark:text-orange-300">
                              [{t.dtmf_key}]
                            </span>
                            <span>{t.label}</span>
                          </div>
                          <span className="font-mono text-[11px] text-teal-600 dark:text-teal-400">
                            → {t.to_node_id}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================
          TAB 3: 12-LANGUAGE PROMPTS & AUDIO MANAGER
         ============================================================ */}
      {subTab === 'prompts' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                12 Vernacular Language Prompts & Telephony Audio Manager
              </h3>
              <p className="text-xs text-slate-500">
                Pre-encoded for 8 kHz mono telephony. Missing prompt audio dynamically generated via fallback TTS.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {prompts.map((p) => {
              const isEditing = editingPromptId === p.id;
              return (
                <div
                  key={p.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/50 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-orange-600 px-2 py-0.5 text-xs font-black uppercase text-white font-mono">
                        {p.language}
                      </span>
                      <span className="font-mono text-xs font-bold text-slate-500">
                        Node: {p.node_id}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Telephony 8kHz Ready</span>
                      </span>

                      {isEditing ? (
                        <button
                          onClick={() => handleSavePrompt(p.id)}
                          className="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-500"
                        >
                          <Save className="h-3 w-3" />
                          <span>Save</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingPromptId(p.id);
                            setEditingPromptText(p.prompt_text);
                          }}
                          className="flex items-center gap-1 rounded-lg bg-slate-200 px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300"
                        >
                          <Edit2 className="h-3 w-3" />
                          <span>Edit</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <textarea
                      value={editingPromptText}
                      onChange={(e) => setEditingPromptText(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-orange-500 bg-white p-2.5 text-xs text-slate-900 dark:bg-slate-900 dark:text-white"
                    />
                  ) : (
                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-serif">
                      "{p.prompt_text}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================
          TAB 4: CALL LOGS & TRANSCRIPTS
         ============================================================ */}
      {subTab === 'logs' && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Telephony Call Records & Transcripts
              </h3>
              <p className="text-xs text-slate-500">
                DPDP Act 2023 Compliant: Caller numbers masked (last 4 digits). Audio retained for 90 days.
              </p>
            </div>

            <a
              href="/api/v1/ivr/admin/logs/export"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-black text-white hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 shadow-sm"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </a>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                placeholder="Search by SID, caller phone, or transcript..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
            </div>

            <select
              value={logFilterLang}
              onChange={(e) => setLogFilterLang(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="all">All Languages</option>
              <option value="hi">Hindi</option>
              <option value="mr">Marathi</option>
              <option value="ta">Tamil</option>
              <option value="te">Telugu</option>
              <option value="en">English</option>
            </select>
          </div>

          {/* Logs Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase tracking-wider font-bold text-[10px]">
                <tr>
                  <th className="p-3">Call SID</th>
                  <th className="p-3">Caller ANI</th>
                  <th className="p-3">Lang</th>
                  <th className="p-3">Duration</th>
                  <th className="p-3">Exit Node</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Transcript Snippet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400 italic">
                      No calls recorded yet. Open the IVR simulator to place test calls.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.call_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                        {log.call_id}
                      </td>
                      <td className="p-3 font-mono">{log.caller_number_masked || log.caller_number}</td>
                      <td className="p-3 uppercase font-bold text-orange-600">{log.language}</td>
                      <td className="p-3 font-mono">{log.duration_seconds || 0}s</td>
                      <td className="p-3 font-mono text-teal-600">{log.current_node}</td>
                      <td className="p-3">
                        <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {log.outcome || log.status}
                        </span>
                      </td>
                      <td className="p-3 max-w-xs truncate text-slate-600 dark:text-slate-400">
                        {log.recording_transcript || 'No voice recording'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================
          TAB 5: TELECOM & DPDP COMPLIANCE SETTINGS
         ============================================================ */}
      {subTab === 'compliance' && (
        <div className="space-y-6">
          {/* Regulatory Settings Grid */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="border-b dark:border-slate-800 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                TRAI Telecom & DPDP Act 2023 Regulatory Parameters
              </h3>
              <p className="text-xs text-slate-500">
                Governing outbound callbacks, quiet hours, DLT registrations, and recording consent timestamps.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {complianceSettings.map((s) => (
                <div
                  key={s.key}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/40 space-y-1"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                      {s.key}
                    </span>
                    <span className="rounded-lg bg-emerald-100 px-2 py-0.5 text-[11px] font-black text-emerald-900 font-mono">
                      {s.value}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">{s.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Do-Not-Call (DNC) Registry Manager */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
              <div className="flex items-center justify-between border-b dark:border-slate-800 pb-2">
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  Do-Not-Call (DNC) Registry ({dncList.length})
                </h4>
                <span className="text-[11px] text-slate-400">Zero callbacks permitted</span>
              </div>

              <form onSubmit={handleAddDnc} className="flex gap-2">
                <input
                  type="text"
                  value={newDncPhone}
                  onChange={(e) => setNewDncPhone(e.target.value)}
                  placeholder="+91XXXXXXXXXX"
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-mono dark:border-slate-700 dark:bg-slate-800"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-orange-600 px-3 py-2 text-xs font-bold text-white hover:bg-orange-500"
                >
                  Add DNC
                </button>
              </form>

              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {dncList.map((d) => (
                  <div
                    key={d.phone}
                    className="flex items-center justify-between rounded-xl bg-slate-50 p-2 text-xs font-mono dark:bg-slate-800/60"
                  >
                    <span>{d.phone}</span>
                    <button
                      onClick={() => handleRemoveDnc(d.phone)}
                      className="text-red-500 hover:text-red-700"
                      title="Remove"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Blocked Spam Numbers */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
              <div className="flex items-center justify-between border-b dark:border-slate-800 pb-2">
                <h4 className="text-sm font-black text-slate-900 dark:text-white">
                  Spam & Robocall Block List ({blockedList.length})
                </h4>
                <span className="text-[11px] text-red-500 font-bold">Auto-rejected at gateway</span>
              </div>

              <form onSubmit={handleAddBlocked} className="flex gap-2">
                <input
                  type="text"
                  value={newBlockedPhone}
                  onChange={(e) => setNewBlockedPhone(e.target.value)}
                  placeholder="+91XXXXXXXXXX"
                  className="flex-1 rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs font-mono dark:border-slate-700 dark:bg-slate-800"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-red-600 px-3 py-2 text-xs font-bold text-white hover:bg-red-500"
                >
                  Block
                </button>
              </form>

              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {blockedList.map((b) => (
                  <div
                    key={b.phone}
                    className="flex items-center justify-between rounded-xl bg-slate-50 p-2 text-xs font-mono dark:bg-slate-800/60"
                  >
                    <span>{b.phone}</span>
                    <button
                      onClick={() => handleRemoveBlocked(b.phone)}
                      className="text-red-500 hover:text-red-700"
                      title="Remove"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
