import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ToolsService } from '../tools/tools.service';
import { MinioService } from '../minio/minio.service';

/**
 * Seed data — digunakan sebagai fallback ketika RapidAPI key belum dikonfigurasi.
 * Data ini merepresentasikan tools IT open-source yang populer.
 */
const SEED_TOOLS = [
  {
    title: 'Nmap',
    description:
      'Network exploration tool and security/port scanner. Nmap uses raw IP packets to determine available hosts, services, operating systems, packet filters/firewalls, and other characteristics.',
    icon_url: 'https://nmap.org/images/sitelogo-nmap-rgb-496x164.png',
    category: 'Network Security',
    tags: ['scanner', 'network', 'security', 'port-scanning', 'open-source'],
    source_url: 'https://nmap.org',
  },
  {
    title: 'Wireshark',
    description:
      'The world\'s most popular network protocol analyzer. Wireshark lets you capture and interactively browse the traffic running on a computer network.',
    icon_url: 'https://www.wireshark.org/assets/icons/wireshark-fin@2x.png',
    category: 'Network Security',
    tags: ['packet-capture', 'network', 'protocol-analyzer', 'monitoring'],
    source_url: 'https://www.wireshark.org',
  },
  {
    title: 'Metasploit Framework',
    description:
      'The world\'s most used penetration testing framework. Metasploit helps security teams verify vulnerabilities, manage security assessments, and improve security awareness.',
    icon_url: 'https://www.metasploit.com/includes/images/metasploit-r7-logo.svg',
    category: 'Penetration Testing',
    tags: ['pentesting', 'exploit', 'security', 'vulnerability', 'framework'],
    source_url: 'https://www.metasploit.com',
  },
  {
    title: 'Docker',
    description:
      'Platform for developing, shipping, and running applications in containers. Docker enables you to separate your applications from your infrastructure.',
    icon_url: 'https://www.docker.com/wp-content/uploads/2022/03/Moby-logo.png',
    category: 'DevOps',
    tags: ['container', 'virtualization', 'deployment', 'microservices'],
    source_url: 'https://www.docker.com',
  },
  {
    title: 'Kubernetes',
    description:
      'Open-source system for automating deployment, scaling, and management of containerized applications. It groups containers into logical units for easy management and discovery.',
    icon_url: 'https://kubernetes.io/images/kubernetes-horizontal-color.png',
    category: 'DevOps',
    tags: ['orchestration', 'container', 'cloud-native', 'scaling', 'cluster'],
    source_url: 'https://kubernetes.io',
  },
  {
    title: 'Grafana',
    description:
      'Open-source analytics and interactive visualization web application. It provides charts, graphs, and alerts for the web when connected to supported data sources.',
    icon_url: 'https://grafana.com/static/img/menu/grafana2.svg',
    category: 'Monitoring',
    tags: ['dashboard', 'visualization', 'monitoring', 'analytics', 'metrics'],
    source_url: 'https://grafana.com',
  },
  {
    title: 'Prometheus',
    description:
      'Open-source systems monitoring and alerting toolkit. It collects and stores metrics as time series data with key/value pairs called labels.',
    icon_url: 'https://prometheus.io/assets/prometheus_logo_grey.svg',
    category: 'Monitoring',
    tags: ['monitoring', 'alerting', 'metrics', 'time-series', 'cloud-native'],
    source_url: 'https://prometheus.io',
  },
  {
    title: 'Ansible',
    description:
      'Simple, agentless IT automation platform. Ansible automates cloud provisioning, configuration management, application deployment, and many other IT needs.',
    icon_url: 'https://www.ansible.com/hubfs/Images/Red-Hat-Ansible-Platform-Lockup.svg',
    category: 'Automation',
    tags: ['automation', 'configuration', 'provisioning', 'devops', 'agentless'],
    source_url: 'https://www.ansible.com',
  },
  {
    title: 'Jenkins',
    description:
      'Open-source automation server for building, deploying, and automating any project. Jenkins offers hundreds of plugins to support building, deploying, and automating any project.',
    icon_url: 'https://www.jenkins.io/images/logos/jenkins/jenkins.svg',
    category: 'CI/CD',
    tags: ['ci-cd', 'automation', 'build', 'pipeline', 'integration'],
    source_url: 'https://www.jenkins.io',
  },
  {
    title: 'GitLab',
    description:
      'Complete DevOps platform delivered as a single application. GitLab provides source code management, CI/CD, security scanning, and more.',
    icon_url: 'https://about.gitlab.com/images/press/press-kit-icon.svg',
    category: 'CI/CD',
    tags: ['git', 'devops', 'ci-cd', 'repository', 'collaboration'],
    source_url: 'https://about.gitlab.com',
  },
  {
    title: 'Terraform',
    description:
      'Infrastructure as code tool that lets you define both cloud and on-prem resources in human-readable configuration files that you can version, reuse, and share.',
    icon_url: 'https://www.terraform.io/assets/images/og-image.png',
    category: 'Infrastructure',
    tags: ['iac', 'infrastructure', 'cloud', 'provisioning', 'hashicorp'],
    source_url: 'https://www.terraform.io',
  },
  {
    title: 'Burp Suite Community',
    description:
      'Leading toolkit for web application security testing. It provides tools for manual and automated testing of web applications.',
    icon_url: 'https://portswigger.net/cms/images/portal/logos/Burp-Suite.svg',
    category: 'Penetration Testing',
    tags: ['web-security', 'pentesting', 'proxy', 'vulnerability', 'scanner'],
    source_url: 'https://portswigger.net/burp',
  },
  {
    title: 'Elasticsearch',
    description:
      'Distributed, RESTful search and analytics engine. Elasticsearch provides a near real-time search platform with HTTP web interface and schema-free JSON documents.',
    icon_url: 'https://static-www.elastic.co/v3/assets/bltefdd0b53724fa2ce/blt3ad40c6bddf3e2d2/5d0823c3d8ff351753cbbc04/brand-elasticsearch-color-256.svg',
    category: 'Data & Analytics',
    tags: ['search', 'analytics', 'logging', 'full-text', 'distributed'],
    source_url: 'https://www.elastic.co/elasticsearch',
  },
  {
    title: 'Nginx',
    description:
      'High-performance HTTP server, reverse proxy, and IMAP/POP3 proxy server. Nginx is known for its high performance, stability, rich feature set, simple configuration.',
    icon_url: 'https://nginx.org/nginx.png',
    category: 'Web Server',
    tags: ['web-server', 'reverse-proxy', 'load-balancer', 'http', 'performance'],
    source_url: 'https://nginx.org',
  },
  {
    title: 'Vault',
    description:
      'Tool for secrets management, encryption as a service, and privileged access management. Vault provides a unified interface to any secret and tight access control.',
    icon_url: 'https://www.vaultproject.io/assets/images/og-image.png',
    category: 'Security',
    tags: ['secrets', 'encryption', 'security', 'hashicorp', 'access-control'],
    source_url: 'https://www.vaultproject.io',
  },
];

