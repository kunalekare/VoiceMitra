import { Response } from 'express';

interface SseClient {
  id: string;
  userId?: string;
  role?: string;
  res: Response;
}

class SseManager {
  private clients: Map<string, SseClient> = new Map();

  public addClient(id: string, res: Response, userId?: string, role?: string): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const client: SseClient = { id, userId, role, res };
    this.clients.set(id, client);

    // Send connection established event
    this.sendToClient(id, 'connected', { clientId: id, timestamp: Date.now() });

    // Handle client disconnect
    res.on('close', () => {
      this.clients.delete(id);
    });
  }

  public removeClient(id: string): void {
    const client = this.clients.get(id);
    if (client) {
      try {
        client.res.end();
      } catch {}
      this.clients.delete(id);
    }
  }

  public broadcast(event: string, data: unknown): void {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const [, client] of this.clients) {
      try {
        client.res.write(payload);
      } catch (err) {
        console.error('SSE broadcast error:', err);
      }
    }
  }

  public sendToUser(userId: string, event: string, data: unknown): void {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const [, client] of this.clients) {
      if (client.userId === userId) {
        try {
          client.res.write(payload);
        } catch (err) {
          console.error('SSE sendToUser error:', err);
        }
      }
    }
  }

  public sendToRole(role: string, event: string, data: unknown): void {
    const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const [, client] of this.clients) {
      if (client.role === role) {
        try {
          client.res.write(payload);
        } catch (err) {
          console.error('SSE sendToRole error:', err);
        }
      }
    }
  }

  public sendToClient(id: string, event: string, data: unknown): void {
    const client = this.clients.get(id);
    if (client) {
      try {
        client.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      } catch (err) {
        console.error('SSE sendToClient error:', err);
      }
    }
  }

  public getConnectedCount(): number {
    return this.clients.size;
  }
}

export const sseManager = new SseManager();
