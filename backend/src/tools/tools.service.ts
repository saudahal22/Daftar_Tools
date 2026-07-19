import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tool, ToolDocument } from './schemas/tool.schema';
import { CreateToolDto } from './dto/create-tool.dto';
import { UpdateToolDto } from './dto/update-tool.dto';

@Injectable()
export class ToolsService {
  private readonly logger = new Logger(ToolsService.name);

  constructor(
    @InjectModel(Tool.name) private toolModel: Model<ToolDocument>,
  ) {}

  /**
   * Membuat tool baru
   */
  async create(createToolDto: CreateToolDto): Promise<ToolDocument> {
    const created = new this.toolModel(createToolDto);
    this.logger.log(`Creating tool: ${createToolDto.title}`);
    return created.save();
  }

  /**
   * Mencari semua tools dengan fitur search dan filter.
   *
   * @param search - Kata kunci pencarian (judul/deskripsi)
   * @param category - Filter berdasarkan kategori
   * @param tags - Filter berdasarkan tags (comma-separated)
   * @param page - Halaman (pagination)
   * @param limit - Jumlah item per halaman
   */
  async findAll(
    search?: string,
    category?: string,
    tags?: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    tools: ToolDocument[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const filter: any = {};

    // Full-text search pada title, description, tags
    if (search && search.trim()) {
      filter.$text = { $search: search.trim() };
    }

    // Filter berdasarkan kategori (case-insensitive)
    if (category && category.trim()) {
      filter.category = { $regex: new RegExp(`^${category.trim()}$`, 'i') };
    }

    // Filter berdasarkan tags
    if (tags && tags.trim()) {
      const tagArray = tags.split(',').map((t) => t.trim().toLowerCase());
      filter.tags = { $in: tagArray };
    }

    const skip = (page - 1) * limit;

    // Build query with optional text score sorting
    let query = this.toolModel.find(filter);

    if (search && search.trim()) {
      // Sort by text relevance score when searching
      query = query
        .select({ score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } });
    } else {
      query = query.sort({ createdAt: -1 });
    }

    const [tools, total] = await Promise.all([
      query.skip(skip).limit(limit).exec(),
      this.toolModel.countDocuments(filter).exec(),
    ]);

    return {
      tools,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Mencari tool berdasarkan ID
   */
  async findOne(id: string): Promise<ToolDocument> {
    const tool = await this.toolModel.findById(id).exec();
    if (!tool) {
      throw new NotFoundException(`Tool dengan ID "${id}" tidak ditemukan`);
    }
    return tool;
  }

  /**
   * Memperbarui tool berdasarkan ID (partial update / PATCH)
   */
  async update(
    id: string,
    updateToolDto: UpdateToolDto,
  ): Promise<ToolDocument> {
    const updated = await this.toolModel
      .findByIdAndUpdate(id, { $set: updateToolDto }, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(`Tool dengan ID "${id}" tidak ditemukan`);
    }

    this.logger.log(`Updated tool: ${updated.title} (${id})`);
    return updated;
  }

  /**
   * Menghapus tool berdasarkan ID
   */
  async remove(id: string): Promise<{ deleted: boolean; id: string }> {
    const result = await this.toolModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Tool dengan ID "${id}" tidak ditemukan`);
    }
    this.logger.log(`Deleted tool: ${result.title} (${id})`);
    return { deleted: true, id };
  }

  /**
   * Upsert tool berdasarkan title (untuk data ingestion)
   */
  async upsertByTitle(toolData: CreateToolDto): Promise<ToolDocument> {
    const existing = await this.toolModel
      .findOneAndUpdate(
        { title: toolData.title },
        { $set: toolData },
        { new: true, upsert: true },
      )
      .exec();

    return existing;
  }

  /**
   * Mendapatkan semua kategori unik
   */
  async getCategories(): Promise<string[]> {
    return this.toolModel.distinct('category').exec();
  }

  /**
   * Mendapatkan semua tools (tanpa pagination, untuk AI recommendation)
   */
  async findAllRaw(): Promise<ToolDocument[]> {
    return this.toolModel.find().exec();
  }
}
