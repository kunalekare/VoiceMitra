import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { webhookRouter } from '../server/routes/webhookRoutes';
import { runMigrations } from '../server/models/migrations';
import { db } from '../server/config/database';

describe('WhatsApp Bot Inbound Webhook API Tests', () => {
  let app: express.Express;
  const testPhone = '+919822099999';

  beforeAll(async () => {
    await runMigrations();
    app = express();
    app.use(express.json());
    app.use('/api/v1/webhooks', webhookRouter);
  });

  it('1. returns greeting and main menu on initial contact', async () => {
    const res = await request(app)
      .post('/api/v1/webhooks/whatsapp')
      .send({
        from: testPhone,
        message: 'Hello SkillBridge'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.reply).toContain('स्किलब्रिज');
    expect(res.body.data.buttons.length).toBeGreaterThan(0);
  });

  it('2. switches language via command or action payload', async () => {
    const res = await request(app)
      .post('/api/v1/webhooks/whatsapp')
      .send({
        from: testPhone,
        actionPayload: 'SET_LANG_en'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.language).toBe('en');
    expect(res.body.data.reply).toContain('English');
  });

  it('3. returns matching job offers and interactive buttons', async () => {
    const res = await request(app)
      .post('/api/v1/webhooks/whatsapp')
      .send({
        from: testPhone,
        actionPayload: 'MENU_JOBS'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.reply).toBeDefined();
    expect(res.body.data.buttons).toBeDefined();
  });

  it('4. checks escrow wallet balance and returns card', async () => {
    const res = await request(app)
      .post('/api/v1/webhooks/whatsapp')
      .send({
        from: testPhone,
        actionPayload: 'MENU_EARNINGS'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.reply).toContain('एस्क्रो');
    expect(res.body.data.mediaCard).toBeDefined();
    expect(res.body.data.mediaCard.type).toBe('wallet_card');
  });

  it('5. starts trade skill quiz on whatsapp', async () => {
    const res = await request(app)
      .post('/api/v1/webhooks/whatsapp')
      .send({
        from: testPhone,
        actionPayload: 'MENU_QUIZ'
      });

    expect(res.status).toBe(200);
    expect(res.body.data.nextState).toBe('QUIZ_IN_PROGRESS');
    expect(res.body.data.buttons.length).toBe(4);
  });

  it('6. verifies database session persistence', async () => {
    const session = db.queryOne<{ phone: string; state: string }>(
      'SELECT * FROM whatsapp_sessions WHERE phone = ?;',
      [testPhone]
    );

    expect(session).toBeDefined();
    expect(session?.phone).toBe(testPhone);
  });
});
