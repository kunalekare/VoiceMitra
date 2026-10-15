export type UserRole = 'worker' | 'employer' | 'admin';

export type EmployerType = 'household' | 'contractor' | 'small_business' | 'enterprise';

export type WorkerStatus = 'active' | 'suspended' | 'pending_kyc' | 'deactivated';

export type JobStatus = 
  | 'pending_payment' 
  | 'matched' 
  | 'accepted' 
  | 'in_progress' 
  | 'completed' 
  | 'cancelled' 
  | 'disputed';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export type NotificationChannel = 'in-app' | 'whatsapp' | 'sms' | 'email' | 'push';

export type SubscriptionPlan = 'free' | 'contractor_monthly' | 'enterprise';

export type LanguageCode = 
  | 'hi' // Hindi
  | 'mr' // Marathi
  | 'ta' // Tamil
  | 'te' // Telugu
  | 'kn' // Kannada
  | 'ml' // Malayalam
  | 'bn' // Bengali
  | 'gu' // Gujarati
  | 'or' // Odia
  | 'pa' // Punjabi
  | 'ur' // Urdu
  | 'en'; // English

export interface Worker {
  id: string;
  phone: string;
  name: string;
  primarySkill: string;
  secondarySkills: string[];
  experienceYears: number;
  languagesSpoken: string[];
  district: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
  voiceProfileUrl?: string;
  voiceTranscript?: string;
  voiceAudioBlob?: string; // base64 or object URL
  profilePicUrl?: string;
  aadhaarVerified: boolean;
  aadhaarHash?: string;
  reputationScore: number; // 0 - 5.0
  totalJobs: number;
  isAvailable: boolean;
  status: WorkerStatus;
  verifiedSkillBadges: string[]; // e.g. ["Aadhaar Verified", "ITI Certified", "SkillBridge Verified Pro"]
  portfolioVideoUrl?: string;
  createdAt: string;
  hourlyRateEstimate?: number;
  dailyWageExpected?: number;
  gender?: 'male' | 'female' | 'other';
  bioHighlight?: string;
  referralCode?: string;
  insuranceActive?: boolean;
  loanEligible?: boolean;
}

export interface Employer {
  id: string;
  phone: string;
  email: string;
  name: string;
  businessName?: string;
  employerType: EmployerType;
  district: string;
  state: string;
  lat: number;
  lng: number;
  plan: SubscriptionPlan;
  planExpiresAt?: string;
  totalHires: number;
  companyGst?: string;
  walletBalanceInr?: number;
}

export interface Job {
  id: string;
  employerId: string;
  employerName: string;
  workerIds: string[];
  skillRequired: string;
  description: string;
  status: JobStatus;
  startDate: string;
  endDate: string;
  durationDays: number;
  dailyWageInr: number;
  platformFeeInr: number;
  totalAmountInr: number;
  paymentStatus: PaymentStatus;
  paymentIds: {
    razorpayOrderId?: string;
    paymentId?: string;
    signature?: string;
    payoutId?: string;
  };
  employerReviewScore?: number;
  workerReviewScore?: number;
  employerReviewText?: string;
  workerReviewText?: string;
  isGroupJob: boolean;
  workerCount: number;
  district: string;
  state: string;
  urgency?: 'immediate' | 'within_3_days' | 'flexible';
  createdAt: string;
}

export interface Review {
  id: string;
  jobId: string;
  employerId: string;
  employerName: string;
  workerId: string;
  workerName: string;
  rating: number; // 1 to 5
  textReview: string;
  voiceNoteUrl?: string;
  voiceTranscript?: string;
  createdAt: string;
}

export interface Dispute {
  id: string;
  jobId: string;
  raisedBy: 'employer' | 'worker';
  raisedByName: string;
  reason: string;
  status: 'open' | 'investigating' | 'resolved_refund' | 'resolved_payout';
  mediatorName?: string;
  notes?: string;
  resolutionOutcome?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  role: UserRole;
  title: string;
  message: string;
  channel: NotificationChannel;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorRole: string;
  action: string;
  entityType: 'worker' | 'employer' | 'job' | 'dispute' | 'payment' | 'fraud_alert';
  entityId: string;
  details: string;
  timestamp: string;
}

export interface Referral {
  id: string;
  workerId: string;
  referrerCode: string;
  referredWorkerName: string;
  status: 'registered' | 'first_job_done' | 'bonus_paid';
  bonusAmountInr: number;
  createdAt: string;
}

export interface Invoice {
  id: string;
  jobId: string;
  employerId: string;
  employerName: string;
  workerName: string;
  skill: string;
  durationDays: number;
  wageAmountInr: number;
  platformFeeInr: number;
  gstInr: number;
  totalInr: number;
  pdfUrl?: string;
  createdAt: string;
}

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  keySecretMasked: string;
  rateLimitPerMinute: number;
  totalRequests: number;
  status: 'active' | 'revoked';
  createdAt: string;
}

export interface FraudQueueItem {
  id: string;
  workerId?: string;
  workerName?: string;
  flagType: 
    | 'duplicate_phone_voice'
    | 'abnormal_hire_frequency'
    | 'rating_manipulation'
    | 'payment_failures'
    | 'rapid_location_jumps';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  flaggedAt: string;
  status: 'pending' | 'approved' | 'banned';
}

export interface RankingBreakdown {
  compositeScore: number;
  skillMatchScore: number;     // max 40
  proximityScore: number;      // max 25
  reputationScore: number;     // max 20
  experienceScore: number;     // max 10
  availabilityScore: number;   // max 5
  kycBonus: number;            // 10
  distanceKm: number;
  skillMatchRatio: number;
}

export interface VoiceRegistrationResult {
  name: string;
  primarySkill: string;
  secondarySkills: string[];
  experienceYears: number;
  location: string;
  confidence: number;
  transcript: string;
}
