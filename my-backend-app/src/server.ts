import { createApp } from './app';
import { config } from './config';
import { createLogger } from './utils/logger';

const logger = createLogger('server', config.logLevel);

const app = createApp();

const server = app.listen(config.port, config.host, () => {
  logger.info('API server listening', {
    url: `http://${config.host}:${config.port}`,
    env: config.env,
  });
});

// Graceful shutdown so in-flight requests finish before exit.
function shutdown(signal: string): void {
  logger.info(`Received ${signal}, shutting down gracefully…`);
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
  // Force-exit if connections refuse to drain.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
