import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { alertsService } from '../services/alerts.service.js';

const uuidSchema = z.string().uuid();

export const alertsRouter = Router();

alertsRouter.get('/', asyncHandler(async (req, res) => {
  const client_id = z.string().uuid().parse(req.query.client_id);
  const unacknowledged = req.query.unacknowledged === 'true';
  res.json(await alertsService.listByClient(client_id, unacknowledged));
}));

alertsRouter.get('/:id', asyncHandler(async (req, res) => {
  res.json(await alertsService.get(uuidSchema.parse(req.params.id)));
}));

alertsRouter.post('/', asyncHandler(async (req, res) => {
  res.status(201).json(await alertsService.create(req.body));
}));

alertsRouter.patch('/:id/acknowledge', asyncHandler(async (req, res) => {
  const id = uuidSchema.parse(req.params.id);
  const { user_id } = z.object({ user_id: z.string().uuid() }).parse(req.body);
  res.json(await alertsService.acknowledge(id, user_id));
}));
