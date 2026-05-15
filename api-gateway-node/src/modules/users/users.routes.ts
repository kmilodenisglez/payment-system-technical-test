import { Type } from '@sinclair/typebox';
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox';
import { UsersRepository } from './users.repository';
import { UsersService } from './users.service';
import { CreateUserBody, UserIdParam, UserResponse, ErrorResponse } from './users.schema';

const repo = new UsersRepository();
const service = new UsersService(repo);

export const usersRoutes: FastifyPluginAsyncTypebox = async (fastify) => {
  // ── POST /api/v1/users ────────────────────────────────────────────────────
  fastify.post('/', {
    schema: {
      summary: 'Create a user',
      description: 'Registers a new user with a unique email address.',
      tags: ['Users'],
      body: CreateUserBody,
      response: {
        201: UserResponse,
        409: ErrorResponse,
      },
    },
  }, async (request, reply) => {
    const user = await service.createUser(request.body);
    return reply.code(201).send(user);
  });

  // ── GET /api/v1/users ─────────────────────────────────────────────────────
  fastify.get('/', {
    schema: {
      summary: 'List all users',
      description: 'Returns a list of all registered users, newest first.',
      tags: ['Users'],
      response: {
        200: Type.Array(UserResponse),
      },
    },
  }, async (_request, reply) => {
    const users = await service.listUsers();
    return reply.send(users);
  });

  // ── GET /api/v1/users/:id ─────────────────────────────────────────────────
  fastify.get('/:id', {
    schema: {
      summary: 'Get a user by ID',
      tags: ['Users'],
      params: UserIdParam,
      response: {
        200: UserResponse,
        404: ErrorResponse,
      },
    },
  }, async (request, reply) => {
    const user = await service.getUserById(request.params.id);
    return reply.send(user);
  });
};
