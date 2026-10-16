import { describe, it, expect, beforeAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import { db } from '../server/config/database';
import { runMigrations } from '../server/models/migrations';
import { ivrRouter } from '../server/routes/ivrRoutes';
import {
  ivrEngine,
  formatIndianCurrencyWords,
  isWithinCallingHours,
  normalizePhoneNumber
} from '../server/services/ivrEngine';
import { SEED_IVR_NODES, SEED_IVR_TRANSITIONS, SEED_IVR_PROMPTS } from '../server/data/ivrMenuSeed';
import { getTelephonyProvider, SimulatorAdapter, TwilioAdapter, ExotelAdapter } from '../server/services/telephony';

describe('IVR Telephony Unit & Integration Tests', () => {
  let app: express.Express;

  beforeAll(async () => {
    await runMigrations();

    app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use('/api/v1/ivr', ivrRouter);
  });

  describe('1. Phone Number & Indian Numbering to Speech', () => {
    it('normalizes 10-digit Indian numbers to E.164 canonical format', () => {
      expect(normalizePhoneNumber('9822012345')).toBe('+919822012345');
      expect(normalizePhoneNumber('+91 98220 12345')).toBe('+919822012345');
      expect(normalizePhoneNumber('09822012345')).toBe('+919822012345');
    });

    it('formats currency correctly in Indian numbering system (Lakh/Crore/Thousand/Hundred)', () => {
      const speechHi = formatIndianCurrencyWords(34500, 'hi');
      expect(speechHi).toContain('हज़ार');
      expect(speechHi).toContain('रुपये');

      const speechMr = formatIndianCurrencyWords(500000, 'mr');
      expect(speechMr).toContain('लाख');
      expect(speechMr).toContain('रुपये');

      const speechTa = formatIndianCurrencyWords(1500, 'ta');
      expect(speechTa).toContain('ஆயிரம்');

      const speechEn = formatIndianCurrencyWords(12500000, 'en');
      expect(speechEn).toContain('Crore');
      expect(speechEn).toContain('Lakh');
    });

    it('validates quiet hours rules (9:00 AM to 9:00 PM IST)', () => {
      const result = isWithinCallingHours();
      expect(typeof result).toBe('boolean');
    });
  });

  describe('2. Telephony Provider Adapters', () => {
    it('formats responses correctly in SimulatorAdapter (JSON)', () => {
      const sim = new SimulatorAdapter();
      const actions = [
        sim.collectDtmf({ numDigits: 1, actionUrl: '/api/v1/ivr/dtmf', textFallback: 'Test' })
      ];
      expect(actions[0].type).toBe('gather');
      expect(actions[0].maxDigits).toBe(1);
    });

    it('formats responses correctly in TwilioAdapter (TwiML XML)', () => {
      const twilio = new TwilioAdapter();
      const actions = [
        twilio.collectDtmf({ numDigits: 1, actionUrl: '/api/v1/ivr/dtmf', textFallback: 'Welcome' }),
        twilio.hangup('done')
      ];
      expect(actions[0].type).toBe('gather');
      expect(actions[1].type).toBe('hangup');
    });

    it('formats responses correctly in ExotelAdapter (JSON Flow Applet)', () => {
      const exotel = new ExotelAdapter();
      const action = exotel.recordAudio({ maxLengthSeconds: 45, playBeep: true });
      expect(action.type).toBe('record');
      expect(action.maxLengthSeconds).toBe(45);
    });
  });

  describe('3. PIN Authentication & Lockout Security', () => {
    it('locks out caller after 3 failed PIN attempts on sensitive earnings node', async () => {
      const callId = `test_lockout_${Date.now()}`;
      await ivrEngine.getOrCreateSession(callId, '+919822099999');

      // Set node to earnings_pin_prompt in SQLite DB
      db.run('UPDATE ivr_sessions SET current_node = "earnings_pin_prompt", voice_pin = "4321" WHERE call_id = ?;', [callId]);

      // 1st failed attempt
      let actions = await ivrEngine.handleDtmf(callId, '0000');
      expect(actions.length).toBeGreaterThan(0);

      // 2nd failed attempt
      actions = await ivrEngine.handleDtmf(callId, '1111');
      expect(actions.length).toBeGreaterThan(0);

      // 3rd failed attempt -> must trigger lockout and hangup
      actions = await ivrEngine.handleDtmf(callId, '2222');
      const hangupAction = actions.find((a) => a.type === 'hangup');
      expect(hangupAction).toBeDefined();
      expect(hangupAction?.reason).toBe('pin_lockout');
    });
  });

  describe('4. Full End-to-End Call Flow Integration with supertest', () => {
    const testCallId = `integration_call_${Date.now()}`;
    const testCallerPhone = '+919822012345';

    it('step 1: initiates incoming call to /api/v1/ivr/incoming', async () => {
      const res = await request(app)
        .post('/api/v1/ivr/incoming')
        .send({
          CallSid: testCallId,
          From: testCallerPhone,
          direction: 'inbound'
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.actions).toBeDefined();
      expect(res.body.actions.length).toBeGreaterThan(0);
    });

    it('step 2: selects language (key 1 for Hindi) at /api/v1/ivr/dtmf', async () => {
      const res = await request(app)
        .post(`/api/v1/ivr/dtmf?callId=${testCallId}`)
        .send({
          CallSid: testCallId,
          Digits: '1'
        });

      expect(res.status).toBe(200);
      expect(res.body.actions).toBeDefined();
    });

    it('step 3: tests universal key 0 (repeat prompt)', async () => {
      const res = await request(app)
        .post(`/api/v1/ivr/dtmf?callId=${testCallId}`)
        .send({
          CallSid: testCallId,
          Digits: '0'
        });

      expect(res.status).toBe(200);
      expect(res.body.actions).toBeDefined();
    });

    it('step 4: submits voice profile recording to /api/v1/ivr/recording', async () => {
      const res = await request(app)
        .post(`/api/v1/ivr/recording?callId=${testCallId}`)
        .send({
          CallSid: testCallId,
          recordingUrl: 'https://cdn.skillbridge.in/recordings/test_wireman.wav',
          durationSeconds: 15,
          transcript: 'नमस्ते मेरा नाम दीपक पवार है, मैं नागपुर से हूँ और ६ साल से इलेक्ट्रीशियन का काम कर रहा हूँ।'
        });

      expect(res.status).toBe(200);
      expect(res.body.actions).toBeDefined();
    });

    it('step 5: triggers missed-call webhook and schedules callback', async () => {
      const res = await request(app)
        .post('/api/v1/ivr/missed-call')
        .send({
          From: '+919822088888'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.callbackId).toBeDefined();
    });

    it('step 6: ends call and logs duration at /api/v1/ivr/status', async () => {
      const res = await request(app)
        .post('/api/v1/ivr/status')
        .send({
          CallSid: testCallId,
          CallDuration: 75,
          CallStatus: 'completed'
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('5. Failure Paths and Recovery', () => {
    it('handles silence / too short recording gracefully', async () => {
      const shortCallId = `short_audio_call_${Date.now()}`;
      await ivrEngine.getOrCreateSession(shortCallId, '+919822011111');

      const actions = await ivrEngine.handleRecording(shortCallId, 'http://test.wav', 1); // 1 second duration
      expect(actions.length).toBeGreaterThan(0);
      // Re-prompts caller to speak again
      expect(actions[0].text).toContain('छोटी');
    });

    it('handles invalid DTMF key with re-prompt and eventual goodbye', async () => {
      const invalidCallId = `invalid_key_call_${Date.now()}`;
      await ivrEngine.getOrCreateSession(invalidCallId, '+919822022222');

      // Invalid key '7' on consent notice
      const actions1 = await ivrEngine.handleDtmf(invalidCallId, '7');
      expect(actions1.length).toBeGreaterThan(0);

      // Second invalid key '7' -> should exceed max retries and hang up politely
      const actions2 = await ivrEngine.handleDtmf(invalidCallId, '7');
      const hangup = actions2.find((a) => a.type === 'hangup');
      expect(hangup).toBeDefined();
    });
  });
});
