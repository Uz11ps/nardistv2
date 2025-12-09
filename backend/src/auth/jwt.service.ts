import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtService {
  private readonly secret: string;
  private readonly expiresIn: string;

  constructor() {
    this.secret = process.env.JWT_SECRET || 'default-secret-change-in-production';
    this.expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  }

  sign(payload: { userId: number; telegramId: number }): string {
    return jwt.sign(payload, this.secret, {
      expiresIn: this.expiresIn,
    });
  }

  verify(token: string): { userId: number; telegramId: number } {
    try {
      return jwt.verify(token, this.secret) as { userId: number; telegramId: number };
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}

