import { AppError } from '../../shared/errors/AppError';
import { processPayment } from '../../shared/http/httpClient';
import { UsersRepository } from '../users/users.repository';
import { CardsRepository } from '../cards/cards.repository';
import { PaymentsRepository } from './payments.repository';
import { CreatePaymentBodyType, PaymentResponseType } from './payments.schema';
import { PaymentStatus } from '@prisma/client';

/**
 * Business-logic layer for payments.
 *
 * Orchestrates three steps:
 *   1. Validate that the user and card exist (and that the card belongs to the user).
 *   2. Call the Python payment processor service.
 *   3. Persist the result — regardless of approval status — for audit purposes.
 */
export class PaymentsService {
  constructor(
    private readonly paymentsRepo: PaymentsRepository,
    private readonly usersRepo: UsersRepository,
    private readonly cardsRepo: CardsRepository,
  ) {}

  async createPayment(data: CreatePaymentBodyType): Promise<PaymentResponseType> {
    // ── 1. Validate user ──────────────────────────────────────────────────────
    const user = await this.usersRepo.findById(data.userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // ── 2. Validate card ownership ────────────────────────────────────────────
    const card = await this.cardsRepo.findById(data.cardId);
    if (!card) {
      throw new AppError('Card not found', 404, 'CARD_NOT_FOUND');
    }
    if (card.userId !== data.userId) {
      throw new AppError('Card does not belong to this user', 403, 'CARD_OWNERSHIP_ERROR');
    }

    // ── 3. Call Python payment processor ──────────────────────────────────────
    let processorResult;
    try {
      processorResult = await processPayment(data.amount);
    } catch (err) {
      // Re-throw as a 502 so the error handler sends the correct HTTP status
      throw new AppError(
        'Unable to reach the payment processor service',
        502,
        'PAYMENT_PROCESSOR_UNAVAILABLE',
      );
    }

    // ── 4. Persist the result (approved or rejected — always audited) ─────────
    const payment = await this.paymentsRepo.create({
      userId: data.userId,
      cardId: data.cardId,
      amount: data.amount,
      currency: data.currency || 'USD',
      status: processorResult.approved ? PaymentStatus.APPROVED : PaymentStatus.REJECTED,
      transactionId: processorResult.transaction_id,
      bankMessage: processorResult.message,
    });

    return this.toDTO(payment);
  }

  async listByUser(userId: string): Promise<PaymentResponseType[]> {
    const user = await this.usersRepo.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const payments = await this.paymentsRepo.findByUserId(userId);
    return payments.map((p) => this.toDTO(p));
  }

  private toDTO(payment: {
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
  }): PaymentResponseType {
    return {
      id: payment.id,
      userId: payment.userId,
      cardId: payment.cardId,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      transactionId: payment.transactionId,
      bankMessage: payment.bankMessage,
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
    };
  }
}
