import * as XLSX from 'xlsx';
import { createClient } from '@/lib/services/supabase/client';
import type { Transaction } from './tax-transactions.service';

export interface ExcelColumn {
  index: number;
  header: string;
  sample: string;
  dataType: 'string' | 'number' | 'date' | 'boolean';
}

export interface ColumnMapping {
  excelColumn: string;
  dbField: keyof Transaction;
  transform?: (value: any) => any;
}

export interface ImportPreview {
  columns: ExcelColumn[];
  rows: any[];
  totalRows: number;
  errors: string[];
  warnings: string[];
}

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: ImportError[];
  transactions?: Transaction[];
}

export interface ImportError {
  row: number;
  field?: string;
  value?: any;
  message: string;
}

/**
 * 엑셀 파일 파싱
 */
export function parseExcelFile(file: File): Promise<ImportPreview> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        
        // 첫 번째 시트 선택
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // JSON으로 변환
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          raw: false,
          dateNF: 'yyyy-mm-dd'
        });
        
        if (jsonData.length === 0) {
          throw new Error('엑셀 파일에 데이터가 없습니다.');
        }
        
        // 헤더 추출
        const headers = jsonData[0] as string[];
        const rows = jsonData.slice(1);
        
        // 컬럼 정보 생성
        const columns: ExcelColumn[] = headers.map((header, index) => {
          const sampleValues = rows.slice(0, 5)
            .map(row => row[index])
            .filter(val => val !== null && val !== undefined);
          
          const sample = sampleValues[0]?.toString() || '';
          const dataType = detectDataType(sampleValues);
          
          return {
            index,
            header: header?.toString() || `Column ${index + 1}`,
            sample,
            dataType
          };
        });
        
        // 데이터 검증
        const errors: string[] = [];
        const warnings: string[] = [];
        
        if (rows.length === 0) {
          warnings.push('데이터 행이 없습니다.');
        }
        
        if (rows.length > 10000) {
          warnings.push(`대량 데이터 (${rows.length}행) - 처리 시간이 오래 걸릴 수 있습니다.`);
        }
        
        // 빈 행 체크
        const emptyRows = rows.filter(row => 
          row.every(cell => cell === null || cell === undefined || cell === '')
        ).length;
        
        if (emptyRows > 0) {
          warnings.push(`${emptyRows}개의 빈 행이 발견되었습니다.`);
        }
        
        resolve({
          columns,
          rows: rows.slice(0, 100), // 미리보기는 100행까지만
          totalRows: rows.length,
          errors,
          warnings
        });
      } catch (error) {
        reject(new Error(`엑셀 파일 파싱 실패: ${error}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('파일 읽기 실패'));
    };
    
    reader.readAsBinaryString(file);
  });
}

/**
 * 데이터 타입 감지
 */
function detectDataType(values: any[]): ExcelColumn['dataType'] {
  if (values.length === 0) return 'string';
  
  const types = values.map(val => {
    if (val === null || val === undefined) return 'null';
    if (typeof val === 'boolean') return 'boolean';
    if (val instanceof Date) return 'date';
    if (!isNaN(Number(val))) return 'number';
    
    // 날짜 패턴 체크
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (datePattern.test(val.toString())) return 'date';
    
    return 'string';
  }).filter(t => t !== 'null');
  
  // 가장 많은 타입 반환
  const typeCount = types.reduce((acc, type) => {
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const maxType = Object.entries(typeCount).reduce((a, b) => 
    typeCount[a[0]] > typeCount[b[0]] ? a : b
  );
  
  return maxType[0] as ExcelColumn['dataType'];
}

/**
 * 기본 컬럼 매핑 제안
 */
export function suggestColumnMappings(columns: ExcelColumn[]): ColumnMapping[] {
  const mappings: ColumnMapping[] = [];
  
  // 매핑 규칙
  const mappingRules: Record<string, keyof Transaction> = {
    // 날짜
    '거래일': 'transaction_date',
    '거래일자': 'transaction_date',
    '일자': 'transaction_date',
    'date': 'transaction_date',
    
    // 거래처
    '거래처': 'supplier_name',
    '거래처명': 'supplier_name',
    '업체명': 'supplier_name',
    '공급자': 'supplier_name',
    'supplier': 'supplier_name',
    'vendor': 'supplier_name',
    
    // 사업자번호
    '사업자번호': 'supplier_business_number',
    '사업자등록번호': 'supplier_business_number',
    'business_number': 'supplier_business_number',
    
    // 거래 유형
    '구분': 'transaction_type',
    '거래구분': 'transaction_type',
    '유형': 'transaction_type',
    'type': 'transaction_type',
    
    // 금액
    '공급가액': 'supply_amount',
    '공급가': 'supply_amount',
    'amount': 'supply_amount',
    
    '부가세': 'vat_amount',
    'vat': 'vat_amount',
    'tax': 'vat_amount',
    
    '합계': 'total_amount',
    '총액': 'total_amount',
    '합계액': 'total_amount',
    'total': 'total_amount',
    
    // 설명
    '비고': 'description',
    '설명': 'description',
    '내용': 'description',
    'memo': 'description',
    'description': 'description',
    
    // 문서
    '문서번호': 'document_number',
    '전표번호': 'document_number',
    'doc_number': 'document_number',
    
    // 결제
    '결제상태': 'payment_status',
    '결제': 'payment_status',
    'payment': 'payment_status',
    
    '결제일': 'payment_date',
    '결제일자': 'payment_date',
    'payment_date': 'payment_date'
  };
  
  columns.forEach(column => {
    const headerLower = column.header.toLowerCase().trim();
    
    // 직접 매칭
    for (const [pattern, field] of Object.entries(mappingRules)) {
      if (headerLower.includes(pattern) || pattern.includes(headerLower)) {
        mappings.push({
          excelColumn: column.header,
          dbField: field,
          transform: getDefaultTransform(field, column.dataType)
        });
        break;
      }
    }
  });
  
  return mappings;
}

/**
 * 기본 변환 함수
 */
function getDefaultTransform(field: keyof Transaction, dataType: ExcelColumn['dataType']) {
  switch (field) {
    case 'transaction_date':
    case 'payment_date':
      return (value: any) => {
        if (!value) return null;
        if (value instanceof Date) return value.toISOString().split('T')[0];
        
        // 다양한 날짜 형식 처리
        const dateStr = value.toString().trim();
        const patterns = [
          /^(\d{4})-(\d{2})-(\d{2})$/,  // YYYY-MM-DD
          /^(\d{4})\/(\d{2})\/(\d{2})$/, // YYYY/MM/DD
          /^(\d{2})-(\d{2})-(\d{4})$/,  // DD-MM-YYYY
          /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
        ];
        
        for (const pattern of patterns) {
          const match = dateStr.match(pattern);
          if (match) {
            if (match[1].length === 4) {
              return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
            } else {
              return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
            }
          }
        }
        
        return dateStr;
      };
    
    case 'transaction_type':
      return (value: any) => {
        const val = value?.toString().toLowerCase() || '';
        if (val.includes('매출') || val.includes('sale') || val.includes('수입')) {
          return 'sale';
        }
        if (val.includes('매입') || val.includes('purchase') || val.includes('지출')) {
          return 'purchase';
        }
        return 'purchase'; // 기본값
      };
    
    case 'supply_amount':
    case 'vat_amount':
    case 'total_amount':
      return (value: any) => {
        if (!value) return 0;
        // 숫자가 아닌 문자 제거 (콤마, 원 등)
        const cleaned = value.toString().replace(/[^0-9.-]/g, '');
        return parseFloat(cleaned) || 0;
      };
    
    case 'payment_status':
      return (value: any) => {
        const val = value?.toString().toLowerCase() || '';
        if (val.includes('완료') || val.includes('paid') || val.includes('완납')) {
          return 'paid';
        }
        if (val.includes('부분') || val.includes('partial')) {
          return 'partial';
        }
        return 'pending';
      };
    
    default:
      return (value: any) => value?.toString() || '';
  }
}

/**
 * 데이터 검증
 */
export function validateImportData(
  rows: any[],
  mappings: ColumnMapping[]
): ImportError[] {
  const errors: ImportError[] = [];
  
  rows.forEach((row, rowIndex) => {
    // 필수 필드 체크
    const requiredFields: (keyof Transaction)[] = [
      'transaction_date',
      'supplier_name',
      'transaction_type',
      'total_amount'
    ];
    
    requiredFields.forEach(field => {
      const mapping = mappings.find(m => m.dbField === field);
      if (!mapping) {
        errors.push({
          row: rowIndex + 2, // Excel 행 번호 (헤더 제외)
          field,
          message: `필수 필드 '${field}' 매핑이 없습니다.`
        });
      } else {
        const columnIndex = getColumnIndex(mapping.excelColumn);
        const value = row[columnIndex];
        
        if (!value || value === '') {
          errors.push({
            row: rowIndex + 2,
            field,
            value,
            message: `필수 필드 '${field}'가 비어있습니다.`
          });
        }
      }
    });
    
    // 날짜 형식 검증
    const dateMapping = mappings.find(m => m.dbField === 'transaction_date');
    if (dateMapping) {
      const columnIndex = getColumnIndex(dateMapping.excelColumn);
      const value = row[columnIndex];
      
      if (value && dateMapping.transform) {
        const transformed = dateMapping.transform(value);
        if (!transformed || !/^\d{4}-\d{2}-\d{2}$/.test(transformed)) {
          errors.push({
            row: rowIndex + 2,
            field: 'transaction_date',
            value,
            message: `잘못된 날짜 형식: ${value}`
          });
        }
      }
    }
    
    // 금액 검증
    const amountFields: (keyof Transaction)[] = ['supply_amount', 'vat_amount', 'total_amount'];
    amountFields.forEach(field => {
      const mapping = mappings.find(m => m.dbField === field);
      if (mapping) {
        const columnIndex = getColumnIndex(mapping.excelColumn);
        const value = row[columnIndex];
        
        if (value && mapping.transform) {
          const transformed = mapping.transform(value);
          if (isNaN(transformed) || transformed < 0) {
            errors.push({
              row: rowIndex + 2,
              field,
              value,
              message: `잘못된 금액: ${value}`
            });
          }
        }
      }
    });
  });
  
  return errors;
}

/**
 * 컬럼 인덱스 찾기
 */
function getColumnIndex(header: string): number {
  // 실제 구현 시 ImportPreview의 columns에서 찾아야 함
  return 0;
}

/**
 * 엑셀 데이터를 거래 데이터로 변환
 */
export function transformToTransactions(
  rows: any[],
  mappings: ColumnMapping[],
  columns: ExcelColumn[]
): Transaction[] {
  const transactions: Transaction[] = [];
  
  rows.forEach((row, rowIndex) => {
    const transaction: Partial<Transaction> = {
      id: '', // Supabase에서 생성
      user_id: '', // 현재 사용자
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    mappings.forEach(mapping => {
      const column = columns.find(c => c.header === mapping.excelColumn);
      if (column) {
        const value = row[column.index];
        if (value !== null && value !== undefined) {
          const transformed = mapping.transform ? mapping.transform(value) : value;
          (transaction as any)[mapping.dbField] = transformed;
        }
      }
    });
    
    // 기본값 설정
    if (!transaction.transaction_type) {
      transaction.transaction_type = 'purchase';
    }
    
    if (!transaction.payment_status) {
      transaction.payment_status = 'pending';
    }
    
    // VAT 자동 계산 (없는 경우)
    if (transaction.supply_amount && !transaction.vat_amount) {
      transaction.vat_amount = transaction.supply_amount * 0.1;
    }
    
    // 합계 자동 계산 (없는 경우)
    if (transaction.supply_amount && transaction.vat_amount && !transaction.total_amount) {
      transaction.total_amount = transaction.supply_amount + transaction.vat_amount;
    }
    
    transactions.push(transaction as Transaction);
  });
  
  return transactions;
}

/**
 * 거래 데이터 임포트
 */
export async function importTransactions(
  transactions: Transaction[]
): Promise<ImportResult> {
  const supabase = createClient();
  const errors: ImportError[] = [];
  const imported: Transaction[] = [];
  let successCount = 0;
  let failCount = 0;
  
  // 배치 처리 (100개씩)
  const batchSize = 100;
  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, i + batchSize);
    
    try {
      const { data, error } = await supabase
        .from('tax_transactions')
        .insert(batch)
        .select();
      
      if (error) {
        failCount += batch.length;
        errors.push({
          row: i + 2,
          message: `배치 임포트 실패: ${error.message}`
        });
      } else {
        successCount += data.length;
        imported.push(...data);
      }
    } catch (error) {
      failCount += batch.length;
      errors.push({
        row: i + 2,
        message: `임포트 오류: ${error}`
      });
    }
  }
  
  return {
    success: failCount === 0,
    imported: successCount,
    failed: failCount,
    errors,
    transactions: imported
  };
}

/**
 * 템플릿 엑셀 파일 생성
 */
export function generateImportTemplate(): Blob {
  const headers = [
    '거래일',
    '거래구분',
    '거래처명',
    '사업자번호',
    '공급가액',
    '부가세',
    '합계',
    '설명',
    '문서번호',
    '결제상태',
    '결제일'
  ];
  
  const sampleData = [
    [
      '2025-01-01',
      '매입',
      '(주)테스트기업',
      '123-45-67890',
      '1000000',
      '100000',
      '1100000',
      '사무용품 구매',
      'INV-2025-001',
      '완료',
      '2025-01-05'
    ],
    [
      '2025-01-02',
      '매출',
      '(주)고객사',
      '987-65-43210',
      '2000000',
      '200000',
      '2200000',
      '서비스 제공',
      'INV-2025-002',
      '대기',
      ''
    ]
  ];
  
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, '거래내역');
  
  // 컬럼 너비 설정
  worksheet['!cols'] = headers.map(() => ({ wch: 15 }));
  
  // Blob 생성
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'binary' });
  const buf = new ArrayBuffer(wbout.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < wbout.length; i++) {
    view[i] = wbout.charCodeAt(i) & 0xFF;
  }
  
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}