import { describe, it, expect } from 'vitest';
import { AppError } from './AppError';

/**
 * Unit tests for AppError
 * Tests custom error class for consistent error handling
 */
describe('AppError', () => {
  it('should create an error with default status and code', () => {
    const error = new AppError('Something went wrong');

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe('Something went wrong');
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('APP_ERROR');
    expect(error.name).toBe('AppError');
  });

  it('should create an error with custom status code', () => {
    const error = new AppError('Not found', 404);

    expect(error.message).toBe('Not found');
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('APP_ERROR');
  });

  it('should create an error with custom status code and code', () => {
    const error = new AppError('Email already exists', 409, 'EMAIL_CONFLICT');

    expect(error.message).toBe('Email already exists');
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe('EMAIL_CONFLICT');
  });

  it('should maintain instanceof relationship for error checking', () => {
    const error = new AppError('User not found', 404, 'USER_NOT_FOUND');

    expect(error instanceof AppError).toBe(true);
    expect(error instanceof Error).toBe(true);
  });

  it('should be throwable and catchable', () => {
    const throwableError = () => {
      throw new AppError('Payment failed', 402, 'PAYMENT_FAILED');
    };

    expect(throwableError).toThrow();
    expect(throwableError).toThrow(AppError);
    expect(throwableError).toThrow('Payment failed');

    try {
      throwableError();
    } catch (e) {
      expect((e as AppError).statusCode).toBe(402);
      expect((e as AppError).code).toBe('PAYMENT_FAILED');
    }
  });

  it('should work with different error codes', () => {
    const errors = [
      new AppError('Card not found', 404, 'CARD_NOT_FOUND'),
      new AppError('User forbidden', 403, 'FORBIDDEN'),
      new AppError('Server error', 500, 'INTERNAL_ERROR'),
      new AppError('Service unavailable', 502, 'SERVICE_UNAVAILABLE'),
    ];

    expect(errors[0].code).toBe('CARD_NOT_FOUND');
    expect(errors[1].statusCode).toBe(403);
    expect(errors[2].statusCode).toBe(500);
    expect(errors[3].code).toBe('SERVICE_UNAVAILABLE');
  });
});
