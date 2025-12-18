import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TelegramAuthService } from './telegram-auth.service';
import { JwtService } from './jwt.service';
import { DatabaseModule } from '../database/database.module';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [DatabaseModule],
  controllers: [AuthController],
  providers: [AuthService, TelegramAuthService, JwtService, JwtAuthGuard],
  exports: [AuthService, JwtService, JwtAuthGuard],
})
export class AuthModule {}

