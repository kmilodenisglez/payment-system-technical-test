import { FastifyInstance, FastifyError } from 'fastify';
import { AppError } from '../shared/errors/AppError';

/**
 * Centralised error handler for all Fastify routes.
 *
 * Priority:
 *   1. Application errors (AppError) → structured JSON with the correct HTTP status.
 *   2. Fastify schema validation errors → 400 with field-level details.
 *   3. Fastify native HTTP errors (e.g. route not found) → pass status code through.
 *   4. Unexpected errors → 500 Internal Server Error.
 */
export function registerErrorHandler(fastify: FastifyInstance): void {
  fastify.setErrorHandler((error: FastifyError, request, reply) => {
    request.log.error({ err: error }, 'Request error');

    // 1. Known application errors
    if (error instanceof AppError) {
      return reply.code(error.statusCode).send({
        error: error.code,
        message: error.message,
        statusCode: error.statusCode,
      });
    }

    // 2. Fastify input validation errors (TypeBox / JSON Schema)
    if (error.validation) {
      return reply.code(400).send({
        error: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        statusCode: 400,
        details: error.validation,
      });
    }

    // 3. Fastify native HTTP errors (404, 405, etc.)
    if (error.statusCode) {
      return reply.code(error.statusCode).send({
        error: error.code ?? 'HTTP_ERROR',
        message: error.message,
        statusCode: error.statusCode,
      });
    }

    // 4. Unexpected errors — never leak internal details in production
    return reply.code(500).send({
      error: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      statusCode: 500,
    });
  });
}
