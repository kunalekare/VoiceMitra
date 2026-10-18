import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { extractWorkerProfileFromText, processVoiceRegistration, normalizeVoiceRegistrationResult } from '../server/services/geminiService';
import { workerRouter } from '../server/routes/workerRoutes';
import { runMigrations } from '../server/models/migrations';
import { db } from '../server/config/database';

describe('Voice-Based Profile Making Unit & Integration Tests', () => {
  beforeAll(async () => {
    await runMigrations();
  });

  describe('1. Multilingual Indian NLU Voice Extraction Engine', () => {
    it('extracts Hindi voice profile correctly (Ramesh Patel, Plumber, Pune, 7 yrs)', () => {
      const input = 'मेरा नाम रमेश पटेल है, मैं पुणे से हूँ, मुझे 7 साल का प्लंबर और नल फिटिंग का काम आता है।';
      const result = extractWorkerProfileFromText(input, 'hi');

      expect(result.name).toBe('रमेश पटेल');
      expect(result.primarySkill).toBe('Plumber');
      expect(result.location).toBe('Pune');
      expect(result.experienceYears).toBe(7);
      expect(result.secondarySkills).toContain('Pipe Fitting');
      expect(result.confidence).toBeGreaterThanOrEqual(0.85);
      expect(result.transcript).toBe(input);
    });

    it('extracts Marathi voice profile correctly (Santosh Kamble, Carpenter, Mumbai, 10 yrs)', () => {
      const input = 'माझं नाव संतोष कांबळे आहे, मी मुंबईतून आहे आणि मला 10 वर्षे सुतारकाम आणि फर्निचर बनवण्याचा अनुभव आहे.';
      const result = extractWorkerProfileFromText(input, 'mr');

      expect(result.name).toBe('संतोष कांबळे');
      expect(result.primarySkill).toBe('Carpenter');
      expect(result.location).toBe('Mumbai');
      expect(result.experienceYears).toBe(10);
      expect(result.secondarySkills).toContain('Modular Furniture');
    });

    it('extracts English voice profile correctly (Amit Sharma, Electrician, Nagpur, 8 yrs)', () => {
      const input = 'My name is Amit Sharma, I am an electrician from Nagpur with 8 years experience in house wiring.';
      const result = extractWorkerProfileFromText(input, 'en');

      expect(result.name).toBe('Amit Sharma');
      expect(result.primarySkill).toBe('Electrician');
      expect(result.location).toBe('Nagpur');
      expect(result.experienceYears).toBe(8);
      expect(result.secondarySkills).toContain('House Wiring');
    });

    it('extracts Hindi domestic worker profile (Sunita Devi, Domestic Help, Delhi, 4 yrs)', () => {
      const input = 'मेरा नाम सुनीता देवी है, मैं दिल्ली से हूँ, 4 साल से खाना पकाने और घरेलू काम का तजुर्बा है।';
      const result = extractWorkerProfileFromText(input, 'hi');

      expect(result.name).toBe('सुनीता देवी');
      expect(result.primarySkill).toBe('Domestic Help');
      expect(result.location).toBe('Delhi');
      expect(result.experienceYears).toBe(4);
      expect(result.secondarySkills).toContain('Home Cooking');
    });

    it('extracts wages and phone when all worker details are provided', () => {
      const input = 'My name is Amit Sharma, I am an electrician from Nagpur with 8 years experience. My expected wage is 900 rupees per day. My phone number is 9876543210.';
      const result = extractWorkerProfileFromText(input, 'en');

      expect(result.name).toBe('Amit Sharma');
      expect(result.primarySkill).toBe('Electrician');
      expect(result.location).toBe('Nagpur');
      expect(result.experienceYears).toBe(8);
      expect(result.dailyWageExpected).toBe(900);
      expect(result.phone).toBe('+919876543210');
    });

    it('leaves expected wages unset when omitted', () => {
      const input = 'My name is Amit Sharma, I am an electrician from Nagpur with 8 years experience. My phone number is 9876543210.';
      const result = extractWorkerProfileFromText(input, 'en');

      expect(result.dailyWageExpected).toBeUndefined();
      expect(result.phone).toBe('+919876543210');
      expect(result.name).toBe('Amit Sharma');
    });

    it('leaves phone unset when omitted', () => {
      const input = 'My name is Amit Sharma, I am an electrician from Nagpur with 8 years experience. Expected wage is 850 rupees per day.';
      const result = extractWorkerProfileFromText(input, 'en');

      expect(result.phone).toBeUndefined();
      expect(result.dailyWageExpected).toBe(850);
    });

    it('does not fabricate wages or phone when both are omitted', () => {
      const input = 'मेरा नाम रमेश पटेल है, मैं पुणे से हूँ, मुझे 7 साल का प्लंबर और नल फिटिंग का काम आता है।';
      const result = extractWorkerProfileFromText(input, 'hi');

      expect(result.phone).toBeUndefined();
      expect(result.dailyWageExpected).toBeUndefined();
      expect(result.name).toBe('रमेश पटेल');
      expect(result.primarySkill).toBe('Plumber');
      expect(result.location).toBe('Pune');
      expect(result.experienceYears).toBe(7);
    });

    it('preserves a phone number spoken digit by digit', () => {
      const input = 'My name is Amit Sharma, I am an electrician from Nagpur with 8 years experience. My phone number is nine eight seven six five four three two one zero.';
      const result = extractWorkerProfileFromText(input, 'en');

      expect(result.phone).toBe('+919876543210');
      expect(result.dailyWageExpected).toBeUndefined();
    });

    it('does not assign phone digits to wages or wages to phone', () => {
      const input = 'My name is Amit Sharma from Nagpur, electrician, 8 years. Daily wage 800 rupees. Mobile 9876543210.';
      const result = extractWorkerProfileFromText(input, 'en');

      expect(result.dailyWageExpected).toBe(800);
      expect(result.phone).toBe('+919876543210');
    });

    it('keeps only the spoken name and does not invent a surname', () => {
      const input = 'मेरा नाम रमेश है, मैं पुणे से हूँ, मुझे 7 साल का प्लंबर और नल फिटिंग का काम आता है।';
      const result = extractWorkerProfileFromText(input, 'hi');

      expect(result.name).toBe('रमेश');
      expect(result.name).not.toMatch(/Patel|पटेल|Kumar|कुमार|Sharma/i);
      expect(result.primarySkill).toBe('Plumber');
      expect(result.location).toBe('Pune');
      expect(result.experienceYears).toBe(7);
    });

    it('handles incomplete or invalid AI output without fabricating wages or phone', () => {
      const transcript = 'मेरा नाम राजेश है, मैं नागपुर से हूँ और 6 साल से इलेक्ट्रीशियन का काम करता हूँ।';
      const result = normalizeVoiceRegistrationResult(
        {
          name: 'Rajesh Kumar',
          phone: 'not-a-phone',
          dailyWageExpected: '9876543210',
          experienceYears: 'abc',
          primarySkill: 'Electrician'
        },
        transcript,
        'hi'
      );

      expect(result.name).toBe('राजेश');
      expect(result.phone).toBeUndefined();
      expect(result.dailyWageExpected).toBeUndefined();
      expect(result.primarySkill).toBe('Electrician');
      expect(result.location).toBe('Nagpur');
      expect(result.experienceYears).toBe(6);
    });

    it('does not accept a phone number invented by AI output', () => {
      const transcript =
    'My name is Amit Sharma, I am an electrician from Nagpur with 8 years experience.';

      const result = normalizeVoiceRegistrationResult(
    {
      name: 'Amit Sharma',
      phone: '9876543210',
      primarySkill: 'Electrician',
      experienceYears: 8
    },
    transcript,
    'en'
  );

    expect(result.phone).toBeUndefined();
    });
  });

  describe('2. Voice Registration Backend Endpoints', () => {
    const app = express();
    app.use(express.json());
    app.post('/api/gemini/voice-registration', async (req, res) => {
      const { audioBase64, mimeType, textInput, languageCode } = req.body;
      const extracted = await processVoiceRegistration(audioBase64, mimeType, textInput, languageCode);
      res.json(extracted);
    });
    app.use('/api/v1/workers', workerRouter);

    it('POST /api/gemini/voice-registration extracts structured profile from text input', async () => {
      const res = await request(app)
        .post('/api/gemini/voice-registration')
        .send({
          textInput: 'मेरा नाम राजेश कुमार है, मैं नागपुर से हूँ और 6 साल से इलेक्ट्रीशियन का काम करता हूँ।',
          languageCode: 'hi'
        });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('राजेश कुमार');
      expect(res.body.primarySkill).toBe('Electrician');
      expect(res.body.location).toBe('Nagpur');
      expect(res.body.experienceYears).toBe(6);
    });

    it('POST /api/v1/workers/voice-register persists worker to SQLite database', async () => {
      const testPhone = '+919876543210';
      const res = await request(app)
        .post('/api/v1/workers/voice-register')
        .send({
          phone: testPhone,
          textInput: 'मेरा नाम विकास यादव है, मैं पुणे से हूँ, 5 साल से प्लंबर हूँ।',
          languageCode: 'hi',
          overrideData: {
            name: 'विकास यादव',
            primarySkill: 'Plumber',
            district: 'Pune',
            experienceYears: 5
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.worker.name).toBe('विकास यादव');
      expect(res.body.data.worker.primarySkill).toBe('Plumber');

      // Verify row exists in SQLite database
      const rows = db.query<any>('SELECT * FROM workers WHERE phone = ?;', [testPhone]);
      expect(rows.length).toBe(1);
      expect(rows[0].name).toBe('विकास यादव');
      expect(rows[0].primary_skill).toBe('Plumber');
      expect(rows[0].district).toBe('Pune');
    });

    it('POST /api/v1/workers/voice-register does not invent a phone number when none is provided', async () => {
      const res = await request(app)
        .post('/api/v1/workers/voice-register')
        .send({
          userId: 'w-reg-no-phone',
          textInput: 'मेरा नाम विकास यादव है, मैं पुणे से हूँ, 5 साल से प्लंबर हूँ।',
          languageCode: 'hi',
          overrideData: {
            name: 'विकास यादव',
            primarySkill: 'Plumber',
            district: 'Pune',
            experienceYears: 5
          }
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.worker.phone).toBe('');
      expect(res.body.data.extracted.phone).toBeUndefined();
      expect(res.body.data.extracted.dailyWageExpected).toBeUndefined();
    });
  });
});
