'use client';

import { Search } from 'lucide-react';

interface WidgetSearchProps {
  onSearch: (query: string) => void;
  onCategoryFilter: (category: string | null) => void;
  selectedCategory: string | null;
}

const categories = [
  { id: null, label: '전체' },
  { id: 'project', label: '프로젝트' },
  { id: 'tax', label: '세무' },
  { id: 'analytics', label: '분석' },
  { id: 'productivity', label: '생산성' }
];

export function WidgetSearch({ onSearch, onCategoryFilter, selectedCategory }: WidgetSearchProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      {/* 검색 입력 */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-tertiary)]" />
        <input
          type="text"
          placeholder="위젯 이름, 기능으로 검색..."
          onChange={(e) => onSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-[var(--color-border-subtle)] rounded-lg 
                   bg-[var(--color-background-primary)] text-[var(--color-text-primary)]
                   focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary-start)]"
        />
      </div>

      {/* 카테고리 필터 */}
      <div className="flex gap-2">
        {categories.map(cat => (
          <button
            key={cat.id ?? 'all'}
            onClick={() => onCategoryFilter(cat.id)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedCategory === cat.id
                ? 'bg-[var(--color-brand-primary-start)] text-white'
                : 'bg-[var(--color-background-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-background-tertiary)]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}