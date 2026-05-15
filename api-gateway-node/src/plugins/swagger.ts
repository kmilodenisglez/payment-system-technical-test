import { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { env } from '../config/env';

export async function registerSwagger(fastify: FastifyInstance): Promise<void> {
  await fastify.register(swagger, {
    openapi: {
      openapi: '3.0.3',
      info: {
        title: 'Payment System API',
        description:
          'REST API for managing users, credit cards, and payments.\n\n' +
          'All endpoints are under `/api/v1`. The Swagger UI is available at `/docs`.\n\n' +
          '**Note:** All card data is fictitious — no real financial information is stored.',
        version: '1.0.0',
        contact: {
          name: 'Payment System',
        },
      },
      servers: [
        { url: `http://localhost:${env.PORT}`, description: 'Local development' },
      ],
      tags: [
        { name: 'Health', description: 'Liveness probe' },
        { name: 'Users', description: 'User management' },
        { name: 'Cards', description: 'Credit card registration' },
        { name: 'Payments', description: 'Payment creation and history' },
      ],
    },
  });

  await fastify.register(swaggerUI, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
    staticCSP: true,
  });
}
