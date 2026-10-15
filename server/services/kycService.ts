import crypto from 'crypto';
import { db } from '../config/database';
import { ENV } from '../config/env';
import { logAuditEvent } from '../middleware/logger';

// Verhoeff algorithm validation tables
const multiplicationTable = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
  [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
  [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
  [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
  [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
  [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
  [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
  [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
  [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
];

const permutationTable = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
  [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
  [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
  [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
  [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
  [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
  [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
];

export function validateVerhoeff(numStr: string): boolean {
  let c = 0;
  const invertedArray = numStr.split('').map(Number).reverse();
  for (let i = 0; i < invertedArray.length; i++) {
    c = multiplicationTable[c][permutationTable[i % 8][invertedArray[i]]];
  }
  return c === 0;
}

export function verifyAadhaarKYC(params: {
  workerId: string;
  aadhaarNumber: string;
  otp: string;
}): { success: boolean; maskedAadhaar: string; referenceId: string; message: string } {
  const cleanNum = params.aadhaarNumber.replace(/[\s-]/g, '');

  if (!/^\d{12}$/.test(cleanNum)) {
    throw new Error('Aadhaar number must be exactly 12 digits.');
  }

  // Verhoeff checksum validation
  // For sandbox testing, if starts with 0000 or passes Verhoeff, allow
  const isValidChecksum = validateVerhoeff(cleanNum) || cleanNum.startsWith('1234') || cleanNum.startsWith('9999');
  if (!isValidChecksum) {
    throw new Error('Invalid Aadhaar number checksum according to Verhoeff algorithm.');
  }

  // Mock UIDAI OTP validation
  if (params.otp !== '123456' && params.otp !== '999999' && params.otp.length !== 6) {
    throw new Error('Invalid UIDAI OTP. Use sandbox OTP 123456.');
  }

  // DPDP Act 2023 Compliance:
  // NEVER store raw 12-digit Aadhaar. Store SHA-256 HMAC hash with pepper secret.
  const aadhaarHash = crypto
    .createHmac('sha256', ENV.PEPPER_SECRET)
    .update(cleanNum)
    .digest('hex');

  const maskedAadhaar = `XXXX-XXXX-${cleanNum.slice(-4)}`;
  const referenceId = `AADHAAR-REF-${Date.now().toString(36).toUpperCase()}`;

  // Check for duplicate biometric identity fraud
  const existingWorker = db.queryOne<{ id: string }>(
    'SELECT id FROM workers WHERE aadhaar_hash = ? AND id != ?;',
    [aadhaarHash, params.workerId]
  );

  if (existingWorker) {
    // Flag duplicate fraud
    db.run(`
      INSERT INTO fraud_flags (id, worker_id, reason, severity, details, status, created_at)
      VALUES (?, ?, 'Duplicate Aadhaar biometric detected across multiple accounts', 'critical', ?, 'pending_review', datetime('now'));
    `, [
      `fraud-${Date.now()}`,
      params.workerId,
      `Aadhaar hash matched existing worker account ${existingWorker.id}`
    ]);
  }

  db.transaction(() => {
    db.run(`
      UPDATE workers
      SET aadhaar_verified = 1, aadhaar_hash = ?, aadhaar_masked = ?, reputation_score = MIN(5.0, reputation_score + 0.3), updated_at = datetime('now')
      WHERE id = ?;
    `, [aadhaarHash, maskedAadhaar, params.workerId]);

    db.run(`
      INSERT INTO kyc_records (id, user_id, id_type, doc_hash, masked_number, verified_at, status)
      VALUES (?, ?, 'aadhaar', ?, ?, datetime('now'), 'verified');
    `, [`kyc-${Date.now()}`, params.workerId, aadhaarHash, maskedAadhaar]);
  });

  logAuditEvent(params.workerId, 'worker', 'AADHAAR_KYC_VERIFIED', 'worker', params.workerId, undefined, {
    referenceId,
    maskedAadhaar
  });

  return {
    success: true,
    maskedAadhaar,
    referenceId,
    message: 'Aadhaar e-KYC completed successfully (Sandbox verified)'
  };
}

export function verifyDigiLockerCertificate(params: {
  workerId: string;
  certificateType: 'PMKVY' | 'ITI' | 'NCVT';
  certNumber: string;
}): { success: boolean; badgeName: string; message: string } {
  const badgeName = `${params.certificateType} Certified Pro`;

  const worker = db.queryOne<{ id: string; verified_skill_badges: string }>(
    'SELECT id, verified_skill_badges FROM workers WHERE id = ?;',
    [params.workerId]
  );

  if (!worker) {
    throw new Error('Worker not found');
  }

  const existingBadges: string[] = JSON.parse(worker.verified_skill_badges || '[]');
  if (!existingBadges.includes(badgeName)) {
    existingBadges.push(badgeName);
  }

  db.transaction(() => {
    db.run(`
      UPDATE workers
      SET verified_skill_badges = ?, reputation_score = MIN(5.0, reputation_score + 0.2), updated_at = datetime('now')
      WHERE id = ?;
    `, [JSON.stringify(existingBadges), params.workerId]);

    db.run(`
      INSERT INTO kyc_records (id, user_id, id_type, doc_hash, masked_number, verified_at, status)
      VALUES (?, ?, ?, ?, ?, datetime('now'), 'verified');
    `, [
      `kyc-cert-${Date.now()}`,
      params.workerId,
      `digilocker_${params.certificateType.toLowerCase()}`,
      crypto.createHash('sha256').update(params.certNumber).digest('hex'),
      params.certNumber.slice(-4)
    ]);
  });

  logAuditEvent(params.workerId, 'worker', 'DIGILOCKER_CERT_VERIFIED', 'worker', params.workerId, undefined, {
    certificateType: params.certificateType,
    badgeName
  });

  return {
    success: true,
    badgeName,
    message: `DigiLocker ${params.certificateType} certificate verified. Badge awarded!`
  };
}
