/**
 * Application-level error class.
 *
 * Services throw `AppError` for predictable business-rule violations
 * (e.g. "user not found", "email already in use"). The centralised
 * Fastify error handler catches these and returns the appropriate
 * HTTP status code and structured JSON body.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode = 400, code = 'APP_ERROR') {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    // Restore the prototype chain (required when extending built-ins in TS)
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
