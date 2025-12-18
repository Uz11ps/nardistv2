import { Module } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { ResourcesController } from './resources.controller';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [ResourcesService],
  controllers: [ResourcesController],
  exports: [ResourcesService],
})
export class ResourcesModule {}

