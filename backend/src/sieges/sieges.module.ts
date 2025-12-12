import { Module } from '@nestjs/common';
import { SiegesService } from './sieges.service';
import { SiegesController } from './sieges.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [SiegesService],
  controllers: [SiegesController],
  exports: [SiegesService],
})
export class SiegesModule {}

