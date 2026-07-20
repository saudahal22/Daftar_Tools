import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosRequestConfig } from 'axios';
import { ToolsService } from '../tools/tools.service';
import { MinioService } from '../minio/minio.service';

// ─────────────────────────────────────────────────────────────────────────────
// Konstanta konfigurasi crawling
// ─────────────────────────────────────────────────────────────────────────────

/** Jumlah item per halaman (maksimum GitHub API) */
const PER_PAGE = 100;

/** Delay default antar request (ms) — untuk menghormati rate limit */
const REQUEST_DELAY_MS = 700;

/** Delay saat rate limit habis (ms) */
const RATE_LIMIT_PAUSE_MS = 62_000; // 62 detik

/** Jumlah maksimum retry per request */
const MAX_RETRIES = 3;

/** Target minimal sebelum dianggap selesai */
const TARGET_UNIQUE = 6_000;

/** Threshold auto-seed: jika DB < nilai ini, jalankan crawling */
const AUTOSEED_THRESHOLD = 5_000;

// ─────────────────────────────────────────────────────────────────────────────
// Pemetaan Topik → Kategori
// ─────────────────────────────────────────────────────────────────────────────
const TOPIC_CATEGORY_MAP: Record<string, string> = {
  security: 'Network Security',
  networking: 'Network Security',
  firewall: 'Network Security',
  'network-security': 'Network Security',
  ids: 'Network Security',
  ips: 'Network Security',
  nmap: 'Network Security',
  wireshark: 'Network Security',

  pentesting: 'Penetration Testing',
  exploit: 'Penetration Testing',
  vulnerability: 'Penetration Testing',
  'red-team': 'Penetration Testing',
  'penetration-testing': 'Penetration Testing',
  ctf: 'Penetration Testing',
  hacking: 'Penetration Testing',
  malware: 'Penetration Testing',
  osint: 'Penetration Testing',

  devops: 'DevOps & Containers',
  kubernetes: 'DevOps & Containers',
  docker: 'DevOps & Containers',
  container: 'DevOps & Containers',
  helm: 'DevOps & Containers',
  podman: 'DevOps & Containers',
  'docker-compose': 'DevOps & Containers',
  microservices: 'DevOps & Containers',
  'service-mesh': 'DevOps & Containers',
  istio: 'DevOps & Containers',

  terraform: 'Cloud & Infrastructure',
  infrastructure: 'Cloud & Infrastructure',
  'infrastructure-as-code': 'Cloud & Infrastructure',
  ansible: 'Cloud & Infrastructure',
  pulumi: 'Cloud & Infrastructure',
  cloudformation: 'Cloud & Infrastructure',
  aws: 'Cloud & Infrastructure',
  azure: 'Cloud & Infrastructure',
  gcp: 'Cloud & Infrastructure',
  cloud: 'Cloud & Infrastructure',

  'ci-cd': 'CI/CD & Automation',
  'continuous-integration': 'CI/CD & Automation',
  automation: 'CI/CD & Automation',
  jenkins: 'CI/CD & Automation',
  'github-actions': 'CI/CD & Automation',
  'gitlab-ci': 'CI/CD & Automation',
  pipeline: 'CI/CD & Automation',
  'github-actions-workflow': 'CI/CD & Automation',

  monitoring: 'Monitoring & Observability',
  observability: 'Monitoring & Observability',
  logging: 'Monitoring & Observability',
  metrics: 'Monitoring & Observability',
  grafana: 'Monitoring & Observability',
  prometheus: 'Monitoring & Observability',
  tracing: 'Monitoring & Observability',
  apm: 'Monitoring & Observability',
  alerting: 'Monitoring & Observability',
  opentelemetry: 'Monitoring & Observability',

  database: 'Database & Storage',
  storage: 'Database & Storage',
  nosql: 'Database & Storage',
  sql: 'Database & Storage',
  redis: 'Database & Storage',
  mongodb: 'Database & Storage',
  postgresql: 'Database & Storage',
  mysql: 'Database & Storage',
  elasticsearch: 'Database & Storage',
  cache: 'Database & Storage',
  'time-series': 'Database & Storage',
  influxdb: 'Database & Storage',

  'web-server': 'Web Server & Proxy',
  nginx: 'Web Server & Proxy',
  proxy: 'Web Server & Proxy',
  'reverse-proxy': 'Web Server & Proxy',
  'load-balancer': 'Web Server & Proxy',
  'api-gateway': 'Web Server & Proxy',
  traefik: 'Web Server & Proxy',
  haproxy: 'Web Server & Proxy',

  cryptography: 'Security & Cryptography',
  encryption: 'Security & Cryptography',
  'secrets-management': 'Security & Cryptography',
  vault: 'Security & Cryptography',
  pki: 'Security & Cryptography',
  tls: 'Security & Cryptography',
  jwt: 'Security & Cryptography',
  auth: 'Security & Cryptography',
  oauth: 'Security & Cryptography',

  linter: 'Code Analysis & Security',
  'code-quality': 'Code Analysis & Security',
  'static-analysis': 'Code Analysis & Security',
  sast: 'Code Analysis & Security',
  sonar: 'Code Analysis & Security',
  eslint: 'Code Analysis & Security',
  formatter: 'Code Analysis & Security',
  'code-review': 'Code Analysis & Security',

  react: 'Web Development',
  nextjs: 'Web Development',
  vue: 'Web Development',
  angular: 'Web Development',
  svelte: 'Web Development',
  'web-development': 'Web Development',
  frontend: 'Web Development',
  backend: 'Web Development',
  fullstack: 'Web Development',
  'rest-api': 'Web Development',
  graphql: 'Web Development',
  nodejs: 'Web Development',
  fastapi: 'Web Development',
  django: 'Web Development',
  laravel: 'Web Development',
  nestjs: 'Web Development',
  framework: 'Web Development',
  typescript: 'Web Development',
  javascript: 'Web Development',

  'machine-learning': 'AI & Data Science',
  'deep-learning': 'AI & Data Science',
  'artificial-intelligence': 'AI & Data Science',
  'data-science': 'AI & Data Science',
  nlp: 'AI & Data Science',
  'computer-vision': 'AI & Data Science',
  tensorflow: 'AI & Data Science',
  pytorch: 'AI & Data Science',
  llm: 'AI & Data Science',
  'generative-ai': 'AI & Data Science',
  chatbot: 'AI & Data Science',
  'neural-network': 'AI & Data Science',
  ai: 'AI & Data Science',
  'data-analysis': 'AI & Data Science',

  cli: 'System Utilities',
  'command-line': 'System Utilities',
  terminal: 'System Utilities',
  shell: 'System Utilities',
  'system-utility': 'System Utilities',
  productivity: 'System Utilities',
  'file-manager': 'System Utilities',
  'process-manager': 'System Utilities',
  linux: 'System Utilities',
  unix: 'System Utilities',
  bash: 'System Utilities',
  zsh: 'System Utilities',

  'reverse-engineering': 'Reverse Engineering',
  'binary-analysis': 'Reverse Engineering',
  decompiler: 'Reverse Engineering',
  disassembler: 'Reverse Engineering',
  'malware-analysis': 'Reverse Engineering',
  debugging: 'Reverse Engineering',
  ghidra: 'Reverse Engineering',

  'mobile-security': 'Mobile & Wireless',
  android: 'Mobile & Wireless',
  ios: 'Mobile & Wireless',
  'wireless-security': 'Mobile & Wireless',
  wifi: 'Mobile & Wireless',
  bluetooth: 'Mobile & Wireless',

  testing: 'Testing & QA',
  'unit-testing': 'Testing & QA',
  'integration-testing': 'Testing & QA',
  'end-to-end': 'Testing & QA',
  'performance-testing': 'Testing & QA',
  jest: 'Testing & QA',
  pytest: 'Testing & QA',
  'load-testing': 'Testing & QA',
  selenium: 'Testing & QA',
  playwright: 'Testing & QA',

  plugin: 'Developer Tools',
  extension: 'Developer Tools',
  'developer-tools': 'Developer Tools',
  ide: 'Developer Tools',
  vscode: 'Developer Tools',
  'package-manager': 'Developer Tools',
  sdk: 'Developer Tools',
  api: 'Developer Tools',
  library: 'Developer Tools',
  boilerplate: 'Developer Tools',
  template: 'Developer Tools',

  analytics: 'Analytics & BI',
  'data-visualization': 'Analytics & BI',
  dashboard: 'Analytics & BI',
  'business-intelligence': 'Analytics & BI',
  etl: 'Analytics & BI',
  'data-pipeline': 'Analytics & BI',
};

