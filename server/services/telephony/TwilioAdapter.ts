import { Request, Response } from 'express';
import crypto from 'crypto';
import {
  TelephonyProvider,
  TelephonyAction,
  OutboundCallResult,
  SmsResult
} from './types';
import { ENV } from '../../config/env';

export class TwilioAdapter implements TelephonyProvider {
  name = 'twilio';

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
    const callId = `CA_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (ENV.TELEPHONY_ACCOUNT_SID && ENV.TELEPHONY_AUTH_TOKEN) {
      try {
        const auth = Buffer.from(`${ENV.TELEPHONY_ACCOUNT_SID}:${ENV.TELEPHONY_AUTH_TOKEN}`).toString('base64');
        const url = `https://api.twilio.com/2010-04-01/Accounts/${ENV.TELEPHONY_ACCOUNT_SID}/Calls.json`;
        const body = new URLSearchParams({
          From: fromNumber,
          To: toNumber,
          Url: callbackUrl
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
            callId: data?.sid || callId,
            status: 'queued',
            provider: 'twilio'
          };
        }
      } catch (err) {
        console.warn('[TwilioAdapter] Failed to dispatch Twilio call:', err);
      }
    }

    return {
      callId,
      status: 'queued',
      provider: 'twilio'
    };
  }

  async sendSms(
    toNumber: string,
    message: string,
    dltTemplateId?: string
  ): Promise<SmsResult> {
    const messageId = `SM_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (ENV.TELEPHONY_ACCOUNT_SID && ENV.TELEPHONY_AUTH_TOKEN) {
      try {
        const auth = Buffer.from(`${ENV.TELEPHONY_ACCOUNT_SID}:${ENV.TELEPHONY_AUTH_TOKEN}`).toString('base64');
        const url = `https://api.twilio.com/2010-04-01/Accounts/${ENV.TELEPHONY_ACCOUNT_SID}/Messages.json`;
        const body = new URLSearchParams({
          From: ENV.IVR_INBOUND_NUMBER,
          To: toNumber,
          Body: message
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
            messageId: data?.sid || messageId,
            status: 'sent',
            provider: 'twilio'
          };
        }
      } catch (err) {
        console.warn('[TwilioAdapter] Failed to dispatch Twilio SMS:', err);
      }
    }

    return {
      messageId,
      status: 'sent',
      provider: 'twilio'
    };
  }

  verifyWebhookSignature(req: Request): boolean {
    const twilioHeader = req.headers['x-twilio-signature'] as string;
    if (!ENV.TELEPHONY_AUTH_TOKEN || !twilioHeader) {
      return true;
    }
    const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    const params = req.body || {};
    let data = fullUrl;
    Object.keys(params)
      .sort()
      .forEach((key) => {
        data += key + params[key];
      });

    const signature = crypto
      .createHmac('sha1', ENV.TELEPHONY_AUTH_TOKEN)
      .update(data)
      .digest('base64');

    return signature === twilioHeader;
  }

  formatResponse(actions: TelephonyAction[], res: Response): any {
    res.setHeader('Content-Type', 'text/xml');

    let twiml = '<?xml version="1.0" encoding="UTF-8"?>\n<Response>\n';

    for (const a of actions) {
      switch (a.type) {
        case 'gather':
          twiml += `  <Gather action="${a.actionUrl || '/api/v1/ivr/dtmf'}" method="POST" numDigits="${a.maxDigits || 1}" timeout="${a.timeoutSeconds || 5}" finishOnKey="${a.finishOnKey || '#'}" bargeIn="${a.bargeIn !== false}">\n`;
          if (a.promptUrl) {
            twiml += `    <Play>${escapeXml(a.promptUrl)}</Play>\n`;
          } else if (a.text) {
            twiml += `    <Say language="${mapLangToTwilio(a.lang)}">${escapeXml(a.text)}</Say>\n`;
          }
          twiml += `  </Gather>\n`;
          break;

        case 'play':
          if (a.promptUrl) {
            twiml += `  <Play>${escapeXml(a.promptUrl)}</Play>\n`;
          } else if (a.text) {
            twiml += `  <Say language="${mapLangToTwilio(a.lang)}">${escapeXml(a.text)}</Say>\n`;
          }
          break;

        case 'record':
          twiml += `  <Record action="${a.actionUrl || '/api/v1/ivr/recording'}" method="POST" maxLength="${a.maxLengthSeconds || 45}" playBeep="${a.playBeep !== false}" finishOnKey="${a.finishOnKey || '#'}" timeout="${a.timeoutSeconds || 5}"/>\n`;
          break;

        case 'dial':
          twiml += `  <Dial callerId="${a.callerId || ENV.IVR_INBOUND_NUMBER}" timeout="${a.timeoutSeconds || 30}">${escapeXml(a.dialNumber || '')}</Dial>\n`;
          break;

        case 'hangup':
          twiml += `  <Hangup/>\n`;
          break;

        default:
          break;
      }
    }

    twiml += '</Response>';
    return res.status(200).send(twiml);
  }
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function mapLangToTwilio(lang?: string): string {
  switch (lang) {
    case 'hi': return 'hi-IN';
    case 'mr': return 'mr-IN';
    case 'ta': return 'ta-IN';
    case 'te': return 'te-IN';
    case 'kn': return 'kn-IN';
    case 'ml': return 'ml-IN';
    case 'bn': return 'bn-IN';
    case 'gu': return 'gu-IN';
    case 'ur': return 'ur-IN';
    default: return 'en-IN';
  }
}
