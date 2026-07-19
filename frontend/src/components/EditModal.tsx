'use client';

import { useState, useEffect, useRef } from 'react';
import { Tool, updateTool } from '@/lib/api';

interface EditModalProps {
  tool: Tool | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updatedTool: Tool) => void;
}

export default function EditModal({
  tool,
  isOpen,
  onClose,
  onUpdated,
}: EditModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Pre-fill form when tool changes
  useEffect(() => {
    if (tool) {
      setTitle(tool.title);
      setDescription(tool.description);
      setCategory(tool.category);
      setTags(tool.tags.join(', '));
      setSourceUrl(tool.source_url || '');
      setError('');
      setSuccess(false);
    }
  }, [tool]);

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Close on click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tool) return;

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const updatedData: Partial<Tool> = {
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        tags: tags
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t.length > 0),
        source_url: sourceUrl.trim(),
      };

      const updated = await updateTool(tool._id, updatedData);
      setSuccess(true);
      onUpdated(updated);

      // Auto close after success
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Gagal memperbarui tool');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !tool) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      id="edit-modal-overlay"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" />

      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-full max-w-lg rounded-2xl border animate-scale-in overflow-hidden"
        style={{
          background: 'rgba(15, 23, 42, 0.95)',
          borderColor: 'rgba(99, 102, 241, 0.2)',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(99, 102, 241, 0.1)',
        }}
        id="edit-modal-content"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/50">
          <div>
            <h2 className="text-xl font-bold text-white">Edit Tool</h2>
            <p className="text-sm text-slate-400 mt-0.5">
              Perbarui informasi {tool.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
            id="edit-modal-close"
          >
            ✕
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Nama Tool
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder="Masukkan nama tool"
              required
              id="edit-title"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Deskripsi
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field resize-none"
              rows={3}
              placeholder="Deskripsi singkat tool"
              required
              id="edit-description"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Kategori
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="input-field"
              placeholder="Contoh: Network Security"
              required
              id="edit-category"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Tags{' '}
              <span className="text-slate-500 font-normal">
                (pisahkan dengan koma)
              </span>
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="input-field"
              placeholder="scanner, network, security"
              id="edit-tags"
            />
          </div>

          {/* Source URL */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Website URL
            </label>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              className="input-field"
              placeholder="https://example.com"
              id="edit-source-url"
            />
          </div>

          {/* Status messages */}
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
              ✅ Tool berhasil diperbarui!
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl font-medium text-slate-300 border border-slate-600/50 hover:bg-slate-700/50 transition-all duration-200"
              id="edit-cancel"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              id="edit-submit"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Menyimpan...
                </span>
              ) : (
                'Simpan Perubahan'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
