import { Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { IngestionService } from './ingestion.service';

@ApiTags('ingestion')
@Controller('api/ingestion')
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  /**
   * POST /api/ingestion/trigger — Manual trigger ingestion
   */
  @Post('trigger')
  @ApiOperation({
    summary: 'Trigger data ingestion secara manual',
    description:
      'Menjalankan proses crawling data tools IT open-source dari GitHub Public REST API ' +
      'secara manual. Gambar avatar repository akan didownload dan diupload ke MinIO.',
  })
  @ApiResponse({
    status: 201,
    description: 'Ingestion berhasil dimulai di background',
  })
  async triggerIngestion() {
    return this.ingestionService.triggerIngestion();
  }
}

