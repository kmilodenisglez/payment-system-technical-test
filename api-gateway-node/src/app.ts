import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { env } from './config/env';
import { registerSwagger } from './plugins/swagger';
import { registerErrorHandler } from './plugins/errorHandler';
import { usersRoutes } from './modules/users/users.routes';
import { cardsRoutes } from './modules/cards/cards.routes';
import { paymentsRoutes } from './modules/payments/payments.routes';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      ...(env.NODE_ENV === 'development'
        ? {
            transport: {
              target: 'pino-pretty',
              options: { colorize: true, translateTime: 'SYS:standard' },
            },
          }
        : {}),
    },
  });

  // ── Security ──────────────────────────────────────────────────────────────
  await app.register(helmet, {
    // Disable default CSP so Swagger UI assets load correctly
    contentSecurityPolicy: false,
  });

  await app.register(cors, {
    // In production, restrict this to known origins
    origin: env.NODE_ENV === 'production' ? false : true,
  });

  // ── API documentation ─────────────────────────────────────────────────────
  await registerSwagger(app);

  // ── Centralised error handling ────────────────────────────────────────────
  registerErrorHandler(app);

  // ── Health check (no versioning prefix — useful for Docker health probes) ─
  app.get('/health', {
    schema: {
      summary: 'Health Check',
      description: 'Returns service liveness status.',
      tags: ['Health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            service: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  }, async () => ({
    status: 'ok',
    service: 'payment-api-gateway',
    timestamp: new Date().toISOString(),
  }));

  // ── Domain routes ─────────────────────────────────────────────────────────
  await app.register(usersRoutes, { prefix: '/api/v1/users' });
  await app.register(cardsRoutes, { prefix: '/api/v1/cards' });
  await app.register(paymentsRoutes, { prefix: '/api/v1/payments' });

  return app;
}
