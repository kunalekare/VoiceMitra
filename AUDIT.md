# SkillBridge (VoiceMitra) System & Flow Audit

**Date:** October 2026  
**Auditor:** Senior Software Engineer (AI Studio Build)  
**Status:** In Progress (Upgrading to Industry-Grade Production Architecture)

---

## 1. Executive Summary

An exhaustive end-to-end audit was conducted across every user journey, database touchpoint, authentication mechanism, external integration simulation, and regulatory compliance claim in SkillBridge.

The frontend has a solid UI foundation (React 18 + Vite + Tailwind CSS with saffron/teal visual identity, 12 vernacular language support, Leaflet mapping, and audio waveforms). However, the initial implementation relied heavily on client-side state (`localStorage`), client-side OTP checks, mock payment flows without server-side HMAC validation, and lacked a persistent relational database, server-side RBAC, and real-time SSE synchronization.

---

## 2. Comprehensive Flow Audit Matrix

| Journey / Feature | Component / Endpoint | Initial Status (Pre-Upgrade) | Root Issues & Gaps | Target Fix | Final Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Database & Persistence** | Server / Storage Layer | ❌ Mock-Only (localStorage) | Source of truth was browser localStorage. No cross-session persistence, no relational integrity, no server-side ledger. | Replace with SQLite/WAL relational database with migrations, foreign keys, and integer paise ledger. | **PENDING** |
| **2. Auth & Session Management** | `/api/v1/auth/*` | ⚠️ Client-side OTP | OTP checked in browser JS. Rate limit easily bypassed by clearing storage. No server JWT or httpOnly cookies. | Server-side OTP with bcrypt hash, 5-min expiry, 3-attempt lockout, JWT access + rotating refresh cookies, RBAC. | **PENDING** |
| **3. Worker Voice Registration** | `/api/v1/workers/voice-register` | ⚠️ Partial Backend | Basic backend proxy, but lacked noise/silence detection, retry with backoff, schema-constrained Gemini output, and DB save. | Server-side audio processing, Gemini model validation, Zod entity repair, and automatic user/worker record insertion. | **PENDING** |
| **4. Search & Ranking Algorithm** | `/api/v1/search` | ⚠️ Client-only execution | Ranking computed inside React `useMemo`. Unavailable to B2B/mobile APIs, no pagination. | Server-side search API with pagination, filters, debounced autocomplete, and shared ranking utility. | **PENDING** |
| **5. AI Voice Job Match** | `/api/v1/jobs/voice-match` | ⚠️ Unvalidated JSON | LLM output was parsed without strict schema guarantees or Zod fallback; rankings ran on client. | Schema-constrained Gemini extraction, Zod validation fallback, server-authoritative candidate matching with rationales. | **PENDING** |
| **6. Escrow & Hire State Machine** | `/api/v1/jobs/*` | ❌ Client state transitions | Job statuses (`accepted`, `in_progress`, `completed`) updated directly in client memory without transition rules or ledger. | Strict state machine (`pending_payment` -> `funded` -> `accepted` -> `in_progress` -> `completed` -> `released`). Integer paise ledger. | **PENDING** |
| **7. Payments & Razorpay Integration** | `/api/v1/payments/*` | ⚠️ Simulated client-only | Simulated order ID and signature. No crypto timingSafeEqual check. | Server-side Razorpay order creation, timingSafeEqual HMAC verification, webhook handler, sandbox simulation fallback. | **PENDING** |
| **8. Wage Disbursement (RazorpayX)** | `/api/v1/payments/disburse` | ⚠️ Mock UI | Button simulated a payout without updating user wallet balance, payout UTR, or audit log. | Real server payout service recording payout entries, UTR numbers, and deducting escrow ledger. | **PENDING** |
| **9. Reviews & Reputation Updates** | `/api/v1/reviews` | ⚠️ Partial math | Formula existed in helper but was executed on client without server transaction or duplicate check. | Atomic server transaction enforcing 1 review per party per completed job, weighted reputation recalculation. | **PENDING** |
| **10. Aadhaar e-KYC & DigiLocker** | `/api/v1/kyc/*` | ⚠️ Unsalted hash | Stored plain client SHA-256 of Aadhaar without server pepper secret. Claimed "UIDAI verified". | HMAC-SHA256 with server-side pepper secret, last 4 digits only, reference token, sandbox label, DigiLocker pull. | **PENDING** |
| **11. Skill Quiz Verification** | `/api/v1/quiz/*` | ⚠️ Static / Unverified | In-browser quiz awarded badges directly without attempt cooldown or server scoring validation. | Server-side quiz generation/caching, attempt cooldowns, server-scored grading, verifiable badge issuance. | **PENDING** |
| **12. Real-Time Synchronization** | `/api/v1/events` (SSE) | ❌ Non-existent | No real-time updates. Employer hires worker, but worker's inbox never refreshed automatically. | Server-Sent Events (SSE) broadcasting job offers, payments, and status changes instantly to connected clients. | **PENDING** |
| **13. WhatsApp & IVR Simulators** | `/api/v1/webhooks/*` | ⚠️ UI-only component state | Chatbot state machine lived only in React component memory. Not connected to real backend endpoints. | Simulators call webhook-shaped backend endpoints storing conversation sessions in the relational database. | **PENDING** |
| **14. Dispute Resolution** | `/api/v1/disputes/*` | ⚠️ Basic mock | Dispute creation did not freeze escrow or provide mediator evidence tracking. | Full mediator assignment, note-taking, refund vs release decisioning, and escrow ledger reversal. | **PENDING** |
| **15. Subscription & Plan Gating** | `/api/v1/subscriptions` | ❌ No enforcement | Plan selector changed UI badge, but free tier had no server-enforced search/hire restrictions. | Server middleware enforcing plan limits (e.g. Free = 10 searches/day, no bulk hiring; Contractor = unlimited). | **PENDING** |
| **16. GST Invoice Generation** | `/api/v1/invoices/*` | ⚠️ Client-side jsPDF | Generated mockup invoice on client without persistent invoice records or tax ledger. | Persistent invoice series with GSTIN, SAC codes, CGST/SGST/IGST breakdown, client + server PDF delivery. | **PENDING** |
| **17. Fraud Queue & Security** | `/api/v1/admin/fraud` | ⚠️ Static seed items | Fraud queue showed hardcoded flags rather than rules evaluated against actual live database records. | 5 live computed fraud detection rules (duplicate biometrics, hire velocity, rating clusters, chargebacks, GPS velocity). | **PENDING** |
| **18. B2B Developer Portal** | `/api/v1/developer/keys` | ⚠️ Client keys | Created keys in localStorage without server hash, rate limit middleware, or usage metering. | SHA-256 hashed API keys at rest, middleware rate limiting per key, usage analytics, and live interactive test console. | **PENDING** |
| **19. DPDP Act 2023 & Compliance** | Static pages & UI | ⚠️ False claims | Used terms like "RBI-compliant" and "UIDAI verified" without licensed partner disclosure. | Honest sandbox labeling, working Terms of Service, Privacy Policy, and Statutory Grievance Officer page. | **PENDING** |
| **20. Testing & Quality Engineering** | Test Suites | ⚠️ In-browser only | Only in-browser HTML visual checks. No Vitest CLI, supertest integration tests, or CI workflow. | Vitest unit tests (ranking, reputation, state machine, ledger invariants), integration tests, GitHub Actions CI, Dockerfile. | **PENDING** |

---

## 3. Action Plan & Progression

- [ ] **Phase 1**: Restructure `server/` with modular routes, controllers, middleware, SQLite database with schema migrations & seeding, JWT + httpOnly cookie auth, Zod validation, security headers (Helmet, CORS, rate limits), idempotency keys, and Server-Sent Events (SSE).
- [ ] **Phase 2**: Refactor and wire all core business flows to server endpoints (Voice Registration, Search/Rank, AI Match, Escrow State Machine, Razorpay, KYC, Quiz, Subscriptions, Disputes, Webhooks).
- [ ] **Phase 3**: Frontend upgrades (typed API client, SSE subscriber, WCAG AA accessibility, RTL Urdu support, honest compliance labels, legal and grievance pages).
- [ ] **Phase 4**: Automated Vitest test suite, GitHub Actions CI, Dockerfile, docker-compose, and OpenAPI 3 spec at `/api/docs`.
- [ ] **Phase 5**: Re-audit every flow, verify compilation and tests, and update AUDIT.md with final verified status.
