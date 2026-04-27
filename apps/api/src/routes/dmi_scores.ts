import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { dmiScoresService } from '../services/dmi_scores.service.js';

const uuidSchema = z.string().uuid();

export const dmiScoresRouter = Router();

dmiScoresRouter.get('/', asyncHandler(async (req, res) => {
  const client_id = z.string().uuid().parse(req.query.client_id);
  res.json(await dmiScoresService.listByClient(client_id));
}));

dmiScoresRouter.get('/scan/:scan_id', asyncHandler(async (req, res) => {
  res.json(await dmiScoresService.getByScan(uuidSchema.parse(req.params.scan_id)));
}));

dmiScoresRouter.post('/', asyncHandler(async (req, res) => {
  res.status(201).json(await dmiScoresService.create(req.body));
}));
