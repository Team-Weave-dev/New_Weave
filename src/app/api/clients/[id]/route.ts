import { NextRequest, NextResponse } from 'next/server';

// Mock 클라이언트 데이터 (실제로는 DB에서 가져와야 함)
const mockClients = [
  {
    id: '1',
    name: '삼성전자',
    email: 'contact@samsung.com',
    phone: '02-1234-5678',
    business_number: '124-81-00998',
    address: '서울특별시 서초구 서초대로74길 11',
    company: '삼성전자',
    tax_type: '일반과세자'
  }
];

// GET: 특정 클라이언트 조회
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const client = mockClients.find(c => c.id === params.id);
    
    if (!client) {
      return NextResponse.json(
        { error: '클라이언트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ client });
  } catch (error) {
    console.error('Get client error:', error);
    return NextResponse.json(
      { error: '클라이언트 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// PUT: 클라이언트 수정
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const clientIndex = mockClients.findIndex(c => c.id === params.id);
    
    if (clientIndex === -1) {
      return NextResponse.json(
        { error: '클라이언트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    mockClients[clientIndex] = {
      ...mockClients[clientIndex],
      ...body,
      id: params.id, // ID는 변경 불가
      updated_at: new Date().toISOString()
    };
    
    return NextResponse.json({
      client: mockClients[clientIndex],
      message: '클라이언트가 성공적으로 수정되었습니다.'
    });
  } catch (error) {
    console.error('Update client error:', error);
    return NextResponse.json(
      { error: '클라이언트 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: 클라이언트 삭제
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientIndex = mockClients.findIndex(c => c.id === params.id);
    
    if (clientIndex === -1) {
      return NextResponse.json(
        { error: '클라이언트를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    mockClients.splice(clientIndex, 1);
    
    return NextResponse.json({
      message: '클라이언트가 성공적으로 삭제되었습니다.'
    });
  } catch (error) {
    console.error('Delete client error:', error);
    return NextResponse.json(
      { error: '클라이언트 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}