import { Request, Response } from 'express';
import {
  TelephonyProvider,
  TelephonyAction,
  OutboundCallResult,
  SmsResult
} from './types';
import { db } from '../../config/database';

export class SimulatorAdapter implements TelephonyProvider {
  name = 'simulator';

  async answerCall(callId: string): Promise<void> {
    // Simulator auto-answers instantly
    return Promise.resolve();
  }

  playPrompt(
    callId: string,
    promptUrl: string,
    textFallback?: string,
    lang = 'hi'
  ): TelephonyAction {
    return {
      type: 'play',
      promptUrl,
      text: textFallback,
      lang
    };
  }

  collectDtmf(options: {
    numDigits?: number;
    timeoutSeconds?: number;
    finishOnKey?: string;
    actionUrl?: string;
    promptUrl?: string;
    textFallback?: string;
    lang?: string;
    bargeIn?: boolean;
  }): TelephonyAction {
    return {
      type: 'gather',
      maxDigits: options.numDigits ?? 1,
      timeoutSeconds: options.timeoutSeconds ?? 5,
      finishOnKey: options.finishOnKey ?? '#',
      actionUrl: options.actionUrl,
      promptUrl: options.promptUrl,
      text: options.textFallback,
      lang: options.lang || 'hi',
      bargeIn: options.bargeIn ?? true
    };
  }

  recordAudio(options: {
    maxLengthSeconds?: number;
    playBeep?: boolean;
    finishOnKey?: string;
    actionUrl?: string;
    timeoutSeconds?: number;
  }): TelephonyAction {
    return {
      type: 'record',
      maxLengthSeconds: options.maxLengthSeconds ?? 45,
      playBeep: options.playBeep ?? true,
      finishOnKey: options.finishOnKey ?? '#',
      actionUrl: options.actionUrl,
      timeoutSeconds: options.timeoutSeconds ?? 5
    };
  }

  hangup(reason = 'completed'): TelephonyAction {
    return {
      type: 'hangup',
      reason
    };
  }

  transfer(
    destinationNumber: string,
    options?: { callerId?: string; timeoutSeconds?: number }
  ): TelephonyAction {
    return {
      type: 'dial',
      dialNumber: destinationNumber,
      callerId: options?.callerId,
      timeoutSeconds: options?.timeoutSeconds ?? 30
    };
  }

  async makeOutboundCall(
    toNumber: string,
    fromNumber: string,
    callbackUrl: string,
    options?: Record<string, unknown>
  ): Promise<OutboundCallResult> {
    const callId = `sim_call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return Promise.resolve({
      callId,
      status: 'queued',
      provider: 'simulator'
    });
  }

  async sendSms(
    toNumber: string,
    message: string,
    dltTemplateId?: string
  ): Promise<SmsResult> {
    const messageId = `sim_sms_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    // Record in notifications table for audit
    try {
      db.run(
        `INSERT INTO notifications (id, user_id, title, message, channel, created_at)
         VALUES (?, ?, 'IVR SMS Notification', ?, 'sms', datetime('now'));`,
        [messageId, toNumber, message]
      );
    } catch {}

    return Promise.resolve({
      messageId,
      status: 'sent',
      provider: 'simulator'
    });
  }

  verifyWebhookSignature(req: Request): boolean {
    // Simulator accepts calls, but validates if signature header provided
    const secret = req.headers['x-telephony-signature'] || req.headers['x-simulator-secret'];
    if (secret && typeof secret === 'string') {
      return secret.length > 0;
    }
    return true;
  }

  formatResponse(actions: TelephonyAction[], res: Response): any {
    return res.status(200).json({
      status: 'ok',
      provider: 'simulator',
      actions,
      timestamp: new Date().toISOString()
    });
  }
}
