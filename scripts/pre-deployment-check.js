#!/usr/bin/env node

/**
 * 배포 전 자동 검증 스크립트
 * TASK-055: 최종 검증 및 배포 준비
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// 검증 결과 저장
const results = {
  passed: [],
  failed: [],
  warnings: []
};

// 유틸리티 함수
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function runCommand(command, silent = false) {
  try {
    const output = execSync(command, { encoding: 'utf-8' });
    if (!silent) {
      return output;
    }
    return true;
  } catch (error) {
    return false;
  }
}

function checkFile(filePath) {
  return fs.existsSync(path.resolve(process.cwd(), filePath));
}

function addResult(type, message) {
  results[type].push(message);
  const icon = type === 'passed' ? '✅' : type === 'failed' ? '❌' : '⚠️';
  const color = type === 'passed' ? colors.green : type === 'failed' ? colors.red : colors.yellow;
  log(`${icon} ${message}`, color);
}

// 검증 함수들
function checkBuild() {
  log('\n📦 빌드 검증 중...', colors.cyan);
  
  // TypeScript 컴파일 체크
  if (runCommand('npx tsc --noEmit', true)) {
    addResult('passed', 'TypeScript 컴파일 성공');
  } else {
    addResult('failed', 'TypeScript 컴파일 오류');
  }
  
  // Next.js 빌드 체크
  if (checkFile('.next')) {
    addResult('passed', 'Next.js 빌드 디렉토리 존재');
  } else {
    addResult('warnings', 'Next.js 빌드가 필요합니다 (npm run build)');
  }
}

function checkEnvironment() {
  log('\n🔐 환경 변수 검증 중...', colors.cyan);
  
  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY'
  ];
  
  const envFile = checkFile('.env.local') || checkFile('.env.production');
  if (envFile) {
    addResult('passed', '환경 변수 파일 존재');
  } else {
    addResult('warnings', '환경 변수 파일이 없습니다');
  }
  
  // 환경 변수 체크 (현재 프로세스)
  requiredEnvVars.forEach(varName => {
    if (process.env[varName]) {
      addResult('passed', `${varName} 설정됨`);
    } else {
      addResult('warnings', `${varName} 설정 필요`);
    }
  });
}

function checkDependencies() {
  log('\n📚 의존성 검증 중...', colors.cyan);
  
  // package-lock.json 존재 확인
  if (checkFile('package-lock.json')) {
    addResult('passed', 'package-lock.json 존재');
  } else {
    addResult('warnings', 'package-lock.json이 없습니다');
  }
  
  // 취약점 검사
  const auditResult = runCommand('npm audit --audit-level=high', true);
  if (auditResult) {
    addResult('passed', '높은 수준의 보안 취약점 없음');
  } else {
    addResult('warnings', '보안 취약점 검토 필요 (npm audit)');
  }
}

function checkTests() {
  log('\n🧪 테스트 검증 중...', colors.cyan);
  
  // 테스트 파일 존재 확인
  const testDirs = ['tests/e2e', 'tests/integration', 'tests/accessibility', 'tests/security'];
  testDirs.forEach(dir => {
    if (checkFile(dir)) {
      addResult('passed', `${dir} 테스트 디렉토리 존재`);
    } else {
      addResult('warnings', `${dir} 테스트 디렉토리 없음`);
    }
  });
  
  // Jest/Vitest 설정 확인
  if (checkFile('vitest.config.ts') || checkFile('jest.config.js')) {
    addResult('passed', '테스트 설정 파일 존재');
  } else {
    addResult('warnings', '테스트 설정 파일 없음');
  }
}

function checkDatabase() {
  log('\n🗄️ 데이터베이스 검증 중...', colors.cyan);
  
  // Supabase 마이그레이션 확인
  if (checkFile('supabase/migrations')) {
    const migrations = fs.readdirSync(path.resolve(process.cwd(), 'supabase/migrations'));
    if (migrations.length > 0) {
      addResult('passed', `${migrations.length}개의 마이그레이션 파일 발견`);
    } else {
      addResult('warnings', '마이그레이션 파일이 없습니다');
    }
  } else {
    addResult('warnings', 'Supabase 마이그레이션 디렉토리 없음');
  }
  
  // seed 데이터 확인
  if (checkFile('supabase/seed.sql')) {
    addResult('passed', 'Seed 데이터 파일 존재');
  } else {
    addResult('warnings', 'Seed 데이터 파일 없음');
  }
}

function checkSecurity() {
  log('\n🔒 보안 검증 중...', colors.cyan);
  
  // 보안 미들웨어 확인
  if (checkFile('src/middleware/security.ts') || checkFile('src/middleware.ts')) {
    addResult('passed', '보안 미들웨어 구현됨');
  } else {
    addResult('warnings', '보안 미들웨어 없음');
  }
  
  // 보안 유틸리티 확인
  if (checkFile('src/lib/utils/security.ts')) {
    addResult('passed', '보안 유틸리티 구현됨');
  } else {
    addResult('warnings', '보안 유틸리티 없음');
  }
  
  // .env 파일이 .gitignore에 포함되어 있는지 확인
  if (checkFile('.gitignore')) {
    const gitignore = fs.readFileSync('.gitignore', 'utf-8');
    if (gitignore.includes('.env')) {
      addResult('passed', '.env 파일이 .gitignore에 포함됨');
    } else {
      addResult('failed', '.env 파일이 .gitignore에 포함되지 않음!');
    }
  }
}

function checkDocumentation() {
  log('\n📝 문서화 검증 중...', colors.cyan);
  
  const docs = [
    'README.md',
    'docs/deployment-checklist.md',
    'docs/tax-management-implementation.md',
    'RELEASE_NOTES.md'
  ];
  
  docs.forEach(doc => {
    if (checkFile(doc)) {
      addResult('passed', `${doc} 문서 존재`);
    } else {
      addResult('warnings', `${doc} 문서 없음`);
    }
  });
}

function checkPerformance() {
  log('\n⚡ 성능 최적화 검증 중...', colors.cyan);
  
  // Next.js 설정 확인
  if (checkFile('next.config.js')) {
    const config = fs.readFileSync('next.config.js', 'utf-8');
    
    if (config.includes('swcMinify')) {
      addResult('passed', 'SWC 미니파이 활성화');
    } else {
      addResult('warnings', 'SWC 미니파이 비활성화');
    }
    
    if (config.includes('images')) {
      addResult('passed', '이미지 최적화 설정됨');
    } else {
      addResult('warnings', '이미지 최적화 설정 없음');
    }
  }
  
  // 번들 분석기 확인
  if (checkFile('.next/analyze')) {
    addResult('passed', '번들 분석 가능');
  } else {
    addResult('warnings', '번들 분석을 위해 npm run analyze 실행 필요');
  }
}

function generateReport() {
  log('\n' + '='.repeat(50), colors.cyan);
  log('📊 배포 준비 상태 보고서', colors.cyan);
  log('='.repeat(50), colors.cyan);
  
  const total = results.passed.length + results.failed.length + results.warnings.length;
  const score = Math.round((results.passed.length / total) * 100);
  
  log(`\n✅ 통과: ${results.passed.length}`, colors.green);
  log(`⚠️  경고: ${results.warnings.length}`, colors.yellow);
  log(`❌ 실패: ${results.failed.length}`, colors.red);
  
  log(`\n전체 점수: ${score}%`, score >= 80 ? colors.green : score >= 60 ? colors.yellow : colors.red);
  
  if (results.failed.length > 0) {
    log('\n🚨 실패 항목 (반드시 수정 필요):', colors.red);
    results.failed.forEach(item => log(`  - ${item}`, colors.red));
  }
  
  if (results.warnings.length > 0) {
    log('\n⚠️  경고 항목 (검토 필요):', colors.yellow);
    results.warnings.forEach(item => log(`  - ${item}`, colors.yellow));
  }
  
  // 배포 준비 상태 판단
  log('\n' + '='.repeat(50), colors.cyan);
  if (results.failed.length === 0 && score >= 80) {
    log('🎉 배포 준비 완료!', colors.green);
    log('모든 필수 검증을 통과했습니다.', colors.green);
    return 0;
  } else if (results.failed.length === 0) {
    log('⚠️  조건부 배포 가능', colors.yellow);
    log('경고 사항을 검토한 후 배포를 진행하세요.', colors.yellow);
    return 0;
  } else {
    log('❌ 배포 불가', colors.red);
    log('실패 항목을 모두 수정한 후 다시 검증하세요.', colors.red);
    return 1;
  }
}

// 메인 실행
async function main() {
  log('🚀 세무 관리 시스템 배포 전 검증 시작', colors.cyan);
  log('='.repeat(50), colors.cyan);
  
  // 모든 검증 실행
  checkBuild();
  checkEnvironment();
  checkDependencies();
  checkTests();
  checkDatabase();
  checkSecurity();
  checkDocumentation();
  checkPerformance();
  
  // 보고서 생성 및 종료 코드 반환
  const exitCode = generateReport();
  process.exit(exitCode);
}

// 스크립트 실행
if (require.main === module) {
  main().catch(error => {
    log(`\n❌ 검증 중 오류 발생: ${error.message}`, colors.red);
    process.exit(1);
  });
}

module.exports = { checkBuild, checkEnvironment, checkSecurity };