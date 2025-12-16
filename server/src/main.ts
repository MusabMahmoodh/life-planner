import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AppModule } from './app.module';
import { EnvConfig } from './common/config/env.validation';

/**
 * Bootstrap the NestJS application.
 * Configures global pipes, filters, and middleware.
 */
async function bootstrap(): Promise<void> {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Get typed config
  const configService = app.get(ConfigService<EnvConfig, true>);
  const port = configService.get('PORT', { infer: true });
  const nodeEnv = configService.get('NODE_ENV', { infer: true });

  // Global validation pipe - validates all incoming DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error if unknown properties
      transform: true, // Transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: false, // Explicit conversions only
      },
      disableErrorMessages: nodeEnv === 'production', // Hide details in prod
      stopAtFirstError: false, // Return all validation errors
    }),
  );

  // Global prefix for all routes
  app.setGlobalPrefix('api/v1');

  // Enable CORS for frontend
  app.enableCors({
    origin: nodeEnv === 'production' ? false : true, // Configure per environment
    credentials: true,
  });

  // Graceful shutdown
  app.enableShutdownHooks();

  await app.listen(port);

  logger.log(`Application running on port ${port} in ${nodeEnv} mode`);
  logger.log(`API available at http://localhost:${port}/api/v1`);
}

bootstrap().catch((error: Error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start application', error.stack);
  process.exit(1);
});
