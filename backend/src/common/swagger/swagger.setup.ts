import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication) {
  try {
    // Проверяем наличие пакета @nestjs/swagger
    const { DocumentBuilder, SwaggerModule } = require('@nestjs/swagger');
    
    const config = new DocumentBuilder()
      .setTitle('Nardist API')
      .setDescription('API для Telegram Mini App «Нарды»')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .addTag('auth', 'Аутентификация')
      .addTag('users', 'Пользователи')
      .addTag('games', 'Игры')
      .addTag('tournaments', 'Турниры')
      .addTag('quests', 'Квесты')
      .addTag('city', 'Город')
      .addTag('clans', 'Кланы')
      .addTag('market', 'Рынок')
      .addTag('inventory', 'Инвентарь')
      .addTag('businesses', 'Предприятия')
      .addTag('health', 'Health Check')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  } catch (error) {
    // Если пакет не установлен, просто пропускаем
    console.warn('Swagger not available. Install @nestjs/swagger to enable API documentation.');
  }
}

