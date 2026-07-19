import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Tool, ToolSchema } from './schemas/tool.schema';
import { ToolsService } from './tools.service';
import { ToolsController } from './tools.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Tool.name, schema: ToolSchema }]),
  ],
  controllers: [ToolsController],
  providers: [ToolsService],
  exports: [ToolsService],
})
export class ToolsModule {}
