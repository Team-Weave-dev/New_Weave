import { NextRequest, NextResponse } from 'next/server';

// Mock 클라이언트 데이터
const mockClients = [
  {
    id: '1',
    name: '삼성전자',
    email: 'contact@samsung.com',
    phone: '02-1234-5678',
    business_number: '124-81-00998',
    address: '서울특별시 서초구 서초대로74길 11',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'LG전자',
    email: 'contact@lg.com',
    phone: '02-3777-1114',
    business_number: '107-86-14075',
    address: '서울특별시 영등포구 여의대로 128',
    created_at: '2024-01-15T00:00:00Z'
  },
  {
    id: '3',
    name: 'SK텔레콤',
    email: 'contact@sktelecom.com',
    phone: '02-6100-2114',
    business_number: '104-81-37225',
    address: '서울특별시 중구 을지로 65',
    created_at: '2024-02-01T00:00:00Z'
  }
];

// GET: 클라이언트 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    
    let filteredClients = [...mockClients];
    
    // 검색 필터링
    if (search) {
      const searchLower = search.toLowerCase();
      filteredClients = filteredClients.filter(c => 
        c.name.toLowerCase().includes(searchLower) ||
        (c.email && c.email.toLowerCase().includes(searchLower)) ||
        (c.business_number && c.business_number.includes(search))
      );
    }
    
    return NextResponse.json({
      clients: filteredClients,
      total: filteredClients.length
    });
  } catch (error) {
    console.error('Get clients error:', error);
    return NextResponse.json(
      { error: '클라이언트 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 새 클라이언트 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const newClient = {
      id: String(mockClients.length + 1),
      ...body,
      created_at: new Date().toISOString()
    };
    
    mockClients.push(newClient);
    
    return NextResponse.json({
      client: newClient,
      message: '클라이언트가 성공적으로 생성되었습니다.'
    }, { status: 201 });
  } catch (error) {
    console.error('Create client error:', error);
    return NextResponse.json(
      { error: '클라이언트 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}