import { Router, Request, Response } from 'express';
import { sseManager } from '../utils/sse';

export const eventRouter = Router();

eventRouter.get('/', (req: Request, res: Response) => {
  const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const userId = req.query.userId as string | undefined;
  const role = req.query.role as string | undefined;

  sseManager.addClient(clientId, res, userId, role);

  // Send periodic keepalive heartbeat every 25 seconds
  const heartbeatTimer = setInterval(() => {
    try {
      res.write(': keepalive\n\n');
    } catch {
      clearInterval(heartbeatTimer);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeatTimer);
    sseManager.removeClient(clientId);
  });
});
