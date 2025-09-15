#!/usr/bin/env node

/**
 * 위젯 색상 업데이트 스크립트
 * 모든 위젯 컴포넌트의 색상을 프로젝트 메인 색상으로 일괄 변경
 */

const fs = require('fs');
const path = require('path');

const widgetsDir = path.join(process.cwd(), 'src/components/dashboard/widgets');

// 색상 매핑 규칙
const colorMappings = [
  // Gray 색상을 프로젝트 색상으로 변환
  { from: /text-gray-400/g, to: 'widgetColors.text.tertiary' },
  { from: /text-gray-500/g, to: 'widgetColors.text.secondary' },
  { from: /text-gray-600 dark:text-gray-400/g, to: 'widgetColors.text.secondary' },
  { from: /text-gray-700 dark:text-gray-300/g, to: 'widgetColors.text.primary' },
  { from: /text-gray-900 dark:text-gray-100/g, to: 'widgetColors.text.primary' },
  { from: /text-gray-900/g, to: 'widgetColors.text.primary' },
  
  // Blue 색상을 Primary로 변환
  { from: /text-blue-600/g, to: 'widgetColors.primary.text' },
  { from: /text-blue-900 dark:text-blue-100/g, to: 'widgetColors.primary.text' },
  { from: /hover:text-blue-800/g, to: 'widgetColors.primary.textHover' },
  
  // Green 색상을 Success로 변환
  { from: /text-green-600/g, to: 'widgetColors.status.success.text' },
  { from: /text-green-900 dark:text-green-100/g, to: 'widgetColors.status.success.text' },
  
  // Red 색상을 Error로 변환
  { from: /text-red-500/g, to: 'widgetColors.status.error.text' },
  { from: /text-red-600/g, to: 'widgetColors.status.error.text' },
  { from: /text-red-900 dark:text-red-100/g, to: 'widgetColors.status.error.text' },
  
  // 배경 색상
  { from: /bg-gray-100 dark:bg-gray-700/g, to: 'widgetColors.bg.surfaceSecondary' },
  { from: /bg-gray-100 dark:bg-gray-800/g, to: 'widgetColors.bg.surfaceSecondary' },
  { from: /bg-white dark:bg-gray-800/g, to: 'widgetColors.bg.surface' },
];

// 처리할 위젯 파일 목록
const widgetFiles = [
  'TaskTrackerWidget.tsx',
  'TaxDeadlineWidget.tsx',
  'TaxCalculatorWidget.tsx',
  'TodoListWidget.tsx',
  'CalendarWidget.tsx',
  'KPIWidget.tsx',
  'RecentActivityWidget.tsx'
];

// import 문 추가 확인 및 처리
function ensureImport(content) {
  if (!content.includes("import { widgetColors")) {
    const importRegex = /import { cn } from '@\/lib\/utils'/;
    if (importRegex.test(content)) {
      content = content.replace(
        importRegex,
        "import { cn } from '@/lib/utils'\nimport { widgetColors, widgetCategoryColors, gradients } from '@/lib/dashboard/widget-colors'"
      );
    }
  }
  return content;
}

// 색상 변환 처리
function transformColors(content) {
  // className 속성 내의 색상만 변환
  colorMappings.forEach(({ from, to }) => {
    // className 내부의 문자열 색상 클래스를 변환
    const classNameRegex = new RegExp(`className="([^"]*)(${from.source.replace(/\\/g, '')})([^"]*)"`, 'g');
    content = content.replace(classNameRegex, (match, before, colorClass, after) => {
      return `className={cn("${before}${after}", ${to})}`;
    });
    
    // 이미 cn()으로 감싸진 경우
    const cnRegex = new RegExp(`className={cn\\(([^)]*)"(${from.source.replace(/\\/g, '')})"([^)]*)\\)}`, 'g');
    content = content.replace(cnRegex, (match, before, colorClass, after) => {
      return `className={cn(${before}${to}${after})}`;
    });
  });
  
  return content;
}

// 파일 처리
widgetFiles.forEach(fileName => {
  const filePath = path.join(widgetsDir, fileName);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  파일을 찾을 수 없음: ${fileName}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // import 문 추가
  content = ensureImport(content);
  
  // 색상 변환
  content = transformColors(content);
  
  // 파일 저장
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ 업데이트 완료: ${fileName}`);
});

console.log('\n🎨 모든 위젯 색상 업데이트가 완료되었습니다!');