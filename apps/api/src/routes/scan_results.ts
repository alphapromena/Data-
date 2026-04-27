import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { scanResultsService } from '../services/scan_results.service.js';

const uuidSchema = z.string().uuid();

export const scanResultsRouter = Router();

scanResultsRouter.get('/', asyncHandler(async (req, res) => {
  const scan_id = z.string().uuid().parse(req.query.scan_id);
  res.json(await scanResultsService.listByScan(scan_id));
}));

scanResultsRouter.get('/:id', asyncHandler(async (req, res) => {
  res.json(await scanResultsService.get(uuidSchema.parse(req.params.id)));
}));

scanResultsRouter.post('/', asyncHandler(async (req, res) => {
  res.status(201).json(await scanResultsService.create(req.body));
}));
