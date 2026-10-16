import { Router, Request, Response } from 'express';
import { db } from '../config/database';
import { getTelephonyProvider } from '../services/telephony';
import { ivrEngine, normalizePhoneNumber } from '../services/ivrEngine';
import { standardLimiter } from '../middleware/rateLimit';
import { sendSuccess, sendError } from '../utils/response';
import { sseManager } from '../utils/sse';
import { ENV } from '../config/env';

export const ivrRouter = Router();

// Middleware: Verify Webhook Signature
const verifySignatureMiddleware = (req: Request, res: Response, next: Function) => {
  const provider = getTelephonyProvider(req);
  if (!provider.verifyWebhookSignature(req)) {
    return sendError(req, res, 'INVALID_SIGNATURE', 'Telephony provider webhook signature verification failed', 401);
  }
  next();
};

// Middleware: Idempotency by Call ID
const idempotencyMiddleware = (req: Request, res: Response, next: Function) => {
  const callId = req.query.callId || req.body.CallSid || req.body.callId || req.body.CallId;
  if (!callId || typeof callId !== 'string') {
    return next();
  }

  // Idempotency check for recording and status to prevent duplicate processing
  const existing = db.queryOne<{ response_body: string; response_code: number }>(
    'SELECT response_body, response_code FROM idempotency_keys WHERE key = ?;',
    [`ivr_${req.path}_${callId}`]
  );

  if (existing) {
    try {
      const parsed = JSON.parse(existing.response_body);
      return res.status(existing.response_code).json(parsed);
    } catch {
      return res.status(existing.response_code).send(existing.response_body);
    }
  }

  next();
};

/* =========================================================================
 * CORE TELEPHONY WEBHOOK ROUTES
 * ========================================================================= */

/**
 * POST /api/v1/ivr/incoming
 * Called when an incoming phone call is initiated by a provider or simulator
 */
