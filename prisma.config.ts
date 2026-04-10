import 'dotenv/config'; // Обязательно первым делом для загрузки .env
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    // В Prisma 7 используем process.env напрямую или хелпер env()
    url: process.env.DATABASE_URL,
  },
});
