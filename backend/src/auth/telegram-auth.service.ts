import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class TelegramAuthService {
  private readonly botToken: string;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    if (!this.botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN is not set');
    }
  }

  /**
   * Верификация Telegram initData
   * @param initData - строка initData от Telegram Web App
   * @returns объект с данными пользователя или null
   */
  verifyInitData(initData: string): any {
    try {
      const urlParams = new URLSearchParams(initData);
      const hash = urlParams.get('hash');
      urlParams.delete('hash');

      // Создаем секретный ключ
      const secretKey = crypto
        .createHmac('sha256', 'WebAppData')
        .update(this.botToken)
        .digest();

      // Создаем строку для проверки
      const dataCheckString = Array.from(urlParams.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

      // Вычисляем хэш
      const calculatedHash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckString)
        .digest('hex');

      // Проверяем хэш
      if (calculatedHash !== hash) {
        throw new UnauthorizedException('Invalid Telegram initData hash');
      }

      // Парсим данные пользователя
      const userStr = urlParams.get('user');
      if (!userStr) {
        throw new UnauthorizedException('User data not found');
      }

      const user = JSON.parse(userStr);
      return {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        username: user.username,
        languageCode: user.language_code,
        isPremium: user.is_premium || false,
        photoUrl: user.photo_url,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid Telegram initData');
    }
  }
}