/** Inferensi kategori dari topik-topik repo */
function inferCategory(topics: string[], defaultCat = 'Developer Tools'): string {
  for (const t of topics) {
    const cat = TOPIC_CATEGORY_MAP[t.toLowerCase()];
    if (cat) return cat;
  }
  return defaultCat;
}

// ─────────────────────────────────────────────────────────────────────────────
// Query Strategies
// ─────────────────────────────────────────────────────────────────────────────

/** Strategy 1: Topic-based search (GitHub Topics API) */
const GITHUB_TOPICS = [
  'security', 'pentesting', 'vulnerability', 'network-security',
  'penetration-testing', 'osint', 'malware', 'ctf', 'red-team',
  'devops', 'kubernetes', 'docker', 'helm', 'podman', 'microservices',
  'terraform', 'ansible', 'infrastructure-as-code', 'pulumi', 'cloud',
  'ci-cd', 'continuous-integration', 'automation', 'github-actions', 'pipeline',
  'monitoring', 'observability', 'prometheus', 'grafana', 'opentelemetry',
  'database', 'postgresql', 'redis', 'mongodb', 'elasticsearch', 'time-series',
  'web-server', 'nginx', 'proxy', 'load-balancer', 'api-gateway',
  'cryptography', 'encryption', 'jwt', 'oauth',
  'linter', 'code-quality', 'static-analysis', 'formatter',
  'react', 'nextjs', 'vue', 'angular', 'svelte', 'django', 'laravel', 'fastapi', 'nestjs',
  'machine-learning', 'deep-learning', 'nlp', 'tensorflow', 'pytorch', 'llm', 'chatbot',
  'cli', 'terminal', 'shell', 'productivity', 'linux',
  'reverse-engineering', 'binary-analysis', 'debugging',
  'testing', 'jest', 'pytest', 'playwright', 'load-testing',
  'plugin', 'extension', 'vscode', 'sdk',
  'analytics', 'data-visualization', 'dashboard', 'etl',
  'mobile-security', 'android', 'ios',
  'graphql', 'rest-api', 'typescript', 'javascript', 'python', 'golang', 'rust', 'java',
];

