import { db } from '../../config/database';
import { CreatePaymentBodyType } from './payments.schema';
import { PaymentStatus } from '@prisma/client';

export interface CreatePaymentData extends CreatePaymentBodyType {
  status: PaymentStatus;
  transactionId: string | null;
  bankMessage: string;
}

export interface PaymentEntity {
  id: string;
  userId: string;
  cardId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  transactionId: string | null;
  bankMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Data-access layer for the `payments` table.
 */
export class PaymentsRepository {
  async create(data: CreatePaymentData): Promise<PaymentEntity> {
    const payment = await db.payment.create({
      data: {
        userId: data.userId,
        cardId: data.cardId,
        amount: data.amount,
        currency: data.currency || 'USD',
        status: data.status,
        transactionId: data.transactionId,
        bankMessage: data.bankMessage,
      },
    });

    // Convert Prisma's Decimal to a plain JS number for serialisation
    return { ...payment, amount: payment.amount.toNumber() } as PaymentEntity;
  }

  async findByUserId(userId: string): Promise<PaymentEntity[]> {
    const payments = await db.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return payments.map((p) => ({
      ...p,
      amount: p.amount.toNumber(),
    } as PaymentEntity));
  }
}
