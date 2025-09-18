'use client';

import { useState } from 'react';
import { CategorySection } from './CategorySection';
import { WidgetSearch } from './WidgetSearch';
import { widgetCategories } from './widgetData';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';

export function WidgetInventory() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  return (
    <div className="space-y-8">
      {/* 검색 및 필터 */}
      <Card className="p-4">
        <WidgetSearch 
          onSearch={setSearchQuery}
          onCategoryFilter={setSelectedCategory}
          selectedCategory={selectedCategory}
        />
      </Card>

      {/* 통계 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {widgetCategories.map(category => (
          <Card 
            key={category.id}
            className="p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setSelectedCategory(category.id === selectedCategory ? null : category.id)}
          >
            <div className="flex items-center gap-3">
              <div className="text-3xl">{category.icon}</div>
              <div>
                <Typography variant="h6" className="text-[var(--color-text-primary)]">
                  {category.name}
                </Typography>
                <Typography variant="caption" className="text-[var(--color-text-secondary)]">
                  {category.widgets.length}개 위젯
                </Typography>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* 카테고리별 위젯 섹션 */}
      <div className="space-y-8">
        {widgetCategories
          .filter(category => !selectedCategory || category.id === selectedCategory)
          .map(category => (
            <CategorySection 
              key={category.id}
              category={category}
              searchQuery={searchQuery}
            />
          ))}
      </div>
    </div>
  );
}