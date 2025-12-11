import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { TelegramAuthDto } from './dto/telegram-auth.dto';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('telegram')
  async authenticate(@Body() dto: TelegramAuthDto) {
    return this.authService.authenticate(dto.initData);
  }

  @Post('test-login')
  @Public()
  async testLogin(@Body() body: { telegramId?: string }) {
    return this.authService.testLogin(body.telegramId);
  }
}

