import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

import { AppModule } from './app.module';

async function bootstrap() {
  BigInt.prototype['toJSON'] = function () {
    return parseInt(this);
  };

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  const jwtSecret = configService.get<string>('JWT_SECRET');
  if (!jwtSecret) {
    Logger.error(
      'CRITICAL: JWT_SECRET environment variable is missing!',
      'Bootstrap',
    );
    process.exit(1);
  }

  const port = configService.get('LOCAL_PORT') || 3000;
  const hostname = configService.get('HOST') || 'localhost';

  app.use(helmet());
  app.enableShutdownHooks();

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const corsOrigins = configService.get<string>('CORS_ORIGINS');
  const allowedOrigins = corsOrigins
    ? corsOrigins.split(',').map((o) => o.trim())
    : [configService.get<string>('BASE_URL') || 'http://localhost:3000'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  const enableSwagger =
    configService.get<string>('ENABLE_SWAGGER') === 'true' ||
    configService.get<string>('NODE_ENV') !== 'production';

  if (enableSwagger) {
    const config = new DocumentBuilder()
      .setTitle('Base API')
      .setDescription('Base API')
      .setVersion('1.0')
      .addBearerAuth({
        type: 'oauth2',
        flows: {
          password: {
            authorizationUrl: '',
            scopes: {},
            tokenUrl: `${configService.get('BASE_URL')}/auth/login`,
            refreshUrl: '',
          },
        },
      })
      .build();

    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, documentFactory);
  }

  await app.listen(process.env.PORT || port, '0.0.0.0');

  Logger.log(
    `🚀 Application is running on: http://${hostname}:${port}`,
    'Bootstrap',
  );
}
void bootstrap();
