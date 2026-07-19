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
      'Menjalankan proses ingestion data dari RapidAPI (atau seed data) ' +
      'secara manual. Gambar akan didownload dan diupload ke MinIO.',
  })
  @ApiResponse({
    status: 201,
    description: 'Ingestion berhasil dijalankan',
  })
  async triggerIngestion() {
    return this.ingestionService.triggerIngestion();
  }
}
