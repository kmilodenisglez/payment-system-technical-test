import { Type, Static } from '@sinclair/typebox';

// ── Request schemas ────────────────────────────────────────────────────────────

export const CreatePaymentBody = Type.Object(
  {
    userId: Type.String({ format: 'uuid', description: 'UUID of the paying user' }),
    cardId: Type.String({ format: 'uuid', description: 'UUID of the card to charge' }),
    amount: Type.Number({
      minimum: 0.01,
      description: 'Payment amount (must be greater than zero)',
      examples: [120.5],
    }),
    currency: Type.Optional(Type.String({
      minLength: 3,
      maxLength: 3,
      description: 'ISO 4217 currency code',
      examples: ['USD', 'EUR', 'COP'],
    })),
  },
  { additionalProperties: false },
);

export const ListPaymentsByUserQuery = Type.Object({
  userId: Type.String({ format: 'uuid', description: 'Filter payments by user UUID' }),
});

// ── Response schemas ───────────────────────────────────────────────────────────

export const PaymentResponse = Type.Object({
  id: Type.String({ format: 'uuid' }),
  userId: Type.String({ format: 'uuid' }),
  cardId: Type.String({ format: 'uuid' }),
  amount: Type.Number(),
  currency: Type.String({ description: 'ISO 4217 currency code' }),
  status: Type.String({ description: 'PENDING | APPROVED | REJECTED | FAILED' }),
  transactionId: Type.Union([Type.String(), Type.Null()]),
  bankMessage: Type.Union([Type.String(), Type.Null()]),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
});

export const ErrorResponse = Type.Object({
  error: Type.String(),
  message: Type.String(),
  statusCode: Type.Number(),
});

// ── Inferred TypeScript types ──────────────────────────────────────────────────

export type CreatePaymentBodyType = Static<typeof CreatePaymentBody>;
export type ListPaymentsByUserQueryType = Static<typeof ListPaymentsByUserQuery>;
export type PaymentResponseType = Static<typeof PaymentResponse>;
