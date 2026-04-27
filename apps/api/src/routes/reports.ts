import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { reportsService } from '../services/reports.service.js';

const uuidSchema = z.string().uuid();

export const reportsRouter = Router();

reportsRouter.get('/', asyncHandler(async (req, res) => {
  const client_id = z.string().uuid().parse(req.query.client_id);
  res.json(await reportsService.listByClient(client_id));
}));

reportsRouter.get('/:id', asyncHandler(async (req, res) => {
  res.json(await reportsService.get(uuidSchema.parse(req.params.id)));
}));

reportsRouter.post('/', asyncHandler(async (req, res) => {
  res.status(201).json(await reportsService.create(req.body));
}));

reportsRouter.patch('/:id/deliver', asyncHandler(async (req, res) => {
  const id = uuidSchema.parse(req.params.id);
  const { storage_path } = z.object({ storage_path: z.string() }).parse(req.body);
  res.json(await reportsService.markDelivered(id, storage_path));
}));
