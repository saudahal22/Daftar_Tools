import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional } from 'class-validator';

export class UpdateToolDto {
  @ApiProperty({
    description: 'Nama tool',
    example: 'Nmap',
    required: false,
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiProperty({
    description: 'Deskripsi tool',
    example: 'Updated description for the tool',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'URL icon',
    example: 'http://minio:9000/tool-icons/new-icon.png',
    required: false,
  })
  @IsString()
  @IsOptional()
  icon_url?: string;

  @ApiProperty({
    description: 'Kategori tool',
    example: 'DevOps',
    required: false,
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({
    description: 'Tags',
    example: ['updated', 'tools'],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({
    description: 'URL asli tool',
    example: 'https://example.com',
    required: false,
  })
  @IsString()
  @IsOptional()
  source_url?: string;
}
