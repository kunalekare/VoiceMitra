import { Request, Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId: string;
  timestamp: string;
}

export function sendSuccess<T>(req: Request, res: Response, data: T, statusCode = 200): Response {
  const requestId = (req.headers['x-request-id'] as string) || `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const body: ApiResponse<T> = {
    success: true,
    data,
    requestId,
    timestamp: new Date().toISOString()
  };
  return res.status(statusCode).json(body);
}

export function sendError(
  req: Request,
  res: Response,
  code: string,
  message: string,
  statusCode = 400,
  details?: unknown
): Response {
  const requestId = (req.headers['x-request-id'] as string) || `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const body: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      details
    },
    requestId,
    timestamp: new Date().toISOString()
  };
  return res.status(statusCode).json(body);
}
