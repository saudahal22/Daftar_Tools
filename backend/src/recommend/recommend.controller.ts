import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { RecommendService } from './recommend.service';

class RecommendRequestDto {
  /**
   * Pertanyaan pengguna tentang tool yang dicari
   * @example "Apa tool yang bagus untuk port scanning?"
   */
  @ApiProperty({ description: 'Pertanyaan pengguna', example: 'Apa tool yang bagus untuk port scanning?' })
  @IsString()
  @IsNotEmpty()
  question: string;
}

@ApiTags('recommend')
@Controller('api/recommend')
export class RecommendController {
  constructor(private readonly recommendService: RecommendService) {}

  /**
   * POST /api/recommend — AI Recommendation endpoint
   */
  @Post()
  @ApiOperation({
    summary: 'Dapatkan rekomendasi tool dari AI',
    description:
      'Kirimkan pertanyaan dalam bahasa natural (Indonesia/English) dan AI akan ' +
      'merekomendasikan tools yang relevan dari katalog. Menggunakan keyword matching ' +
      'atau MongoDB Atlas Vector Search untuk hasil yang akurat.',
  })
  @ApiBody({
    type: RecommendRequestDto,
    examples: {
      portScanning: {
        summary: 'Pertanyaan tentang port scanning',
        value: { question: 'Apa tool yang bagus untuk port scanning?' },
      },
      monitoring: {
        summary: 'Pertanyaan tentang monitoring',
        value: {
          question: 'Saya butuh tool untuk monitoring server dan metrics',
        },
      },
      cicd: {
        summary: 'Pertanyaan tentang CI/CD',
        value: {
          question:
            'Rekomendasi tool CI/CD pipeline untuk automation deployment',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Rekomendasi berhasil dibuat',
    schema: {
      example: {
        answer: 'Berdasarkan katalog kami, berikut tool yang relevan...',
        tools: [],
        method: 'keyword_matching',
      },
    },
  })
  async recommend(@Body() body: RecommendRequestDto) {
    return this.recommendService.getRecommendation(body.question);
  }
}
