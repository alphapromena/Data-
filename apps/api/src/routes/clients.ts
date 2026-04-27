import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { clientsService } from '../services/clients.service.js';

const createSchema = z.object({
  name_en: z.string().min(1),
  name_ar: z.string().min(1),
  industry: z.string().optional(),
  country_code: z.string().length(2).optional(),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().optional(),
  stage: z.enum(['scan', 'monitor', 'govern']).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const updateSchema = createSchema.partial().extend({ is_active: z.boolean().optional() });
const uuidSchema = z.string().uuid();

export const clientsRouter = Router();

clientsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    res.json(await clientsService.list());
  }),
);

clientsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = uuidSchema.parse(req.params.id);
    res.json(await clientsService.get(id));
  }),
);

clientsRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const input = createSchema.parse(req.body);
    res.status(201).json(await clientsService.create(input));
  }),
);

clientsRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = uuidSchema.parse(req.params.id);
    const input = updateSchema.parse(req.body);
    res.json(await clientsService.update(id, input));
  }),
);

clientsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = uuidSchema.parse(req.params.id);
    await clientsService.remove(id);
    res.status(204).end();
  }),
);
