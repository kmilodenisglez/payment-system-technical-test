import { AppError } from '../../shared/errors/AppError';
import { UsersRepository } from './users.repository';
import { CreateUserBodyType, UserResponseType } from './users.schema';

/**
 * Business-logic layer for users.
 * Validates invariants (e.g. unique email) before delegating to the repository.
 */
export class UsersService {
  constructor(private readonly repo: UsersRepository) {}

  async createUser(data: CreateUserBodyType): Promise<UserResponseType> {
    const existing = await this.repo.findByEmail(data.email);
    if (existing) {
      throw new AppError('Email address is already in use', 409, 'EMAIL_CONFLICT');
    }

    const user = await this.repo.create(data);
    return this.toDTO(user);
  }

  async getUserById(id: string): Promise<UserResponseType> {
    const user = await this.repo.findById(id);
    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }
    return this.toDTO(user);
  }

  async listUsers(): Promise<UserResponseType[]> {
    const users = await this.repo.findAll();
    return users.map((u: { id: string; name: string; email: string; createdAt: Date; }) => this.toDTO(u));
  }

  private toDTO(user: { id: string; name: string; email: string; createdAt: Date }): UserResponseType {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
    };
  }
}
