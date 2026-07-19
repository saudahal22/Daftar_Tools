import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tool, ToolDocument } from '../tools/schemas/tool.schema';
import { ToolsService } from '../tools/tools.service';

/**
 * RecommendService — Logika rekomendasi AI untuk tool IT.
 *
 * Menggunakan dua pendekatan:
 * 1. Keyword Matching (default) — menggunakan MongoDB $text search
 * 2. Vector Search (MongoDB Atlas) — menggunakan $vectorSearch aggregation
 *
 * === TENTANG MONGODB ATLAS VECTOR SEARCH ===
 *
 * MongoDB Atlas Vector Search memungkinkan pencarian semantik yang jauh lebih
 * akurat dibandingkan pencarian teks biasa. Alih-alih mencocokkan kata kunci
 * secara literal, vector search memahami MAKNA dari pertanyaan pengguna.
 *
 * Contoh:
 * - Pertanyaan: "tool untuk mengecek celah keamanan website"
 * - Keyword search mungkin TIDAK menemukan "Burp Suite" karena kata "celah"
 *   dan "mengecek" tidak ada dalam deskripsi.
 * - Vector search AKAN menemukan "Burp Suite" karena embeddings menangkap
 *   bahwa "celah keamanan website" secara semantik mirip dengan
 *   "web application security testing".
 *
 * Cara setup di MongoDB Atlas:
 * 1. Buat cluster di MongoDB Atlas (M10+ tier)
 * 2. Buat Vector Search Index pada collection 'tools':
 *    {
 *      "type": "vectorSearch",
 *      "fields": [{
 *        "path": "embedding",
 *        "type": "vector",
 *        "numDimensions": 100,
 *        "similarity": "cosine"
 *      }]
 *    }
 * 3. Generate embeddings untuk setiap tool saat ingestion
 * 4. Gunakan $vectorSearch aggregation stage untuk query
 *
 * Keuntungan dibanding keyword search:
 * - Memahami sinonim dan konteks
 * - Multi-bahasa (bisa tanya dalam bahasa Indonesia)
 * - Lebih toleran terhadap typo dan variasi kata
 * - Hasil lebih relevan untuk pertanyaan natural language
 */
@Injectable()
export class RecommendService {
  private readonly logger = new Logger(RecommendService.name);

  // Vocabulary sederhana untuk TF-IDF embedding
  private vocabulary: string[] = [];
  private idfValues: Map<string, number> = new Map();

  constructor(
    @InjectModel(Tool.name) private toolModel: Model<ToolDocument>,
    private readonly toolsService: ToolsService,
  ) {}

  /**
   * Endpoint utama: menerima pertanyaan user, memberikan rekomendasi
   */
  async getRecommendation(question: string): Promise<{
    answer: string;
    tools: ToolDocument[];
    method: string;
  }> {
    this.logger.log(`Recommendation request: "${question}"`);

    // Coba Vector Search dulu (jika di MongoDB Atlas)
    try {
      const vectorResults = await this.vectorSearch(question);
      if (vectorResults.length > 0) {
        return {
          answer: this.generateAnswer(question, vectorResults),
          tools: vectorResults,
          method: 'vector_search',
        };
      }
    } catch (error) {
      this.logger.warn(
        `Vector search tidak tersedia, fallback ke keyword matching: ${error.message}`,
      );
    }

    // Fallback: Keyword Matching
    const keywordResults = await this.keywordSearch(question);
    return {
      answer: this.generateAnswer(question, keywordResults),
      tools: keywordResults,
      method: 'keyword_matching',
    };
  }

