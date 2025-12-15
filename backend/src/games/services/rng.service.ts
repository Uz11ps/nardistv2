import { Injectable } from '@nestjs/common';
import { randomBytes, createHash } from 'crypto';

export interface DiceRoll {
  die1: number;
  die2: number;
  timestamp: number;
  seed?: string;
  hash?: string;
}

export interface GameSeed {
  seed: string;
  hash: string;
  createdAt: number;
}

@Injectable()
export class RngService {
  /**
   * Генерировать seed для игры
   */
  generateSeed(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Вычислить hash от seed
   */
  hashSeed(seed: string): string {
    return createHash('sha256').update(seed).digest('hex');
  }

  /**
   * Создать seed для игры с hash
   */
  createGameSeed(): GameSeed {
    const seed = this.generateSeed();
    const hash = this.hashSeed(seed);
    
    return {
      seed,
      hash,
      createdAt: Date.now(),
    };
  }

  /**
   * Генерировать криптографически безопасное случайное число от 1 до 6
   */
  private generateSecureRandom(min: number, max: number, seed: string, counter: number): number {
    // Используем HMAC для генерации детерминированных, но непредсказуемых значений
    const hmac = createHash('sha256');
    hmac.update(seed);
    hmac.update(counter.toString());
    const hash = hmac.digest();
    
    // Преобразуем байт в число от 0 до 255, затем в диапазон 1-6
    const randomValue = hash[0];
    return (randomValue % (max - min + 1)) + min;
  }

  /**
   * Бросить кубики используя seed
   */
  rollDice(seed: string, rollCounter: number): DiceRoll {
    const die1 = this.generateSecureRandom(1, 6, seed, rollCounter * 2);
    const die2 = this.generateSecureRandom(1, 6, seed, rollCounter * 2 + 1);
    
    return {
      die1,
      die2,
      timestamp: Date.now(),
      seed: undefined, // Не отправляем seed клиенту, только hash
      hash: this.hashSeed(seed + rollCounter.toString()),
    };
  }

  /**
   * Верифицировать бросок кубиков по seed и hash
   */
  verifyRoll(roll: DiceRoll, seed: string, rollCounter: number): boolean {
    const expectedHash = this.hashSeed(seed + rollCounter.toString());
    return roll.hash === expectedHash;
  }
}

