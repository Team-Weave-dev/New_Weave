'use client';

import { WidgetCategory } from './widgetData';
import { WidgetPreviewCard } from './WidgetPreviewCard';
import Typography from '@/components/ui/Typography';

interface CategorySectionProps {
  category: WidgetCategory;
  searchQuery: string;
}

export function CategorySection({ category, searchQuery }: CategorySectionProps) {
  const filteredWidgets = category.widgets.filter(widget => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      widget.name.toLowerCase().includes(query) ||
      widget.description.toLowerCase().includes(query) ||
      widget.features.some(f => f.toLowerCase().includes(query))
    );
  });

  if (filteredWidgets.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{category.icon}</span>
        <div>
          <Typography variant="h2" className="text-[var(--color-text-primary)]">
            {category.name}
          </Typography>
          <Typography variant="body2" className="text-[var(--color-text-secondary)]">
            {category.description}
          </Typography>
        </div>
      </div>

      <div className="space-y-6">
        {filteredWidgets.map(widget => (
          <WidgetPreviewCard key={widget.id} widget={widget} />
        ))}
      </div>
    </div>
  );
}