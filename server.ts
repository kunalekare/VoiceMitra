import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import { ENV } from './server/config/env';
import { runMigrations } from './server/models/migrations';
import { requestLogger } from './server/middleware/logger';
import { standardLimiter } from './server/middleware/rateLimit';
import { sendSuccess, sendError } from './server/utils/response';

// Import API Routers
import { authRouter } from './server/routes/authRoutes';
import { workerRouter } from './server/routes/workerRoutes';
import { jobRouter } from './server/routes/jobRoutes';
import { paymentRouter } from './server/routes/paymentRoutes';
import { kycRouter } from './server/routes/kycRoutes';
import { quizRouter } from './server/routes/quizRoutes';
import { disputeRouter } from './server/routes/disputeRoutes';
import { adminRouter } from './server/routes/adminRoutes';
import { webhookRouter } from './server/routes/webhookRoutes';
import { eventRouter } from './server/routes/eventRoutes';
import { developerRouter } from './server/routes/developerRoutes';
import { ivrRouter } from './server/routes/ivrRoutes';

// Direct Gemini Services for backward compatibility
import { processVoiceRegistration, processVoiceJobMatch, generateWorkerSummary } from './server/services/geminiService';
import { getQuizForSkill } from './server/services/quizService';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Trust reverse proxy (Google Cloud Run / AI Studio preview environment)
app.set('trust proxy', true);

// Security Headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Allow Vite and Leaflet assets in dev iframe
    crossOriginEmbedderPolicy: false
  })
);

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow local development and AI Studio domains
      callback(null, true);
    },
    credentials: true
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(requestLogger);

// Health & Readiness Endpoints
app.get('/health', (req: Request, res: Response) => {
  return sendSuccess(req, res, { status: 'healthy', uptime: process.uptime() });
});

app.get('/ready', (req: Request, res: Response) => {
  return sendSuccess(req, res, { status: 'ready', database: 'sqlite_connected' });
});

// Versioned API v1 Router
const apiV1 = express.Router();
apiV1.use(standardLimiter);

apiV1.use('/auth', authRouter);
apiV1.use('/users', authRouter);
apiV1.use('/workers', workerRouter);
apiV1.use('/jobs', jobRouter);
apiV1.use('/payments', paymentRouter);
apiV1.use('/kyc', kycRouter);
apiV1.use('/quiz', quizRouter);
apiV1.use('/disputes', disputeRouter);
apiV1.use('/admin', adminRouter);
apiV1.use('/webhooks', webhookRouter);
apiV1.use('/events', eventRouter);
apiV1.use('/developer', developerRouter);
apiV1.use('/ivr', ivrRouter);

app.use('/api/v1', apiV1);

// Backward Compatibility Routes for `/api/gemini/*`
app.post('/api/gemini/voice-registration', async (req: Request, res: Response) => {
  try {
    const { audioBase64, mimeType, textInput, languageCode } = req.body;
    const result = await processVoiceRegistration(audioBase64, mimeType, textInput, languageCode);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/gemini/voice-job-match', async (req: Request, res: Response) => {
  try {
    const { audioBase64, textInput } = req.body;
    const result = await processVoiceJobMatch(audioBase64, textInput);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/gemini/worker-summary', async (req: Request, res: Response) => {
  try {
    const result = await generateWorkerSummary(req.body);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/gemini/skill-quiz', async (req: Request, res: Response) => {
  try {
    const questions = getQuizForSkill(req.body.skillName || 'Electrician');
    return res.json({ skill: req.body.skillName || 'Electrician', questions });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Centralized API Error Handling Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  if (res.headersSent) {
    return next(err);
  }
  return sendError(req, res, 'INTERNAL_SERVER_ERROR', err.message || 'An unexpected error occurred', 500);
});

// Start Server & Initialize Database
async function startServer() {
  try {
    // 1. Initialize SQLite Database & Seed
    await runMigrations();

    // 2. Setup Vite or Static File Delivery
    const isDev = process.env.NODE_ENV !== 'production';

    if (isDev) {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa'
      });
      app.use(vite.middlewares);
    } else {
      app.use(express.static(path.resolve(__dirname, 'dist')));
      app.get('*', (req: Request, res: Response) => {
        res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
      });
    }

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 SkillBridge Production Server running on http://0.0.0.0:${PORT}`);
    });

    // Graceful Shutdown
    const shutdown = () => {
      console.log('Shutting down SkillBridge server gracefully...');
      server.close(() => {
        console.log('Server terminated cleanly.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (err) {
    console.error('Failed to initialize SkillBridge server:', err);
    process.exit(1);
  }
}

startServer();
