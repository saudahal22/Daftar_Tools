import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Tool, ToolSchema } from '../tools/schemas/tool.schema';
import { ToolsModule } from '../tools/tools.module';
import { RecommendService } from './recommend.service';
import { RecommendController } from './recommend.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Tool.name, schema: ToolSchema }]),
    ToolsModule,
  ],
  controllers: [RecommendController],
  providers: [RecommendService],
})
export class RecommendModule {}
