import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { ToolsService } from './tools.service';
import { UpdateToolDto } from './dto/update-tool.dto';

@ApiTags('tools')
@Controller('api/tools')
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) {}

  /**
   * GET /api/tools — List semua tools dengan search & filter
   */
  @Get()
  @ApiOperation({
    summary: 'List semua tools',
    description:
      'Mendapatkan daftar tools dengan fitur pencarian (berdasarkan judul/deskripsi), ' +
      'filtering berdasarkan kategori dan tags, serta pagination.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Kata kunci pencarian (judul/deskripsi)',
    example: 'nmap',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter berdasarkan kategori',
    example: 'Network Security',
  })
  @ApiQuery({
    name: 'tags',
    required: false,
    description: 'Filter berdasarkan tags (comma-separated)',
    example: 'scanner,network',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Nomor halaman (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Jumlah item per halaman (default: 20)',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'Daftar tools berhasil diambil',
  })
  async findAll(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('tags') tags?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.toolsService.findAll(
      search,
      category,
      tags,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  /**
   * GET /api/tools/categories — Mendapatkan semua kategori unik
   */
  @Get('categories')
  @ApiOperation({
    summary: 'List semua kategori',
    description: 'Mendapatkan daftar kategori unik dari semua tools.',
  })
  @ApiResponse({
    status: 200,
    description: 'Daftar kategori berhasil diambil',
  })
  async getCategories() {
    return this.toolsService.getCategories();
  }

  /**
   * GET /api/tools/:id — Get tool by ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get tool berdasarkan ID',
    description: 'Mendapatkan detail tool berdasarkan ID MongoDB.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId dari tool' })
  @ApiResponse({ status: 200, description: 'Tool ditemukan' })
  @ApiResponse({ status: 404, description: 'Tool tidak ditemukan' })
  async findOne(@Param('id') id: string) {
    return this.toolsService.findOne(id);
  }

  /**
   * PATCH /api/tools/:id — Update tool (CMS edit)
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update tool berdasarkan ID',
    description:
      'Memperbarui detail tool secara parsial (judul, deskripsi, kategori, dll). ' +
      'Hanya field yang dikirim yang akan diperbarui.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId dari tool' })
  @ApiResponse({ status: 200, description: 'Tool berhasil diperbarui' })
  @ApiResponse({ status: 404, description: 'Tool tidak ditemukan' })
  async update(@Param('id') id: string, @Body() updateToolDto: UpdateToolDto) {
    return this.toolsService.update(id, updateToolDto);
  }

  /**
   * DELETE /api/tools/:id — Hapus tool
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Hapus tool berdasarkan ID',
    description: 'Menghapus tool dari database berdasarkan ID.',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId dari tool' })
  @ApiResponse({ status: 200, description: 'Tool berhasil dihapus' })
  @ApiResponse({ status: 404, description: 'Tool tidak ditemukan' })
  async remove(@Param('id') id: string) {
    return this.toolsService.remove(id);
  }
}
