import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggerService } from './common/logger/logger.service';
import { setupSwagger } from './common/swagger/swagger.setup';

async function bootstrap() {
  const logger = new LoggerService('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: logger,
  });

  // Глобальный exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Глобальная валидация
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS настройки
  const allowedOrigins = process.env.FRONTEND_URL 
    ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
    : process.env.NODE_ENV === 'production'
      ? ['https://nardist.online', 'https://www.nardist.online']
      : ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'];
  
  app.enableCors({
    origin: (origin, callback) => {
      // В production разрешаем только указанные домены
      if (process.env.NODE_ENV === 'production') {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      } else {
        // В development разрешаем localhost и указанные домены
        if (!origin || allowedOrigins.includes(origin) || origin.includes('localhost') || origin.includes('127.0.0.1')) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    },
    credentials: true,
  });

  // Swagger документация (только в development)
  if (process.env.NODE_ENV !== 'production') {
    setupSwagger(app);
    logger.log('Swagger documentation available at /api', 'Bootstrap');
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  const url = process.env.NODE_ENV === 'production' 
    ? `https://nardist.online` 
    : `http://localhost:${port}`;
  logger.log(`Application is running on: ${url}`, 'Bootstrap');
}

bootstrap();

