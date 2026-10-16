import { Request, Response } from 'express';

export type TelephonyActionType =
  | 'play'
  | 'gather'
  | 'record'
  | 'hangup'
  | 'dial'
  | 'say'
  | 'pause';

export interface TelephonyAction {
  type: TelephonyActionType;
  promptUrl?: string;
  text?: string;
  lang?: string;
  maxDigits?: number;
  finishOnKey?: string;
  timeoutSeconds?: number;
  actionUrl?: string;
  maxLengthSeconds?: number;
  playBeep?: boolean;
  dialNumber?: string;
  callerId?: string;
  reason?: string;
  bargeIn?: boolean;
}

export interface OutboundCallResult {
  callId: string;
  status: 'queued' | 'initiated' | 'failed';
  provider: string;
}

export interface SmsResult {
  messageId: string;
  status: 'sent' | 'queued' | 'failed';
  provider: string;
}

export interface TelephonyProvider {
  name: string;
  
  answerCall(callId: string): Promise<void>;
  
  playPrompt(
    callId: string,
    promptUrl: string,
    textFallback?: string,
    lang?: string
  ): TelephonyAction;

  collectDtmf(options: {
    numDigits?: number;
    timeoutSeconds?: number;
    finishOnKey?: string;
    actionUrl?: string;
    promptUrl?: string;
    textFallback?: string;
    lang?: string;
    bargeIn?: boolean;
  }): TelephonyAction;

  recordAudio(options: {
    maxLengthSeconds?: number;
    playBeep?: boolean;
    finishOnKey?: string;
    actionUrl?: string;
    timeoutSeconds?: number;
  }): TelephonyAction;

  hangup(reason?: string): TelephonyAction;

  transfer(
    destinationNumber: string,
    options?: { callerId?: string; timeoutSeconds?: number }
  ): TelephonyAction;

  makeOutboundCall(
    toNumber: string,
    fromNumber: string,
    callbackUrl: string,
    options?: Record<string, unknown>
  ): Promise<OutboundCallResult>;

  sendSms(
    toNumber: string,
    message: string,
    dltTemplateId?: string
  ): Promise<SmsResult>;

  verifyWebhookSignature(req: Request): boolean;

  formatResponse(actions: TelephonyAction[], res: Response): any;
}
