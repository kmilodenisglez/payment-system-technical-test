import { db } from '../../config/database';
import { CreatePaymentBodyType } from './payments.schema';

export interface CreatePaymentData extends CreatePaymentBodyType {
  status: 'approved' | 'rejected';
  transactionId: string | null;
  bankMessage: string;
}

/**
 * Data-access layer for the `payments` table.
 */
export class PaymentsRepository {
  async create(data: CreatePaymentData) {
    const payment = await db.payment.create({
      data: {
        userId: data.userId,
        cardId: data.cardId,
        amount: data.amount,
        status: data.status,
        transactionId: data.transactionId,
        bankMessage: data.bankMessage,
      },
    });

    // Convert Prisma's Decimal to a plain JS number for serialisation
    return { ...payment, amount: payment.amount.toNumber() };
  }

  async findByUserId(userId: string) {
    const payments = await db.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return payments.map((p) => ({ ...p, amount: p.amount.toNumber() }));
  }
}
