import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  Briefcase,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Radio,
  FileText,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  Send
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
import {
  workersRepo,
  employersRepo,
  jobsRepo,
  fraudRepo,
  disputesRepo,
  auditLogsRepo,
  notificationsRepo
} from '../services/db';
import { Worker, FraudQueueItem, Dispute, AuditLog } from '../types';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'workers' | 'fraud' | 'disputes' | 'broadcast' | 'audit'>('overview');

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [fraudItems, setFraudItems] = useState<FraudQueueItem[]>([]);
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [workerSearch, setWorkerSearch] = useState('');

  // Broadcast tool state
  const [broadcastChannel, setBroadcastChannel] = useState<'whatsapp' | 'sms' | 'push'>('whatsapp');
  const [broadcastSegment, setBroadcastSegment] = useState<'all_workers' | 'unverified' | 'employers'>('all_workers');
  const [broadcastMessage, setBroadcastMessage] = useState(
    '📢 दिवाली ऑफर: अपने प्रोफाइल पर आधार वेरिफाई करें और पाएं ₹100 का अतिरिक्त बोनस!'
  );
  const [broadcastSent, setBroadcastSent] = useState(false);

  useEffect(() => {
    setWorkers(workersRepo.getAll());
    setFraudItems(fraudRepo.getAll());
    setDisputes(disputesRepo.getAll());
    setAuditLogs(auditLogsRepo.getAll());
  }, []);

  const totalWorkers = workers.length;
  const totalJobs = jobsRepo.getAll().length;
  const gmv = jobsRepo.getAll().reduce((sum, j) => sum + j.totalAmountInr, 0);
  const revenue = jobsRepo.getAll().reduce((sum, j) => sum + j.platformFeeInr, 0) + 14900; // includes subscriptions

  // Recharts Monthly Growth & GMV Data
  const gmvTrends = [
    { month: 'May', gmv: 240000, revenue: 18500, hires: 94 },
    { month: 'Jun', gmv: 380000, revenue: 29000, hires: 142 },
    { month: 'Jul', gmv: 520000, revenue: 41000, hires: 210 },
    { month: 'Aug', gmv: 710000, revenue: 58000, hires: 320 },
    { month: 'Sep', gmv: 940000, revenue: 76000, hires: 430 },
    { month: 'Oct (MTD)', gmv: 1280000, revenue: 104000, hires: 590 }
  ];

  // Revenue By Stream Data
  const revenueStreams = [
    { name: 'Transaction Escrow Fees', value: 48000, color: '#ea580c' },
    { name: 'Contractor Subscriptions (₹499/mo)', value: 24000, color: '#0d9488' },
    { name: 'Skill Certifications (PMKVY/ITI)', value: 12000, color: '#f59e0b' },
    { name: 'Enterprise Corporate Accounts', value: 15000, color: '#3b82f6' },
    { name: 'Insurance Micro-Referrals (₹50/mo)', value: 5000, color: '#8b5cf6' }
  ];

  const handleToggleWorkerStatus = async (wId: string, currentStatus: Worker['status']) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await fetch(`/api/v1/admin/workers/${wId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, reason: 'Admin dashboard toggle' })
      });
    } catch {}
    workersRepo.updateStatus(wId, nextStatus);
    setWorkers(workersRepo.getAll());
    auditLogsRepo.log({
      actorId: 'admin-01',
      actorRole: 'admin',
      action: `WORKER_STATUS_${nextStatus.toUpperCase()}`,
      entityType: 'worker',
      entityId: wId,
      details: `Admin changed status to ${nextStatus}`
    });
    setAuditLogs(auditLogsRepo.getAll());
  };

  const handleFraudAction = (fId: string, action: 'approved' | 'banned') => {
    fraudRepo.updateStatus(fId, action);
    setFraudItems(fraudRepo.getAll());
    auditLogsRepo.log({
      actorId: 'admin-01',
      actorRole: 'admin',
      action: `FRAUD_CASE_${action.toUpperCase()}`,
      entityType: 'fraud_alert',
      entityId: fId,
      details: `Resolution action: ${action}`
    });
    setAuditLogs(auditLogsRepo.getAll());
  };

  const handleResolveDispute = async (dId: string, outcome: 'resolved_refund' | 'resolved_payout') => {
    const dispute = disputes.find((d) => d.id === dId);
    if (!dispute) return;
    try {
      await fetch(`/api/v1/disputes/${dId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolution: outcome === 'resolved_refund' ? 'resolve_refund' : 'resolve_disburse',
          notes: `Admin mediator resolved with ${outcome}`
        })
      });
    } catch {}
    dispute.status = outcome;
    dispute.notes = `Mediator resolved with ${outcome}`;
    disputesRepo.save(dispute);
    setDisputes(disputesRepo.getAll());

    auditLogsRepo.log({
      actorId: 'admin-01',
      actorRole: 'admin',
      action: 'DISPUTE_RESOLVED',
      entityType: 'dispute',
      entityId: dId,
      details: `Outcome: ${outcome}`
    });
    setAuditLogs(auditLogsRepo.getAll());
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setBroadcastSent(true);
    try {
      await fetch('/api/v1/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: broadcastChannel,
          message: broadcastMessage
        })
      });
    } catch {}
    notificationsRepo.send({
      userId: 'broadcast-all',
      role: 'worker',
      title: 'SkillBridge Operations Notice',
      message: broadcastMessage,
      channel: broadcastChannel
    });
    setTimeout(() => setBroadcastSent(false), 2500);
  };

  const filteredWorkers = workers.filter(
    (w) =>
      w.name.toLowerCase().includes(workerSearch.toLowerCase()) ||
      w.primarySkill.toLowerCase().includes(workerSearch.toLowerCase()) ||
      w.district.toLowerCase().includes(workerSearch.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-6 space-y-6 animate-fadeIn">
      {/* Admin Title & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b pb-4 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 text-white px-3 py-1 text-xs font-black uppercase tracking-wider dark:bg-slate-800 mb-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>National Workforce Operations Console</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            SkillBridge Control Center
          </h1>
        </div>

        {/* Admin Section Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
          {[
            { id: 'overview', label: 'KPIs & GMV' },
            { id: 'workers', label: `Workers (${totalWorkers})` },
            { id: 'fraud', label: `Fraud Queue (${fraudItems.filter((f) => f.status === 'pending').length})` },
            { id: 'disputes', label: `Disputes (${disputes.length})` },
            { id: 'broadcast', label: 'Broadcast Tool' },
            { id: 'audit', label: 'Audit Logs' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`rounded-xl px-3 py-2 transition ${
                activeTab === tab.id
                  ? 'bg-orange-600 text-white shadow-sm font-black'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: OVERVIEW & RECHARTS KPIS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 4 Stat Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total Registered Workers
              </span>
              <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                {totalWorkers}
              </div>
              <div className="text-xs text-emerald-600 font-bold mt-1">↑ 28% this month</div>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Gross Merchandise Value (GMV)
              </span>
              <div className="text-3xl font-black text-orange-600 dark:text-orange-400 mt-1">
                ₹{(gmv + 1280000).toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-slate-500 mt-1">Escrow wage volume</div>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Platform Net Revenue
              </span>
              <div className="text-3xl font-black text-teal-600 dark:text-teal-400 mt-1">
                ₹{(revenue + 89000).toLocaleString('en-IN')}
              </div>
              <div className="text-xs text-emerald-600 font-bold mt-1">Profitable unit economics</div>
            </div>

            <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total Hires Completed
              </span>
              <div className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                {totalJobs + 1720}
              </div>
              <div className="text-xs text-slate-500 mt-1">Across 7 Indian metros</div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid lg:grid-cols-12 gap-6">
            {/* GMV Growth Area Chart */}
            <div className="lg:col-span-8 rounded-3xl bg-white p-6 shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Escrow GMV & Monthly Hires Velocity
                  </h3>
                  <p className="text-xs text-slate-400">Monthly transactional volume (INR)</p>
                </div>
                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-800 dark:bg-orange-950 dark:text-orange-300">
                  +124% QoQ Growth
                </span>
              </div>

              <div className="h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={gmvTrends}>
                    <defs>
                      <linearGradient id="gmvGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stop-color="#ea580c" stop-opacity={0.3} />
                        <stop offset="95%" stop-color="#ea580c" stop-opacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} />
                    <Tooltip
                      formatter={(val: any) => [`₹${Number(val || 0).toLocaleString('en-IN')}`, 'Escrow Volume']}
                    />
                    <Area
                      type="monotone"
                      dataKey="gmv"
                      stroke="#ea580c"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#gmvGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Revenue by Stream Pie Chart */}
            <div className="lg:col-span-4 rounded-3xl bg-white p-6 shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800 space-y-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Revenue Streams (₹1.03L MTD)
              </h3>
              <p className="text-xs text-slate-400">Breakdown of monetized verticals</p>

              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={revenueStreams}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {revenueStreams.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => [`₹${Number(val || 0).toLocaleString('en-IN')}`, 'Revenue']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-1 text-[11px] font-semibold">
                {revenueStreams.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-600 dark:text-slate-400 truncate max-w-[140px]">
                        {item.name}
                      </span>
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      ₹{item.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WORKER MANAGEMENT */}
      {activeTab === 'workers' && (
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Worker Directory & KYC Status
            </h3>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={workerSearch}
                onChange={(e) => setWorkerSearch(e.target.value)}
                placeholder="Filter by name, trade or city..."
                className="w-full rounded-xl border border-slate-300 py-1.5 pl-8 pr-3 text-xs dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-400 dark:bg-slate-800">
                <tr>
                  <th className="p-3">Worker Name</th>
                  <th className="p-3">Primary Trade</th>
                  <th className="p-3">Location</th>
                  <th className="p-3">Aadhaar KYC</th>
                  <th className="p-3">Reputation</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredWorkers.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-slate-900 dark:text-white">
                      {w.name}
                      <div className="text-[10px] text-slate-400 font-normal">{w.phone}</div>
                    </td>
                    <td className="p-3 text-orange-600 font-semibold">{w.primarySkill}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{w.district}</td>
                    <td className="p-3">
                      {w.aadhaarVerified ? (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                          ✓ Verified Hash
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          Pending OTP
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-bold text-amber-600">★ {w.reputationScore}</td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          w.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {w.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleToggleWorkerStatus(w.id, w.status)}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-bold transition ${
                          w.status === 'active'
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                        }`}
                      >
                        {w.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: FRAUD QUEUE WITH 5 RULE-BASED FLAGS */}
      {activeTab === 'fraud' && (
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-red-600" />
                <span>Automated Rule-Based Fraud Queue (5 Vectors)</span>
              </h3>
              <p className="text-xs text-slate-400">
                Monitors voice biometrics, abnormal hire frequency, rating manipulation, payment chargebacks, and rapid GPS velocity jumps.
              </p>
            </div>
            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">
              {fraudItems.filter((f) => f.status === 'pending').length} Pending Review
            </span>
          </div>

          <div className="space-y-3">
            {fraudItems.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800 space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                        item.severity === 'critical'
                          ? 'bg-red-600 text-white'
                          : item.severity === 'high'
                          ? 'bg-orange-600 text-white'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      {item.severity}
                    </span>
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {item.flagType.toUpperCase().replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs text-slate-400">• Subject: {item.workerName}</span>
                  </div>

                  <span className="text-[11px] font-mono text-slate-400">
                    Flagged: {new Date(item.flaggedAt).toLocaleString()}
                  </span>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl">
                  {item.description}
                </p>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    Status: <strong className="capitalize">{item.status}</strong>
                  </span>

                  {item.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleFraudAction(item.id, 'approved')}
                        className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition"
                      >
                        Approve (Clear Flag)
                      </button>
                      <button
                        onClick={() => handleFraudAction(item.id, 'banned')}
                        className="rounded-xl bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-500 transition"
                      >
                        Ban Account
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: DISPUTE RESOLUTION WORKFLOW */}
      {activeTab === 'disputes' && (
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Dispute Resolution & Escrow Mediation
              </h3>
              <p className="text-xs text-slate-400">
                Inspect complaints and decide between employer escrow refund or worker wage release.
              </p>
            </div>
            <span className="text-xs font-bold text-amber-600">
              {disputes.filter((d) => ['open', 'investigating'].includes(d.status)).length} Active
            </span>
          </div>

          <div className="space-y-3">
            {disputes.map((disp) => (
              <div
                key={disp.id}
                className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-red-600">Dispute #{disp.id}</span>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      Raised by: {disp.raisedByName} ({disp.raisedBy})
                    </h4>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold capitalize dark:bg-slate-800">
                    Status: {disp.status.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/60 dark:bg-slate-800">
                  <strong>Complaint:</strong> {disp.reason}
                </p>

                {disp.notes && (
                  <div className="text-[11px] text-slate-500">
                    <strong>Mediator Notes:</strong> {disp.notes}
                  </div>
                )}

                {['open', 'investigating'].includes(disp.status) && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => handleResolveDispute(disp.id, 'resolved_payout')}
                      className="rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition"
                    >
                      Release Escrow to Worker
                    </button>
                    <button
                      onClick={() => handleResolveDispute(disp.id, 'resolved_refund')}
                      className="rounded-xl bg-orange-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-orange-500 transition"
                    >
                      Issue Full Refund to Employer
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: BROADCAST TOOL */}
      {activeTab === 'broadcast' && (
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800 space-y-4">
          <h3 className="text-lg font-black text-slate-900 dark:text-white border-b pb-3 dark:border-slate-800">
            Mass Vernacular Notification Broadcast Tool
          </h3>

          <form onSubmit={handleSendBroadcast} className="space-y-4 max-w-xl">
            <div className="grid grid-cols-2 gap-3 text-xs font-bold">
              <div>
                <label className="block mb-1 text-slate-700 dark:text-slate-300">Channel</label>
                <select
                  value={broadcastChannel}
                  onChange={(e) => setBroadcastChannel(e.target.value as typeof broadcastChannel)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="whatsapp">WhatsApp Template Message</option>
                  <option value="sms">SMS Text Alert (MSG91)</option>
                  <option value="push">PWA Mobile Push</option>
                </select>
              </div>

              <div>
                <label className="block mb-1 text-slate-700 dark:text-slate-300">Audience Segment</label>
                <select
                  value={broadcastSegment}
                  onChange={(e) => setBroadcastSegment(e.target.value as typeof broadcastSegment)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="all_workers">All Active Workers ({totalWorkers})</option>
                  <option value="unverified">Pending Aadhaar KYC</option>
                  <option value="employers">Contractor & Household Employers</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Vernacular Broadcast Copy (Hindi / Regional Script)
              </label>
              <textarea
                rows={3}
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                className="w-full rounded-xl border border-slate-300 p-3 text-xs font-serif dark:border-slate-700 dark:bg-slate-800"
              />
            </div>

            <button
              type="submit"
              className="flex items-center gap-2 rounded-2xl bg-orange-600 px-6 py-3 text-xs font-black text-white shadow hover:bg-orange-500 transition"
            >
              <Send className="h-4 w-4" />
              <span>Broadcast Campaign to {totalWorkers} Workers</span>
            </button>

            {broadcastSent && (
              <div className="rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-800 border border-emerald-200">
                ✓ Campaign queued! Dispatching simulated {broadcastChannel.toUpperCase()} packets.
              </div>
            )}
          </form>
        </div>
      )}

      {/* TAB 6: AUDIT LOG VIEWER */}
      {activeTab === 'audit' && (
        <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800 space-y-4">
          <h3 className="text-lg font-black text-slate-900 dark:text-white border-b pb-3 dark:border-slate-800">
            Immutable Audit Trail Logs
          </h3>

          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800"
              >
                <div>
                  <span className="font-mono font-bold text-orange-600 dark:text-orange-400">
                    [{log.action}]
                  </span>
                  <span className="text-slate-700 dark:text-slate-300 ml-2">{log.details}</span>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Actor: {log.actorId} ({log.actorRole}) • Entity: {log.entityType} #{log.entityId}
                  </div>
                </div>
                <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-4">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
