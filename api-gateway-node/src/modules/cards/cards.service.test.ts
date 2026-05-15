import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CardsService } from './cards.service';
import { CardsRepository } from './cards.repository';
import { UsersRepository } from '../users/users.repository';
import { AppError } from '../../shared/errors/AppError';

/**
 * Unit tests for CardsService
 * Tests business logic: card registration, user validation, card ownership
 */
describe('CardsService', () => {
  let service: CardsService;
  let cardsRepoMock: { [key: string]: any };
  let usersRepoMock: { [key: string]: any };

  beforeEach(() => {
    // Mock repositories
    cardsRepoMock = {
      create: vi.fn(),
      findById: vi.fn(),
      findByUserId: vi.fn(),
    };

    usersRepoMock = {
      findById: vi.fn(),
    };

    service = new CardsService(
      cardsRepoMock as unknown as CardsRepository,
      usersRepoMock as unknown as UsersRepository,
    );
  });

  describe('registerCard', () => {
    it('should successfully register a card for an existing user', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const createData = {
        userId,
        holderName: 'John Doe',
        last4: '4242',
        brand: 'Visa',
        fakeToken: 'tok_visa_1234',
        expiresAt: new Date('2027-12-31'),
      };

      const user = {
        id: userId,
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date('2026-05-15'),
        updatedAt: new Date('2026-05-15'),
      };

      const card = {
        id: 'card-id-123',
        ...createData,
        createdAt: new Date('2026-05-15'),
      };

      usersRepoMock.findById.mockResolvedValueOnce(user);
      cardsRepoMock.create.mockResolvedValueOnce(card);

      const result = await service.registerCard(createData);

      expect(result).toEqual({
        id: card.id,
        userId: card.userId,
        holderName: card.holderName,
        last4: card.last4,
        brand: card.brand,
        fakeToken: card.fakeToken,
        expiresAt: card.expiresAt.toISOString(),
        createdAt: card.createdAt.toISOString(),
      });
      expect(usersRepoMock.findById).toHaveBeenCalledWith(userId);
      expect(cardsRepoMock.create).toHaveBeenCalledWith(createData);
    });

    it('should throw USER_NOT_FOUND when user does not exist', async () => {
      const userId = 'nonexistent-id';
      const createData = {
        userId,
        holderName: 'John Doe',
        last4: '4242',
        brand: 'Visa',
        fakeToken: 'tok_visa_1234',
        expiresAt: new Date('2027-12-31'),
      };

      usersRepoMock.findById.mockResolvedValueOnce(null);

      const error = await service.registerCard(createData).catch((e) => e);

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('User not found');
      expect(error.code).toBe('USER_NOT_FOUND');
      expect(error.statusCode).toBe(404);
      expect(cardsRepoMock.create).not.toHaveBeenCalled();
    });
  });

  describe('getCardById', () => {
    it('should retrieve a card by ID', async () => {
      const cardId = 'card-id-123';
      const card = {
        id: cardId,
        userId: '550e8400-e29b-41d4-a716-446655440000',
        holderName: 'John Doe',
        last4: '4242',
        brand: 'Visa',
        fakeToken: 'tok_visa_1234',
        expiresAt: new Date('2027-12-31'),
        createdAt: new Date('2026-05-15'),
      };

      cardsRepoMock.findById.mockResolvedValueOnce(card);

      const result = await service.getCardById(cardId);

      expect(result).toEqual({
        id: card.id,
        userId: card.userId,
        holderName: card.holderName,
        last4: card.last4,
        brand: card.brand,
        fakeToken: card.fakeToken,
        expiresAt: card.expiresAt.toISOString(),
        createdAt: card.createdAt.toISOString(),
      });
      expect(cardsRepoMock.findById).toHaveBeenCalledWith(cardId);
    });

    it('should throw CARD_NOT_FOUND when card does not exist', async () => {
      const cardId = 'nonexistent-card-id';
      cardsRepoMock.findById.mockResolvedValueOnce(null);

      const error = await service.getCardById(cardId).catch((e) => e);

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Card not found');
      expect(error.code).toBe('CARD_NOT_FOUND');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('listCardsByUser', () => {
    it('should list cards for an existing user', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const user = {
        id: userId,
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date('2026-05-15'),
        updatedAt: new Date('2026-05-15'),
      };

      const cards = [
        {
          id: 'card-1',
          userId,
          holderName: 'John Doe',
          last4: '4242',
          brand: 'Visa',
          fakeToken: 'tok_visa_1234',
          expiresAt: new Date('2027-12-31'),
          createdAt: new Date('2026-05-15'),
        },
        {
          id: 'card-2',
          userId,
          holderName: 'John Doe',
          last4: '5555',
          brand: 'Mastercard',
          fakeToken: 'tok_mc_5678',
          expiresAt: new Date('2027-06-30'),
          createdAt: new Date('2026-05-15'),
        },
      ];

      usersRepoMock.findById.mockResolvedValueOnce(user);
      cardsRepoMock.findByUserId.mockResolvedValueOnce(cards);

      const result = await service.listCardsByUser(userId);

      expect(result).toHaveLength(2);
      expect(result[0].userId).toBe(userId);
      expect(result[1].userId).toBe(userId);
      expect(usersRepoMock.findById).toHaveBeenCalledWith(userId);
      expect(cardsRepoMock.findByUserId).toHaveBeenCalledWith(userId);
    });

    it('should throw USER_NOT_FOUND when user does not exist', async () => {
      const userId = 'nonexistent-id';
      usersRepoMock.findById.mockResolvedValueOnce(null);

      const error = await service.listCardsByUser(userId).catch((e) => e);

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('User not found');
      expect(error.code).toBe('USER_NOT_FOUND');
      expect(error.statusCode).toBe(404);
      expect(cardsRepoMock.findByUserId).not.toHaveBeenCalled();
    });

    it('should return empty array when user has no cards', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const user = {
        id: userId,
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date('2026-05-15'),
        updatedAt: new Date('2026-05-15'),
      };

      usersRepoMock.findById.mockResolvedValueOnce(user);
      cardsRepoMock.findByUserId.mockResolvedValueOnce([]);

      const result = await service.listCardsByUser(userId);

      expect(result).toEqual([]);
    });
  });
});
