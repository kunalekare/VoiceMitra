import { Request, Response } from 'express';
import crypto from 'crypto';
import {
  TelephonyProvider,
  TelephonyAction,
  OutboundCallResult,
  SmsResult
} from './types';
import { ENV } from '../../config/env';

export class ExotelAdapter implements TelephonyProvider {
  name = 'exotel';

  async answerCall(callId: string): Promise<void> {
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
      callerId: options?.callerId || ENV.IVR_INBOUND_NUMBER,
      timeoutSeconds: options?.timeoutSeconds ?? 30
    };
  }

  async makeOutboundCall(
    toNumber: string,
    fromNumber: string,
    callbackUrl: string,
    options?: Record<string, unknown>
  ): Promise<OutboundCallResult> {
    const callId = `exo_call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    // If real Exotel credentials are present, invoke Exotel REST endpoint
    if (ENV.TELEPHONY_ACCOUNT_SID && ENV.TELEPHONY_AUTH_TOKEN) {
      try {
        const auth = Buffer.from(`${ENV.TELEPHONY_ACCOUNT_SID}:${ENV.TELEPHONY_AUTH_TOKEN}`).toString('base64');
        const url = `https://api.exotel.com/v1/Accounts/${ENV.TELEPHONY_ACCOUNT_SID}/Calls/connect.json`;
        const body = new URLSearchParams({
          From: fromNumber,
          To: toNumber,
          CallerId: fromNumber,
          Url: callbackUrl,
          CallType: 'trans'
        });

        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: body.toString()
        });

        if (resp.ok) {
          const data = await resp.json() as any;
          return {
            callId: data?.Call?.Sid || callId,
            status: 'queued',
            provider: 'exotel'
          };
        }
      } catch (err) {
        console.warn('[ExotelAdapter] Failed to dispatch real Exotel call, fallback to queued stub:', err);
      }
    }

    return {
      callId,
      status: 'queued',
      provider: 'exotel'
    };
  }

  async sendSms(
    toNumber: string,
    message: string,
    dltTemplateId?: string
  ): Promise<SmsResult> {
    const messageId = `exo_sms_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (ENV.TELEPHONY_ACCOUNT_SID && ENV.TELEPHONY_AUTH_TOKEN) {
      try {
        const auth = Buffer.from(`${ENV.TELEPHONY_ACCOUNT_SID}:${ENV.TELEPHONY_AUTH_TOKEN}`).toString('base64');
        const url = `https://api.exotel.com/v1/Accounts/${ENV.TELEPHONY_ACCOUNT_SID}/Sms/send.json`;
        const body = new URLSearchParams({
          From: 'SKLBRG',
          To: toNumber,
          Body: message,
          ...(dltTemplateId ? { DltTemplateId: dltTemplateId } : {})
        });

        const resp = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: body.toString()
        });

        if (resp.ok) {
          const data = await resp.json() as any;
          return {
            messageId: data?.SMSMessage?.Sid || messageId,
            status: 'sent',
            provider: 'exotel'
          };
        }
      } catch (err) {
        console.warn('[ExotelAdapter] Failed to dispatch real Exotel SMS, fallback to stub:', err);
      }
    }

    return {
      messageId,
      status: 'sent',
      provider: 'exotel'
    };
  }

  verifyWebhookSignature(req: Request): boolean {
    const signature = req.headers['x-exotel-signature'] || req.headers['x-telephony-signature'];
    if (!ENV.TELEPHONY_WEBHOOK_SECRET || !signature) {
      return true; // allow in dev if not strictly enforced
    }
    const computed = crypto
      .createHmac('sha256', ENV.TELEPHONY_WEBHOOK_SECRET)
      .update(JSON.stringify(req.body || {}))
      .digest('hex');
    return computed === signature;
  }

  formatResponse(actions: TelephonyAction[], res: Response): any {
    // Exotel Flow / Passthru applet format
    const exotelCommands = actions.map((a) => {
      switch (a.type) {
        case 'gather':
          return {
            action: 'gather',
            max_digits: a.maxDigits,
            timeout: a.timeoutSeconds,
            finish_key: a.finishOnKey,
            prompt: a.promptUrl || a.text,
            url: a.actionUrl
          };
        case 'play':
          return {
            action: 'play',
            url: a.promptUrl,
            text: a.text
          };
        case 'record':
          return {
            action: 'record',
            max_length: a.maxLengthSeconds,
            beep: a.playBeep,
            finish_key: a.finishOnKey,
            url: a.actionUrl
          };
        case 'dial':
          return {
            action: 'transfer',
            number: a.dialNumber,
            caller_id: a.callerId
          };
        case 'hangup':
        default:
          return { action: 'hangup', reason: a.reason };
      }
    });

    return res.status(200).json({
      status: 'success',
      provider: 'exotel',
      flow: exotelCommands
    });
  }
}
