import { Module } from '@nestjs/common';
import { DistrictsService } from './districts.service';
import { DistrictsController } from './districts.controller';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [DistrictsService],
  controllers: [DistrictsController],
  exports: [DistrictsService],
})
export class DistrictsModule {}

