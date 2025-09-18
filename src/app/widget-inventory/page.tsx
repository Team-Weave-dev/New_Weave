import { WidgetInventory } from '@/components/widget-inventory/WidgetInventory';
import PageContainer from '@/components/layout/PageContainer';
import Typography from '@/components/ui/Typography';

export default function WidgetInventoryPage() {
  return (
    <PageContainer>
      <div className="space-y-6">
        {/* 헤더 섹션 */}
        <div className="border-b border-[var(--color-border-subtle)] pb-6">
          <Typography variant="h1" className="text-[var(--color-text-primary)] mb-2">
            위젯 인벤토리
          </Typography>
          <Typography variant="body1" className="text-[var(--color-text-secondary)]">
            WEAVE 대시보드에서 사용 가능한 모든 위젯을 확인하고 테스트해보세요
          </Typography>
        </div>

        {/* 위젯 카탈로그 */}
        <WidgetInventory />
      </div>
    </PageContainer>
  );
}