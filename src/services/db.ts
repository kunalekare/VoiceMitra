import {
  Worker,
  Employer,
  Job,
  Review,
  Dispute,
  AuditLog,
  Notification,
  Referral,
  Invoice,
  ApiKey,
  FraudQueueItem
} from '../types';
import {
  SEED_WORKERS,
  SEED_EMPLOYERS,
  SEED_JOBS,
  SEED_REVIEWS,
  SEED_DISPUTES,
  SEED_AUDIT_LOGS,
  SEED_NOTIFICATIONS,
  SEED_FRAUD_QUEUE
} from '../data/seedData';
import { calculateUpdatedReputation } from '../utils/ranking';

const KEYS = {
  WORKERS: 'skillbridge_workers_v1',
  EMPLOYERS: 'skillbridge_employers_v1',
  JOBS: 'skillbridge_jobs_v1',
  REVIEWS: 'skillbridge_reviews_v1',
  DISPUTES: 'skillbridge_disputes_v1',
  AUDIT_LOGS: 'skillbridge_audit_logs_v1',
  NOTIFICATIONS: 'skillbridge_notifications_v1',
  REFERRALS: 'skillbridge_referrals_v1',
  INVOICES: 'skillbridge_invoices_v1',
  API_KEYS: 'skillbridge_api_keys_v1',
  FRAUD_QUEUE: 'skillbridge_fraud_queue_v1',
  ANALYTICS: 'skillbridge_analytics_v1'
};

function getItem<T>(key: string, defaultVal: T): T {
  if (typeof window === 'undefined') return defaultVal;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultVal));
      return defaultVal;
    }
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error(`Error reading ${key} from storage:`, e);
    return defaultVal;
  }
}

function setItem<T>(key: string, val: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
    window.dispatchEvent(new CustomEvent('skillbridge-storage-update', { detail: { key } }));
  } catch (e) {
    console.error(`Error saving ${key} to storage:`, e);
  }
}

