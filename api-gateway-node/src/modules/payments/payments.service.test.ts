import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PaymentsService } from './payments.service';
import { PaymentsRepository } from './payments.repository';
import { UsersRepository } from '../users/users.repository';
import { CardsRepository } from '../cards/cards.repository';
import { AppError } from '../../shared/errors/AppError';
import { PaymentStatus } from '@prisma/client';
import * as httpClient from '../../shared/http/httpClient';

/**
 * Unit tests for PaymentsService
 * Tests business logic: payment validation, processor integration, audit trail
 */
describe('PaymentsService', () => {
  let service: PaymentsService;
  let paymentsRepoMock: { [key: string]: any };
  let usersRepoMock: { [key: string]: any };
  let cardsRepoMock: { [key: string]: any };

  beforeEach(() => {
    // Mock repositories
    paymentsRepoMock = {
      create: vi.fn(),
      findByUserId: vi.fn(),
    };

    usersRepoMock = {
      findById: vi.fn(),
    };

    cardsRepoMock = {
      findById: vi.fn(),
    };

    service = new PaymentsService(
      paymentsRepoMock as unknown as PaymentsRepository,
      usersRepoMock as unknown as UsersRepository,
      cardsRepoMock as unknown as CardsRepository,
    );

    // Mock the httpClient.processPayment
    vi.spyOn(httpClient, 'processPayment');
  });

  describe('createPayment', () => {
    it('should successfully create an approved payment', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const cardId = 'card-id-123';
      const createData = {
        userId,
        cardId,
        amount: 100,
        currency: 'USD',
      };

      const user = {
        id: userId,
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date('2026-05-15'),
        updatedAt: new Date('2026-05-15'),
      };

      const card = {
        id: cardId,
        userId,
        holderName: 'John Doe',
        last4: '4242',
        brand: 'Visa',
        fakeToken: 'tok_visa_1234',
        expiresAt: new Date('2027-12-31'),
        createdAt: new Date('2026-05-15'),
      };

      const processorResponse = {
        approved: true,
        transaction_id: 'txn_123456',
        message: 'Payment approved',
      };

      const payment = {
        id: 'payment-id-123',
        userId,
        cardId,
        amount: 100,
        currency: 'USD',
        status: PaymentStatus.APPROVED,
        transactionId: 'txn_123456',
        bankMessage: 'Payment approved',
        createdAt: new Date('2026-05-15'),
        updatedAt: new Date('2026-05-15'),
      };

      usersRepoMock.findById.mockResolvedValueOnce(user);
      cardsRepoMock.findById.mockResolvedValueOnce(card);
      vi.mocked(httpClient.processPayment).mockResolvedValueOnce(processorResponse);
      paymentsRepoMock.create.mockResolvedValueOnce(payment);

      const result = await service.createPayment(createData);

      expect(result).toEqual({
        id: payment.id,
        userId: payment.userId,
        cardId: payment.cardId,
        amount: payment.amount,
        currency: payment.currency,
        status: PaymentStatus.APPROVED,
        transactionId: payment.transactionId,
        bankMessage: payment.bankMessage,
        createdAt: payment.createdAt.toISOString(),
        updatedAt: payment.updatedAt.toISOString(),
      });
      expect(usersRepoMock.findById).toHaveBeenCalledWith(userId);
      expect(cardsRepoMock.findById).toHaveBeenCalledWith(cardId);
      expect(httpClient.processPayment).toHaveBeenCalledWith(100);
      expect(paymentsRepoMock.create).toHaveBeenCalled();
    });

    it('should create a rejected payment and persist it for audit', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const cardId = 'card-id-123';
      const createData = {
        userId,
        cardId,
        amount: 50,
        currency: 'EUR',
      };

      const user = {
        id: userId,
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date('2026-05-15'),
        updatedAt: new Date('2026-05-15'),
      };

      const card = {
        id: cardId,
        userId,
        holderName: 'John Doe',
        last4: '4242',
        brand: 'Visa',
        fakeToken: 'tok_visa_1234',
        expiresAt: new Date('2027-12-31'),
        createdAt: new Date('2026-05-15'),
      };

      const processorResponse = {
        approved: false,
        transaction_id: null,
        message: 'Insufficient funds',
      };

      const payment = {
        id: 'payment-id-456',
        userId,
        cardId,
        amount: 50,
        currency: 'EUR',
        status: PaymentStatus.REJECTED,
        transactionId: null,
        bankMessage: 'Insufficient funds',
        createdAt: new Date('2026-05-15'),
        updatedAt: new Date('2026-05-15'),
      };

      usersRepoMock.findById.mockResolvedValueOnce(user);
      cardsRepoMock.findById.mockResolvedValueOnce(card);
      vi.mocked(httpClient.processPayment).mockResolvedValueOnce(processorResponse);
      paymentsRepoMock.create.mockResolvedValueOnce(payment);

      const result = await service.createPayment(createData);

      expect(result.status).toBe(PaymentStatus.REJECTED);
      expect(result.bankMessage).toBe('Insufficient funds');
      expect(result.currency).toBe('EUR');
      // Even with rejection, the payment should be persisted for audit
      expect(paymentsRepoMock.create).toHaveBeenCalled();
    });

    it('should throw USER_NOT_FOUND when user does not exist', async () => {
      const userId = 'nonexistent-id';
      const createData = {
        userId,
        cardId: 'card-id',
        amount: 100,
        currency: 'USD',
      };

      usersRepoMock.findById.mockResolvedValueOnce(null);

      const error = await service.createPayment(createData).catch((e) => e);

      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe('USER_NOT_FOUND');
      expect(error.statusCode).toBe(404);
      expect(cardsRepoMock.findById).not.toHaveBeenCalled();
      expect(httpClient.processPayment).not.toHaveBeenCalled();
    });

    it('should throw CARD_NOT_FOUND when card does not exist', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const cardId = 'nonexistent-card';
      const createData = {
        userId,
        cardId,
        amount: 100,
        currency: 'USD',
      };

      const user = {
        id: userId,
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date('2026-05-15'),
        updatedAt: new Date('2026-05-15'),
      };

      usersRepoMock.findById.mockResolvedValueOnce(user);
      cardsRepoMock.findById.mockResolvedValueOnce(null);

      const error = await service.createPayment(createData).catch((e) => e);

      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe('CARD_NOT_FOUND');
      expect(error.statusCode).toBe(404);
      expect(httpClient.processPayment).not.toHaveBeenCalled();
    });

    it('should throw CARD_OWNERSHIP_ERROR when card does not belong to user', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const cardId = 'card-id-owned-by-other-user';
      const createData = {
        userId,
        cardId,
        amount: 100,
        currency: 'USD',
      };

      const user = {
        id: userId,
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date('2026-05-15'),
        updatedAt: new Date('2026-05-15'),
      };

      const card = {
        id: cardId,
        userId: 'other-user-id', // Different user
        holderName: 'Other User',
        last4: '4242',
        brand: 'Visa',
        fakeToken: 'tok_visa_1234',
        expiresAt: new Date('2027-12-31'),
        createdAt: new Date('2026-05-15'),
      };

      usersRepoMock.findById.mockResolvedValueOnce(user);
      cardsRepoMock.findById.mockResolvedValueOnce(card);

      const error = await service.createPayment(createData).catch((e) => e);

      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe('CARD_OWNERSHIP_ERROR');
      expect(error.statusCode).toBe(403);
      expect(httpClient.processPayment).not.toHaveBeenCalled();
    });

    it('should throw PAYMENT_PROCESSOR_UNAVAILABLE when processor fails', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const cardId = 'card-id-123';
      const createData = {
        userId,
        cardId,
        amount: 100,
        currency: 'USD',
      };

      const user = {
        id: userId,
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date('2026-05-15'),
        updatedAt: new Date('2026-05-15'),
      };

      const card = {
        id: cardId,
        userId,
        holderName: 'John Doe',
        last4: '4242',
        brand: 'Visa',
        fakeToken: 'tok_visa_1234',
        expiresAt: new Date('2027-12-31'),
        createdAt: new Date('2026-05-15'),
      };

      usersRepoMock.findById.mockResolvedValueOnce(user);
      cardsRepoMock.findById.mockResolvedValueOnce(card);
      vi.mocked(httpClient.processPayment).mockRejectedValueOnce(new Error('Connection timeout'));

      const error = await service.createPayment(createData).catch((e) => e);

      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe('PAYMENT_PROCESSOR_UNAVAILABLE');
      expect(error.statusCode).toBe(502);
      expect(paymentsRepoMock.create).not.toHaveBeenCalled();
    });

    it('should use default currency USD when not provided', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const cardId = 'card-id-123';
      const createData = {
        userId,
        cardId,
        amount: 100,
        // currency not provided
      };

      const user = {
        id: userId,
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date('2026-05-15'),
        updatedAt: new Date('2026-05-15'),
      };

      const card = {
        id: cardId,
        userId,
        holderName: 'John Doe',
        last4: '4242',
        brand: 'Visa',
        fakeToken: 'tok_visa_1234',
        expiresAt: new Date('2027-12-31'),
        createdAt: new Date('2026-05-15'),
      };

      const processorResponse = {
        approved: true,
        transaction_id: 'txn_789',
        message: 'Approved',
      };

      const payment = {
        id: 'payment-id-789',
        userId,
        cardId,
        amount: 100,
        currency: 'USD', // Should default to USD
        status: PaymentStatus.APPROVED,
        transactionId: 'txn_789',
        bankMessage: 'Approved',
        createdAt: new Date('2026-05-15'),
        updatedAt: new Date('2026-05-15'),
      };

      usersRepoMock.findById.mockResolvedValueOnce(user);
      cardsRepoMock.findById.mockResolvedValueOnce(card);
      vi.mocked(httpClient.processPayment).mockResolvedValueOnce(processorResponse);
      paymentsRepoMock.create.mockResolvedValueOnce(payment);

      const result = await service.createPayment(createData as any);

      expect(result.currency).toBe('USD');
    });
  });

  describe('listByUser', () => {
    it('should list all payments for a user', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const user = {
        id: userId,
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date('2026-05-15'),
        updatedAt: new Date('2026-05-15'),
      };

      const payments = [
        {
          id: 'payment-1',
          userId,
          cardId: 'card-1',
          amount: 100,
          currency: 'USD',
          status: PaymentStatus.APPROVED,
          transactionId: 'txn_1',
          bankMessage: 'Approved',
          createdAt: new Date('2026-05-15'),
          updatedAt: new Date('2026-05-15'),
        },
        {
          id: 'payment-2',
          userId,
          cardId: 'card-1',
          amount: 50,
          currency: 'EUR',
          status: PaymentStatus.REJECTED,
          transactionId: null,
          bankMessage: 'Declined',
          createdAt: new Date('2026-05-15'),
          updatedAt: new Date('2026-05-15'),
        },
      ];

      usersRepoMock.findById.mockResolvedValueOnce(user);
      paymentsRepoMock.findByUserId.mockResolvedValueOnce(payments);

      const result = await service.listByUser(userId);

      expect(result).toHaveLength(2);
      expect(result[0].currency).toBe('USD');
      expect(result[1].currency).toBe('EUR');
      expect(result[0].status).toBe(PaymentStatus.APPROVED);
      expect(result[1].status).toBe(PaymentStatus.REJECTED);
      expect(usersRepoMock.findById).toHaveBeenCalledWith(userId);
      expect(paymentsRepoMock.findByUserId).toHaveBeenCalledWith(userId);
    });

    it('should throw USER_NOT_FOUND when user does not exist', async () => {
      const userId = 'nonexistent-id';
      usersRepoMock.findById.mockResolvedValueOnce(null);

      const error = await service.listByUser(userId).catch((e) => e);

      expect(error).toBeInstanceOf(AppError);
      expect(error.code).toBe('USER_NOT_FOUND');
      expect(error.statusCode).toBe(404);
      expect(paymentsRepoMock.findByUserId).not.toHaveBeenCalled();
    });

    it('should return empty array when user has no payments', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const user = {
        id: userId,
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date('2026-05-15'),
        updatedAt: new Date('2026-05-15'),
      };

      usersRepoMock.findById.mockResolvedValueOnce(user);
      paymentsRepoMock.findByUserId.mockResolvedValueOnce([]);

      const result = await service.listByUser(userId);

      expect(result).toEqual([]);
    });
  });
});
