'use client';

import { useState, useCallback, useEffect } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  initialValue?: string;
}

export default function SearchBar({ onSearch, initialValue = '' }: SearchBarProps) {
  const [value, setValue] = useState(initialValue);

  // Debounce search (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch(value);
    }, 300);
    return () => clearTimeout(timer);
  }, [value, onSearch]);

  const handleClear = () => {
    setValue('');
    onSearch('');
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Search icon */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
          />
        </svg>
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Cari tools berdasarkan nama atau deskripsi..."
        className="w-full pl-12 pr-12 py-4 rounded-2xl border text-white placeholder-slate-400 text-lg transition-all duration-300 outline-none"
        style={{
          background: 'rgba(15, 23, 42, 0.7)',
          borderColor: 'rgba(148, 163, 184, 0.15)',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'rgba(99, 102, 241, 0.5)';
          e.target.style.boxShadow = '0 0 0 4px rgba(99, 102, 241, 0.1), 0 8px 25px rgba(99, 102, 241, 0.15)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'rgba(148, 163, 184, 0.15)';
          e.target.style.boxShadow = 'none';
        }}
        id="search-input"
      />

      {/* Clear button */}
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-600/50 transition-all"
          id="search-clear"
        >
          ✕
        </button>
      )}
    </div>
  );
}
