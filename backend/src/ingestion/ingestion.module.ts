import { Module } from '@nestjs/common';
import { ToolsModule } from '../tools/tools.module';
import { IngestionService } from './ingestion.service';
import { IngestionController } from './ingestion.controller';

@Module({
  imports: [ToolsModule],
  controllers: [IngestionController],
  providers: [IngestionService],
})
export class IngestionModule {}
