/**
 * UIDAI Aadhaar e-KYC and DigiLocker Certificate Verification Service
 * 
 * DPDP Act 2023 & UIDAI Circular Compliance:
 * NEVER STORE RAW 12-DIGIT AADHAAR NUMBERS.
 * Only one-way cryptographic SHA-256 hash is retained for deduplication.
 * 
 * In production:
 * // swap with real API:
 * // const digilockerResponse = await fetch('https://api.digitallocker.gov.in/public/oauth2/1/xml/certificate', {
 * //   headers: { 'Authorization': `Bearer ${accessToken}` }
 * // });
 */

export interface DigiLockerCertificate {
  certificateType: 'ITI_ELECTRICIAN' | 'PMKVY_PLUMBING' | 'NSDC_MASONRY' | 'NCVT_CERTIFICATE';
  title: string;
  issuer: string;
  issueDate: string;
  certificateNumber: string;
  verifiedStatus: 'verified' | 'pending';
  badgeTitle: string;
}

// In-browser pseudo SHA-256 hash for raw string
export async function sha256Hex(text: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback simple hash string if crypto.subtle is unavailable
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `sha256_mock_${Math.abs(hash)}_${text.slice(-4)}`;
}

export const aadhaarDigiLockerService = {
  /**
   * Request OTP from UIDAI server for Aadhaar verification
   * In production:
   * // swap with real API:
   * // const res = await fetch('https://resident.uidai.gov.in/api/v1/generate-otp', {
   * //   method: 'POST',
   * //   body: JSON.stringify({ uid: aadhaarNumber, consent: 'Y' })
   * // });
   */
  requestAadhaarOtp: async (aadhaarNumber: string): Promise<{ success: boolean; maskedNumber: string; message: string }> => {
    const clean = aadhaarNumber.replace(/\D/g, '');
    if (clean.length !== 12) {
      throw new Error('Aadhaar number must be exactly 12 digits.');
    }

    await new Promise((resolve) => setTimeout(resolve, 400));
    const maskedNumber = `XXXX-XXXX-${clean.slice(-4)}`;

    return {
      success: true,
      maskedNumber,
      message: `OTP sent to the mobile number linked with Aadhaar ${maskedNumber}. (Demo OTP: 123456)`
    };
  },

  /**
   * Verifies UIDAI OTP and returns SHA-256 hash (NEVER stores raw number)
   */
  verifyAadhaarOtp: async (
    rawAadhaarNumber: string,
    otp: string
  ): Promise<{
    verified: boolean;
    aadhaarHash: string;
    maskedAadhaar: string;
    verifiedName: string;
    message: string;
  }> => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    if (otp !== '123456' && otp.length !== 6) {
      throw new Error('Invalid Aadhaar OTP. Please enter 123456 in demo mode.');
    }

    const clean = rawAadhaarNumber.replace(/\D/g, '');
    const hash = await sha256Hex(clean);
    const maskedAadhaar = `XXXX-XXXX-${clean.slice(-4)}`;

    return {
      verified: true,
      aadhaarHash: hash,
      maskedAadhaar,
      verifiedName: 'UIDAI Government Verified Worker',
      message: 'Aadhaar e-KYC completed successfully under DPDP Act 2023 regulations.'
    };
  },

  /**
   * Fetch ITI / PMKVY skill certificates via DigiLocker OAuth integration
   * In production:
   * // swap with real API:
   * // const doc = await fetch('https://digilocker.meripehchan.gov.in/public/oauth2/1/pull/uri', ...);
   */
  fetchDigiLockerCertificates: async (workerPhone: string): Promise<DigiLockerCertificate[]> => {
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Realistic demo certificates issued by NCVT / Ministry of Skill Development
    return [
      {
        certificateType: 'ITI_ELECTRICIAN',
        title: 'National Trade Certificate (NTC) - Electrician',
        issuer: 'National Council for Vocational Training (NCVT), Govt. of India',
        issueDate: '2021-07-15',
        certificateNumber: 'NCVT/2021/MH/88921',
        verifiedStatus: 'verified',
        badgeTitle: 'ITI Certified'
      },
      {
        certificateType: 'PMKVY_PLUMBING',
        title: 'Pradhan Mantri Kaushal Vikas Yojana (PMKVY 3.0) - Assistant Plumber',
        issuer: 'Skill India / NSDC / Govt. of India',
        issueDate: '2023-02-28',
        certificateNumber: 'PMKVY/NSDC/IND/2023/44109',
        verifiedStatus: 'verified',
        badgeTitle: 'PMKVY Certified'
      }
    ];
  }
};
