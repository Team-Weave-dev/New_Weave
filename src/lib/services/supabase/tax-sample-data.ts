import { supabase } from '@/lib/supabase';
import type { TransactionInsert } from './tax-transactions.service';

export async function insertSampleTaxData() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('No authenticated user found');
    return { success: false, error: 'No authenticated user' };
  }

  // 샘플 거래처 목록
  const suppliers = [
    { name: '(주)테크솔루션', businessNumber: '123-45-67890' },
    { name: '디자인스튜디오', businessNumber: '234-56-78901' },
    { name: '클라우드서비스', businessNumber: '345-67-89012' },
    { name: '마케팅에이전시', businessNumber: '456-78-90123' },
    { name: '개발자커뮤니티', businessNumber: '567-89-01234' },
    { name: '웹호스팅코리아', businessNumber: '678-90-12345' },
    { name: '소프트웨어몰', businessNumber: '789-01-23456' },
    { name: '프리랜서김개발', businessNumber: '890-12-34567' },
  ];

  // 2025년 1-3월 샘플 데이터 생성
  const sampleTransactions: TransactionInsert[] = [];
  const startDate = new Date('2025-01-01');
  const endDate = new Date('2025-03-31');

  // 매출 데이터 (프로젝트 수익)
  for (let month = 1; month <= 3; month++) {
    // 각 월별 큰 프로젝트 매출 2-3건
    for (let i = 0; i < Math.floor(Math.random() * 2) + 2; i++) {
      const day = Math.floor(Math.random() * 28) + 1;
      const supplyAmount = Math.floor(Math.random() * 10000000) + 5000000; // 500만원 ~ 1500만원
      const vatAmount = Math.floor(supplyAmount * 0.1);
      
      sampleTransactions.push({
        user_id: user.id,
        transaction_date: new Date(2025, month - 1, day).toISOString().split('T')[0],
        transaction_type: '매출',
        supplier_name: suppliers[Math.floor(Math.random() * suppliers.length)].name,
        supplier_business_number: suppliers[Math.floor(Math.random() * suppliers.length)].businessNumber,
        supply_amount: supplyAmount,
        vat_amount: vatAmount,
        total_amount: supplyAmount + vatAmount,
        item_description: `${month}월 프로젝트 개발 용역`,
        payment_status: Math.random() > 0.3 ? 'completed' : 'pending',
        invoice_number: `2025-${month.toString().padStart(2, '0')}-${(i + 1).toString().padStart(3, '0')}`,
        notes: `${month}월 정기 프로젝트 대금`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    // 각 월별 소규모 매출 3-5건
    for (let i = 0; i < Math.floor(Math.random() * 3) + 3; i++) {
      const day = Math.floor(Math.random() * 28) + 1;
      const supplyAmount = Math.floor(Math.random() * 2000000) + 500000; // 50만원 ~ 250만원
      const vatAmount = Math.floor(supplyAmount * 0.1);
      
      sampleTransactions.push({
        user_id: user.id,
        transaction_date: new Date(2025, month - 1, day).toISOString().split('T')[0],
        transaction_type: '매출',
        supplier_name: suppliers[Math.floor(Math.random() * suppliers.length)].name,
        supplier_business_number: suppliers[Math.floor(Math.random() * suppliers.length)].businessNumber,
        supply_amount: supplyAmount,
        vat_amount: vatAmount,
        total_amount: supplyAmount + vatAmount,
        item_description: `유지보수 및 기술지원`,
        payment_status: Math.random() > 0.2 ? 'completed' : 'pending',
        invoice_number: `2025-${month.toString().padStart(2, '0')}-M${(i + 1).toString().padStart(3, '0')}`,
        notes: `월간 유지보수 계약`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
  }

  // 매입 데이터 (비용)
  for (let month = 1; month <= 3; month++) {
    // 월별 고정 비용 (사무실, 서버 등)
    const fixedCosts = [
      { name: '사무실 임대료', amount: 2000000, supplier: '부동산관리(주)' },
      { name: 'AWS 서버 비용', amount: 350000, supplier: '아마존웹서비스' },
      { name: '소프트웨어 라이선스', amount: 150000, supplier: '소프트웨어몰' },
      { name: '인터넷/통신비', amount: 100000, supplier: 'KT텔레콤' },
    ];

    fixedCosts.forEach((cost, index) => {
      const vatAmount = Math.floor(cost.amount * 0.1);
      sampleTransactions.push({
        user_id: user.id,
        transaction_date: new Date(2025, month - 1, 5).toISOString().split('T')[0],
        transaction_type: '매입',
        supplier_name: cost.supplier,
        supplier_business_number: `${month}00-00-0000${index}`,
        supply_amount: cost.amount,
        vat_amount: vatAmount,
        total_amount: cost.amount + vatAmount,
        item_description: cost.name,
        payment_status: 'completed',
        invoice_number: `P2025-${month.toString().padStart(2, '0')}-${(index + 1).toString().padStart(3, '0')}`,
        notes: `${month}월 정기 비용`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    });

    // 변동 비용 (외주, 장비 구매 등)
    for (let i = 0; i < Math.floor(Math.random() * 5) + 3; i++) {
      const day = Math.floor(Math.random() * 28) + 1;
      const supplyAmount = Math.floor(Math.random() * 1000000) + 100000; // 10만원 ~ 110만원
      const vatAmount = Math.floor(supplyAmount * 0.1);
      
      const itemTypes = [
        '외주 개발비',
        '디자인 용역',
        '마케팅 비용',
        '장비 구매',
        '소모품 구매',
        '교육/세미나',
        '출장 경비',
        '회의/접대비'
      ];
      
      sampleTransactions.push({
        user_id: user.id,
        transaction_date: new Date(2025, month - 1, day).toISOString().split('T')[0],
        transaction_type: '매입',
        supplier_name: suppliers[Math.floor(Math.random() * suppliers.length)].name,
        supplier_business_number: suppliers[Math.floor(Math.random() * suppliers.length)].businessNumber,
        supply_amount: supplyAmount,
        vat_amount: vatAmount,
        total_amount: supplyAmount + vatAmount,
        item_description: itemTypes[Math.floor(Math.random() * itemTypes.length)],
        payment_status: Math.random() > 0.1 ? 'completed' : 'pending',
        invoice_number: `P2025-${month.toString().padStart(2, '0')}-V${(i + 1).toString().padStart(3, '0')}`,
        notes: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
  }

  // 데이터베이스에 삽입
  console.log(`Inserting ${sampleTransactions.length} sample transactions...`);
  
  const { data, error } = await supabase
    .from('tax_transactions')
    .insert(sampleTransactions)
    .select();

  if (error) {
    console.error('Error inserting sample data:', error);
    return { success: false, error: error.message };
  }

  console.log(`Successfully inserted ${data?.length || 0} transactions`);
  
  // 월별 요약 테이블이 자동으로 업데이트되는지 확인
  const { data: summaryData, error: summaryError } = await supabase
    .from('tax_monthly_summary')
    .select('*')
    .eq('user_id', user.id)
    .order('year', { ascending: false })
    .order('month', { ascending: false });

  if (summaryError) {
    console.error('Error checking monthly summary:', summaryError);
  } else {
    console.log(`Monthly summaries created: ${summaryData?.length || 0} records`);
  }

  return { 
    success: true, 
    transactionsCount: data?.length || 0,
    summariesCount: summaryData?.length || 0 
  };
}

// 기존 데이터 삭제 함수 (테스트용)
export async function clearSampleTaxData() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('No authenticated user found');
    return { success: false, error: 'No authenticated user' };
  }

  // 모든 거래 데이터 삭제
  const { error: deleteError } = await supabase
    .from('tax_transactions')
    .delete()
    .eq('user_id', user.id);

  if (deleteError) {
    console.error('Error deleting sample data:', deleteError);
    return { success: false, error: deleteError.message };
  }

  // 월별 요약도 삭제 (트리거가 있다면 자동으로 처리될 수도 있음)
  const { error: summaryDeleteError } = await supabase
    .from('tax_monthly_summary')
    .delete()
    .eq('user_id', user.id);

  if (summaryDeleteError) {
    console.error('Error deleting summary data:', summaryDeleteError);
  }

  return { success: true };
}