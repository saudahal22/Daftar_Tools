'use client';

interface CategoryFilterProps {
  categories: string[];
  selected: string;
  onSelect: (category: string) => void;
}

export default function CategoryFilter({
  categories,
  selected,
  onSelect,
}: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2" id="category-filter">
      {/* All button */}
      <button
        onClick={() => onSelect('')}
        className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 border ${
          selected === ''
            ? 'bg-primary-500/20 text-primary-300 border-primary-500/40 shadow-lg shadow-primary-500/10'
            : 'text-slate-400 border-slate-700/50 hover:text-slate-200 hover:border-slate-600/50 hover:bg-slate-800/50'
        }`}
        id="category-all"
      >
        🔥 Semua
      </button>

      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 border ${
            selected === cat
              ? 'bg-primary-500/20 text-primary-300 border-primary-500/40 shadow-lg shadow-primary-500/10'
              : 'text-slate-400 border-slate-700/50 hover:text-slate-200 hover:border-slate-600/50 hover:bg-slate-800/50'
          }`}
          id={`category-${cat.toLowerCase().replace(/\s+/g, '-')}`}
        >
          {getCategoryEmoji(cat)} {cat}
        </button>
      ))}
    </div>
  );
}

function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    'Network Security': '🛡️',
    'Penetration Testing': '🔓',
    'DevOps': '🐳',
    'Monitoring': '📊',
    'CI/CD': '🔄',
    'Automation': '🤖',
    'Infrastructure': '🏗️',
    'Data & Analytics': '📈',
    'Web Server': '🌐',
    'Security': '🔒',
  };
  return map[category] || '🔧';
}