  /**
   * MODE 1: Keyword Matching
   *
   * Strategi:
   * 1. Ekstrak kata kunci dari pertanyaan
   * 2. Gunakan MongoDB $text search
   * 3. Rank berdasarkan textScore
   * 4. Boost score berdasarkan tag matching
   */
  private async keywordSearch(question: string): Promise<ToolDocument[]> {
    // Ekstrak keywords (hapus stop words)
    const keywords = this.extractKeywords(question);
    const searchQuery = keywords.join(' ');

    this.logger.log(`Keyword search: "${searchQuery}"`);

    if (!searchQuery.trim()) {
      // Jika tidak ada keyword yang bermakna, return random 5
      return this.toolModel.find().limit(5).exec();
    }

    try {
      // MongoDB full-text search dengan text score
      const results = await this.toolModel
        .find(
          { $text: { $search: searchQuery } },
          { score: { $meta: 'textScore' } },
        )
        .sort({ score: { $meta: 'textScore' } })
        .limit(5)
        .exec();

      if (results.length > 0) {
        return results;
      }
    } catch (error) {
      this.logger.warn(`Text search gagal: ${error.message}`);
    }

    // Fallback: regex search pada title dan description
    const regexPattern = keywords
      .map((k) => `(?=.*${this.escapeRegex(k)})`)
      .join('');

    const regexResults = await this.toolModel
      .find({
        $or: [
          { title: { $regex: regexPattern, $options: 'i' } },
          { description: { $regex: regexPattern, $options: 'i' } },
          { tags: { $in: keywords.map((k) => new RegExp(k, 'i')) } },
        ],
      })
      .limit(5)
      .exec();

    return regexResults;
  }

  /**
   * MODE 2: MongoDB Atlas Vector Search
   *
   * Menggunakan $vectorSearch aggregation stage.
   * HANYA berfungsi di MongoDB Atlas dengan Vector Search Index.
   *
   * Untuk menggunakan fitur ini:
   * 1. Deploy MongoDB ke Atlas
   * 2. Buat vector search index pada field 'embedding'
   * 3. Generate embeddings saat ingestion (OpenAI / TF-IDF)
   */
  private async vectorSearch(question: string): Promise<ToolDocument[]> {
    // Generate embedding dari pertanyaan
    const queryEmbedding = this.generateSimpleEmbedding(question);

    if (queryEmbedding.length === 0) {
      throw new Error('Embedding kosong');
    }

    // MongoDB Atlas $vectorSearch aggregation
    const results = await this.toolModel
      .aggregate([
        {
          $vectorSearch: {
            index: 'vector_index', // Nama index di Atlas
            path: 'embedding',
            queryVector: queryEmbedding,
            numCandidates: 50,
            limit: 5,
          },
        },
        {
          $project: {
            title: 1,
            description: 1,
            icon_url: 1,
            category: 1,
            tags: 1,
            source_url: 1,
            score: { $meta: 'vectorSearchScore' },
          },
        },
      ])
      .exec();

    return results;
  }

  /**
   * Generate jawaban berdasarkan hasil pencarian
   *
   * Prompt/logika untuk menyusun jawaban yang informatif
   */
  private generateAnswer(question: string, tools: ToolDocument[]): string {
    if (tools.length === 0) {
      return (
        `Maaf, saya tidak menemukan tool yang cocok untuk pertanyaan: "${question}". ` +
        `Coba gunakan kata kunci yang lebih spesifik, misalnya nama kategori seperti ` +
        `"Network Security", "DevOps", "Monitoring", dll.`
      );
    }

    const toolList = tools
      .map(
        (t, i) =>
          `${i + 1}. **${t.title}** (${t.category}): ${t.description.substring(0, 120)}...`,
      )
      .join('\n');

    return (
      `Berdasarkan katalog kami, berikut ${tools.length} tool yang relevan ` +
      `untuk pertanyaan "${question}":\n\n${toolList}\n\n` +
      `💡 Tip: Klik pada tool untuk melihat detail lengkap dan link download.`
    );
  }

