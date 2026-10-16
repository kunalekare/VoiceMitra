import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Check if TS execution loader (tsx) is already active
const isTsxActive =
  process.env.__TSX_BOOTSTRAPPED === 'true' ||
  (Array.isArray(process.execArgv) && process.execArgv.some((arg) => arg.includes('tsx'))) ||
  Boolean((process as any).versions?.tsx);

if (!isTsxActive) {
  // When executed via `node server.ts` (e.g. Cloud Run production `npm start`),
  // spawn using tsx loader so TypeScript and extensionless module imports work in production.
  const currentFile = fileURLToPath(import.meta.url);
  const child = spawn(
    process.execPath,
    ['--import', 'tsx', currentFile, ...process.argv.slice(2)],
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        __TSX_BOOTSTRAPPED: 'true'
      }
    }
  );

  const forwardSignal = (signal: NodeJS.Signals) => {
    try {
      child.kill(signal);
    } catch (_) {}
  };

  process.on('SIGINT', () => forwardSignal('SIGINT'));
  process.on('SIGTERM', () => forwardSignal('SIGTERM'));

  child.on('exit', (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
    } else {
      process.exit(code ?? 0);
    }
  });
} else {
  // tsx is active: run the application server
  await startServer();
}

async function startServer() {
  const express = (await import('express')).default;
  const { createServer: createViteServer } = await import('vite');
  const path = (await import('node:path')).default;
  const fs = (await import('node:fs')).default;
  const { fileURLToPath } = await import('node:url');
  const cookieParser = (await import('cookie-parser')).default;
  const cors = (await import('cors')).default;
  const helmet = (await import('helmet')).default;
  const dotenv = (await import('dotenv')).default;

  const { runMigrations } = await import('./server/models/migrations');
  const { requestLogger } = await import('./server/middleware/logger');
  const { standardLimiter } = await import('./server/middleware/rateLimit');
  const { sendSuccess, sendError } = await import('./server/utils/response');

  // Import API Routers
  const { authRouter } = await import('./server/routes/authRoutes');
  const { workerRouter } = await import('./server/routes/workerRoutes');
  const { jobRouter } = await import('./server/routes/jobRoutes');
  const { paymentRouter } = await import('./server/routes/paymentRoutes');
  const { kycRouter } = await import('./server/routes/kycRoutes');
  const { quizRouter } = await import('./server/routes/quizRoutes');
  const { disputeRouter } = await import('./server/routes/disputeRoutes');
  const { adminRouter } = await import('./server/routes/adminRoutes');
  const { webhookRouter } = await import('./server/routes/webhookRoutes');
  const { eventRouter } = await import('./server/routes/eventRoutes');
  const { developerRouter } = await import('./server/routes/developerRoutes');
  const { ivrRouter } = await import('./server/routes/ivrRoutes');

  // Direct Gemini Services for backward compatibility
  const { processVoiceRegistration, processVoiceJobMatch, generateWorkerSummary } = await import('./server/services/geminiService');
  const { getQuizForSkill } = await import('./server/services/quizService');

  dotenv.config();

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // In Cloud Run / AI Studio container, Nginx reverse proxy listens on 8080 and proxies to 3000.
  // Node.js must always listen on port 3000 (DEFAULT_APP_PORT) to avoid EADDRINUSE with Nginx.
  const portArgIdx = process.argv.indexOf('--port');
  const cliPort = portArgIdx !== -1 && process.argv[portArgIdx + 1] ? Number(process.argv[portArgIdx + 1]) : null;
  const PORT = cliPort || Number(process.env.DEFAULT_APP_PORT) || 3000;

  const app = express();

  // Trust reverse proxy (Google Cloud Run / AI Studio preview environment)
  app.set('trust proxy', true);

  // Security Headers with Helmet
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false
    })
  );

  // CORS configuration
  app.use(
    cors({
      origin: (origin, callback) => {
        callback(null, true);
      },
      credentials: true
    })
  );

  app.use(cookieParser());
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));
  app.use(requestLogger);

  // Health & Readiness Endpoints (used by Cloud Run startup and liveness probes)
  app.get('/health', (req, res) => {
    return sendSuccess(req, res, { status: 'healthy', uptime: process.uptime() });
  });

  app.get('/ready', (req, res) => {
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
  app.post('/api/gemini/voice-registration', async (req, res) => {
    try {
      const { audioBase64, mimeType, textInput, languageCode } = req.body;
      const result = await processVoiceRegistration(audioBase64, mimeType, textInput, languageCode);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/gemini/voice-job-match', async (req, res) => {
    try {
      const { audioBase64, textInput } = req.body;
      const result = await processVoiceJobMatch(audioBase64, textInput);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/gemini/worker-summary', async (req, res) => {
    try {
      const result = await generateWorkerSummary(req.body);
      return res.json(result);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/gemini/skill-quiz', async (req, res) => {
    try {
      const questions = getQuizForSkill(req.body.skillName || 'Electrician');
      return res.json({ skill: req.body.skillName || 'Electrician', questions });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  });

  // Centralized API Error Handling Middleware
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Unhandled Server Error:', err);
    if (res.headersSent) {
      return next(err);
    }
    return sendError(req, res, 'INTERNAL_SERVER_ERROR', err.message || 'An unexpected error occurred', 500);
  });

  try {
    // 1. Initialize SQLite Database & Seed
    await runMigrations();

    // 2. Setup Vite or Static File Delivery
    const distPath = path.resolve(__dirname, 'dist');
    const distExists = fs.existsSync(path.resolve(distPath, 'index.html'));
    const isExplicitDev = process.env.npm_lifecycle_event === 'dev';
    const isDev = isExplicitDev || (!distExists && process.env.NODE_ENV !== 'production');

    if (isDev) {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa'
      });
      app.use(vite.middlewares);
    } else {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        const indexPath = path.resolve(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          res.status(200).send('SkillBridge API server running.');
        }
      });
    }

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 SkillBridge Server running on http://0.0.0.0:${PORT} (mode: ${isDev ? 'dev' : 'production'})`);
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
