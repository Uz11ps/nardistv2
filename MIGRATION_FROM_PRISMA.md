# Миграция с Prisma на прямой PostgreSQL

## Что сделано:

1. ✅ Заменен `@prisma/client` на `pg` в package.json
2. ✅ Удалены Prisma скрипты из package.json
3. ✅ Создан `DatabaseService` для работы с PostgreSQL
4. ✅ Обновлен `app.module.ts` - заменен PrismaModule на DatabaseModule
5. ✅ Обновлен Dockerfile - убраны все упоминания Prisma

## Что нужно сделать:

### 1. Заменить PrismaService на DatabaseService во всех сервисах

Нужно переписать 19 файлов:
- `src/auth/auth.service.ts`
- `src/users/users.service.ts`
- `src/tournaments/tournaments.service.ts`
- `src/subscription/subscription.service.ts`
- `src/referrals/referrals.service.ts`
- `src/inventory/inventory.service.ts`
- `src/game-history/game-history.service.ts`
- `src/economy/economy.service.ts`
- `src/clans/clans.service.ts`
- `src/businesses/businesses.service.ts`
- `src/admin/admin.service.ts`
- `src/academy/academy.service.ts`
- `src/sieges/sieges.service.ts`
- `src/resources/resources.service.ts`
- `src/quests/quests.service.ts`
- `src/market/market.service.ts`
- `src/districts/districts.service.ts`
- `src/city/city.service.ts`
- `src/ratings/ratings.service.ts`
- `src/health/health.service.ts`

### 2. Пример замены:

**Было (Prisma):**
```typescript
import { PrismaService } from '../prisma/prisma.service';

constructor(private readonly prisma: PrismaService) {}

const user = await this.prisma.user.findUnique({
  where: { id: userId },
});

await this.prisma.user.create({
  data: { name: 'John' },
});

await this.prisma.user.update({
  where: { id: userId },
  data: { name: 'Jane' },
});
```

**Стало (DatabaseService):**
```typescript
import { DatabaseService } from '../database/database.service';

constructor(private readonly db: DatabaseService) {}

const user = await this.db.findOne('users', { id: userId });

await this.db.create('users', { name: 'John' });

await this.db.update('users', { id: userId }, { name: 'Jane' });
```

### 3. Сложные запросы:

Для сложных запросов используйте прямой SQL:

```typescript
// Prisma
const users = await this.prisma.user.findMany({
  where: { level: { gte: 10 } },
  orderBy: { xp: 'desc' },
  take: 10,
});

// DatabaseService
const users = await this.db.query(`
  SELECT * FROM users 
  WHERE level >= $1 
  ORDER BY xp DESC 
  LIMIT $2
`, [10, 10]);
```

### 4. Транзакции:

```typescript
// Prisma
await this.prisma.$transaction([
  this.prisma.user.update(...),
  this.prisma.gameHistory.create(...),
]);

// DatabaseService
await this.db.transaction(async (client) => {
  await client.query('UPDATE users SET ...');
  await client.query('INSERT INTO game_history ...');
});
```

### 5. Обновить health.service.ts:

```typescript
// Было
await this.prisma.$queryRaw`SELECT 1`;

// Стало
await this.db.query('SELECT 1');
```

## После миграции:

1. Удалите директорию `prisma/` из проекта
2. Удалите `src/prisma/` модуль
3. Установите зависимости: `npm install`
4. Проверьте что все работает

## Важно:

- Все таблицы должны быть созданы вручную через SQL миграции
- Имена таблиц в SQL должны соответствовать именам из Prisma schema (обычно lowercase с подчеркиваниями)
- Проверьте все связи между таблицами (foreign keys)
