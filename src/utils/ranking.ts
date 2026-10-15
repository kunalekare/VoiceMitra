import { Worker, RankingBreakdown } from '../types';
import { stringSimilarity, normalizeSkill } from './taxonomy';

// Calculate Haversine distance in kilometers between two lat/lng coordinates
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;

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
  const d = R * c;
  return Math.round(d * 10) / 10; // 1 decimal place
}

/**
 * Calculates skill match ratio (0.0 to 1.0)
 * 1.0 = exact match on primary skill
 * 0.85 = high fuzzy match on primary
 * 0.7 = exact match on secondary skills
 * else fuzzy ratio
 */
export function calculateSkillMatchRatio(worker: Worker, targetSkill: string): number {
  if (!targetSkill || !targetSkill.trim()) return 1.0;

  const cleanTarget = targetSkill.trim().toLowerCase();
  const normalizedTarget = normalizeSkill(targetSkill).canonical.toLowerCase();
  const cleanPrimary = worker.primarySkill.trim().toLowerCase();
  const normalizedPrimary = normalizeSkill(worker.primarySkill).canonical.toLowerCase();

  // 1. Exact canonical or direct match
  if (cleanPrimary === cleanTarget || normalizedPrimary === normalizedTarget) {
    return 1.0;
  }

  // 2. Secondary skills match
  if (worker.secondarySkills && worker.secondarySkills.length > 0) {
    for (const sec of worker.secondarySkills) {
      const cleanSec = sec.trim().toLowerCase();
      const normSec = normalizeSkill(sec).canonical.toLowerCase();
      if (cleanSec === cleanTarget || normSec === normalizedTarget) {
        return 0.75;
      }
    }
  }

  // 3. Fuzzy similarity
  const primarySimilarity = stringSimilarity(cleanPrimary, cleanTarget);
  if (primarySimilarity >= 0.7) {
    return Math.min(1.0, primarySimilarity);
  }

  // Secondary fuzzy match
  let maxSecSimilarity = 0;
  if (worker.secondarySkills) {
    for (const sec of worker.secondarySkills) {
      const sim = stringSimilarity(sec, cleanTarget);
      if (sim > maxSecSimilarity) maxSecSimilarity = sim;
    }
  }

  return Math.max(primarySimilarity, maxSecSimilarity * 0.7);
}

/**
 * Compute the SkillBridge Composite Ranking Score
 * composite = skillMatch*40 + proximity*25 + reputation*20 + experience*10 + availability*5 + KYC bonus (10 if Aadhaar verified), capped at 100.
 *
 * Skill match: 1.0 exact, else fuzzy
 * Proximity: max(0, 1 - haversineKm/50)
 * Reputation: score/5
 * Experience: min(totalJobs/20, 1)
 * Availability: 1.0 if available, else 0.5
 * KYC bonus: 10 if Aadhaar verified
 */
export function computeRankingBreakdown(
  worker: Worker,
  targetSkill: string,
  userLat?: number,
  userLng?: number
): RankingBreakdown {
  // 1. Skill Match (max 40)
  const skillRatio = calculateSkillMatchRatio(worker, targetSkill);
  const skillMatchScore = Math.round(skillRatio * 40 * 10) / 10;

  // 2. Proximity (max 25)
  // Distance in km from user coordinates (or default to 5km if coordinates not provided)
  const distanceKm =
    userLat !== undefined && userLng !== undefined
      ? calculateHaversineDistanceKm(userLat, userLng, worker.lat, worker.lng)
      : 5.0;

  const proximityRatio = Math.max(0, 1 - distanceKm / 50);
  const proximityScore = Math.round(proximityRatio * 25 * 10) / 10;

  // 3. Reputation (max 20)
  // Reputation: score / 5
  const clampedReputation = Math.min(5, Math.max(0, worker.reputationScore));
  const reputationRatio = clampedReputation / 5;
  const reputationScore = Math.round(reputationRatio * 20 * 10) / 10;

  // 4. Experience (max 10)
  // Experience: min(totalJobs/20, 1)
  const experienceRatio = Math.min(worker.totalJobs / 20, 1.0);
  const experienceScore = Math.round(experienceRatio * 10 * 10) / 10;

  // 5. Availability (max 5)
  // Availability: 1.0 if available, else 0.5
  const availabilityRatio = worker.isAvailable ? 1.0 : 0.5;
  const availabilityScore = Math.round(availabilityRatio * 5 * 10) / 10;

  // 6. KYC bonus (10 if Aadhaar verified)
  const kycBonus = worker.aadhaarVerified ? 10 : 0;

  // Composite sum, capped at 100
  const rawSum =
    skillMatchScore +
    proximityScore +
    reputationScore +
    experienceScore +
    availabilityScore +
    kycBonus;

  const compositeScore = Math.min(100, Math.round(rawSum * 10) / 10);

  return {
    compositeScore,
    skillMatchScore,
    proximityScore,
    reputationScore,
    experienceScore,
    availabilityScore,
    kycBonus,
    distanceKm,
    skillMatchRatio: skillRatio
  };
}

/**
 * Reputation Update Formula:
 * (oldScore * oldCount + newRating) / (oldCount + 1), rounded to 1 decimal.
 */
export function calculateUpdatedReputation(
  oldScore: number,
  oldCount: number,
  newRating: number
): { newScore: number; newCount: number } {
  const safeOldCount = Math.max(0, oldCount);
  const safeOldScore = Math.min(5, Math.max(0, oldScore));
  const safeNewRating = Math.min(5, Math.max(1, newRating));

  const totalPoints = safeOldScore * safeOldCount + safeNewRating;
  const newCount = safeOldCount + 1;
  const rawNewScore = totalPoints / newCount;
  const newScore = Math.round(rawNewScore * 10) / 10;

  return {
    newScore: Math.min(5.0, Math.max(1.0, newScore)),
    newCount
  };
}
