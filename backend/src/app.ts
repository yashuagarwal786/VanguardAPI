import express from 'express';
import { targetsRouter } from './api/routes/targets.js';
import { scansRouter } from './api/routes/scans.js';
import { findingsRouter } from './api/routes/findings.js';
import { healthRouter } from './api/routes/health.js';
import { demoRouter } from './api/routes/demo.js';
import { syncRouter } from './api/routes/sync.js';

export const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use('/api/health', healthRouter);
app.use('/api/targets', targetsRouter);
app.use('/api/scans', scansRouter);
app.use('/api/findings', findingsRouter);
app.use('/api/demo', demoRouter);
app.use('/api/sync', syncRouter);
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => { console.error(JSON.stringify({ event: 'http_error', message: error instanceof Error ? error.message : 'Unknown error' })); res.status(500).json({ error: 'Internal server error' }); });