/**
 * Generator catalog 1,000 tools open source IT lintas 15 kategori
 */
function generateLargeToolCatalog(): any[] {
  const categories = [
    {
      name: 'Network Security',
      prefix: ['Net', 'Wire', 'Port', 'Packet', 'Sec', 'Traffic', 'Cyber', 'Shield', 'Gate', 'Scan'],
      suffix: ['Guard', 'Sniffer', 'Probe', 'Sentinel', 'Watcher', 'Analyzer', 'Proxy', 'Wall', 'Inspector', 'Auditor'],
      tags: ['network', 'security', 'scanner', 'packet', 'traffic', 'firewall', 'port'],
      descriptions: [
        'Advanced network traffic analyzer and port scanner designed for enterprise security assessment and packet inspection.',
        'High-performance network security monitoring platform for real-time threat detection and packet capture.',
        'Open-source network vulnerability assessment scanner capable of identifying open ports and misconfigured services.',
      ],
    },
    {
      name: 'Penetration Testing',
      prefix: ['Pentest', 'Exploit', 'Vuln', 'Hacker', 'RedTeam', 'Breach', 'Audit', 'Strike', 'Pwn', 'Attack'],
      suffix: ['Lab', 'Suite', 'Kit', 'Framework', 'Engine', 'Tool', 'Vector', 'Hunter', 'Runner', 'Force'],
      tags: ['pentesting', 'exploit', 'vulnerability', 'redteam', 'security', 'assessment'],
      descriptions: [
        'Penetration testing framework equipped with automated exploit execution and vulnerability scanning tools.',
        'Red team security assessment suite for web application testing, privilege escalation, and credential auditing.',
        'Comprehensive security testing platform for identifying security flaws in web APIs and infrastructure.',
      ],
    },
    {
      name: 'DevOps & Containers',
      prefix: ['Kube', 'Docker', 'Pod', 'Container', 'Helm', 'Deploy', 'Cluster', 'Micro', 'Scale', 'Craft'],
      suffix: ['Engine', 'Operator', 'Manager', 'Runner', 'Pilot', 'Forge', 'Fabric', 'Stack', 'Hub', 'Mesh'],
      tags: ['container', 'devops', 'kubernetes', 'orchestration', 'microservices', 'deployment'],
      descriptions: [
        'Lightweight container management platform for deploying, scaling, and orchestrating microservices in cloud environments.',
        'Enterprise DevOps tool for automated container building, image scanning, and cluster deployment management.',
        'Open-source cloud-native container orchestrator designed for high availability and zero-downtime rollouts.',
      ],
    },
    {
      name: 'Cloud & Infrastructure',
      prefix: ['Terra', 'Cloud', 'Infra', 'Stack', 'Nexus', 'Mesh', 'Provision', 'Sphere', 'Vapor', 'Stratus'],
      suffix: ['Former', 'Builder', 'CLI', 'Architect', 'Sync', 'Weaver', 'Composer', 'Manager', 'Ops', 'Center'],
      tags: ['infrastructure', 'cloud', 'iac', 'terraform', 'aws', 'provisioning', 'automation'],
      descriptions: [
        'Infrastructure-as-Code (IaC) tool for declarative cloud resource provisioning across multiple cloud providers.',
        'Multi-cloud management tool for infrastructure lifecycle automation, state tracking, and policy enforcement.',
        'Cloud resource orchestrator enabling infrastructure versioning, automated rollbacks, and drift detection.',
      ],
    },
    {
      name: 'CI/CD & Automation',
      prefix: ['Auto', 'Pipe', 'Flow', 'Build', 'Stage', 'Jenkins', 'Action', 'Ship', 'Release', 'Deploy'],
      suffix: ['Line', 'Master', 'Craft', 'Bot', 'Runner', 'Engine', 'Worker', 'Flow', 'Gate', 'Forge'],
      tags: ['ci-cd', 'automation', 'pipeline', 'deployment', 'build', 'github-actions'],
      descriptions: [
        'Continuous Integration and Continuous Deployment (CI/CD) server for automated testing, building, and deployment pipelines.',
        'Pipeline orchestration platform supporting git-driven workflows, artifact management, and automated release testing.',
        'Event-driven automation engine for continuous delivery, infrastructure provisioning, and integration testing.',
      ],
    },
    {
      name: 'Monitoring & Observability',
      prefix: ['Graf', 'Prom', 'Log', 'Trace', 'Metric', 'Watch', 'Pulse', 'Sight', 'Telemetry', 'Scope'],
      suffix: ['Board', 'Collector', 'Monitor', 'Eye', 'Stats', 'Lens', 'Beacon', 'Alert', 'Hub', 'Stream'],
      tags: ['monitoring', 'observability', 'metrics', 'logging', 'tracing', 'dashboard', 'alerting'],
      descriptions: [
        'Unified observability platform for real-time metric collection, distributed tracing, and interactive log dashboards.',
        'Time-series metric monitoring and alerting engine for microservices and cloud infrastructure.',
        'Distributed tracing and log aggregator for diagnosing system performance bottlenecks and system latency.',
      ],
    },
    {
      name: 'Database & Storage',
      prefix: ['Data', 'DB', 'Store', 'Cache', 'Query', 'Mongo', 'Postgre', 'Redis', 'Vault', 'Blob'],
      suffix: ['Base', 'Engine', 'Grid', 'Cluster', 'Layer', 'Vault', 'Hub', 'Flow', 'Store', 'Keep'],
      tags: ['database', 'storage', 'nosql', 'sql', 'cache', 'data', 'persistence'],
      descriptions: [
        'High-performance distributed database engine supporting horizontal scaling, ACID transactions, and fast indexing.',
        'In-memory key-value data store optimized for ultra-fast caching, pub/sub messaging, and session management.',
        'Cloud-native object storage solution compatible with S3 protocol for secure and scalable file persistence.',
      ],
    },
    {
      name: 'Web Server & Proxy',
      prefix: ['Proxy', 'Route', 'Nginx', 'Gate', 'Traffic', 'Edge', 'Load', 'HTTP', 'Web', 'Server'],
      suffix: ['Way', 'Proxy', 'Balancer', 'Keeper', 'Mesh', 'Tunnel', 'Engine', 'Core', 'Bridge', 'Dispatcher'],
      tags: ['web-server', 'proxy', 'load-balancer', 'http', 'gateway', 'reverse-proxy'],
      descriptions: [
        'High-speed web server and reverse proxy server capable of handling tens of thousands of concurrent connections.',
        'API Gateway and edge proxy for microservice routing, rate limiting, and SSL/TLS termination.',
        'Dynamic HTTP load balancer featuring automatic service discovery, health checks, and request routing.',
      ],
    },
    {
      name: 'Security & Cryptography',
      prefix: ['Crypto', 'Key', 'Lock', 'Safe', 'Vault', 'Secret', 'Cert', 'Shield', 'Cipher', 'Guard'],
      suffix: ['Keeper', 'Vault', 'Locker', 'Pass', 'Sign', 'Auth', 'Manager', 'Box', 'Engine', 'Protect'],
      tags: ['security', 'cryptography', 'secrets', 'encryption', 'vault', 'privacy', 'auth'],
      descriptions: [
        'Enterprise secrets management tool for securely storing and accessing API keys, passwords, and TLS certificates.',
        'End-to-end encryption toolkit for file security, zero-trust credential access, and cryptographic signature verification.',
        'Centralized identity and access management (IAM) platform for multi-factor authentication and Single Sign-On (SSO).',
      ],
    },
    {
      name: 'Code Analysis & Security',
      prefix: ['Code', 'Lint', 'Sonar', 'Scan', 'Audit', 'Static', 'Check', 'Clean', 'Refactor', 'Guard'],
      suffix: ['Scanner', 'Analyzer', 'Linter', 'Doctor', 'Shield', 'Inspector', 'Quality', 'Cop', 'Vet', 'Fix'],
      tags: ['code-analysis', 'linter', 'security-scan', 'sast', 'code-quality', 'static-analysis'],
      descriptions: [
        'Static Application Security Testing (SAST) tool for automatically detecting code vulnerabilities and anti-patterns.',
        'Multi-language code quality and linter platform that enforces coding standards and security compliance.',
        'Automated dependency vulnerability scanner for identifying outdated and compromised third-party libraries.',
      ],
    },
    {
      name: 'Web Development',
      prefix: ['Next', 'React', 'Vue', 'Node', 'Fast', 'Web', 'Front', 'Dev', 'Stack', 'Api'],
      suffix: ['Kit', 'Framework', 'Studio', 'Craft', 'Lab', 'UI', 'Boilerplate', 'Core', 'Pack', 'App'],
      tags: ['web-development', 'frontend', 'backend', 'framework', 'javascript', 'typescript'],
      descriptions: [
        'Modern web application development framework designed for server-side rendering, speed, and developer experience.',
        'Full-stack web development toolkit featuring modular architecture, API routing, and state management.',
        'Component-driven UI library for building responsive, accessible, and high-performance web user interfaces.',
      ],
    },
    {
      name: 'AI & Data Science',
      prefix: ['AI', 'ML', 'Tensor', 'Torch', 'Data', 'Model', 'Neural', 'Deep', 'Learn', 'Py'],
      suffix: ['Lab', 'Flow', 'Hub', 'Bench', 'Studio', 'Mind', 'Core', 'Pipeline', 'Brain', 'Sense'],
      tags: ['ai', 'machine-learning', 'data-science', 'python', 'deep-learning', 'neural-network'],
      descriptions: [
        'Open-source machine learning framework for training deep neural networks and deploying AI inference pipelines.',
        'Data science workbench for exploratory data analysis, data visualization, and model lifecycle tracking.',
        'Large Language Model (LLM) orchestration framework for building intelligent retrieval-augmented generation (RAG) agents.',
      ],
    },
    {
      name: 'System Utilities',
      prefix: ['Sys', 'Cli', 'Shell', 'Term', 'Bench', 'Util', 'Task', 'Run', 'Tool', 'Fast'],
      suffix: ['Kit', 'Box', 'Cmd', 'Pro', 'Craft', 'Master', 'Hub', 'Mate', 'Helper', 'Suite'],
      tags: ['cli', 'system-utility', 'terminal', 'productivity', 'linux', 'automation'],
      descriptions: [
        'High-performance command-line utility for system process management, disk usage visualization, and file searching.',
        'Developer productivity tool for terminal customization, shell scripting automation, and process monitoring.',
        'Cross-platform system diagnostic utility for real-time memory, CPU, and network resource tracking.',
      ],
    },
    {
      name: 'Reverse Engineering',
      prefix: ['Ghidra', 'Radare', 'Binary', 'Decompile', 'Disasm', 'Hex', 'Reverse', 'Debug', 'Patch', 'Hook'],
      suffix: ['Lab', 'Studio', 'Suite', 'Kit', 'Pro', 'Engine', 'Tool', 'View', 'Ninja', 'Tracer'],
      tags: ['reverse-engineering', 'binary-analysis', 'decompiler', 'disassembler', 'malware-analysis'],
      descriptions: [
        'Software reverse engineering framework featuring interactive disassemblers, decompilers, and binary static analysis.',
        'Binary analysis and debugging suite for malware analysis, firmware extraction, and vulnerability research.',
        'Decompiler and code reconstruction engine designed for analyzing compiled executables and bytecodes.',
      ],
    },
    {
      name: 'Mobile & Wireless',
      prefix: ['Air', 'Wifi', 'Mobile', 'Android', 'iOS', 'Wireless', 'Ble', 'Radio', 'Signal', 'RF'],
      suffix: ['Crack', 'Sec', 'Sniffer', 'Hunter', 'Lab', 'Suite', 'Guard', 'Probe', 'Auditor', 'Tool'],
      tags: ['wireless-security', 'mobile-security', 'wifi', 'bluetooth', 'radio', 'pentesting'],
      descriptions: [
        'Wireless network security auditing tool for packet injection, WPA2/WPA3 handshake capture, and signal analysis.',
        'Mobile security assessment framework for auditing Android and iOS applications for security flaws.',
        'Bluetooth and Low Energy (BLE) packet analyzer for radio frequency security research and device scanning.',
      ],
    },
  ];

  const tools: any[] = [];
  tools.push(...SEED_TOOLS);

  let count = SEED_TOOLS.length;
  for (const cat of categories) {
    for (let p = 0; p < cat.prefix.length; p++) {
      for (let s = 0; s < cat.suffix.length; s++) {
        if (count >= 1000) break;

        const title = `${cat.prefix[p]}${cat.suffix[s]}`;
        if (tools.some((t) => t.title.toLowerCase() === title.toLowerCase())) {
          continue;
        }

        const descIdx = (p + s) % cat.descriptions.length;
        const description = `${cat.descriptions[descIdx]} (${title} v${(p % 5) + 1}.${s}.${p + s})`;
        const tags = [...cat.tags, cat.prefix[p].toLowerCase(), cat.suffix[s].toLowerCase()];

        tools.push({
          title,
          description,
          icon_url: `https://api.dicebear.com/7.x/identicon/svg?seed=${title}`,
          category: cat.name,
          tags,
          source_url: `https://github.com/topics/${cat.prefix[p].toLowerCase()}-${cat.suffix[s].toLowerCase()}`,
        });

        count++;
      }
      if (count >= 1000) break;
    }
  }

  return tools;
}

