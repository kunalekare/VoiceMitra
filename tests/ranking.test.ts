import { describe, it, expect } from 'vitest';
import {
  calculateHaversineDistanceKm,
  calculateSkillMatchRatio,
  computeRankingBreakdown,
  calculateUpdatedReputation
} from '../src/utils/ranking';
import { normalizeSkill, stringSimilarity } from '../src/utils/taxonomy';
import { Worker } from '../src/types';

describe('Ranking and Geo Calculations', () => {
  it('calculates accurate Haversine distance in kilometers', () => {
    // Nagpur coordinates to Pune coordinates (~710 km)
    const nagpurLat = 21.1458;
    const nagpurLng = 79.0882;
    const puneLat = 18.5204;
    const puneLng = 73.8567;

    const distance = calculateHaversineDistanceKm(nagpurLat, nagpurLng, puneLat, puneLng);
    expect(distance).toBeGreaterThan(600);
    expect(distance).toBeLessThan(750);

    // Identical coordinates must be 0
    expect(calculateHaversineDistanceKm(nagpurLat, nagpurLng, nagpurLat, nagpurLng)).toBe(0);
  });

  it('normalizes vernacular skill names to canonical trades', () => {
    expect(normalizeSkill('बिजली मिस्त्री').canonical).toBe('Electrician');
    expect(normalizeSkill('नल मिस्त्री').canonical).toBe('Plumber');
    expect(normalizeSkill('wireman').canonical).toBe('Electrician');
    expect(normalizeSkill('रंगारी').canonical).toBe('Painter');
  });

  it('calculates skill match ratio with canonical and secondary fallback', () => {
    const mockWorker: Worker = {
      id: 'w-test',
      phone: '+91 99999 11111',
      name: 'Test Wireman',
      primarySkill: 'Electrician',
      secondarySkills: ['Appliance Repair', 'Inverter Setup'],
      experienceYears: 5,
      languagesSpoken: ['Hindi'],
      district: 'Nagpur',
      state: 'Maharashtra',
      pincode: '440010',
      lat: 21.148,
      lng: 79.082,
      profilePicUrl: '',
      aadhaarVerified: true,
      reputationScore: 4.8,
      totalJobs: 25,
      isAvailable: true,
      status: 'active',
      verifiedSkillBadges: ['Aadhaar Verified'],
      dailyWageExpected: 800,
      createdAt: '2026-01-01'
    };

    // Exact primary match
    expect(calculateSkillMatchRatio(mockWorker, 'Electrician')).toBe(1.0);
    // Secondary match
    expect(calculateSkillMatchRatio(mockWorker, 'Appliance Repair')).toBe(0.75);
    // Unrelated skill
    expect(calculateSkillMatchRatio(mockWorker, 'Gardener')).toBeLessThan(0.4);
  });

  it('computes composite ranking breakdown within bounded ranges', () => {
    const mockWorker: Worker = {
      id: 'w-test',
      phone: '+91 99999 11111',
      name: 'Rameshwar',
      primarySkill: 'Electrician',
      secondarySkills: [],
      experienceYears: 8,
      languagesSpoken: ['Hindi'],
      district: 'Nagpur',
      state: 'Maharashtra',
      pincode: '440010',
      lat: 21.148,
      lng: 79.082,
      profilePicUrl: '',
      aadhaarVerified: true,
      reputationScore: 4.9,
      totalJobs: 50,
      isAvailable: true,
      status: 'active',
      verifiedSkillBadges: ['Aadhaar Verified'],
      dailyWageExpected: 850,
      createdAt: '2026-01-01'
    };

    const breakdown = computeRankingBreakdown(mockWorker, 'Electrician', 21.148, 79.082);

    expect(breakdown.skillMatchScore).toBe(40);
    expect(breakdown.proximityScore).toBe(25);
    expect(breakdown.kycBonus).toBe(10);
    expect(breakdown.compositeScore).toBeGreaterThanOrEqual(90);
    expect(breakdown.compositeScore).toBeLessThanOrEqual(100);
  });

  it('updates reputation using exact weighted formula (oldScore*oldCount + newRating)/(oldCount + 1)', () => {
    // 4.0 score over 4 jobs + 5.0 new rating = (16 + 5)/5 = 4.2
    const res1 = calculateUpdatedReputation(4.0, 4, 5.0);
    expect(res1.newScore).toBe(4.2);
    expect(res1.newCount).toBe(5);

    // 5.0 score over 1 job + 1.0 new rating = (5 + 1)/2 = 3.0
    const res2 = calculateUpdatedReputation(5.0, 1, 1.0);
    expect(res2.newScore).toBe(3.0);
    expect(res2.newCount).toBe(2);
  });
});