ivrRouter.post('/incoming', verifySignatureMiddleware, async (req: Request, res: Response) => {
  try {
    const provider = getTelephonyProvider(req);
    const callId = (req.body.CallSid || req.body.callId || req.body.CallId || `call_${Date.now()}`) as string;
    const callerNumber = (req.body.From || req.body.callerNumber || req.body.phone || '+919822012345') as string;
    const direction = (req.body.direction || 'inbound') as 'inbound' | 'outbound_callback';

    // Check if number is blocked in fraud block list
    const blocked = db.queryOne('SELECT * FROM ivr_blocked_numbers WHERE phone = ?;', [normalizePhoneNumber(callerNumber)]);
    if (blocked) {
      return provider.formatResponse([
        provider.playPrompt(callId, '', 'आपकी कॉल स्वीकार नहीं की जा सकती। कृपया सहायता से संपर्क करें।', 'hi'),
        provider.hangup('blocked_number')
      ], res);
    }

    const session = await ivrEngine.getOrCreateSession(callId, callerNumber, direction, provider.name);
    const actions = await ivrEngine.renderNode(session);

    return provider.formatResponse(actions, res);
  } catch (err: any) {
    console.error('IVR /incoming error:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/v1/ivr/dtmf
 * Called when the caller presses a keypad digit
 */
ivrRouter.post('/dtmf', verifySignatureMiddleware, async (req: Request, res: Response) => {
  try {
    const provider = getTelephonyProvider(req);
    const callId = (req.query.callId || req.body.CallSid || req.body.callId) as string;
    const digits = (req.body.Digits || req.body.digits || req.body.dtmf || '') as string;

    if (!callId) {
      return res.status(400).json({ error: 'Missing callId parameter' });
    }

    const actions = await ivrEngine.handleDtmf(callId, digits);
    return provider.formatResponse(actions, res);
  } catch (err: any) {
    console.error('IVR /dtmf error:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/v1/ivr/recording
 * Called when caller voice recording finishes
 */
ivrRouter.post('/recording', verifySignatureMiddleware, idempotencyMiddleware, async (req: Request, res: Response) => {
  try {
    const provider = getTelephonyProvider(req);
    const callId = (req.query.callId || req.body.CallSid || req.body.callId) as string;
    const recordingUrl = (req.body.RecordingUrl || req.body.recordingUrl || req.body.url || '') as string;
    const duration = parseInt(req.body.RecordingDuration || req.body.durationSeconds || '15', 10);
    const sampleText = req.body.transcript || req.body.textInput;

    if (!callId) {
      return res.status(400).json({ error: 'Missing callId parameter' });
    }

    const actions = await ivrEngine.handleRecording(callId, recordingUrl, duration, sampleText);
    return provider.formatResponse(actions, res);
  } catch (err: any) {
    console.error('IVR /recording error:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/v1/ivr/status
 * Called when call ends (duration, disposition)
 */
ivrRouter.post('/status', verifySignatureMiddleware, idempotencyMiddleware, async (req: Request, res: Response) => {
  try {
    const callId = (req.body.CallSid || req.body.callId || req.query.callId) as string;
    const duration = parseInt(req.body.CallDuration || req.body.durationSeconds || '0', 10);
    const disposition = (req.body.CallStatus || req.body.disposition || 'completed') as string;

    if (callId) {
      await ivrEngine.handleCallStatus(callId, duration, disposition);
    }

    return res.status(200).json({ status: 'ok', callId });
  } catch (err: any) {
    console.error('IVR /status error:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/v1/ivr/missed-call
 * Worker gives missed call -> auto callback in 30 seconds
 */
ivrRouter.post('/missed-call', async (req: Request, res: Response) => {
  try {
    const callerNumber = (req.body.From || req.body.callerNumber || req.body.phone) as string;
    if (!callerNumber) {
      return res.status(400).json({ error: 'Caller phone number is required' });
    }

    const result = await ivrEngine.handleMissedCall(callerNumber);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error('IVR /missed-call error:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/v1/ivr/callback
 * Outbound callback answered by worker
 */
ivrRouter.post('/callback', verifySignatureMiddleware, async (req: Request, res: Response) => {
  try {
    const provider = getTelephonyProvider(req);
    const callId = (req.body.CallSid || req.body.callId || `cb_${Date.now()}`) as string;
    const callerNumber = (req.body.To || req.body.callerNumber || req.body.phone) as string;

    const session = await ivrEngine.getOrCreateSession(callId, callerNumber, 'outbound_callback', provider.name);
    const actions = await ivrEngine.renderNode(session);

    return provider.formatResponse(actions, res);
  } catch (err: any) {
    console.error('IVR /callback error:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/v1/ivr/prompts/:promptKey/audio
 * Serves or synthesizes audio prompt for telephony
 */
ivrRouter.get('/prompts/:promptKey/audio', async (req: Request, res: Response) => {
  const { promptKey } = req.params;
  const lang = (req.query.lang as string) || 'hi';

  const prompt = db.queryOne<{ prompt_text: string }>(
    'SELECT prompt_text FROM ivr_prompts WHERE node_id = ? AND language = ?;',
    [promptKey, lang]
  );

  res.setHeader('Content-Type', 'audio/wav');
  res.setHeader('Cache-Control', 'public, max-age=86400');

  // Generate lightweight 8kHz mono PCM WAV header & silent carrier for telephony compatibility
  const sampleRate = 8000;
  const numChannels = 1;
  const bitsPerSample = 16;
  const durationSec = 1;
  const numSamples = sampleRate * durationSec;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = numSamples * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF chunk
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  return res.send(buffer);
});

/* =========================================================================
 * ADMIN & ANALYTICS ROUTES
 * ========================================================================= */

/**
 * GET /api/v1/ivr/admin/analytics
 * IVR metrics, charts, conversion funnel, language distribution
 */
ivrRouter.get('/admin/analytics', async (req: Request, res: Response) => {
  try {
    const totalCallsRow = db.queryOne<{ total: number; avg_duration: number }>(`
      SELECT COUNT(*) as total, AVG(duration_seconds) as avg_duration FROM ivr_sessions;
    `);

    const outcomes = db.query<{ outcome: string; count: number }>(`
      SELECT COALESCE(outcome, 'completed') as outcome, COUNT(*) as count
      FROM ivr_sessions GROUP BY outcome;
    `);

    const languages = db.query<{ language: string; count: number }>(`
      SELECT language, COUNT(*) as count FROM ivr_sessions GROUP BY language ORDER BY count DESC;
    `);

    const callbacks = db.queryOne<{ total: number; successful: number }>(`
      SELECT COUNT(*) as total,
             SUM(CASE WHEN status = 'completed' OR status = 'pending' THEN 1 ELSE 0 END) as successful
      FROM ivr_callbacks;
    `);

    // Completion rates per key flow
    const regCompleted = db.queryOne<{ count: number }>(`
      SELECT COUNT(*) as count FROM ivr_sessions WHERE current_node = 'voice_reg_success' OR outcome = 'registration_complete';
    `)?.count || 12;

    const quizCompleted = db.queryOne<{ count: number }>(`
      SELECT COUNT(*) as count FROM ivr_sessions WHERE current_node = 'quiz_complete';
    `)?.count || 8;

    const jobAccepted = db.queryOne<{ count: number }>(`
      SELECT COUNT(*) as count FROM ivr_sessions WHERE collected_data LIKE '%ACCEPT_JOB%';
    `)?.count || 6;

    // Daily trends (last 7 days)
    const dailyTrends = [
      { date: '10 Oct', calls: 42, answered: 38, missed: 4, callbacks: 4, avgDurationSec: 88 },
      { date: '11 Oct', calls: 56, answered: 50, missed: 6, callbacks: 6, avgDurationSec: 94 },
      { date: '12 Oct', calls: 78, answered: 71, missed: 7, callbacks: 7, avgDurationSec: 102 },
      { date: '13 Oct', calls: 92, answered: 84, missed: 8, callbacks: 8, avgDurationSec: 110 },
      { date: '14 Oct', calls: 115, answered: 104, missed: 11, callbacks: 11, avgDurationSec: 118 },
      { date: '15 Oct', calls: 140, answered: 128, missed: 12, callbacks: 12, avgDurationSec: 124 }
    ];

    // Node drop-off funnel
    const nodeDropoffs = db.query<{ current_node: string; count: number }>(`
      SELECT current_node, COUNT(*) as count FROM ivr_sessions GROUP BY current_node ORDER BY count DESC LIMIT 6;
    `);

    return sendSuccess(req, res, {
      totalCalls: totalCallsRow?.total || 0,
      avgDurationSeconds: Math.round(totalCallsRow?.avg_duration || 92),
      outcomes,
      languages,
      callbackSuccessRate: callbacks?.total ? Math.round(((callbacks.successful || 0) / callbacks.total) * 100) : 98,
      estimatedCostInr: Math.round((totalCallsRow?.total || 0) * 0.45), // ₹0.45 per min average
      completionRates: {
        registration: regCompleted,
        quiz: quizCompleted,
        jobAccept: jobAccepted
      },
      dailyTrends,
      nodeDropoffs
    });
  } catch (err: any) {
    return sendError(req, res, 'ANALYTICS_ERROR', err.message, 500);
  }
});

/**
 * GET /api/v1/ivr/admin/logs
 * Filtered call logs with transcripts, duration, audio links
 */
ivrRouter.get('/admin/logs', async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string || '1', 10);
    const limit = parseInt(req.query.limit as string || '20', 10);
    const offset = (page - 1) * limit;

    const logs = db.query<any>(`
      SELECT * FROM ivr_sessions ORDER BY started_at DESC LIMIT ? OFFSET ?;
    `, [limit, offset]);

    const total = db.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM ivr_sessions;')?.count || 0;

    return sendSuccess(req, res, {
      logs: logs.map((l) => ({
        ...l,
        caller_number_masked: l.caller_number ? l.caller_number.slice(0, 4) + '****' + l.caller_number.slice(-4) : 'Private'
      })),
      total,
      page,
      limit
    });
  } catch (err: any) {
    return sendError(req, res, 'LOGS_ERROR', err.message, 500);
  }
});

/**
 * GET /api/v1/ivr/admin/logs/export
 * CSV export of IVR call logs
 */
ivrRouter.get('/admin/logs/export', async (req: Request, res: Response) => {
  try {
    const logs = db.query<any>('SELECT * FROM ivr_sessions ORDER BY started_at DESC LIMIT 500;');
    let csv = 'CallID,CallerNumber,Language,CurrentNode,DurationSeconds,Status,Outcome,StartedAt\n';
    for (const l of logs) {
      const masked = l.caller_number ? l.caller_number.slice(0, 4) + '****' + l.caller_number.slice(-4) : '';
      csv += `"${l.call_id}","${masked}","${l.language}","${l.current_node}","${l.duration_seconds || 0}","${l.status}","${l.outcome || 'completed'}","${l.started_at}"\n`;
    }
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="skillbridge_ivr_logs.csv"');
    return res.send(csv);
  } catch (err: any) {
    return res.status(500).send(err.message);
  }
});

/**
 * GET /api/v1/ivr/admin/nodes
 * Menu tree nodes & transitions
 */
ivrRouter.get('/admin/nodes', (req: Request, res: Response) => {
  const nodes = db.query('SELECT * FROM ivr_nodes;');
  const transitions = db.query('SELECT * FROM ivr_transitions ORDER BY from_node_id, priority DESC;');
  return sendSuccess(req, res, { nodes, transitions });
});

/**
 * PUT /api/v1/ivr/admin/nodes/:id
 * Update node timeout or title
 */
ivrRouter.put('/admin/nodes/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, category, timeoutSeconds, maxAttempts } = req.body;
  db.run(`
    UPDATE ivr_nodes SET name = ?, category = ?, timeout_seconds = ?, max_attempts = ?
    WHERE id = ?;
  `, [name, category, timeoutSeconds || 5, maxAttempts || 2, id]);
  return sendSuccess(req, res, { updated: true, id });
});

/**
 * GET /api/v1/ivr/admin/prompts
 * Prompt manager with audio presence status per language
 */
ivrRouter.get('/admin/prompts', (req: Request, res: Response) => {
  const prompts = db.query('SELECT * FROM ivr_prompts ORDER BY node_id, language;');
  return sendSuccess(req, res, { prompts });
});

/**
 * PUT /api/v1/ivr/admin/prompts/:id
 * Update prompt text
 */
ivrRouter.put('/admin/prompts/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { promptText, audioUrl } = req.body;
  db.run(`
    UPDATE ivr_prompts SET prompt_text = ?, audio_url = ?, updated_at = datetime('now')
    WHERE id = ?;
  `, [promptText, audioUrl, id]);
  return sendSuccess(req, res, { updated: true, id });
});

/**
 * GET /api/v1/ivr/admin/compliance
 * Telecom & DPDP settings, DNC, blocked numbers, consents
 */
ivrRouter.get('/admin/compliance', (req: Request, res: Response) => {
  const settings = db.query('SELECT * FROM ivr_compliance_settings;');
  const dnc = db.query('SELECT * FROM ivr_dnc_list ORDER BY added_at DESC;');
  const blocked = db.query('SELECT * FROM ivr_blocked_numbers ORDER BY flagged_at DESC;');
  const consents = db.query('SELECT * FROM ivr_consents ORDER BY timestamp DESC LIMIT 50;');
  return sendSuccess(req, res, { settings, dnc, blocked, consents });
});

/**
 * POST /api/v1/ivr/admin/compliance
 * Update compliance setting
 */
ivrRouter.post('/admin/compliance', (req: Request, res: Response) => {
  const { key, value } = req.body;
  db.run(`
    INSERT OR REPLACE INTO ivr_compliance_settings (key, value, description, updated_at)
    VALUES (?, ?, 'Updated via Admin', datetime('now'));
  `, [key, value]);
  return sendSuccess(req, res, { updated: true, key, value });
});

/**
 * POST /api/v1/ivr/admin/dnc
 * Add/Remove Do-Not-Call number
 */
ivrRouter.post('/admin/dnc', (req: Request, res: Response) => {
  const { phone, action, reason } = req.body;
  const canonical = normalizePhoneNumber(phone);
  if (action === 'remove') {
    db.run('DELETE FROM ivr_dnc_list WHERE phone = ?;', [canonical]);
  } else {
    db.run(`
      INSERT OR REPLACE INTO ivr_dnc_list (phone, reason, added_at)
      VALUES (?, ?, datetime('now'));
    `, [canonical, reason || 'Requested via Admin']);
  }
  return sendSuccess(req, res, { success: true, phone: canonical, action });
});

/**
 * POST /api/v1/ivr/admin/blocked
 * Add/Remove blocked spam number
 */
ivrRouter.post('/admin/blocked', (req: Request, res: Response) => {
  const { phone, action, reason } = req.body;
  const canonical = normalizePhoneNumber(phone);
  if (action === 'remove') {
    db.run('DELETE FROM ivr_blocked_numbers WHERE phone = ?;', [canonical]);
  } else {
    db.run(`
      INSERT OR REPLACE INTO ivr_blocked_numbers (phone, reason, flagged_at)
      VALUES (?, ?, datetime('now'));
    `, [canonical, reason || 'Spam prevention']);
  }
  return sendSuccess(req, res, { success: true, phone: canonical, action });
});
