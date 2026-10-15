/**
 * SkillBridge Typed API Client for /api/v1/*
 * All backend trust logic, escrow calculations, and persistence live on the server.
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId: string;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Generate client-side request-id if not present
  if (!headers.has('x-request-id')) {
    headers.set('x-request-id', `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
    credentials: 'include' // send cookies
  });

  const json: ApiResponse<T> = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || `API request failed with status ${res.status}`);
  }

  return json.data;
}

export const api = {
  // Auth
  auth: {
    requestOtp: (phone: string) =>
      request<{ success: boolean; message: string; resendInSeconds: number; devOtp?: string }>('/api/v1/auth/request-otp', {
        method: 'POST',
        body: JSON.stringify({ phone })
      }),

    verifyOtp: (phone: string, otp: string, preferredRole?: string, name?: string) =>
      request<{ user: any; accessToken: string }>('/api/v1/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ phone, otp, preferredRole, name })
      }),

    getProfile: () => request<any>('/api/v1/auth/me'),

    logout: () => request<{ message: string }>('/api/v1/auth/logout', { method: 'POST' })
  },

  // Workers
  workers: {
    search: (params: {
      query?: string;
      skill?: string;
      district?: string;
      state?: string;
      minRating?: number;
      verifiedOnly?: boolean;
      availableOnly?: boolean;
      lat?: number;
      lng?: number;
      radiusKm?: number;
      page?: number;
      limit?: number;
    }) => {
      const q = new URLSearchParams();
      if (params.query) q.set('query', params.query);
      if (params.skill) q.set('skill', params.skill);
      if (params.district) q.set('district', params.district);
      if (params.state) q.set('state', params.state);
      if (params.minRating) q.set('minRating', params.minRating.toString());
      if (params.verifiedOnly) q.set('verifiedOnly', 'true');
      if (params.availableOnly) q.set('availableOnly', 'true');
      if (params.lat) q.set('lat', params.lat.toString());
      if (params.lng) q.set('lng', params.lng.toString());
      if (params.radiusKm) q.set('radiusKm', params.radiusKm.toString());
      if (params.page) q.set('page', params.page.toString());
      if (params.limit) q.set('limit', params.limit.toString());
      return request<{ workers: any[]; total: number; page: number; limit: number }>(`/api/v1/workers/search?${q.toString()}`);
    },

    getById: (id: string) => request<any>(`/api/v1/workers/${id}`),

    voiceRegister: (payload: {
      audioBase64?: string;
      mimeType?: string;
      textInput?: string;
      languageCode?: string;
      overrideData?: any;
      userId?: string;
      phone?: string;
    }) =>
      request<{ worker: any; extracted: any }>('/api/v1/workers/voice-register', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    getSummary: (workerData: any) =>
      request<{ summaryEnglish: string; summaryHindi: string }>('/api/v1/workers/summary', {
        method: 'POST',
        body: JSON.stringify(workerData)
      }),

    toggleAvailability: (id: string, isAvailable: boolean) =>
      request<{ isAvailable: boolean }>(`/api/v1/workers/${id}/availability`, {
        method: 'PATCH',
        body: JSON.stringify({ isAvailable })
      })
  },

  // Jobs & Escrow
  jobs: {
    hire: (payload: {
      employerId: string;
      workerIds?: string[];
      workerId?: string;
      skillRequired: string;
      description: string;
      startDate: string;
      endDate: string;
      durationDays: number;
      dailyWageInr: number;
      employerPlan?: string;
      idempotencyKey?: string;
    }) => {
      const headers: Record<string, string> = {};
      if (payload.idempotencyKey) {
        headers['idempotency-key'] = payload.idempotencyKey;
      }
      return request<any>('/api/v1/jobs/hire', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
    },

    transitionStatus: (jobId: string, status: string, actorId?: string, actorRole?: string) =>
      request<any>(`/api/v1/jobs/${jobId}/transition`, {
        method: 'POST',
        body: JSON.stringify({ status, actorId, actorRole })
      }),

    getEmployerJobs: (employerId: string) =>
      request<any[]>(`/api/v1/jobs/employer/${employerId}`),

    getWorkerJobs: (workerId: string) =>
      request<any[]>(`/api/v1/jobs/worker/${workerId}`),

    voiceMatch: (payload: { audioBase64?: string; textInput?: string }) =>
      request<any>('/api/v1/jobs/voice-match', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    submitReview: (jobId: string, payload: {
      reviewerId: string;
      reviewerRole: string;
      workerId: string;
      score: number;
      comment: string;
    }) =>
      request<any>(`/api/v1/jobs/${jobId}/review`, {
        method: 'POST',
        body: JSON.stringify(payload)
      })
  },

  // Payments & Payouts
  payments: {
    createOrder: (jobId: string, employerId?: string) =>
      request<{ orderId: string; amountPaise: number; currency: string; jobId: string; keyId: string }>(
        '/api/v1/payments/order',
        {
          method: 'POST',
          body: JSON.stringify({ jobId, employerId })
        }
      ),

    verifyPayment: (payload: {
      jobId: string;
      employerId?: string;
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature?: string;
      idempotencyKey?: string;
    }) => {
      const headers: Record<string, string> = {};
      if (payload.idempotencyKey) {
        headers['idempotency-key'] = payload.idempotencyKey;
      }
      return request<{ success: boolean; paymentId: string; jobId: string }>('/api/v1/payments/verify', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
    },

    disbursePayout: (payload: {
      workerId: string;
      amountInr: number;
      mode: 'upi' | 'bank_account';
      destination: string;
      ifsc?: string;
      accountHolderName?: string;
      idempotencyKey?: string;
    }) => {
      const headers: Record<string, string> = {};
      if (payload.idempotencyKey) {
        headers['idempotency-key'] = payload.idempotencyKey;
      }
      return request<{ payoutId: string; utrNumber: string; amountInr: number; status: string }>(
        '/api/v1/payments/disburse',
        {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        }
      );
    },

    getPayouts: (workerId: string) => request<any[]>(`/api/v1/payments/payouts/${workerId}`)
  },

  // KYC
  kyc: {
    verifyAadhaar: (workerId: string, aadhaarNumber: string, otp: string) =>
      request<{ success: boolean; maskedAadhaar: string; referenceId: string; message: string }>(
        '/api/v1/kyc/aadhaar/verify',
        {
          method: 'POST',
          body: JSON.stringify({ workerId, aadhaarNumber, otp })
        }
      ),

    verifyDigiLocker: (workerId: string, certificateType: string, certNumber: string) =>
      request<{ success: boolean; badgeName: string; message: string }>('/api/v1/kyc/digilocker/verify', {
        method: 'POST',
        body: JSON.stringify({ workerId, certificateType, certNumber })
      })
  },

  // Quiz
  quiz: {
    getQuestions: (skill: string) => request<{ skill: string; questions: any[] }>(`/api/v1/quiz/${skill}`),

    submit: (payload: { workerId: string; skill: string; answers: Array<{ questionId: number; selectedIndex: number }> }) =>
      request<{ score: number; passed: boolean; badgeAwarded?: string; message: string }>('/api/v1/quiz/submit', {
        method: 'POST',
        body: JSON.stringify(payload)
      })
  },

  // Disputes
  disputes: {
    getAll: () => request<any[]>('/api/v1/disputes'),

    open: (payload: { jobId: string; raisedBy: string; reason: string; evidence?: string; actorId?: string }) =>
      request<any>('/api/v1/disputes/open', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    resolve: (disputeId: string, payload: { resolution: string; notes: string; adminId?: string }) =>
      request<any>(`/api/v1/disputes/${disputeId}/resolve`, {
        method: 'POST',
        body: JSON.stringify(payload)
      })
  },

  // Admin
  admin: {
    getMetrics: () => request<any>('/api/v1/admin/metrics'),

    getWorkers: () => request<any[]>('/api/v1/admin/workers'),

    updateWorkerStatus: (workerId: string, status: string, reason?: string) =>
      request<any>(`/api/v1/admin/workers/${workerId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, reason })
      }),

    getFraudQueue: () => request<any[]>('/api/v1/admin/fraud-queue'),

    getAuditLogs: () => request<any[]>('/api/v1/admin/audit-logs'),

    broadcast: (payload: { channel: string; targetSkill?: string; targetDistrict?: string; message: string }) =>
      request<{ success: boolean; deliveredCount: number; message: string }>('/api/v1/admin/broadcast', {
        method: 'POST',
        body: JSON.stringify(payload)
      })
  },

  // Webhooks
  webhooks: {
    sendWhatsApp: (payload: { from?: string; message: string; state?: string }) =>
      request<any>('/api/v1/webhooks/whatsapp', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),

    sendIvrDtmf: (payload: { callSid?: string; digits: string; step?: string; phone?: string }) =>
      request<any>('/api/v1/webhooks/ivr', {
        method: 'POST',
        body: JSON.stringify(payload)
      })
  },

  // Developer & Live Tests
  developer: {
    getKeys: () => request<any[]>('/api/v1/developer/keys'),

    createKey: (name: string, userId?: string) =>
      request<any>('/api/v1/developer/keys', {
        method: 'POST',
        body: JSON.stringify({ name, userId })
      }),

    revokeKey: (id: string) => request<any>(`/api/v1/developer/keys/${id}`, { method: 'DELETE' }),

    runLiveTests: () =>
      request<{
        passed: boolean;
        totalTests: number;
        passedCount: number;
        results: Array<{ testName: string; category: string; passed: boolean; durationMs: number; details: string }>;
      }>('/api/v1/developer/test-runner', { method: 'POST' })
  }
};

/**
 * Real-Time Server-Sent Events (SSE) Subscriber Hook
 */
export function subscribeToRealtimeEvents(onEvent: (event: string, data: any) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const es = new EventSource('/api/v1/events');

  const eventTypes = [
    'connected',
    'worker_registered',
    'job_updated',
    'payment_success',
    'payout_completed',
    'dispute_opened',
    'dispute_resolved',
    'admin_broadcast'
  ];

  for (const type of eventTypes) {
    es.addEventListener(type, (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        onEvent(type, data);
      } catch (err) {
        console.error('SSE JSON parse error:', err);
      }
    });
  }

  return () => {
    es.close();
  };
}
