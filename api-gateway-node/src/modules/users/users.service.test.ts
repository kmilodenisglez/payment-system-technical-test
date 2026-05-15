import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { AppError } from '../../shared/errors/AppError';

/**
 * Unit tests for UsersService
 * Tests business logic: email uniqueness validation, user retrieval, listing
 */
describe('UsersService', () => {
  let service: UsersService;
  let repoMock: { [key: string]: any };

  beforeEach(() => {
    // Mock the UsersRepository
    repoMock = {
      create: vi.fn(),
      findById: vi.fn(),
      findByEmail: vi.fn(),
      findAll: vi.fn(),
    };
    service = new UsersService(repoMock as unknown as UsersRepository);
  });

  describe('createUser', () => {
    it('should successfully create a user with unique email', async () => {
      const createData = {
        name: 'John Doe',
        email: 'john@example.com',
      };
      const user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        ...createData,
        createdAt: new Date('2026-05-15'),
        updatedAt: new Date('2026-05-15'),
      };

      repoMock.findByEmail.mockResolvedValueOnce(null); // No existing user
      repoMock.create.mockResolvedValueOnce(user);

      const result = await service.createUser(createData);

      expect(result).toEqual({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      });
      expect(repoMock.findByEmail).toHaveBeenCalledWith(createData.email);
      expect(repoMock.create).toHaveBeenCalledWith(createData);
    });

    it('should throw EMAIL_CONFLICT when email already exists', async () => {
      const createData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
      };
      const existingUser = {
        id: 'existing-id',
        name: 'Existing User',
        email: createData.email,
        createdAt: new Date('2026-05-15'),
        updatedAt: new Date('2026-05-15'),
      };

      repoMock.findByEmail.mockResolvedValueOnce(existingUser);

      const error = await service.createUser(createData).catch((e) => e);

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Email address is already in use');
      expect(error.code).toBe('EMAIL_CONFLICT');
      expect(error.statusCode).toBe(409);
      expect(repoMock.create).not.toHaveBeenCalled();
    });
  });

  describe('getUserById', () => {
    it('should retrieve a user by ID', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const user = {
        id: userId,
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date('2026-05-15'),
        updatedAt: new Date('2026-05-15'),
      };

      repoMock.findById.mockResolvedValueOnce(user);

      const result = await service.getUserById(userId);

      expect(result).toEqual({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      });
      expect(repoMock.findById).toHaveBeenCalledWith(userId);
    });

    it('should throw USER_NOT_FOUND when user does not exist', async () => {
      const userId = 'nonexistent-id';
      repoMock.findById.mockResolvedValueOnce(null);

      const error = await service.getUserById(userId).catch((e) => e);

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('User not found');
      expect(error.code).toBe('USER_NOT_FOUND');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('listUsers', () => {
    it('should list all users', async () => {
      const users = [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          name: 'John Doe',
          email: 'john@example.com',
          createdAt: new Date('2026-05-15'),
          updatedAt: new Date('2026-05-15'),
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          name: 'Jane Doe',
          email: 'jane@example.com',
          createdAt: new Date('2026-05-15'),
          updatedAt: new Date('2026-05-15'),
        },
      ];

      repoMock.findAll.mockResolvedValueOnce(users);

      const result = await service.listUsers();

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: users[0].id,
        name: users[0].name,
        email: users[0].email,
        createdAt: users[0].createdAt.toISOString(),
        updatedAt: users[0].updatedAt.toISOString(),
      });
      expect(repoMock.findAll).toHaveBeenCalled();
    });

    it('should return empty array when no users exist', async () => {
      repoMock.findAll.mockResolvedValueOnce([]);

      const result = await service.listUsers();

      expect(result).toEqual([]);
      expect(repoMock.findAll).toHaveBeenCalled();
    });
  });
});
