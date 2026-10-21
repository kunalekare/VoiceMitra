import { db } from '../config/database';
import { processVoiceRegistration, VoiceRegistrationExtracted } from './geminiService';
import { logAuditEvent } from '../middleware/logger';
import { sseManager } from '../utils/sse';

export interface WorkerRow {
  id: string;
  phone: string;
  name: string;
  primary_skill: string;
  secondary_skills: string;
  experience_years: number;
  languages_spoken: string;
  district: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
  voice_profile_url?: string;
  voice_transcript?: string;
  profile_pic_url?: string;
  aadhaar_verified: number;
  aadhaar_masked?: string;
  reputation_score: number;
  total_jobs: number;
  is_available: number;
  status: string;
  verified_skill_badges: string;
  portfolio_video_url?: string;
  wallet_balance_paise: number;
  created_at: string;
}

export interface WorkerDto {
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
  profilePicUrl?: string;
  aadhaarVerified: boolean;
  aadhaarMasked?: string;
  reputationScore: number;
  totalJobs: number;
  isAvailable: boolean;
  status: string;
  verifiedSkillBadges: string[];
  portfolioVideoUrl?: string;
  walletBalanceInr: number;
  createdAt: string;
  distanceKm?: number;
  rankingScore?: number;
  rankingBreakdown?: {
    skillMatch: number;
    proximity: number;
    reputation: number;
    experience: number;
    availability: number;
    kycBonus: number;
    total: number;
  };
}

export function formatWorkerRow(row: WorkerRow): WorkerDto {
  return {
    id: row.id,
    phone: row.phone,
    name: row.name,
    primarySkill: row.primary_skill,
    secondarySkills: JSON.parse(row.secondary_skills || '[]'),
    experienceYears: row.experience_years,
    languagesSpoken: JSON.parse(row.languages_spoken || '["hi"]'),
    district: row.district,
    state: row.state,
    pincode: row.pincode,
    lat: row.lat,
    lng: row.lng,
    voiceProfileUrl: row.voice_profile_url || undefined,
    voiceTranscript: row.voice_transcript || undefined,
    profilePicUrl: row.profile_pic_url || undefined,
    aadhaarVerified: row.aadhaar_verified === 1,
    aadhaarMasked: row.aadhaar_masked || undefined,
    reputationScore: row.reputation_score,
    totalJobs: row.total_jobs,
    isAvailable: row.is_available === 1,
    status: row.status,
    verifiedSkillBadges: JSON.parse(row.verified_skill_badges || '[]'),
    portfolioVideoUrl: row.portfolio_video_url || undefined,
    walletBalanceInr: Math.round(row.wallet_balance_paise / 100),
    createdAt: row.created_at
  };
}

// Calculate Haversine distance in km
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export interface SearchFilters {
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
}

export function searchWorkers(filters: SearchFilters): { workers: WorkerDto[]; total: number; page: number; limit: number } {
  const page = filters.page || 1;
  const limit = filters.limit || 20;

  let sql = 'SELECT * FROM workers WHERE status = "active"';
  const params: unknown[] = [];

  if (filters.district) {
    sql += ' AND LOWER(district) = LOWER(?)';
    params.push(filters.district);
  }

  if (filters.state) {
    sql += ' AND LOWER(state) = LOWER(?)';
    params.push(filters.state);
  }

  if (filters.minRating) {
    sql += ' AND reputation_score >= ?';
    params.push(filters.minRating);
  }

  if (filters.verifiedOnly) {
    sql += ' AND aadhaar_verified = 1';
  }

  if (filters.availableOnly) {
    sql += ' AND is_available = 1';
  }

  const rows = db.query<WorkerRow>(sql, params);
  let dtos = rows.map(formatWorkerRow);

  const userLat = filters.lat || 21.1458; // default to Nagpur center
  const userLng = filters.lng || 79.0882;
  const targetSkill = (filters.skill || filters.query || '').toLowerCase().trim();

  // Apply ranking formula and distance
  dtos = dtos.map((w) => {
    const dist = calculateDistanceKm(userLat, userLng, w.lat, w.lng);
    w.distanceKm = dist;

    // Skill match score (0-100)
    let skillScore = 70;
    if (targetSkill) {
      if (w.primarySkill.toLowerCase() === targetSkill) {
        skillScore = 100;
      } else if (w.primarySkill.toLowerCase().includes(targetSkill) || targetSkill.includes(w.primarySkill.toLowerCase())) {
        skillScore = 85;
      } else if (w.secondarySkills.some(s => s.toLowerCase().includes(targetSkill))) {
        skillScore = 75;
      } else {
        skillScore = 30;
      }
    }

    // Proximity score (0-100)
    const proximityScore = Math.max(0, 100 - dist * 2);

    // Reputation score (0-100)
    const reputationScore = Math.min(100, Math.round((w.reputationScore / 5.0) * 100));

    // Experience score (0-100)
    const experienceScore = Math.min(100, w.experienceYears * 10);

    // Availability score (0-100)
    const availabilityScore = w.isAvailable ? 100 : 20;

    // KYC Bonus (10)
    const kycBonus = w.aadhaarVerified ? 10 : 0;

    // Weighted composite score (0-100 scale):
    // skillMatch*0.40 + proximity*0.25 + reputation*0.20 + experience*0.10 + availability*0.05 + kycBonus
    const rawTotal = (
      skillScore * 0.40 +
      proximityScore * 0.25 +
      reputationScore * 0.20 +
      experienceScore * 0.10 +
      availabilityScore * 0.05 +
      kycBonus
    );

    const total = Math.min(99.9, Math.round(rawTotal * 10) / 10);

    w.rankingScore = total;
    w.rankingBreakdown = {
      skillMatch: skillScore,
      proximity: proximityScore,
      reputation: reputationScore,
      experience: experienceScore,
      availability: availabilityScore,
      kycBonus,
      total
    };

    return w;
  });

  // Filter by radius if specified
  if (filters.radiusKm) {
    dtos = dtos.filter(w => (w.distanceKm || 0) <= (filters.radiusKm || 50));
  }

  // Filter by text query if passed
  if (filters.query && !filters.skill) {
    const q = filters.query.toLowerCase();
    dtos = dtos.filter(w =>
      w.name.toLowerCase().includes(q) ||
      w.primarySkill.toLowerCase().includes(q) ||
      w.district.toLowerCase().includes(q) ||
      w.secondarySkills.some(s => s.toLowerCase().includes(q))
    );
  }

  // Sort by rankingScore descending
  dtos.sort((a, b) => (b.rankingScore || 0) - (a.rankingScore || 0));

  const total = dtos.length;
  const paginated = dtos.slice((page - 1) * limit, page * limit);

  return { workers: paginated, total, page, limit };
}

