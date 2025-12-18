import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    // Проверяем, является ли пользователь админом
    // Можно добавить поле isAdmin в User или использовать отдельную таблицу
    // Пока проверяем по telegramId (можно настроить список админов)
    const adminTelegramIds = process.env.ADMIN_TELEGRAM_IDS?.split(',') || [];
    
    return adminTelegramIds.includes(user.telegramId?.toString());
  }
}

