import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Swagger / OpenAPI setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Katalog Open Source IT Tools')
    .setDescription(
      'API untuk mengelola katalog tool IT open-source. ' +
      'Mendukung CRUD, pencarian, filtering, data ingestion dari GitHub Public REST API, ' +
      'penyimpanan gambar di MinIO, dan rekomendasi AI.',
    )
    .setVersion('1.0')
    .addTag('tools', 'Endpoint CRUD dan pencarian tool')
    .addTag('recommend', 'Endpoint rekomendasi AI')
    .addTag('ingestion', 'Endpoint data ingestion dari GitHub Public REST API')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Backend running on http://localhost:${port}`);
  console.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
}
bootstrap();