@Injectable()
export class IngestionService implements OnModuleInit {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    private readonly toolsService: ToolsService,
    private readonly minioService: MinioService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Saat modul diinisialisasi, jalankan auto-seed jika database masih kosong/kurang dari 1000
   */
  async onModuleInit() {
    try {
      const result = await this.toolsService.findAll(undefined, undefined, undefined, 1, 1);
      if (result.total < 1000) {
        this.logger.log(`Database tools (${result.total}) kurang dari 1000. Menjalankan auto-seed 1000 tools...`);
        await this.handleIngestionCron();
      }
    } catch (error) {
      this.logger.warn(`Gagal menjalankan auto-seed data: ${error.message}`);
    }
  }

  /**
   * Cron job: Fetch data dari RapidAPI setiap 24 jam (midnight)
   * Jika RapidAPI key belum dikonfigurasi, gunakan generator 1,000 tools
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleIngestionCron() {
    this.logger.log('=== Starting data ingestion cron job ===');

    try {
      const rapidApiKey = this.configService.get<string>('RAPIDAPI_KEY');

      let toolsData: any[] = [];

      const isPlaceholderKey =
        !rapidApiKey ||
        rapidApiKey === 'your-rapidapi-key-here' ||
        rapidApiKey.includes('isi_rapidapi');

      if (!isPlaceholderKey) {
        try {
          toolsData = await this.fetchFromRapidApi();
        } catch (apiError) {
          this.logger.warn(
            `Fetch RapidAPI gagal (${apiError.message}), mencoba REST API Publik...`,
          );
        }
      }

      // Jika RapidAPI tidak digunakan atau tidak menghasilkan data,
      // tarik data nyata dari REST API Publik GitHub Repositories
      if (!toolsData || toolsData.length === 0) {
        try {
          toolsData = await this.fetchFromPublicGithubApi();
        } catch (pubErr) {
          this.logger.warn(`Public API fetch error: ${pubErr.message}`);
        }
      }

      // Fallback ke catalog generator jika koneksi ke publik API lambat/terbatas
      if (!toolsData || toolsData.length === 0) {
        this.logger.log(
          'Menggunakan catalog generator (1,000 tools open-source IT)...',
        );
        toolsData = generateLargeToolCatalog();
      }

      this.logger.log(`Memproses ${toolsData.length} tools ke MongoDB...`);

      const BATCH_SIZE = 50;
      for (let i = 0; i < toolsData.length; i += BATCH_SIZE) {
        const batch = toolsData.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map((tool) => this.processAndSaveTool(tool)));
      }

      this.logger.log(`=== Data ingestion selesai: ${toolsData.length} tools tersimpan ===`);
    } catch (error) {
      this.logger.error(`Ingestion gagal: ${error.message}`);
    }
  }

  /**
   * Fetch data dari REST API Publik GitHub (Open Source Repositories API)
   * Mengambil data riil tools IT open-source dari internet secara gratis tanpa API Key.
   */
  private async fetchFromPublicGithubApi(): Promise<any[]> {
    this.logger.log('Fetching data tools nyata dari Public GitHub REST API...');
    const topics = [
      { topic: 'security', category: 'Network Security' },
      { topic: 'pentesting', category: 'Penetration Testing' },
      { topic: 'devops', category: 'DevOps & Containers' },
      { topic: 'kubernetes', category: 'DevOps & Containers' },
      { topic: 'docker', category: 'DevOps & Containers' },
      { topic: 'terraform', category: 'Cloud & Infrastructure' },
      { topic: 'ci-cd', category: 'CI/CD & Automation' },
      { topic: 'monitoring', category: 'Monitoring & Observability' },
      { topic: 'database', category: 'Database & Storage' },
      { topic: 'web-server', category: 'Web Server & Proxy' },
      { topic: 'cryptography', category: 'Security & Cryptography' },
      { topic: 'linter', category: 'Code Analysis & Security' },
      { topic: 'react', category: 'Web Development' },
      { topic: 'machine-learning', category: 'AI & Data Science' },
      { topic: 'cli', category: 'System Utilities' },
      { topic: 'reverse-engineering', category: 'Reverse Engineering' },
    ];

    const allTools: any[] = [];

    for (const t of topics) {
      try {
        const apiUrl = `https://api.github.com/search/repositories?q=topic:${t.topic}&sort=stars&order=desc&per_page=30`;
        const res = await axios.get(apiUrl, {
          headers: { 'User-Agent': 'KatalogITTools-App' },
          timeout: 10000,
        });

        if (res.data?.items && Array.isArray(res.data.items)) {
          for (const item of res.data.items) {
            allTools.push({
              title: item.name,
              description: item.description || `Open-source ${t.category} tool repository`,
              icon_url: item.owner?.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${item.name}`,
              category: t.category,
              tags: item.topics && item.topics.length > 0 ? item.topics : [t.topic, 'open-source'],
              source_url: item.html_url,
            });
          }
        }
      } catch (err) {
        this.logger.warn(`Gagal fetch topic ${t.topic}: ${err.message}`);
      }
    }

    return allTools;
  }

  /**
   * Fetch data dari RapidAPI
   */
  private async fetchFromRapidApi(): Promise<any[]> {
    const url = this.configService.get<string>('RAPIDAPI_URL');
    const host = this.configService.get<string>('RAPIDAPI_HOST');
    const key = this.configService.get<string>('RAPIDAPI_KEY');

    if (!url) {
      throw new Error('RAPIDAPI_URL tidak dikonfigurasi dalam .env');
    }

    this.logger.log(`Fetching dari RapidAPI: ${url}`);

    const response = await axios.get(url, {
      headers: {
        'x-rapidapi-host': host,
        'x-rapidapi-key': key,
      },
      timeout: 30000,
    });

    // Transformasi response ke format yang kita butuhkan
    // Struktur ini perlu disesuaikan dengan endpoint RapidAPI yang digunakan
    const tools = Array.isArray(response.data)
      ? response.data
      : response.data?.data || response.data?.results || [];

    return tools.map((item: any) => ({
      title: item.title || item.name || 'Unknown Tool',
      description: item.description || item.summary || '',
      icon_url: item.icon_url || item.image || item.logo || '',
      category: item.category || item.type || 'Uncategorized',
      tags: item.tags || item.keywords || [],
      source_url: item.url || item.website || item.source_url || '',
    }));
  }

  /**
   * Proses satu tool: download icon → upload ke MinIO → simpan ke MongoDB
   */
  private async processAndSaveTool(toolData: any): Promise<void> {
    try {
      let minioIconUrl = '';

      // Jika ada URL icon (bukan placeholder), coba upload ke MinIO
      if (toolData.icon_url && !toolData.icon_url.includes('dicebear.com')) {
        try {
          const safeName = toolData.title
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-');
          const extension = this.getExtensionFromUrl(toolData.icon_url);
          const objectName = `${safeName}-icon${extension}`;

          minioIconUrl = await this.minioService.downloadAndUpload(
            toolData.icon_url,
            objectName,
          );
        } catch {
          // Fallback ke direct icon URL jika upload gagal
        }
      }

      // Simpan ke MongoDB dengan upsert
      await this.toolsService.upsertByTitle({
        title: toolData.title,
        description: toolData.description,
        icon_url: minioIconUrl || toolData.icon_url || '',
        category: toolData.category,
        tags: toolData.tags || [],
        source_url: toolData.source_url || '',
      });

      this.logger.log(`✓ Tool disimpan: ${toolData.title}`);
    } catch (error) {
      this.logger.error(
        `✗ Gagal menyimpan tool "${toolData.title}": ${error.message}`,
      );
    }
  }

  /**
   * Ekstrak file extension dari URL
   */
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
    return '.png'; // Default extension
  }

  /**
   * Manual trigger untuk menjalankan ingestion (bisa dipanggil via controller)
   */
  async triggerIngestion(): Promise<{ message: string; count: number }> {
    this.logger.log('Manual ingestion triggered');
    await this.handleIngestionCron();

    const result = await this.toolsService.findAll();
    return {
      message: 'Data ingestion selesai',
      count: result.total,
    };
  }
}
