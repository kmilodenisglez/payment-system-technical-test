import { PrismaClient } from '@prisma/client';
import { env } from './env';

/**
 * Prisma client singleton.
 *
 * A global reference is kept in development so that hot-module reloads
 * (ts-node-dev) don't create a new connection pool on every restart.
 */
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const db: PrismaClient =
  globalThis.__prisma ??
  new PrismaClient({
    log:
      env.NODE_ENV === 'development'
        ? [{ emit: 'stdout', level: 'query' }, 'warn', 'error']
        : ['error'],
  });

if (env.NODE_ENV !== 'production') {
  globalThis.__prisma = db;
}
