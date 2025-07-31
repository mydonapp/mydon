import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const PORT = configService.get<string>('API_PORT');
  const corsOrigins = configService.get<string>('CORS_ORIGINS');
  const enableApiDocs = configService.get<string>('ENABLE_API_DOCS') !== 'false';

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.use(cookieParser());
  app.use(helmet());

  // Configure CORS with environment-based origins
  const origins = corsOrigins
    ? corsOrigins.split(',').map((origin) => origin.trim())
    : ['http://localhost:4200']; // fallback for local development

  app.enableCors({
    origin: origins,
    credentials: true,
  });

  // Setup Swagger API documentation (configurable)
  if (enableApiDocs) {
    const config = new DocumentBuilder()
      .setTitle('MyDon API')
      .setDescription('MyDon - Personal Finance Tracker API')
      .setVersion('1.0')
      .addTag('auth', 'Authentication endpoints')
      .addTag('accounts', 'Account management')
      .addTag('transactions', 'Transaction management')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  app.enableShutdownHooks();

  await app.listen(PORT);
  Logger.log(`🚀 Application is running on: http://localhost:${PORT}`);
  
  if (enableApiDocs) {
    Logger.log(`📚 API Documentation available at: http://localhost:${PORT}/api/docs`);
  }
}

bootstrap();
