import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { dataSourcesService } from '../services/data_sources.service.js';

const uuidSchema = z.string().uuid();

const createSchema = z.object({
  client_id: z.string().uuid(),
  name: z.string().min(1),
  kind: z.enum(['postgres', 'mysql', 'mssql', 'oracle', 'sap_hana', 'excel', 'csv']),
  connection_config: z.record(z.unknown()).optional(),
  secret_ref: z.string().optional(),
});

export const dataSourcesRouter = Router();

dataSourcesRouter.get('/', asyncHandler(async (req, res) => {
  const client_id = req.query.client_id as string | undefined;
  res.json(await dataSourcesService.list(client_id));
}));

dataSourcesRouter.get('/:id', asyncHandler(async (req, res) => {
  res.json(await dataSourcesService.get(uuidSchema.parse(req.params.id)));
}));

dataSourcesRouter.post('/', asyncHandler(async (req, res) => {
  res.status(201).json(await dataSourcesService.create(createSchema.parse(req.body)));
}));

dataSourcesRouter.patch('/:id', asyncHandler(async (req, res) => {
  const id = uuidSchema.parse(req.params.id);
  res.json(await dataSourcesService.update(id, req.body));
}));

dataSourcesRouter.delete('/:id', asyncHandler(async (req, res) => {
  await dataSourcesService.remove(uuidSchema.parse(req.params.id));
  res.status(204).end();
}));
