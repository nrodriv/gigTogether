import * as dotenv from 'dotenv';
dotenv.config({ override: true });
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ConcertsModule } from './concerts/concerts.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.useWebSocketAdapter(new IoAdapter(app));

  app.useGlobalFilters(new HttpExceptionFilter());

  app.enableCors({ origin: process.env.ALLOWED_ORIGIN });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  if (process.env.NODE_ENV === 'production') {
    const config = new DocumentBuilder()
      .setTitle('GigTogether API')
      .setDescription('API pública de solo lectura. Consulta conciertos y ciudades disponibles.')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, config, {
      include: [ConcertsModule],
    });
    SwaggerModule.setup('api/docs', app, document);
  } else {
    const config = new DocumentBuilder()
      .setTitle('GigTogether API')
      .setDescription('Documentación completa de la API.')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}
bootstrap();
