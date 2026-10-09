// Application entry point.
// Sets up CORS, global prefix, global pipes/filters/interceptors, and starts the server.

import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Silence Nest's default logger noise in dev; use our own Logger.
    logger: ['error', 'warn', 'log'],
  });

  const config = app.get(ConfigService);
  const port = config.get<number>('port') ?? 4000;
  const apiPrefix = config.get<string>('apiPrefix') ?? 'api';
  const corsOrigin = config.get<string>('corsOrigin') ?? 'http://localhost:3000';

  // ---- Security & parsing middleware ----
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(cookieParser());

  // ---- CORS ----
  app.enableCors({
    origin: corsOrigin.split(',').map((s) => s.trim()),
    credentials: true,
  });

  // ---- Global API prefix ----
  app.setGlobalPrefix(apiPrefix);

  // ---- Global class-validator pipe (used only for DTOs without Zod pipe) ----
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  // ---- Global exception filter (consistent error responses) ----
  app.useGlobalFilters(new AllExceptionsFilter());

  // ---- Global response interceptor (consistent success responses) ----
  app.useGlobalInterceptors(new TransformInterceptor());

  // ---- Graceful shutdown (PM2 / Docker friendly) ----
  app.enableShutdownHooks();

  await app.listen(port, '0.0.0.0');

  const logger = new Logger('Bootstrap');
  logger.log(`🚀 API running at http://localhost:${port}/${apiPrefix}`);
  logger.log(`🌐 CORS allowed from: ${corsOrigin}`);
}

bootstrap().catch((err) => {
  // If bootstrap fails, log and exit with non-zero code.
  // eslint-disable-next-line no-console
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
