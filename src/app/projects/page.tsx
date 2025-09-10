// 동적 렌더링 강제 - Static Generation 방지
export const dynamic = 'force-dynamic';

// 통합 프로젝트 페이지 - List View와 Detail View 전환 가능
import UnifiedProjectsPage from './unified-page';

export default function ProjectsPage() {
  return <UnifiedProjectsPage />;
}