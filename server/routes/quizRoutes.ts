import { Router, Request, Response } from 'express';
import { getQuizForSkill, submitQuizAnswers } from '../services/quizService';
import { sendSuccess, sendError } from '../utils/response';

export const quizRouter = Router();

// Get 5 questions for skill
quizRouter.get('/:skill', (req: Request, res: Response) => {
  try {
    const questions = getQuizForSkill(req.params.skill);
    return sendSuccess(req, res, { skill: req.params.skill, questions });
  } catch (err: any) {
    return sendError(req, res, 'FETCH_QUIZ_FAILED', err.message, 500);
  }
});

// Submit Quiz Answers
quizRouter.post('/submit', (req: Request, res: Response) => {
  try {
    const { workerId, skill, answers } = req.body;
    if (!workerId || !skill || !Array.isArray(answers)) {
      return sendError(req, res, 'INVALID_PAYLOAD', 'workerId, skill, and answers array required', 400);
    }

    const result = submitQuizAnswers({ workerId, skill, answers });
    return sendSuccess(req, res, result);
  } catch (err: any) {
    return sendError(req, res, 'QUIZ_SUBMIT_FAILED', err.message, 400);
  }
});
