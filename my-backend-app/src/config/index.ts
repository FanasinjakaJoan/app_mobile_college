import dotenv from 'dotenv';

// Load environment variables from `.env` before anything reads them.
dotenv.config({ quiet: true });

/**
 * Centralised, validated application configuration.
 * Every value comes from the environment (`.env` file or process env)
 * so no setting is ever hardcoded in the source code.
 */
export type Environment = 'development' | 'test' | 'production';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface AppConfig {
  /** TCP port the HTTP server listens on. */
  readonly port: number;
  /** Network interface the HTTP server binds to. */
  readonly host: string;
  /** Runtime environment. */
  readonly env: Environment;
  /** Origin allowed by CORS (`*` authorises every origin). */
  readonly corsOrigin: string;
  /** Maximum requests per 15 minute window per client IP. */
  readonly rateLimitMax: number;
  /** Minimum level emitted by the logger. */
  readonly logLevel: LogLevel;
}

const ENV_VALUES: readonly Environment[] = ['development', 'test', 'production'];
const LOG_LEVELS: readonly LogLevel[] = ['debug', 'info', 'warn', 'error'];

function parsePort(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw === '') {
    return fallback;
  }
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 65535) {
    throw new Error(`Invalid PORT value "${raw}": expected an integer between 0 and 65535.`);
  }
  return parsed;
}

function parseRateLimit(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw === '') {
    return fallback;
  }
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid RATE_LIMIT_MAX value "${raw}": expected a positive integer.`);
  }
  return parsed;
}

function parseEnum<T extends string>(raw: string | undefined, allowed: readonly T[], fallback: T): T {
  if (raw === undefined || raw === '') {
    return fallback;
  }
  const value = raw.toLowerCase() as T;
  if (!allowed.includes(value)) {
    throw new Error(`Invalid value "${raw}": expected one of ${allowed.join(', ')}.`);
  }
  return value;
}

export const config: AppConfig = Object.freeze({
  port: parsePort(process.env.PORT, 3000),
  host: process.env.HOST ?? '0.0.0.0',
  env: parseEnum(process.env.NODE_ENV, ENV_VALUES, 'development'),
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  rateLimitMax: parseRateLimit(process.env.RATE_LIMIT_MAX, 300),
  logLevel: parseEnum(process.env.LOG_LEVEL, LOG_LEVELS, 'info'),
});
