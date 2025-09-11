import { NextRequest, NextResponse } from 'next/server';

// Mock 프로젝트 데이터 (실제로는 DB에서 가져와야 함)
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
    description: '기업 웹사이트 전면 리디자인 프로젝트',
    tasks: [],
    team: []
  }
];

// GET: 특정 프로젝트 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const project = mockProjects.find(p => p.id === params.id);
    
    if (!project) {
      return NextResponse.json(
        { error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ project });
  } catch (error) {
    console.error('Get project error:', error);
    return NextResponse.json(
      { error: '프로젝트 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// PUT: 프로젝트 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const projectIndex = mockProjects.findIndex(p => p.id === params.id);
    
    if (projectIndex === -1) {
      return NextResponse.json(
        { error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    mockProjects[projectIndex] = {
      ...mockProjects[projectIndex],
      ...body,
      id: params.id, // ID는 변경 불가
      updatedAt: new Date().toISOString()
    };
    
    return NextResponse.json({
      project: mockProjects[projectIndex],
      message: '프로젝트가 성공적으로 수정되었습니다.'
    });
  } catch (error) {
    console.error('Update project error:', error);
    return NextResponse.json(
      { error: '프로젝트 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: 프로젝트 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectIndex = mockProjects.findIndex(p => p.id === params.id);
    
    if (projectIndex === -1) {
      return NextResponse.json(
        { error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    mockProjects.splice(projectIndex, 1);
    
    return NextResponse.json({
      message: '프로젝트가 성공적으로 삭제되었습니다.'
    });
  } catch (error) {
    console.error('Delete project error:', error);
    return NextResponse.json(
      { error: '프로젝트 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}