export function getWorkerById(id: string): WorkerDto | null {
  const row = db.queryOne<WorkerRow>('SELECT * FROM workers WHERE id = ?;', [id]);
  return row ? formatWorkerRow(row) : null;
}

export async function registerWorkerVoice(params: {
  userId?: string;
  phone?: string;
  audioBase64?: string;
  mimeType?: string;
  textInput?: string;
  languageCode?: string;
  overrideData?: Partial<WorkerDto>;
}): Promise<{ worker: WorkerDto; extracted: VoiceRegistrationExtracted }> {
  // 1. Process voice through Gemini
  const extracted = await processVoiceRegistration(
    params.audioBase64,
    params.mimeType || 'audio/webm',
    params.textInput,
    params.languageCode || 'hi'
  );

  const providedPhone = typeof params.phone === 'string' ? params.phone.trim() : '';
  const phone = providedPhone || extracted.phone || '';
  const workerId = params.userId || 'w-' + Date.now().toString(36);
  const name = params.overrideData?.name || extracted.name;
  const skill = params.overrideData?.primarySkill || extracted.primarySkill;
  const district = params.overrideData?.district || extracted.location || 'Nagpur';
  const expYears = params.overrideData?.experienceYears ?? extracted.experienceYears ?? 5;

  db.transaction(() => {
    // Ensure user row
    db.run(`
      INSERT OR REPLACE INTO users (id, phone, name, role, language, status, created_at, updated_at)
      VALUES (?, ?, ?, 'worker', ?, 'active', datetime('now'), datetime('now'));
    `, [workerId, phone, name, params.languageCode || 'hi']);

    // Ensure worker row
    db.run(`
      INSERT OR REPLACE INTO workers (
        id, phone, name, primary_skill, secondary_skills, experience_years,
        languages_spoken, district, state, pincode, lat, lng,
        voice_profile_url, voice_transcript, profile_pic_url,
        aadhaar_verified, reputation_score, total_jobs, is_available, status,
        verified_skill_badges, wallet_balance_paise
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Maharashtra', '440001', 21.1458, 79.0882, ?, ?, ?, 0, 4.8, 0, 1, 'active', '[]', 0);
    `, [
      workerId,
      phone,
      name,
      skill,
      JSON.stringify(extracted.secondarySkills || []),
      expYears,
      JSON.stringify([params.languageCode || 'hi', 'en']),
      district,
      params.audioBase64 ? 'voice_recording_recorded.webm' : '',
      extracted.transcript,
      `https://images.unsplash.com/photo-${1500000000000 + (Math.floor(Math.random() * 500000))}?w=200&auto=format&fit=crop`
    ]);
  });

  const worker = getWorkerById(workerId)!;

  logAuditEvent(workerId, 'worker', 'VOICE_REGISTER_SUCCESS', 'worker', workerId, undefined, { skill, district });

  // Broadcast real-time SSE event to employers and admins
  sseManager.broadcast('worker_registered', {
    id: worker.id,
    name: worker.name,
    primarySkill: worker.primarySkill,
    district: worker.district
  });

  return { worker, extracted };
}
