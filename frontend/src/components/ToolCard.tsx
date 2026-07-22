'use client';

import { Tool, resolveImageUrl } from '@/lib/api';

interface ToolCardProps {
  tool: Tool;
  onEdit: (tool: Tool) => void;
}

export default function ToolCard({ tool, onEdit }: ToolCardProps) {
  // Placeholder icon jika tidak ada icon_url
  const iconSrc = tool.icon_url ? resolveImageUrl(tool.icon_url) : null;

  return (
    <div className="glass-card card-animate p-6 flex flex-col h-full group">
      {/* Header: Icon + Title */}
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 border border-primary-500/20 flex items-center justify-center overflow-hidden">
          {iconSrc ? (
            <img
              src={iconSrc}
              alt={tool.title}
              className="w-10 h-10 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <span className={`text-2xl font-bold gradient-text ${iconSrc ? 'hidden' : ''}`}>
            {tool.title.charAt(0).toUpperCase()}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white truncate group-hover:text-primary-300 transition-colors">
            {tool.title}
          </h3>
          <span className="badge text-xs mt-1">{tool.category}</span>
        </div>
      </div>

      {/* Description */}
      <p className="text-slate-400 text-sm leading-relaxed mb-4 flex-1 line-clamp-3">
        {tool.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {tool.tags.slice(0, 4).map((tag) => (
          <span
            key={tag}
            className="px-2 py-0.5 rounded-md text-xs bg-surface-800/80 text-slate-400 border border-surface-700/50"
          >
            #{tag}
          </span>
        ))}
        {tool.tags.length > 4 && (
          <span className="px-2 py-0.5 rounded-md text-xs text-slate-500">
            +{tool.tags.length - 4}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-slate-700/30">
        {tool.source_url && (
          <a
            href={tool.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center py-2 px-3 rounded-lg text-sm font-medium text-primary-300 hover:bg-primary-500/10 transition-all duration-200 border border-primary-500/20 hover:border-primary-500/40"
          >
            🔗 Website
          </a>
        )}
        <button
          onClick={() => onEdit(tool)}
          className="flex-1 py-2 px-3 rounded-lg text-sm font-medium text-amber-300 hover:bg-amber-500/10 transition-all duration-200 border border-amber-500/20 hover:border-amber-500/40"
          id={`edit-tool-${tool._id}`}
        >
          ✏️ Edit
        </button>
      </div>
    </div>
  );
}
