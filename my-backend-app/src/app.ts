import cors from 'cors';
import express, { Express } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { config } from './config';
import { landingPage } from './controllers/landing';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { createApiRouter } from './routes';

/**
 * Application factory: builds the Express app without binding a port,
 * which keeps it trivially testable and reusable.
 */
export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  // Security hardening.
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigin }));
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: config.rateLimitMax,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  // Body parsing with a small payload cap (DoS mitigation).
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: false, limit: '10kb' }));

  // Browser landing page + API routes + unified error handling.
  app.get('/', (_req, res) => {
    res.type('html').send(landingPage);
  });
  app.use('/api', createApiRouter());
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
