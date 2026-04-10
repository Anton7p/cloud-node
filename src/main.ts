import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule);

  app.enableShutdownHooks();

  const port = process.env.PORT || 3000;

  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Health check available at: http://localhost:${port}/health`);
}

bootstrap();