/** Strategy 2: Keyword + Language search */
const SEARCH_KEYWORDS = [
  'tool', 'framework', 'library', 'toolkit', 'platform',
  'cli tool', 'dev tool', 'developer tool',
  'automation tool', 'security tool', 'monitoring tool',
  'open source tool', 'productivity tool', 'testing tool',
  'web scraper', 'api client', 'database client',
  'log analyzer', 'code generator', 'code scanner',
  'performance profiler', 'network scanner', 'vulnerability scanner',
];

const SEARCH_LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Go', 'Rust',
  'Java', 'C++', 'C', 'Shell', 'Ruby', 'PHP',
];

/** Strategy 3: Stars range dengan topic populer */
const STAR_RANGES = [
  { min: 500, max: 1000 },
  { min: 1000, max: 5000 },
  { min: 5000, max: 50000 },
  { min: 100, max: 500 },
  { min: 50, max: 100 },
  { min: 10, max: 50 },
];

/** Strategy 4: Date ranges untuk distribusi hasil */
const DATE_RANGES = [
  { from: '2019-01-01', to: '2019-12-31' },
  { from: '2020-01-01', to: '2020-06-30' },
  { from: '2020-07-01', to: '2020-12-31' },
  { from: '2021-01-01', to: '2021-06-30' },
  { from: '2021-07-01', to: '2021-12-31' },
  { from: '2022-01-01', to: '2022-06-30' },
  { from: '2022-07-01', to: '2022-12-31' },
  { from: '2023-01-01', to: '2023-06-30' },
  { from: '2023-07-01', to: '2023-12-31' },
  { from: '2024-01-01', to: '2024-12-31' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Ingestion Service
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class IngestionService implements OnModuleInit {
  private readonly logger = new Logger(IngestionService.name);

  /** Set of GitHub repo IDs yang sudah dikumpulkan (in-memory deduplication) */
  private seenGithubIds = new Set<number>();

  constructor(
    private readonly toolsService: ToolsService,
    private readonly minioService: MinioService,
    private readonly configService: ConfigService,
  ) {}

  // ───────────────────────────────────────────────────────────────────────────
  // Lifecycle Hooks
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Saat modul diinisialisasi, auto-seed jika database < AUTOSEED_THRESHOLD
   */
  async onModuleInit() {
    try {
      const result = await this.toolsService.findAll(undefined, undefined, undefined, 1, 1);
      if (result.total < AUTOSEED_THRESHOLD) {
        this.logger.log(
          `Database tools (${result.total}) < ${AUTOSEED_THRESHOLD}. Menjalankan auto-crawl dari GitHub API...`,
        );
        // Jalankan async agar tidak memblokir startup
        this.handleIngestionCron().catch((err) =>
          this.logger.error(`Auto-crawl error: ${err.message}`),
        );
      } else {
        this.logger.log(`Database sudah memiliki ${result.total} tools. Skip auto-crawl.`);
      }
    } catch (error) {
      this.logger.warn(`Gagal cek jumlah tools: ${error.message}`);
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Cron Job
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Cron job: Jalankan crawling setiap 24 jam (midnight)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleIngestionCron() {
    this.logger.log('╔══════════════════════════════════════════╗');
    this.logger.log('║   GitHub Repository Crawler — DIMULAI    ║');
    this.logger.log('╚══════════════════════════════════════════╝');

    this.seenGithubIds.clear();

    const startTime = Date.now();
    const allTools: any[] = [];

    try {
      // ── Strategy 1: Topic-based Search ──────────────────────────────────
      this.logger.log('▶ Strategy 1: Topic-based Search');
      const topicTools = await this.crawlByTopics();
      this.mergeTools(allTools, topicTools);
      this.logProgress(allTools, startTime, 'Strategy 1 selesai');

      if (allTools.length < TARGET_UNIQUE) {
        // ── Strategy 2: Keyword + Language Search ──────────────────────
        this.logger.log('▶ Strategy 2: Keyword + Language Search');
        const keywordTools = await this.crawlByKeywordsAndLanguages();
        this.mergeTools(allTools, keywordTools);
        this.logProgress(allTools, startTime, 'Strategy 2 selesai');
      }

      if (allTools.length < TARGET_UNIQUE) {
        // ── Strategy 3: Stars Range Search ─────────────────────────────
        this.logger.log('▶ Strategy 3: Stars Range Search');
        const starsTools = await this.crawlByStarsRange();
        this.mergeTools(allTools, starsTools);
        this.logProgress(allTools, startTime, 'Strategy 3 selesai');
      }

      if (allTools.length < TARGET_UNIQUE) {
        // ── Strategy 4: Date Range Search ──────────────────────────────
        this.logger.log('▶ Strategy 4: Date Range Search');
        const dateTools = await this.crawlByDateRange();
        this.mergeTools(allTools, dateTools);
        this.logProgress(allTools, startTime, 'Strategy 4 selesai');
      }

      // ── Hasil Akhir ────────────────────────────────────────────
      const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
      this.logger.log('╔══════════════════════════════════════════════════╗');
      this.logger.log(`║  CRAWLING SELESAI: ${allTools.length} tools dalam ${elapsed} menit  ║`);
      this.logger.log('╚══════════════════════════════════════════════════╝');
    } catch (error) {
      this.logger.error(`Ingestion gagal: ${error.message}`);
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Strategy 1: Topic-based Search
  // ───────────────────────────────────────────────────────────────────────────

  private async crawlByTopics(): Promise<any[]> {
    const results: any[] = [];

    for (const topic of GITHUB_TOPICS) {
      const category = TOPIC_CATEGORY_MAP[topic] || 'Developer Tools';
      this.logger.log(`  📌 Topic: "${topic}" [${category}]`);

      // Ambil 2 halaman per topik (200 repo/topic)
      for (let page = 1; page <= 2; page++) {
        const query = `topic:${topic}`;
        const items = await this.searchRepositories(query, page);
        if (!items || items.length === 0) break;

        const mapped = this.mapItems(items, category);
        if (mapped.length > 0) {
          results.push(...mapped);

          // Simpan LANGSUNG ke MongoDB secara real-time (incremental)
          const savedCount = await this.toolsService.upsertByGithubIdBulk(mapped);
          this.logger.log(
            `    ↳ Hal ${page}: +${mapped.length} repo (${savedCount} tersimpan ke DB) | Total Strategy 1: ${results.length}`,
          );
        }

        if (items.length < PER_PAGE) break; // Tidak ada halaman berikutnya
        await this.sleep(REQUEST_DELAY_MS);
      }

      await this.sleep(REQUEST_DELAY_MS);
    }

    return results;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Strategy 2: Keyword + Language Search
  // ───────────────────────────────────────────────────────────────────────────

  private async crawlByKeywordsAndLanguages(): Promise<any[]> {
    const results: any[] = [];

    for (const keyword of SEARCH_KEYWORDS) {
      for (const lang of SEARCH_LANGUAGES) {
        const query = `${keyword} language:${lang} stars:>10`;
        this.logger.log(`  🔍 Keyword: "${keyword}" + Language: ${lang}`);

        const items = await this.searchRepositories(query, 1);
        if (!items || items.length === 0) continue;

        const mapped = this.mapItems(items, 'Developer Tools');
        if (mapped.length > 0) {
          results.push(...mapped);
          const savedCount = await this.toolsService.upsertByGithubIdBulk(mapped);
          this.logger.log(
            `    ↳ +${mapped.length} repo (${savedCount} tersimpan ke DB) | Total Strategy 2: ${results.length}`,
          );
        }

        await this.sleep(REQUEST_DELAY_MS);
      }
    }

    return results;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Strategy 3: Stars Range Search
  // ───────────────────────────────────────────────────────────────────────────

  private async crawlByStarsRange(): Promise<any[]> {
    const results: any[] = [];
    const keyTopics = [
      'cli', 'devops', 'security', 'machine-learning', 'web-development',
      'testing', 'monitoring', 'database', 'automation',
    ];

    for (const topic of keyTopics) {
      for (const range of STAR_RANGES) {
        const query = `topic:${topic} stars:${range.min}..${range.max}`;
        this.logger.log(`  ⭐ Stars ${range.min}..${range.max} + topic:${topic}`);

        const items = await this.searchRepositories(query, 1);
        if (!items || items.length === 0) continue;

        const category = TOPIC_CATEGORY_MAP[topic] || 'Developer Tools';
        const mapped = this.mapItems(items, category);
        if (mapped.length > 0) {
          results.push(...mapped);
          const savedCount = await this.toolsService.upsertByGithubIdBulk(mapped);
          this.logger.log(
            `    ↳ +${mapped.length} repo (${savedCount} tersimpan ke DB) | Total Strategy 3: ${results.length}`,
          );
        }

        await this.sleep(REQUEST_DELAY_MS);
      }
    }

    return results;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Strategy 4: Date Range Search
  // ───────────────────────────────────────────────────────────────────────────

  private async crawlByDateRange(): Promise<any[]> {
    const results: any[] = [];
    const keyTopics = ['tool', 'framework', 'library', 'cli', 'automation'];

    for (const topic of keyTopics) {
      for (const dateRange of DATE_RANGES) {
        const query = `topic:${topic} created:${dateRange.from}..${dateRange.to} stars:>20`;
        this.logger.log(`  📅 Date: ${dateRange.from}..${dateRange.to} + topic:${topic}`);

        const items = await this.searchRepositories(query, 1);
        if (!items || items.length === 0) continue;

        const category = TOPIC_CATEGORY_MAP[topic] || 'Developer Tools';
        const mapped = this.mapItems(items, category);
        if (mapped.length > 0) {
          results.push(...mapped);
          const savedCount = await this.toolsService.upsertByGithubIdBulk(mapped);
          this.logger.log(
            `    ↳ +${mapped.length} repo (${savedCount} tersimpan ke DB) | Total Strategy 4: ${results.length}`,
          );
        }

        await this.sleep(REQUEST_DELAY_MS);
      }
    }

    return results;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Core: GitHub Search API dengan Retry + Rate Limit Handling
  // ───────────────────────────────────────────────────────────────────────────

  private async searchRepositories(query: string, page: number): Promise<any[]> {
    const githubToken = this.configService.get<string>('GITHUB_TOKEN');
    const headers: Record<string, string> = {
      'User-Agent': 'KatalogITTools-Crawler/2.0',
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };

    if (githubToken && githubToken.trim() && !githubToken.includes('isi_token')) {
      headers['Authorization'] = `Bearer ${githubToken.trim()}`;
    }

    const config: AxiosRequestConfig = {
      headers,
      timeout: 15_000,
      params: {
        q: query,
        sort: 'stars',
        order: 'desc',
        per_page: PER_PAGE,
        page,
      },
    };

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const res = await axios.get('https://api.github.com/search/repositories', config);

        // Log sisa rate limit
        const remaining = res.headers['x-ratelimit-remaining'];
        const resetAt = res.headers['x-ratelimit-reset'];
        if (remaining !== undefined) {
          this.logger.debug(
            `    Rate Limit: ${remaining} sisa | Reset: ${new Date(Number(resetAt) * 1000).toLocaleTimeString()}`,
          );
        }

        return res.data?.items ?? [];
      } catch (err: any) {
        const status = err?.response?.status;
        const retryAfter = err?.response?.headers?.['retry-after'];
        const rateLimitReset = err?.response?.headers?.['x-ratelimit-reset'];

        if (status === 403 || status === 429) {
          // Rate limit habis — tunggu hingga reset
          let waitMs = RATE_LIMIT_PAUSE_MS;
          if (rateLimitReset) {
            const resetTime = Number(rateLimitReset) * 1000;
            waitMs = Math.max(resetTime - Date.now() + 2000, RATE_LIMIT_PAUSE_MS);
          } else if (retryAfter) {
            waitMs = Number(retryAfter) * 1000 + 2000;
          }
          this.logger.warn(
            `⏳ Rate limit habis! Menunggu ${(waitMs / 1000).toFixed(0)} detik... (attempt ${attempt}/${MAX_RETRIES})`,
          );
          await this.sleep(waitMs);
          continue;
        }

        if (status === 422) {
          // Query tidak valid (bisa terjadi pada kombinasi filter ekstrem)
          this.logger.debug(`Query tidak valid, dilewati: "${query}"`);
          return [];
        }

        if (attempt < MAX_RETRIES) {
          const backoff = attempt * 2000;
          this.logger.warn(
            `Retry ${attempt}/${MAX_RETRIES} untuk query "${query}" (${err.message}) — tunggu ${backoff}ms`,
          );
          await this.sleep(backoff);
        } else {
          this.logger.warn(`Gagal setelah ${MAX_RETRIES} percobaan: "${query}" — ${err.message}`);
          return [];
        }
      }
    }

    return [];
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Helpers
  // ───────────────────────────────────────────────────────────────────────────

  /** Mapping item GitHub API → format Tool */
  private mapItems(items: any[], defaultCategory: string): any[] {
    const mapped: any[] = [];
    for (const item of items) {
      if (!item.id || !item.name || !item.html_url) continue;
      if (this.seenGithubIds.has(item.id)) continue; // Deduplication in-memory

      // Inferensi kategori dari topics repository
      const topics: string[] = item.topics ?? [];
      const category = inferCategory(topics, defaultCategory);

      // Bangun tags dari topics GitHub
      const tags: string[] = topics.length > 0
        ? topics.slice(0, 10)
        : [defaultCategory.toLowerCase().replace(/[^a-z0-9]/g, '-'), 'open-source'];

      mapped.push({
        github_id: item.id,
        title: item.name,
        description: item.description || `Open-source ${category} repository on GitHub`,
        icon_url: item.owner?.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${item.name}`,
        category,
        tags,
        source_url: item.html_url,
        stars: item.stargazers_count ?? 0,
      });

      this.seenGithubIds.add(item.id);
    }
    return mapped;
  }

  /**
   * Merge tools baru ke array utama (berdasarkan github_id)
   * seenGithubIds sudah diupdate di mapItems(), jadi merge aman
   */
  private mergeTools(target: any[], source: any[]): void {
    for (const tool of source) {
      target.push(tool);
    }
  }

  /** Log progres crawling */
  private logProgress(tools: any[], startTime: number, label: string): void {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
    const pct = Math.min(((tools.length / TARGET_UNIQUE) * 100), 100).toFixed(1);
    this.logger.log(
      `\n📊 [${label}] Unik: ${tools.length} | Target: ${TARGET_UNIQUE} | Progres: ${pct}% | Waktu: ${elapsed}s\n`,
    );
  }

  /** Simpan batch tools ke MongoDB menggunakan bulkWrite */
  private async saveToolsBatch(tools: any[]): Promise<void> {
    const BATCH_SIZE = 200;
    let saved = 0;

    for (let i = 0; i < tools.length; i += BATCH_SIZE) {
      const batch = tools.slice(i, i + BATCH_SIZE);
      const enriched = await this.enrichWithMinioIcons(batch);

      const count = await this.toolsService.upsertByGithubIdBulk(enriched);
      saved += count;

      const pct = Math.min(((i + BATCH_SIZE) / tools.length) * 100, 100).toFixed(0);
      this.logger.log(
        `  💾 Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${count} tersimpan | Total tersimpan: ${saved} | Progres: ${pct}%`,
      );
    }

    this.logger.log(`✅ Total tersimpan ke MongoDB: ${saved}`);
  }

  /**
   * Download icon dari GitHub avatar dan upload ke MinIO (best-effort).
   * Jika gagal, gunakan URL asli dari GitHub (tetap valid).
   */
  private async enrichWithMinioIcons(tools: any[]): Promise<any[]> {
    const enriched: any[] = [];

    for (const tool of tools) {
      let finalIconUrl = tool.icon_url;

      // Hanya upload avatar GitHub (bukan dicebear placeholder)
      if (tool.icon_url && tool.icon_url.includes('avatars.githubusercontent.com')) {
        try {
          const safeName = tool.title
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .substring(0, 60);
          const objectName = `github-${tool.github_id}-${safeName}.png`;

          finalIconUrl = await this.minioService.downloadAndUpload(
            tool.icon_url,
            objectName,
          );
        } catch {
          // Biarkan icon_url tetap dari GitHub — masih valid
        }
      }

      enriched.push({ ...tool, icon_url: finalIconUrl });
    }

    return enriched;
  }

  /** Sleep helper */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /** Ekstrak file extension dari URL */
  private getExtensionFromUrl(url: string): string {
    try {
      const pathname = new URL(url).pathname;
      const ext = pathname.split('.').pop()?.toLowerCase();
      if (ext && ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico'].includes(ext)) {
        return `.${ext}`;
      }
    } catch {
      // Ignore URL parsing errors
    }
    return '.png';
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Public API (dipanggil dari Controller)
  // ───────────────────────────────────────────────────────────────────────────

  /**
   * Manual trigger untuk menjalankan ingestion (dipanggil via POST /api/ingestion/trigger)
   */
  async triggerIngestion(): Promise<{ message: string; status: string }> {
    this.logger.log('Manual ingestion triggered');
    this.seenGithubIds.clear();

    // Jalankan crawling di background tanpa menahan response HTTP Swagger
    this.handleIngestionCron().catch((err) =>
      this.logger.error(`Manual ingestion error: ${err.message}`),
    );

    return {
      message: 'Proses crawling 5.000-7.000 data GitHub telah dimulai di background. Silakan pantau log terminal backend.',
      status: 'started',
    };
  }
}