// Initialize database with seed data if empty
export function initDatabase(): void {
  getItem<Worker[]>(KEYS.WORKERS, SEED_WORKERS);
  getItem<Employer[]>(KEYS.EMPLOYERS, SEED_EMPLOYERS);
  getItem<Job[]>(KEYS.JOBS, SEED_JOBS);
  getItem<Review[]>(KEYS.REVIEWS, SEED_REVIEWS);
  getItem<Dispute[]>(KEYS.DISPUTES, SEED_DISPUTES);
  getItem<AuditLog[]>(KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS);
  getItem<Notification[]>(KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
  getItem<FraudQueueItem[]>(KEYS.FRAUD_QUEUE, SEED_FRAUD_QUEUE);
}

// WORKERS REPOSITORY
export const workersRepo = {
  getAll: (): Worker[] => getItem<Worker[]>(KEYS.WORKERS, SEED_WORKERS),
  getById: (id: string): Worker | undefined => {
    const all = workersRepo.getAll();
    return all.find((w) => w.id === id);
  },
  getByPhone: (phone: string): Worker | undefined => {
    const all = workersRepo.getAll();
    const clean = phone.replace(/\D/g, '');
    return all.find((w) => w.phone.replace(/\D/g, '') === clean);
  },
  save: (worker: Worker): Worker => {
    const all = workersRepo.getAll();
    const idx = all.findIndex((w) => w.id === worker.id);
    if (idx >= 0) {
      all[idx] = worker;
    } else {
      all.unshift(worker);
    }
    setItem(KEYS.WORKERS, all);
    return worker;
  },
  toggleAvailability: (id: string): boolean => {
    const all = workersRepo.getAll();
    const w = all.find((item) => item.id === id);
    if (!w) return false;
    w.isAvailable = !w.isAvailable;
    setItem(KEYS.WORKERS, all);
    return w.isAvailable;
  },
  updateStatus: (id: string, status: Worker['status']): void => {
    const all = workersRepo.getAll();
    const w = all.find((item) => item.id === id);
    if (!w) return;
    w.status = status;
    setItem(KEYS.WORKERS, all);
  }
};

// EMPLOYERS REPOSITORY
export const employersRepo = {
  getAll: (): Employer[] => getItem<Employer[]>(KEYS.EMPLOYERS, SEED_EMPLOYERS),
  getById: (id: string): Employer | undefined => {
    return employersRepo.getAll().find((e) => e.id === id);
  },
  getByPhone: (phone: string): Employer | undefined => {
    const clean = phone.replace(/\D/g, '');
    return employersRepo.getAll().find((e) => e.phone.replace(/\D/g, '') === clean);
  },
  save: (employer: Employer): Employer => {
    const all = employersRepo.getAll();
    const idx = all.findIndex((e) => e.id === employer.id);
    if (idx >= 0) {
      all[idx] = employer;
    } else {
      all.unshift(employer);
    }
    setItem(KEYS.EMPLOYERS, all);
    return employer;
  }
};

// JOBS REPOSITORY
export const jobsRepo = {
  getAll: (): Job[] => getItem<Job[]>(KEYS.JOBS, SEED_JOBS),
  getById: (id: string): Job | undefined => {
    return jobsRepo.getAll().find((j) => j.id === id);
  },
  getByWorkerId: (workerId: string): Job[] => {
    return jobsRepo.getAll().filter((j) => j.workerIds.includes(workerId));
  },
  getByEmployerId: (employerId: string): Job[] => {
    return jobsRepo.getAll().filter((j) => j.employerId === employerId);
  },
  save: (job: Job): Job => {
    const all = jobsRepo.getAll();
    const idx = all.findIndex((j) => j.id === job.id);
    if (idx >= 0) {
      all[idx] = job;
    } else {
      all.unshift(job);
    }
    setItem(KEYS.JOBS, all);
    return job;
  },
  updateStatus: (jobId: string, status: Job['status']): Job | undefined => {
    const all = jobsRepo.getAll();
    const job = all.find((j) => j.id === jobId);
    if (!job) return undefined;
    job.status = status;
    setItem(KEYS.JOBS, all);
    return job;
  }
};

// REVIEWS REPOSITORY & REPUTATION CALCULATION
export const reviewsRepo = {
  getAll: (): Review[] => getItem<Review[]>(KEYS.REVIEWS, SEED_REVIEWS),
  getByWorkerId: (workerId: string): Review[] => {
    return reviewsRepo.getAll().filter((r) => r.workerId === workerId);
  },
  addReview: (review: Review): Review => {
    const all = reviewsRepo.getAll();
    all.unshift(review);
    setItem(KEYS.REVIEWS, all);

    // Update worker reputation score using exact formula:
    // (oldScore * oldCount + newRating) / (oldCount + 1)
    const worker = workersRepo.getById(review.workerId);
    if (worker) {
      const { newScore, newCount } = calculateUpdatedReputation(
        worker.reputationScore,
        worker.totalJobs,
        review.rating
      );
      worker.reputationScore = newScore;
      worker.totalJobs = newCount;
      workersRepo.save(worker);
    }

    return review;
  }
};

// DISPUTES REPOSITORY
export const disputesRepo = {
  getAll: (): Dispute[] => getItem<Dispute[]>(KEYS.DISPUTES, SEED_DISPUTES),
  save: (dispute: Dispute): Dispute => {
    const all = disputesRepo.getAll();
    const idx = all.findIndex((d) => d.id === dispute.id);
    if (idx >= 0) {
      all[idx] = dispute;
    } else {
      all.unshift(dispute);
    }
    setItem(KEYS.DISPUTES, all);
    return dispute;
  }
};

// NOTIFICATIONS REPOSITORY
export const notificationsRepo = {
  getAll: (): Notification[] => getItem<Notification[]>(KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS),
  getByUser: (userId: string): Notification[] => {
    return notificationsRepo.getAll().filter((n) => n.userId === userId);
  },
  send: (notif: Omit<Notification, 'id' | 'createdAt' | 'read'> & Partial<Pick<Notification, 'id' | 'createdAt' | 'read'>>): Notification => {
    const all = notificationsRepo.getAll();
    const newNotif: Notification = {
      ...notif,
      id: notif.id || `notif-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: notif.createdAt || new Date().toISOString(),
      read: notif.read ?? false
    };
    all.unshift(newNotif);
    setItem(KEYS.NOTIFICATIONS, all);
    return newNotif;
  },
  addNotification: (notif: Omit<Notification, 'id' | 'createdAt' | 'read'> & Partial<Pick<Notification, 'id' | 'createdAt' | 'read'>>): Notification => {
    return notificationsRepo.send(notif);
  },
  markAsRead: (id: string): void => {
    const all = notificationsRepo.getAll();
    const n = all.find((item) => item.id === id);
    if (n) {
      n.read = true;
      setItem(KEYS.NOTIFICATIONS, all);
    }
  }
};

// AUDIT LOGS REPOSITORY
export const auditLogsRepo = {
  getAll: (): AuditLog[] => getItem<AuditLog[]>(KEYS.AUDIT_LOGS, SEED_AUDIT_LOGS),
  log: (entry: Omit<AuditLog, 'id' | 'timestamp'> & { id?: string; timestamp?: string }): AuditLog => {
    const all = auditLogsRepo.getAll();
    const newEntry: AuditLog = {
      ...entry,
      id: entry.id || `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: entry.timestamp || new Date().toISOString()
    };
    all.unshift(newEntry);
    setItem(KEYS.AUDIT_LOGS, all);
    return newEntry;
  }
};

// FRAUD QUEUE REPOSITORY
export const fraudRepo = {
  getAll: (): FraudQueueItem[] => getItem<FraudQueueItem[]>(KEYS.FRAUD_QUEUE, SEED_FRAUD_QUEUE),
  updateStatus: (id: string, status: FraudQueueItem['status']): void => {
    const all = fraudRepo.getAll();
    const item = all.find((f) => f.id === id);
    if (item) {
      item.status = status;
      setItem(KEYS.FRAUD_QUEUE, all);
    }
  }
};

// API KEYS REPOSITORY
export const apiKeysRepo = {
  getAll: (): ApiKey[] =>
    getItem<ApiKey[]>(KEYS.API_KEYS, [
      {
        id: 'key-01',
        name: 'Construction Portal Sync',
        keyPrefix: 'sk_live_sb_',
        keySecretMasked: 'sk_live_sb_9921****88a1',
        rateLimitPerMinute: 60,
        totalRequests: 1420,
        status: 'active',
        createdAt: '2026-08-01T00:00:00.000Z'
      }
    ]),
  createKey: (name: string): ApiKey => {
    const all = apiKeysRepo.getAll();
    const randomHex = Math.random().toString(36).substr(2, 12);
    const newKey: ApiKey = {
      id: `key-${Date.now()}`,
      name,
      keyPrefix: 'sk_live_sb_',
      keySecretMasked: `sk_live_sb_${randomHex.substr(0, 4)}****${randomHex.substr(-4)}`,
      rateLimitPerMinute: 120,
      totalRequests: 0,
      status: 'active',
      createdAt: new Date().toISOString()
    };
    all.unshift(newKey);
    setItem(KEYS.API_KEYS, all);
    return newKey;
  },
  revokeKey: (id: string): void => {
    const all = apiKeysRepo.getAll();
    const k = all.find((item) => item.id === id);
    if (k) {
      k.status = 'revoked';
      setItem(KEYS.API_KEYS, all);
    }
  }
};

// ANALYTICS / EVENT TRACKING (PostHog-style funnel)
export interface AnalyticsEvent {
  id: string;
  eventName: 'search' | 'view_worker' | 'initiate_hire' | 'payment_completed' | 'job_completed' | 'voice_registered';
  userId?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export const analyticsRepo = {
  getAll: (): AnalyticsEvent[] =>
    getItem<AnalyticsEvent[]>(KEYS.ANALYTICS, [
      { id: 'ev-1', eventName: 'search', timestamp: '2026-10-14T10:00:00.000Z' },
      { id: 'ev-2', eventName: 'view_worker', timestamp: '2026-10-14T10:05:00.000Z' },
      { id: 'ev-3', eventName: 'initiate_hire', timestamp: '2026-10-14T10:10:00.000Z' },
      { id: 'ev-4', eventName: 'payment_completed', timestamp: '2026-10-14T10:15:00.000Z' }
    ]),
  track: (eventName: AnalyticsEvent['eventName'], metadata?: Record<string, unknown>): void => {
    const all = analyticsRepo.getAll();
    all.unshift({
      id: `ev-${Date.now()}`,
      eventName,
      metadata,
      timestamp: new Date().toISOString()
    });
    setItem(KEYS.ANALYTICS, all.slice(0, 200)); // cap recent 200 events
  }
};
