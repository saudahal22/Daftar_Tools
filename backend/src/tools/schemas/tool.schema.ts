import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type ToolDocument = Tool & Document;

@Schema({ timestamps: true })
export class Tool {
  @ApiProperty({ description: 'Nama tool', example: 'Nmap' })
  @Prop({ required: true, index: true })
  title: string;

  @ApiProperty({
    description: 'Deskripsi lengkap tool',
    example: 'Network exploration tool and security / port scanner',
  })
  @Prop({ required: true })
  description: string;

  @ApiProperty({
    description: 'URL icon gambar di MinIO',
    example: 'http://minio:9000/tool-icons/nmap-icon.png',
  })
  @Prop({ default: '' })
  icon_url: string;

  @ApiProperty({
    description: 'Kategori tool',
    example: 'Network Security',
  })
  @Prop({ required: true, index: true })
  category: string;

  @ApiProperty({
    description: 'Tags untuk filtering',
    example: ['scanner', 'network', 'security'],
  })
  @Prop({ type: [String], default: [] })
  tags: string[];

  @ApiProperty({
    description: 'URL asli tool (website/repository)',
    example: 'https://nmap.org',
  })
  @Prop({ default: '' })
  source_url: string;

  @ApiProperty({
    description: 'URL icon asli dari sumber (sebelum upload ke MinIO)',
    example: 'https://example.com/nmap-icon.png',
  })
  @Prop({ default: '' })
  original_icon_url: string;

  @ApiProperty({
    description: 'Vector embedding untuk AI recommendation (TF-IDF atau model)',
    type: [Number],
  })
  @Prop({ type: [Number], default: [] })
  embedding: number[];
}

export const ToolSchema = SchemaFactory.createForClass(Tool);

// Create text index for full-text search on title and description
ToolSchema.index({ title: 'text', description: 'text', tags: 'text' });
