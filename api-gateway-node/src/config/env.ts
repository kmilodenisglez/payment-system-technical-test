/**
 * Environment configuration with runtime validation.
 * The process exits immediately if any required variable is missing or invalid,
 * preventing the app from starting in a broken state.
 */

type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';
type NodeEnv = 'development' | 'production' | 'test';

const LOG_LEVELS: LogLevel[] = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'];
const NODE_ENVS: NodeEnv[] = ['development', 'production', 'test'];

function requireString(key: string): string {
  const value = process.env[key];
  if (!value) {
    console.error(`[env] Missing required environment variable: ${key}`);
    process.exit(1);
  }
  return value;
}

function optionalString(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

function optionalInt(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) return fallback;
  const parsed = parseInt(raw, 10);
  if (isNaN(parsed)) {
    console.error(`[env] ${key} must be an integer, received: "${raw}"`);
    process.exit(1);
  }
  return parsed;
}

const rawLogLevel = optionalString('LOG_LEVEL', 'info');
if (!LOG_LEVELS.includes(rawLogLevel as LogLevel)) {
  console.error(`[env] LOG_LEVEL must be one of: ${LOG_LEVELS.join(', ')}`);
  process.exit(1);
}

const rawNodeEnv = optionalString('NODE_ENV', 'development');
if (!NODE_ENVS.includes(rawNodeEnv as NodeEnv)) {
  console.error(`[env] NODE_ENV must be one of: ${NODE_ENVS.join(', ')}`);
  process.exit(1);
}

export const env = {
  NODE_ENV: rawNodeEnv as NodeEnv,
  PORT: optionalInt('PORT', 3000),
  HOST: optionalString('HOST', '0.0.0.0'),
  DATABASE_URL: requireString('DATABASE_URL'),
  PYTHON_SERVICE_URL: optionalString('PYTHON_SERVICE_URL', 'http://localhost:5000'),
  LOG_LEVEL: rawLogLevel as LogLevel,
} as const;
