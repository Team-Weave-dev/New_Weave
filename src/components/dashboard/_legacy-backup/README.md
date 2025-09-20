# 레거시 대시보드 시스템 백업

## 개요
이 폴더는 iOS 스타일 대시보드로 전환하면서 백업된 기존 대시보드 시스템 파일들을 포함합니다.

## 백업 날짜
2025-09-21

## 백업 이유
- iOS 스타일 대시보드 시스템으로 전면 전환
- 기존 위젯들은 유지하되, 추후 iOS 스타일로 재디자인 예정
- 대시보드 컨테이너 및 레이아웃 시스템은 iOS 스타일로 완전 교체

## 백업된 주요 파일
- `DashboardContainer.tsx` - 기존 대시보드 컨테이너
- `DashboardGrid.tsx` - 기존 그리드 시스템
- `GridLayout.tsx` - 그리드 레이아웃 관리
- `LayoutManager.tsx` - 레이아웃 매니저
- `WidgetContainer.tsx` - 위젯 컨테이너
- `WidgetWrapper.tsx` - 위젯 래퍼
- `WidgetRenderer.tsx` - 위젯 렌더러
- 기타 레거시 파일들

## 현재 사용 중인 시스템
- **iOS 대시보드**: `/src/components/dashboard/ios-style/IOSStyleDashboardFixed.tsx`
- **위젯 파일**: `/src/components/dashboard/widgets/` (보존됨)

## 참고사항
- 기존 위젯들은 `/widgets/` 폴더에 보존되어 있음
- 추후 iOS 스타일로 재디자인하여 적용 예정
- 레거시 코드는 참고용으로만 보관