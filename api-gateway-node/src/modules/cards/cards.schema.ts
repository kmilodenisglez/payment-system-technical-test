import { Type, Static } from '@sinclair/typebox';

// ── Request schemas ────────────────────────────────────────────────────────────

export const CreateCardBody = Type.Object(
  {
    userId: Type.String({
      format: 'uuid',
      description: 'UUID of the card owner',
    }),
    holderName: Type.String({
      minLength: 1,
      maxLength: 120,
      description: 'Name as it appears on the card',
      examples: ['Alice Johnson'],
    }),
    last4: Type.String({
      minLength: 4,
      maxLength: 4,
      pattern: '^[0-9]{4}$',
      description: 'Last 4 digits of the card number (fictitious)',
      examples: ['4242'],
    }),
    brand: Type.String({
      minLength: 1,
      maxLength: 50,
      description: 'Card network/brand',
      examples: ['Visa', 'Mastercard'],
    }),
    expiresAt: Type.String({
      format: 'date',
      description: 'Expiry date in YYYY-MM-DD format',
      examples: ['2027-12-31'],
    }),
  },
  { additionalProperties: false },
);

export const CardIdParam = Type.Object({
  id: Type.String({ format: 'uuid', description: 'Card UUID' }),
});

export const ListCardsByUserQuery = Type.Object({
  userId: Type.String({ format: 'uuid', description: 'Filter cards by owner UUID' }),
});

// ── Response schemas ───────────────────────────────────────────────────────────

export const CardResponse = Type.Object({
  id: Type.String({ format: 'uuid' }),
  userId: Type.String({ format: 'uuid' }),
  holderName: Type.String(),
  last4: Type.String(),
  brand: Type.String(),
  fakeToken: Type.String(),
  expiresAt: Type.String({ format: 'date-time' }),
  createdAt: Type.String({ format: 'date-time' }),
});

export const ErrorResponse = Type.Object({
  error: Type.String(),
  message: Type.String(),
  statusCode: Type.Number(),
});

// ── Inferred TypeScript types ──────────────────────────────────────────────────

export type CreateCardBodyType = Static<typeof CreateCardBody>;
export type CardIdParamType = Static<typeof CardIdParam>;
export type ListCardsByUserQueryType = Static<typeof ListCardsByUserQuery>;
export type CardResponseType = Static<typeof CardResponse>;
