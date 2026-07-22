function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    console.log("[API DEBUG] Browser origin detected:", origin);
    
    // Auto-detect GitHub Codespaces domain URL pattern (handles .github.dev, .app.github.dev, and preview.app.github.dev)
    const codespaceRegex = /-[0-9]+(?=\.(?:preview\.)?(?:app\.)?github\.dev)/;
    if (codespaceRegex.test(origin)) {
      const rewritten = origin.replace(codespaceRegex, '-3001');
      console.log("[API DEBUG] Codespace detected. Rewriting API URL from", origin, "to", rewritten);
      return rewritten;
    }
  }
  
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) {
    console.log("[API DEBUG] No Codespace pattern matched. Using NEXT_PUBLIC_API_URL:", envUrl);
    return envUrl;
  }
  
  console.log("[API DEBUG] Fallback to default localhost:3001");
  return 'http://localhost:3001';
}


export interface Tool {
  _id: string;
  title: string;
  description: string;
  icon_url: string;
  category: string;
  tags: string[];
  source_url: string;
  createdAt: string;
  updatedAt: string;
}

export interface ToolsResponse {
  tools: Tool[];
  total: number;
  page: number;
  totalPages: number;
}

export interface RecommendResponse {
  answer: string;
  tools: Tool[];
  method: string;
}

/**
 * Fetch daftar tools dengan search & filter
 */
export async function fetchTools(params?: {
  search?: string;
  category?: string;
  tags?: string;
  page?: number;
  limit?: number;
}): Promise<ToolsResponse> {
  const query = new URLSearchParams();

  if (params?.search) query.set('search', params.search);
  if (params?.category) query.set('category', params.category);
  if (params?.tags) query.set('tags', params.tags);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));

  const res = await fetch(`${getApiBaseUrl()}/api/tools?${query.toString()}`, {
    cache: 'no-store',
  });

  if (!res.ok) throw new Error('Gagal mengambil data tools');
  return res.json();
}

/**
 * Fetch tool berdasarkan ID
 */
export async function fetchTool(id: string): Promise<Tool> {
  const res = await fetch(`${getApiBaseUrl()}/api/tools/${id}`, {
    cache: 'no-store',
  });

  if (!res.ok) throw new Error('Tool tidak ditemukan');
  return res.json();
}

/**
 * Update tool (PATCH) — digunakan oleh Edit Modal
 */
export async function updateTool(
  id: string,
  data: Partial<Tool>,
): Promise<Tool> {
  const res = await fetch(`${getApiBaseUrl()}/api/tools/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error('Gagal memperbarui tool');
  return res.json();
}

/**
 * Dapatkan rekomendasi AI
 */
export async function getRecommendation(
  question: string,
): Promise<RecommendResponse> {
  const res = await fetch(`${getApiBaseUrl()}/api/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });

  if (!res.ok) throw new Error('Gagal mendapatkan rekomendasi');
  return res.json();
}

/**
 * Fetch semua kategori unik
 */
export async function fetchCategories(): Promise<string[]> {
  const res = await fetch(`${getApiBaseUrl()}/api/tools/categories`, {
    cache: 'no-store',
  });

  if (!res.ok) return [];
  return res.json();
}

/**
 * Trigger data ingestion secara manual
 */
export async function triggerIngestion(): Promise<{
  message: string;
  count: number;
}> {
  const res = await fetch(`${getApiBaseUrl()}/api/ingestion/trigger`, {
    method: 'POST',
  });

  if (!res.ok) throw new Error('Gagal menjalankan ingestion');
  return res.json();
}
