import { Type, Static } from '@sinclair/typebox';

// ── Request schemas ────────────────────────────────────────────────────────────

export const CreateUserBody = Type.Object(
  {
    name: Type.String({
      minLength: 1,
      maxLength: 100,
      description: 'Full name of the user',
      examples: ['Alice Johnson'],
    }),
    email: Type.String({
      format: 'email',
      description: 'Unique email address',
      examples: ['alice@example.com'],
    }),
  },
  { additionalProperties: false },
);

export const UserIdParam = Type.Object({
  id: Type.String({ format: 'uuid', description: 'User UUID' }),
});

// ── Response schemas ───────────────────────────────────────────────────────────

export const UserResponse = Type.Object({
  id: Type.String({ format: 'uuid' }),
  name: Type.String(),
  email: Type.String(),
  createdAt: Type.String({ format: 'date-time' }),
});

export const ErrorResponse = Type.Object({
  error: Type.String(),
  message: Type.String(),
  statusCode: Type.Number(),
});

// ── Inferred TypeScript types ──────────────────────────────────────────────────

export type CreateUserBodyType = Static<typeof CreateUserBody>;
export type UserIdParamType = Static<typeof UserIdParam>;
export type UserResponseType = Static<typeof UserResponse>;
