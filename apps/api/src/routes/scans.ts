import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { scansService } from '../services/scans.service.js';

const createSchema = z.object({
  client_id: z.string().uuid(),
  data_source_id: z.string().uuid(),
  stage: z.enum(['scan', 'monitor', 'govern']).optional(),
  config: z.record(z.unknown()).optional(),
});

const updateSchema = z.object({
  status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']).optional(),
  started_at: z.string().datetime().nullable().optional(),
  completed_at: z.string().datetime().nullable().optional(),
  error_message: z.string().nullable().optional(),
  config: z.record(z.unknown()).optional(),
});

const uuidSchema = z.string().uuid();
const listQuerySchema = z.object({ client_id: z.string().uuid().optional() });

export const scansRouter = Router();

scansRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const filters = listQuerySchema.parse(req.query);
    res.json(await scansService.list(filters));
  }),
);

scansRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = uuidSchema.parse(req.params.id);
    res.json(await scansService.get(id));
  }),
);

scansRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const input = createSchema.parse(req.body);
    res.status(201).json(await scansService.create(input));
  }),
);

scansRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = uuidSchema.parse(req.params.id);
    const input = updateSchema.parse(req.body);
    res.json(await scansService.update(id, input));
  }),
);

scansRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = uuidSchema.parse(req.params.id);
    await scansService.remove(id);
    res.status(204).end();
  }),
);
