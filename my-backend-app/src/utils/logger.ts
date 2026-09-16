import { LogLevel } from '../config';

/**
 * Minimal structured (JSON lines) logger.
 * Writes to stdout/stderr only — no third-party logging dependency needed,
 * and every log line is machine-parseable in production log aggregators.
 */
const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export class Logger {
  constructor(
    private readonly context: string,
    private readonly threshold: LogLevel = 'info',
  ) {}

  debug(message: string, meta?: Record<string, unknown>): void {
    this.write('debug', message, meta);
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.write('info', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.write('warn', message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.write('error', message, meta);
  }

  private write(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    if (LEVEL_WEIGHT[level] < LEVEL_WEIGHT[this.threshold]) {
      return;
    }
    const line = JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      context: this.context,
      message,
      ...meta,
    });
    if (level === 'warn' || level === 'error') {
      process.stderr.write(`${line}\n`);
    } else {
      process.stdout.write(`${line}\n`);
    }
  }
}

export function createLogger(context: string, threshold: LogLevel = 'info'): Logger {
  return new Logger(context, threshold);
}
