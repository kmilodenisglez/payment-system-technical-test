import { Type } from '@sinclair/typebox';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { UsersRepository } from '../users/users.repository';
import { CardsRepository } from './cards.repository';
import { CardsService } from './cards.service';
import {
  CreateCardBody,
  CardIdParam,
  ListCardsByUserQuery,
  CardResponse,
  ErrorResponse,
} from './cards.schema';

const cardsRepo = new CardsRepository();
const usersRepo = new UsersRepository();
const service = new CardsService(cardsRepo, usersRepo);

export const cardsRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  // ── POST /api/v1/cards ────────────────────────────────────────────────────
  fastify.post('/', {
    schema: {
      summary: 'Register a credit card',
      description:
        'Associates a fictitious card with an existing user. ' +
        'Only the last 4 digits are stored — never the full card number (PCI-DSS principle).',
      tags: ['Cards'],
      body: CreateCardBody,
      response: {
        201: CardResponse,
        404: ErrorResponse,
      },
    },
  }, async (request, reply) => {
    const card = await service.registerCard(request.body);
    return reply.code(201).send(card);
  });

  // ── GET /api/v1/cards?userId=:userId ──────────────────────────────────────
  fastify.get('/', {
    schema: {
      summary: "List a user's cards",
      description: 'Returns all cards registered for the given user.',
      tags: ['Cards'],
      querystring: ListCardsByUserQuery,
      response: {
        200: Type.Array(CardResponse),
        404: ErrorResponse,
      },
    },
  }, async (request, reply) => {
    const cards = await service.listCardsByUser(request.query.userId);
    return reply.send(cards);
  });

  // ── GET /api/v1/cards/:id ─────────────────────────────────────────────────
  fastify.get('/:id', {
    schema: {
      summary: 'Get a card by ID',
      tags: ['Cards'],
      params: CardIdParam,
      response: {
        200: CardResponse,
        404: ErrorResponse,
      },
    },
  }, async (request, reply) => {
    const card = await service.getCardById(request.params.id);
    return reply.send(card);
  });
};
