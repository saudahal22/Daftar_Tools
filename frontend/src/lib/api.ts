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
  
  const envUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (envUrl) {
    const api = envUrl.replace(/\/$/, "");
    console.log("🌐 API BASE URL (ENV):", api);
    return api;
  }
  
  console.log("🌐 API BASE URL (LOCAL): http://localhost:3001");
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

export async function fetchTools(params?: {
  search?: string;
  category?: string;
  tags?: string;
  page?: number;
  limit?: number;
}): Promise<ToolsResponse> {
  const query = new URLSearchParams();

  if (params?.search) query.set("search", params.search);
  if (params?.category) query.set("category", params.category);
  if (params?.tags) query.set("tags", params.tags);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const url = `${getApiBaseUrl()}/api/tools?${query.toString()}`;

  console.log("📤 FETCH TOOLS:", url);

  try {
    const res = await fetch(url, {
      cache: "no-store",
    });

    console.log("📥 STATUS:", res.status);

    if (!res.ok) {
      throw new Error(
        `HTTP ${res.status} ${res.statusText}`
      );
    }

    return res.json();
  } catch (err) {
    console.error("❌ fetchTools ERROR:", err);
    throw err;
  }
}

export async function fetchTool(id: string): Promise<Tool> {
  const url = `${getApiBaseUrl()}/api/tools/${id}`;

  console.log("📤 FETCH TOOL:", url);

  const res = await fetch(url, {
    cache: "no-store",
  });

  console.log("📥 STATUS:", res.status);

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return res.json();
}

export async function updateTool(
  id: string,
  data: Partial<Tool>
): Promise<Tool> {
  const url = `${getApiBaseUrl()}/api/tools/${id}`;

  console.log("📤 UPDATE:", url);

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  console.log("📥 STATUS:", res.status);

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return res.json();
}

export async function getRecommendation(
  question: string
): Promise<RecommendResponse> {
  const url = `${getApiBaseUrl()}/api/recommend`;

  console.log("📤 RECOMMEND:", url);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question }),
  });

  console.log("📥 STATUS:", res.status);

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return res.json();
}

export async function fetchCategories(): Promise<string[]> {
  const url = `${getApiBaseUrl()}/api/tools/categories`;

  console.log("📤 CATEGORIES:", url);

  const res = await fetch(url, {
    cache: "no-store",
  });

  console.log("📥 STATUS:", res.status);

  if (!res.ok) {
    return [];
  }

  return res.json();
}

export async function triggerIngestion(): Promise<{
  message: string;
  count: number;
}> {
  const url = `${getApiBaseUrl()}/api/ingestion/trigger`;

  console.log("📤 INGESTION:", url);

  const res = await fetch(url, {
    method: "POST",
  });

  console.log("📥 STATUS:", res.status);

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return res.json();
}
