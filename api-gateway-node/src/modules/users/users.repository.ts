import { db } from '../../config/database';
import { CreateUserBodyType } from './users.schema';

/**
 * Data-access layer for the `users` table.
 * All Prisma queries are isolated here so the service layer
 * remains decoupled from the database implementation.
 */
export class UsersRepository {
  async create(data: CreateUserBodyType) {
    return db.user.create({
      data: { name: data.name, email: data.email },
    });
  }

  async findById(id: string) {
    return db.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string) {
    return db.user.findUnique({ where: { email } });
  }

  async findAll() {
    return db.user.findMany({ orderBy: { createdAt: 'desc' } });
  }
}
