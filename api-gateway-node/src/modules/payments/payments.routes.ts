import { Type } from '@sinclair/typebox';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { UsersRepository } from '../users/users.repository';
import { CardsRepository } from '../cards/cards.repository';
import { PaymentsRepository } from './payments.repository';
import { PaymentsService } from './payments.service';
import {
  CreatePaymentBody,
  ListPaymentsByUserQuery,
  PaymentResponse,
  ErrorResponse,
} from './payments.schema';

const paymentsRepo = new PaymentsRepository();
const usersRepo = new UsersRepository();
const cardsRepo = new CardsRepository();
const service = new PaymentsService(paymentsRepo, usersRepo, cardsRepo);

export const paymentsRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  // ── POST /api/v1/payments ─────────────────────────────────────────────────
  fastify.post('/', {
    schema: {
      summary: 'Create a payment',
      description:
        'Validates the user and card, calls the Python payment processor, ' +
        'and persists the result. Every transaction (approved or rejected) is recorded.',
      tags: ['Payments'],
      body: CreatePaymentBody,
      response: {
        201: PaymentResponse,
        404: ErrorResponse,
        502: ErrorResponse,
      },
    },
  }, async (request, reply) => {
    const payment = await service.createPayment(request.body);
    return reply.code(201).send(payment);
  });

  // ── GET /api/v1/payments?userId=:userId ───────────────────────────────────
  fastify.get('/', {
    schema: {
      summary: "List a user's payment history",
      description: 'Returns all payments for the given user, newest first.',
      tags: ['Payments'],
      querystring: ListPaymentsByUserQuery,
      response: {
        200: Type.Array(PaymentResponse),
        404: ErrorResponse,
      },
    },
  }, async (request, reply) => {
    const payments = await service.listByUser(request.query.userId);
    return reply.send(payments);
  });
};
