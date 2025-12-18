import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    // Retry логика для подключения к базе данных
    const maxRetries = 10;
    const retryDelay = 3000; // 3 секунды

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
    await this.$connect();
        this.logger.log('Successfully connected to database');
        return;
      } catch (error) {
        this.logger.warn(
          `Database connection attempt ${attempt}/${maxRetries} failed: ${error.message}`,
        );
        
        if (attempt === maxRetries) {
          this.logger.error('Failed to connect to database after all retries');
          throw error;
        }
        
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

