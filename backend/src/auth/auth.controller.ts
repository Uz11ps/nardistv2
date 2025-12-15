import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { TelegramAuthDto } from './dto/telegram-auth.dto';
import { Public } from './decorators/public.decorator';

// Swagger декораторы (опционально, если пакет установлен)
let ApiTags: any, ApiOperation: any, ApiResponse: any, ApiBearerAuth: any;
try {
  const swagger = require('@nestjs/swagger');
  ApiTags = swagger.ApiTags;
  ApiOperation = swagger.ApiOperation;
  ApiResponse = swagger.ApiResponse;
  ApiBearerAuth = swagger.ApiBearerAuth;
} catch {
  // Если пакет не установлен, используем пустые функции
  ApiTags = () => () => {};
  ApiOperation = () => () => {};
  ApiResponse = () => () => {};
  ApiBearerAuth = () => () => {};
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('telegram')
  @Public()
  @ApiOperation({ summary: 'Аутентификация через Telegram' })
  @ApiResponse({ status: 200, description: 'Успешная аутентификация' })
  @ApiResponse({ status: 401, description: 'Неверные данные' })
  async authenticate(@Body() dto: TelegramAuthDto) {
    return this.authService.authenticate(dto.initData);
  }

  @Post('test-login')
  @Public()
  @ApiOperation({ summary: 'Тестовая аутентификация (только для разработки)' })
  @ApiResponse({ status: 200, description: 'Успешная аутентификация' })
  async testLogin(@Body() body: { telegramId?: string }) {
    return this.authService.testLogin(body.telegramId);
  }
}