  /**
   * Ekstrak keywords dari pertanyaan (hapus stop words Indonesia + English)
   */
  private extractKeywords(question: string): string[] {
    const stopWords = new Set([
      // Indonesian stop words
      'apa', 'yang', 'untuk', 'dan', 'di', 'ke', 'dari', 'ini', 'itu',
      'dengan', 'adalah', 'pada', 'tidak', 'akan', 'juga', 'sudah',
      'bisa', 'ada', 'saya', 'mereka', 'kita', 'atau', 'tapi', 'bagus',
      'baik', 'tool', 'tools', 'alat', 'cara', 'buat', 'bikin', 'cari',
      'rekomendasi', 'rekomendasikan', 'sarankan', 'saran',
      // English stop words
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
      'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'could', 'should', 'may', 'might', 'can', 'shall',
      'what', 'which', 'who', 'whom', 'this', 'that', 'these',
      'those', 'am', 'for', 'not', 'or', 'but', 'if', 'then',
      'than', 'too', 'very', 'just', 'about', 'above', 'after',
      'good', 'best', 'recommend', 'suggestion', 'find', 'search',
    ]);

    return question
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.has(word));
  }

  /**
   * Generate embedding sederhana menggunakan TF-IDF-like approach
   *
   * Untuk production, ganti dengan OpenAI Embeddings API:
   *
   * ```typescript
   * async generateEmbedding(text: string): Promise<number[]> {
   *   const response = await axios.post(
   *     'https://api.openai.com/v1/embeddings',
   *     {
   *       model: 'text-embedding-3-small',
   *       input: text,
   *     },
   *     {
   *       headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
   *     }
   *   );
   *   return response.data.data[0].embedding;
   * }
   * ```
   */
  private generateSimpleEmbedding(text: string): number[] {
    // Vocabulary berbasis domain IT security & tools
    const domainVocab = [
      'network', 'security', 'scanner', 'port', 'vulnerability',
      'penetration', 'testing', 'firewall', 'monitoring', 'docker',
      'container', 'kubernetes', 'deployment', 'automation', 'ci',
      'cd', 'pipeline', 'cloud', 'server', 'proxy', 'reverse',
      'load', 'balancer', 'database', 'api', 'web', 'application',
      'encryption', 'authentication', 'authorization', 'logging',
      'metrics', 'dashboard', 'visualization', 'analytics',
      'infrastructure', 'provisioning', 'configuration', 'management',
      'devops', 'git', 'repository', 'build', 'integration',
      'packet', 'capture', 'protocol', 'analyzer', 'exploit',
      'framework', 'alerting', 'time-series', 'agentless',
      'orchestration', 'scaling', 'cluster', 'microservices',
      'secrets', 'vault', 'hash', 'ssl', 'tls', 'certificate',
      'dns', 'http', 'https', 'ssh', 'ftp', 'smtp', 'snmp',
      'tcp', 'udp', 'ip', 'icmp', 'arp', 'vpn', 'ids', 'ips',
      'siem', 'log', 'audit', 'compliance', 'backup', 'restore',
      'disaster', 'recovery', 'performance', 'benchmark', 'stress',
      'test', 'scan', 'detect', 'prevent', 'protect', 'secure',
      'open-source', 'free', 'community', 'enterprise', 'platform',
      'tool', 'toolkit', 'suite', 'collection', 'bundle',
      'linux', 'windows', 'macos', 'cross-platform', 'cli',
      'gui', 'interface', 'plugin', 'extension', 'module',
      'search', 'index', 'query', 'filter', 'sort', 'aggregate',
      'real-time', 'distributed', 'scalable', 'lightweight',
    ];

    const words = text.toLowerCase().split(/\s+/);
    const wordSet = new Set(words);

    // Simple binary + frequency embedding
    return domainVocab.map((term) => {
      if (wordSet.has(term)) {
        return 1.0;
      }
      // Partial match
      for (const word of words) {
        if (word.includes(term) || term.includes(word)) {
          return 0.5;
        }
      }
      return 0.0;
    });
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
