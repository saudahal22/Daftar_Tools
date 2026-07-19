import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { ToolsModule } from './tools/tools.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { MinioModule } from './minio/minio.module';
import { RecommendModule } from './recommend/recommend.module';

@Module({
  imports: [
    // Load environment variables
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // MongoDB connection
    MongooseModule.forRoot(
      process.env.MONGO_URI ||
        'mongodb://admin:password123@localhost:27017/katalog-tools?authSource=admin',
    ),

    // Schedule module for cron jobs
    ScheduleModule.forRoot(),

    // Feature modules
    ToolsModule,
    IngestionModule,
    MinioModule,
    RecommendModule,
  ],
})
export class AppModule {}
