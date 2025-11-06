import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config/env.js';
import loansRouter from './v1/routes/loans.js';
import recommendationsRouter from './v1/routes/recommendations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = config.port;
const app = express();

app.use(helmet());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

const staticDir = path.join(__dirname, '../dist');
app.use(express.static(staticDir));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'credit-analytics-backend', timestamp: new Date().toISOString() });
});

app.use('/api/loans', loansRouter);
app.use('/api/refinance', recommendationsRouter);

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not Found' });
  }

  return res.sendFile(path.join(staticDir, 'index.html'));
});

app.use((err, _req, res, _next) => {
  console.error('[credit-analytics-backend] unhandled error', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

app.listen(PORT, () => {
  console.log(`Credit analytics backend listening on port ${PORT}`);
});
