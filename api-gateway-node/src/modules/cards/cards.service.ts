import { AppError } from '../../shared/errors/AppError';
import { UsersRepository } from '../users/users.repository';
import { CardsRepository } from './cards.repository';
import { CreateCardBodyType, CardResponseType } from './cards.schema';

/**
 * Business-logic layer for cards.
 * Verifies the owner exists before persisting the card record.
 */
export class CardsService {
  constructor(
    private readonly cardsRepo: CardsRepository,
    private readonly usersRepo: UsersRepository,
  ) {}

  async registerCard(data: CreateCardBodyType): Promise<CardResponseType> {
    const owner = await this.usersRepo.findById(data.userId);
    if (!owner) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const card = await this.cardsRepo.create(data);
    return this.toDTO(card);
  }

  async getCardById(id: string): Promise<CardResponseType> {
    const card = await this.cardsRepo.findById(id);
    if (!card) {
      throw new AppError('Card not found', 404, 'CARD_NOT_FOUND');
    }
    return this.toDTO(card);
  }

  async listCardsByUser(userId: string): Promise<CardResponseType[]> {
    // Validate the user exists before querying cards
    const owner = await this.usersRepo.findById(userId);
    if (!owner) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const cards = await this.cardsRepo.findByUserId(userId);
    return cards.map((c) => this.toDTO(c));
  }

  private toDTO(card: {
    id: string;
    userId: string;
    holderName: string;
    last4: string;
    brand: string;
    fakeToken: string;
    expiresAt: Date;
    createdAt: Date;
  }): CardResponseType {
    return {
      id: card.id,
      userId: card.userId,
      holderName: card.holderName,
      last4: card.last4,
      brand: card.brand,
      fakeToken: card.fakeToken,
      expiresAt: card.expiresAt.toISOString(),
      createdAt: card.createdAt.toISOString(),
    };
  }
}
