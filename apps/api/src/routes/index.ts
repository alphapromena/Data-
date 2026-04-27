import { Router } from 'express';
import { clientsRouter } from './clients.js';
import { scansRouter } from './scans.js';

export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'mizan-api', timestamp: new Date().toISOString() });
});

apiRouter.use('/clients', clientsRouter);
apiRouter.use('/scans', scansRouter);
