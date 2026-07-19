import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsOptional,
  IsUrl,
} from 'class-validator';

export class CreateToolDto {
  @ApiProperty({ description: 'Nama tool', example: 'Nmap' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Deskripsi tool',
    example: 'Network exploration tool and security / port scanner',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    description: 'URL icon (akan diproses ke MinIO)',
    example: 'https://example.com/icon.png',
    required: false,
  })
  @IsString()
  @IsOptional()
  icon_url?: string;

  @ApiProperty({
    description: 'Kategori tool',
    example: 'Network Security',
  })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({
    description: 'Tags',
    example: ['scanner', 'network', 'security'],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({
    description: 'URL asli tool',
    example: 'https://nmap.org',
    required: false,
  })
  @IsString()
  @IsOptional()
  source_url?: string;
}
