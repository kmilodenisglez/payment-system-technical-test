import crypto from 'crypto';
import { db } from '../../config/database';
import { CreateCardBodyType } from './cards.schema';

/**
 * Data-access layer for the `cards` table.
 */
export class CardsRepository {
  async create(data: CreateCardBodyType) {
    // Generate a random, opaque token to represent this card in the system.
    // This simulates a tokenisation service (e.g. Stripe's card tokens).
    const fakeToken = `tok_${crypto.randomBytes(12).toString('hex')}`;

    return db.card.create({
      data: {
        userId: data.userId,
        holderName: data.holderName,
        last4: data.last4,
        brand: data.brand,
        fakeToken,
        expiresAt: new Date(data.expiresAt),
      },
    });
  }

  async findById(id: string) {
    return db.card.findUnique({ where: { id } });
  }

  async findByUserId(userId: string) {
    return db.card.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
