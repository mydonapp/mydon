import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const PORT = configService.get<string>('API_PORT');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    })
  );

  app.use(cookieParser());
  app.use(helmet());
  app.enableCors({ origin: 'http://localhost:4200', credentials: true });

  app.enableShutdownHooks();

  await app.listen(PORT);
  Logger.log(`🚀 Application is running on: http://localhost:${PORT}`);
}

bootstrap();
