'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchTools, fetchCategories, triggerIngestion, Tool, ToolsResponse } from '@/lib/api';
import ToolCard from '@/components/ToolCard';
import EditModal from '@/components/EditModal';
import SearchBar from '@/components/SearchBar';
import CategoryFilter from '@/components/CategoryFilter';
import RecommendChat from '@/components/RecommendChat';

export default function HomePage() {
  const [toolsData, setToolsData] = useState<ToolsResponse | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [ingesting, setIngesting] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(24);

  // Fetch tools
  const loadTools = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchTools({
        search: search || undefined,
        category: selectedCategory || undefined,
        page,
        limit,
      });
      setToolsData(data);
    } catch (error) {
      console.error('Gagal mengambil tools:', error);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, page, limit]);

  // Fetch categories
  const loadCategories = useCallback(async () => {
    try {
      const cats = await fetchCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Gagal mengambil kategori:', error);
    }
  }, []);

  useEffect(() => {
    loadTools();
  }, [loadTools]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearch(query);
    setPage(1);
  }, []);

  // Handle category filter
  const handleCategorySelect = useCallback((category: string) => {
    setSelectedCategory(category);
    setPage(1);
  }, []);

  // Handle edit
  const handleEdit = (tool: Tool) => {
    setEditingTool(tool);
    setIsEditOpen(true);
  };

  const handleEditClose = () => {
    setIsEditOpen(false);
    setEditingTool(null);
  };

  const handleToolUpdated = (updatedTool: Tool) => {
    if (toolsData) {
      setToolsData({
        ...toolsData,
        tools: toolsData.tools.map((t) =>
          t._id === updatedTool._id ? updatedTool : t,
        ),
      });
    }
  };

  // Handle ingestion trigger
  const handleIngest = async () => {
    setIngesting(true);
    try {
      await triggerIngestion();
      await loadTools();
      await loadCategories();
    } catch (error) {
      console.error('Ingestion gagal:', error);
    } finally {
      setIngesting(false);
    }
  };

  return (
    <main className="min-h-screen relative">
      {/* ==================== HERO SECTION ==================== */}
      <section className="relative pt-16 pb-12 px-4 overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto text-center relative z-10">
          {/* Logo / Title */}
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary-500/20 bg-primary-500/5 text-sm text-primary-300 mb-6">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Open Source Catalog
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-4">
              <span className="text-white">Katalog </span>
              <span className="gradient-text">IT Tools</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Temukan, jelajahi, dan kelola tool IT open-source terbaik untuk{' '}
              <span className="text-primary-300">keamanan jaringan</span>,{' '}
              <span className="text-purple-300">DevOps</span>,{' '}
              <span className="text-cyan-300">monitoring</span>, dan banyak lagi.
            </p>
          </div>

          {/* Search Bar */}
          <div className="mt-8 mb-6">
            <SearchBar onSearch={handleSearch} />
          </div>

          {/* Seed / Ingest Button */}
          <button
            onClick={handleIngest}
            disabled={ingesting}
            className="mt-2 px-5 py-2.5 rounded-xl text-sm font-medium text-primary-300 border border-primary-500/30 hover:bg-primary-500/10 transition-all duration-300 disabled:opacity-50"
            id="ingest-button"
          >
            {ingesting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Mengambil data...
              </span>
            ) : (
              '🔄 Seed / Refresh Data'
            )}
          </button>
        </div>
      </section>

      {/* ==================== CATEGORY FILTER ==================== */}
      <section className="px-4 pb-8">
        <div className="max-w-6xl mx-auto">
          <CategoryFilter
            categories={categories}
            selected={selectedCategory}
            onSelect={handleCategorySelect}
          />
        </div>
      </section>

      {/* ==================== TOOLS GRID ==================== */}
      <section className="px-4 pb-16">
        <div className="max-w-6xl mx-auto">
          {/* Results count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-slate-400 text-sm">
              {toolsData ? (
                <>
                  Menampilkan{' '}
                  <span className="text-white font-semibold">
                    {toolsData.tools.length}
                  </span>{' '}
                  dari{' '}
                  <span className="text-white font-semibold">
                    {toolsData.total}
                  </span>{' '}
                  tools
                  {search && (
                    <span className="text-primary-300"> — "{search}"</span>
                  )}
                  {selectedCategory && (
                    <span className="text-purple-300">
                      {' '}
                      — {selectedCategory}
                    </span>
                  )}
                </>
              ) : (
                'Memuat data...'
              )}
            </p>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="glass-card p-6 animate-pulse"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-xl bg-slate-700/50" />
                    <div className="flex-1">
                      <div className="h-5 bg-slate-700/50 rounded w-2/3 mb-2" />
                      <div className="h-3 bg-slate-700/30 rounded w-1/3" />
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="h-3 bg-slate-700/30 rounded" />
                    <div className="h-3 bg-slate-700/30 rounded w-4/5" />
                  </div>
                  <div className="flex gap-2">
                    <div className="h-6 bg-slate-700/20 rounded-md w-16" />
                    <div className="h-6 bg-slate-700/20 rounded-md w-16" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tools grid */}
          {!loading && toolsData && toolsData.tools.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {toolsData.tools.map((tool) => (
                  <ToolCard key={tool._id} tool={tool} onEdit={handleEdit} />
                ))}
              </div>

              {/* Pagination controls */}
              {toolsData.totalPages > 1 && (
                <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 glass-card p-4">
                  <div className="text-sm text-slate-400">
                    Halaman <span className="text-white font-semibold">{toolsData.page}</span> dari{' '}
                    <span className="text-white font-semibold">{toolsData.totalPages}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-300 text-sm hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      ← Prev
                    </button>

                    <div className="flex items-center gap-1">
                      {(() => {
                        const total = toolsData.totalPages;
                        const current = page;
                        const maxButtons = 5;
                        let start = Math.max(1, current - 2);
                        let end = Math.min(total, start + maxButtons - 1);
                        if (end - start + 1 < maxButtons) {
                          start = Math.max(1, end - maxButtons + 1);
                        }
                        const pages = [];
                        for (let p = start; p <= end; p++) {
                          pages.push(p);
                        }
                        return pages.map((pageNum) => (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                              page === pageNum
                                ? 'bg-primary-500 text-white font-bold'
                                : 'border border-slate-700 bg-slate-800/30 text-slate-400 hover:bg-slate-700 hover:text-white'
                            }`}
                          >
                            {pageNum}
                          </button>
                        ));
                      })()}
                    </div>

                    <button
                      onClick={() => setPage((p) => Math.min(toolsData.totalPages, p + 1))}
                      disabled={page >= toolsData.totalPages}
                      className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/50 text-slate-300 text-sm hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    >
                      Next →
                    </button>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <span>Tampilkan:</span>
                    <select
                      value={limit}
                      onChange={(e) => {
                        setLimit(Number(e.target.value));
                        setPage(1);
                      }}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-white text-sm focus:outline-none focus:border-primary-500"
                    >
                      <option value={12}>12 per hal</option>
                      <option value={24}>24 per hal</option>
                      <option value={48}>48 per hal</option>
                      <option value={100}>100 per hal</option>
                      <option value={1000}>Tampilkan Semua (1000)</option>
                    </select>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Empty state */}
          {!loading && toolsData && toolsData.tools.length === 0 && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold text-white mb-2">
                Tidak ada tool ditemukan
              </h3>
              <p className="text-slate-400 max-w-md mx-auto">
                {search || selectedCategory
                  ? 'Coba ubah kata kunci pencarian atau filter kategori.'
                  : 'Klik tombol "Seed / Refresh Data" untuk mengambil data tools.'}
              </p>
              {(search || selectedCategory) && (
                <button
                  onClick={() => {
                    setSearch('');
                    setSelectedCategory('');
                  }}
                  className="mt-4 btn-primary text-sm"
                >
                  Reset Filter
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ==================== AI RECOMMENDATION ==================== */}
      <section className="px-4 pb-20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              🤖 AI <span className="gradient-text">Recommendation</span>
            </h2>
            <p className="text-slate-400">
              Tanyakan tool yang Anda butuhkan, AI akan merekomendasikan dari
              katalog
            </p>
          </div>
          <RecommendChat />
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="border-t border-slate-800/50 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-slate-500 text-sm">
            © 2026 Katalog Open Source IT Tools — Built with NestJS, MongoDB,
            Next.js, MinIO & Docker
          </p>
        </div>
      </footer>

      {/* ==================== EDIT MODAL ==================== */}
      <EditModal
        tool={editingTool}
        isOpen={isEditOpen}
        onClose={handleEditClose}
        onUpdated={handleToolUpdated}
      />
    </main>
  );
}
