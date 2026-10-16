# SkillBridge — Voice-Powered Hiring Platform for India's 500 Million Informal Workers

> **Tagline:** "Voice-Powered Hiring for India's Informal Workers"

SkillBridge is an end-to-end, production-quality, mobile-first web app (PWA-ready) connecting informal trade workers (electricians, plumbers, masons, painters, carpenters, drivers, domestic help, AC technicians) with contractors and households across India. Workers register by simply speaking in their mother tongue; employers hear their authentic voice, view verified credentials, hire, and settle wages via RBI-compliant escrow.

---

## 🚀 Key Features

### 1. Worker Voice Registration & Native Dialects
- **60-Second MediaRecorder**: High-fidelity live canvas waveform visualizer, countdown timer, audio playback preview, and re-record capability.
- **Multimodal Gemini AI Transcription**: Powered by Google Gemini (`gemini-3.8-flash`) via secure server-side routes in `server.ts`. Automatically extracts `{ name, primarySkill, secondarySkills, experienceYears, location, confidence, transcript }`.
- **Fuzzy Skill Taxonomy Normalization**: Standardizes vernacular terminology (e.g., *bijli mistri* ➔ Electrician, *nal mistri* ➔ Plumber, *sutar* ➔ Carpenter, *rangari* ➔ Painter).
- **12 Indian Languages**: UI and voice support in Hindi, Marathi, Tamil, Telugu, Kannada, Malayalam, Bengali, Gujarati, Odia, Punjabi, Urdu, and English with browser Web Speech synthesis for low-literacy users.

### 2. Employer Dashboard & Ranking Algorithm
- **Exact Composite Ranking Formula (0 to 100)**:
  ```
  compositeScore = skillMatch*40 + proximity*25 + reputation*20 + experience*10 + availability*5 + KYC bonus (10 if Aadhaar verified)
  ```
  - **Skill match**: 1.0 exact match on primary trade, 0.75 on secondary, or fuzzy Levenshtein match.
  - **Proximity**: `max(0, 1 - haversineKm / 50)`
  - **Reputation**: `reputationScore / 5`
  - **Experience**: `min(totalJobs / 20, 1.0)`
  - **Availability**: `1.0 if available else 0.5`
  - **KYC bonus**: `+10 if Aadhaar verified`
  - Total score capped at 100. Every card features a breakdown tooltip showing exact points.
- **Interactive Leaflet Map View**: Dynamic trade pins, radius circle overlay (5 to 50 km slider), and click-to-hire modal.
- **AI Voice Job Match**: Employer records a 30s requirement; Gemini transcribes it, extracts budget, duration, and urgency, and ranks the top 10 candidates with detailed match explanations.

### 3. Escrow Hire Flow & Razorpay Payments
- **Cost Breakdown**: Daily wage × days × workers + platform fee (₹99 - ₹299 based on tier).
- **Mock Razorpay Checkout**: Simulates UPI (GPay, PhonePe, Paytm, QR), Cards, and NetBanking.
- **HMAC Signature Check**: Simulated cryptographic check before escrow activation.
- **Wage Disbursement**: RazorpayX payout simulation to worker UPI/bank account.

### 4. Trust, Security & Regulatory Compliance
- **DPDP Act 2023 Compliance**: Raw 12-digit Aadhaar numbers are **never stored**. Only one-way SHA-256 cryptographic hashes are retained. Includes a dedicated Privacy Consent modal with data deletion ("Right to be Forgotten").
- **DigiLocker Integration**: Verification of NCVT National Trade Certificates (ITI) and PMKVY skill badges.
- **5-Question Trade Verification Quiz**: Generates realistic MCQs per skill (via Gemini or built-in bank) awarding a "Verified Skill Pro" badge.

### 5. Multimodal Channel Simulators
- **WhatsApp Bot Simulator**: Full 7-stage state machine (`NEW -> AWAITING_VOICE -> CONFIRM_PROFILE -> KYC_AADHAAR -> JOB_RESPONSE -> REVIEW -> REGISTERED`).
- **Phone IVR Dialpad Simulator**: Interactive telephone menu (`080-47190000`) with audio prompts, Web Audio DTMF tones, and voice registration.

### 6. Admin & B2B Developer Portal
- **Admin Dashboard**: Recharts KPIs (GMV, net revenue, hires, conversion funnels).
- **Rule-Based Fraud Queue (5 Vectors)**: Monitors duplicate voice biometrics, abnormal hire frequency, rating manipulation, payment failures, and rapid GPS velocity jumps.
- **B2B API Console**: Key generation, rate limits, and interactive Swagger-style REST test console (`/api/v1/search`, `/workers`, `/jobs`, `/payments`).

---

## 🛠️ Architecture & Tech Stack

