import { Router } from 'express';
import { alertsRouter } from './alerts.js';
import { clientsRouter } from './clients.js';
import { dataSourcesRouter } from './data_sources.js';
import { dmiScoresRouter } from './dmi_scores.js';
import { engineRouter } from './engine.js';
import { reportsRouter } from './reports.js';
import { scanResultsRouter } from './scan_results.js';
import { scansRouter } from './scans.js';

export const apiRouter = Router();

// Health check
apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'mizan-api', timestamp: new Date().toISOString() });
});

// Resource routes
apiRouter.use('/clients', clientsRouter);
apiRouter.use('/scans', scansRouter);
apiRouter.use('/data-sources', dataSourcesRouter);
apiRouter.use('/scan-results', scanResultsRouter);
apiRouter.use('/dmi-scores', dmiScoresRouter);
apiRouter.use('/reports', reportsRouter);
apiRouter.use('/alerts', alertsRouter);
apiRouter.use('/engine', engineRouter);
