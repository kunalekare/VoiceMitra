import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { searchWorkers, getWorkerById, registerWorkerVoice } from '../services/workerService';
import { generateWorkerSummary } from '../services/geminiService';
import { sendSuccess, sendError } from '../utils/response';
import { db } from '../config/database';
import { aiLimiter } from '../middleware/rateLimit';

export const workerRouter = Router();

// Search and rank workers
workerRouter.get('/search', (req: Request, res: Response) => {
  try {
    const filters = {
      query: req.query.query as string,
      skill: req.query.skill as string,
      district: req.query.district as string,
      state: req.query.state as string,
      minRating: req.query.minRating ? parseFloat(req.query.minRating as string) : undefined,
      verifiedOnly: req.query.verifiedOnly === 'true',
      availableOnly: req.query.availableOnly === 'true',
      lat: req.query.lat ? parseFloat(req.query.lat as string) : undefined,
      lng: req.query.lng ? parseFloat(req.query.lng as string) : undefined,
      radiusKm: req.query.radiusKm ? parseFloat(req.query.radiusKm as string) : undefined,
      page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 30
    };

    const results = searchWorkers(filters);
    return sendSuccess(req, res, results);
  } catch (err: any) {
    return sendError(req, res, 'SEARCH_FAILED', err.message, 500);
  }
});

// Get worker by ID
workerRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const worker = getWorkerById(req.params.id);
    if (!worker) {
      return sendError(req, res, 'WORKER_NOT_FOUND', 'Worker not found', 404);
    }
    return sendSuccess(req, res, worker);
  } catch (err: any) {
    return sendError(req, res, 'FETCH_WORKER_FAILED', err.message, 500);
  }
});

// Voice Registration
workerRouter.post('/voice-register', aiLimiter, async (req: Request, res: Response) => {
  try {
    const { audioBase64, mimeType, textInput, languageCode, overrideData, userId, phone } = req.body;
    const result = await registerWorkerVoice({
      userId,
      phone,
      audioBase64,
      mimeType,
      textInput,
      languageCode,
      overrideData
    });

    return sendSuccess(req, res, result);
  } catch (err: any) {
    return sendError(req, res, 'VOICE_REGISTRATION_FAILED', err.message, 500);
  }
});

// Worker LLM Summary
workerRouter.post('/summary', aiLimiter, async (req: Request, res: Response) => {
  try {
    const { name, skill, experienceYears, totalJobs, rating, badges, city } = req.body;
    const result = await generateWorkerSummary({
      name: name || 'Worker',
      skill: skill || 'Electrician',
      experienceYears: experienceYears || 5,
      totalJobs: totalJobs || 10,
      rating: rating || 4.8,
      badges: badges || [],
      city: city || 'Nagpur'
    });

    return sendSuccess(req, res, result);
  } catch (err: any) {
    return sendError(req, res, 'SUMMARY_FAILED', err.message, 500);
  }
});

// Toggle availability
workerRouter.patch('/:id/availability', (req: Request, res: Response) => {
  try {
    const { isAvailable } = req.body;
    db.run('UPDATE workers SET is_available = ? WHERE id = ?;', [isAvailable ? 1 : 0, req.params.id]);
    return sendSuccess(req, res, { isAvailable });
  } catch (err: any) {
    return sendError(req, res, 'UPDATE_FAILED', err.message, 500);
  }
});