```
SkillBridge/
├── server.ts                  # Express full-stack backend with server-side @google/genai
├── index.html                 # PWA meta tags, Leaflet CSS & Indian typography
├── public/
│   ├── manifest.json          # PWA Web App Manifest
│   ├── sw.js                  # Service worker for offline shell caching
│   └── icon.svg               # Saffron/teal brand vector icon
├── src/
│   ├── App.tsx                # Main view router & global modals
│   ├── types/index.ts         # Strictly typed domain data models
│   ├── utils/
│   │   ├── ranking.ts         # Exact composite ranking algorithm & reputation formula
│   │   └── taxonomy.ts        # Canonical Indian trades taxonomy & Levenshtein fuzzy match
│   ├── services/
│   │   ├── db.ts              # Typed repository layer over LocalStorage/IndexedDB
│   │   ├── msg91OtpService.ts # MSG91 SMS gateway mock with 5-min timer & 3 attempts
│   │   ├── razorpayService.ts # Razorpay checkout & RazorpayX payout disbursement
│   │   ├── aadhaarDigiLockerService.ts # UIDAI SHA-256 e-KYC & DigiLocker
│   │   ├── whatsappService.ts # WhatsApp two-way bot state machine
│   │   └── ivrExotelService.ts# Exotel IVR phone dialer tree
│   ├── components/            # Reusable UI widgets (VoicePlayer, AudioVoiceRecorder, LeafletMap)
│   ├── pages/                 # Full feature views (Landing, Auth, Dashboards, APIs, Tests)
│   ├── store/index.ts         # Zustand state store
│   └── i18n/index.ts          # 12 Indian languages dictionary & Web Speech synthesis
```

---

## 💻 Local Development Setup

To run SkillBridge locally on your machine:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/kunalekare/VoiceMitra.git
   cd VoiceMitra
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   Add your `GEMINI_API_KEY` (and optional telephony/payment credentials) to `.env`.

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser. Both Express API routes and the Vite frontend run simultaneously on port 3000.

5. **Run Tests & Validation**:
   ```bash
   npm test               # Run all 49 Vitest unit & integration tests
   npm run i18n:check     # Verify 100% key parity across all 12 Indian languages
   npm run ivr:validate   # Validate the IVR telephony graph and state machine
   npm run build          # Create production build in /dist
   ```

---

## 🔄 Guide: Swap Mocks for Real Production APIs

Each integration service in `src/services/` contains explicit `// swap with real API` comments:

1. **SMS OTP (MSG91 / Fast2SMS)**:
   In `src/services/msg91OtpService.ts`:
   ```ts
   // swap with real API:
   const res = await fetch('https://api.msg91.com/api/v5/otp', {
     method: 'POST',
     headers: { 'authkey': process.env.MSG91_AUTH_KEY, 'content-type': 'application/json' },
     body: JSON.stringify({ template_id: process.env.MSG91_TEMPLATE_ID, mobile: `91${phone}`, otp })
   });
   ```

2. **Payment Gateway (Razorpay & RazorpayX)**:
   In `src/services/razorpayService.ts`:
   ```ts
   // swap with real API:
   const Razorpay = require('razorpay');
   const rzp = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
   const order = await rzp.orders.create({ amount: amountInPaise, currency: 'INR', receipt: `job_${jobId}` });
   ```

3. **UIDAI Aadhaar & DigiLocker**:
   In `src/services/aadhaarDigiLockerService.ts`:
   ```ts
   // swap with real API:
   const response = await fetch('https://api.digitallocker.gov.in/public/oauth2/1/xml/certificate', {
     headers: { 'Authorization': `Bearer ${accessToken}` }
   });
   ```

4. **WhatsApp Cloud API (Meta / Gupshup)**:
   In `src/services/whatsappService.ts`:
   ```ts
   // swap with real API:
   await fetch(`https://graph.facebook.com/v19.0/${process.env.WA_PHONE_NUMBER_ID}/messages`, {
     method: 'POST',
     headers: { Authorization: `Bearer ${process.env.WA_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
     body: JSON.stringify({ messaging_product: 'whatsapp', to: workerPhone, type: 'text', text: { body } })
   });
   ```

5. **Exotel Telephony IVR**:
   In `src/services/ivrExotelService.ts`:
   ```ts
   // swap with real API:
   await fetch(`https://api.exotel.com/v1/Accounts/${process.env.EXOTEL_SID}/Calls/connect`, {
     method: 'POST',
     body: new URLSearchParams({ From: workerPhone, To: '08047190000', Url: 'https://skillbridge.in/ivr/callback' })
   });
   ```

---

## 🧪 Testing

Open the **Tests (Algorithm)** tab in the top navigation to execute the live automated unit test suite verifying:
- Composite ranking formula & 100-point ceiling
- Proximity falloff beyond 50 km
- Weighted reputation updates
- Geodesic Haversine distance
- MSG91 OTP 3-attempt lockouts
