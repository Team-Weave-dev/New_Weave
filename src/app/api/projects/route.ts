import { NextRequest, NextResponse } from 'next/server';

// Mock 프로젝트 데이터
const mockProjects = [
  {
    id: '1',
    projectName: '웹사이트 리디자인',
    clientName: '삼성전자',
    status: 'active',
    progress: 75,
    startDate: '2024-01-15',
    endDate: '2024-06-30',
    amount: 50000000,
    description: '기업 웹사이트 전면 리디자인 프로젝트'
  },
  {
    id: '2',
    projectName: '모바일 앱 개발',
    clientName: 'LG전자',
    status: 'planning',
    progress: 20,
    startDate: '2024-03-01',
    endDate: '2024-12-31',
    amount: 80000000,
    description: 'iOS/Android 하이브리드 앱 개발'
  },
  {
    id: '3',
    projectName: 'ERP 시스템 구축',
    clientName: 'SK텔레콤',
    status: 'completed',
    progress: 100,
    startDate: '2023-06-01',
    endDate: '2024-01-31',
    amount: 120000000,
    description: '전사 ERP 시스템 구축 및 마이그레이션'
  }
];

// GET: 프로젝트 목록 조회
export async function GET(request: NextRequest) {
  try {
    // 쿼리 파라미터 처리
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    
    let filteredProjects = [...mockProjects];
    
    // 상태 필터링
    if (status && status !== 'all') {
      filteredProjects = filteredProjects.filter(p => p.status === status);
    }
    
    // 검색 필터링
    if (search) {
      const searchLower = search.toLowerCase();
      filteredProjects = filteredProjects.filter(p => 
        p.projectName.toLowerCase().includes(searchLower) ||
        p.clientName.toLowerCase().includes(searchLower)
      );
    }
    
    return NextResponse.json({
      projects: filteredProjects,
      total: filteredProjects.length
    });
  } catch (error) {
    console.error('Get projects error:', error);
    return NextResponse.json(
      { error: '프로젝트 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 새 프로젝트 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const newProject = {
      id: String(mockProjects.length + 1),
      ...body,
      status: body.status || 'planning',
      progress: body.progress || 0,
      createdAt: new Date().toISOString()
    };
    
    mockProjects.push(newProject);
    
    return NextResponse.json({
      project: newProject,
      message: '프로젝트가 성공적으로 생성되었습니다.'
    }, { status: 201 });
  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json(
      { error: '프로젝트 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}