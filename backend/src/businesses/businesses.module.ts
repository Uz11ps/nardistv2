import { Module } from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { BusinessesController } from './businesses.controller';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [BusinessesService],
  controllers: [BusinessesController],
  exports: [BusinessesService],
})
export class BusinessesModule {}

