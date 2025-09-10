'use client';

import React, { useState, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import { 
  Upload, 
  X, 
  ChevronRight,
  ChevronLeft,
  Download,
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import {
  parseExcelFile,
  suggestColumnMappings,
  validateImportData,
  transformToTransactions,
  importTransactions,
  generateImportTemplate,
  type ImportPreview,
  type ColumnMapping,
  type ImportError,
  type ExcelColumn
} from '@/lib/services/supabase/excel-import.service';
import type { Transaction } from '@/lib/services/supabase/tax-transactions.service';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: (transactions: Transaction[]) => void;
}

type ImportStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete';

export default function ExcelImportModal({
  isOpen,
  onClose,
  onImportComplete
}: ExcelImportModalProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [errors, setErrors] = useState<ImportError[]>([]);
  const [transformedData, setTransformedData] = useState<Transaction[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  // 파일 드롭존
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!file.name.match(/\.(xlsx|xls)$/)) {
      alert('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.');
      return;
    }

    setFile(file);
    
    try {
      const preview = await parseExcelFile(file);
      setPreview(preview);
      
      // 자동 매핑 제안
      const suggestedMappings = suggestColumnMappings(preview.columns);
      setMappings(suggestedMappings);
      
      setStep('mapping');
    } catch (error) {
      console.error('파일 파싱 실패:', error);
      alert('파일을 읽을 수 없습니다.');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1
  });

  // 매핑 업데이트
  const updateMapping = (excelColumn: string, dbField: keyof Transaction | '') => {
    setMappings(prev => {
      const newMappings = prev.filter(m => m.excelColumn !== excelColumn);
      if (dbField) {
        newMappings.push({
          excelColumn,
          dbField: dbField as keyof Transaction,
          transform: getTransformFunction(dbField as keyof Transaction)
        });
      }
      return newMappings;
    });
  };

  // 변환 함수
  const getTransformFunction = (field: keyof Transaction) => {
    // excel-import.service.ts의 getDefaultTransform 사용
    return undefined; // 실제로는 service의 함수 사용
  };

  // 다음 단계
  const handleNext = async () => {
    if (step === 'mapping' && preview) {
      // 데이터 검증
      const validationErrors = validateImportData(preview.rows, mappings);
      setErrors(validationErrors);
      
      if (validationErrors.length > 0 && !confirm('검증 오류가 있습니다. 계속하시겠습니까?')) {
        return;
      }
      
      // 데이터 변환
      const transformed = transformToTransactions(preview.rows, mappings, preview.columns);
      setTransformedData(transformed);
      setStep('preview');
    } else if (step === 'preview') {
      handleImport();
    }
  };

  // 이전 단계
  const handlePrevious = () => {
    if (step === 'mapping') {
      setStep('upload');
    } else if (step === 'preview') {
      setStep('mapping');
    }
  };

  // 임포트 실행
  const handleImport = async () => {
    setStep('importing');
    setImporting(true);
    
    try {
      const result = await importTransactions(transformedData);
      setImportResult(result);
      setStep('complete');
      
      if (result.success && result.transactions) {
        onImportComplete?.(result.transactions);
      }
    } catch (error) {
      console.error('임포트 실패:', error);
      alert('데이터 임포트 중 오류가 발생했습니다.');
      setStep('preview');
    } finally {
      setImporting(false);
    }
  };

  // 템플릿 다운로드
  const downloadTemplate = () => {
    const blob = generateImportTemplate();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = '거래내역_템플릿.xlsx';
    link.click();
    URL.revokeObjectURL(url);
  };

  // DB 필드 옵션
  const dbFields: Array<{ value: keyof Transaction | ''; label: string }> = [
    { value: '', label: '매핑 안함' },
    { value: 'transaction_date', label: '거래일' },
    { value: 'transaction_type', label: '거래구분' },
    { value: 'supplier_name', label: '거래처명' },
    { value: 'supplier_business_number', label: '사업자번호' },
    { value: 'supply_amount', label: '공급가액' },
    { value: 'vat_amount', label: '부가세' },
    { value: 'total_amount', label: '합계' },
    { value: 'description', label: '설명' },
    { value: 'document_number', label: '문서번호' },
    { value: 'payment_status', label: '결제상태' },
    { value: 'payment_date', label: '결제일' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="p-6 border-b border-border-light">
          <div className="flex items-center justify-between">
            <div>
              <Typography variant="h2" className="text-xl font-bold mb-1">
                엑셀 파일 임포트
              </Typography>
              <Typography variant="body2" className="text-txt-secondary">
                엑셀 파일에서 거래 데이터를 가져옵니다
              </Typography>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-bg-secondary rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-txt-tertiary" />
            </button>
          </div>

          {/* 단계 표시 */}
          <div className="flex items-center justify-center mt-6 space-x-2">
            {['upload', 'mapping', 'preview', 'complete'].map((s, index) => (
              <React.Fragment key={s}>
                {index > 0 && (
                  <div className={`w-12 h-0.5 ${
                    ['mapping', 'preview', 'importing', 'complete'].indexOf(step) >= index 
                      ? 'bg-weave-primary' 
                      : 'bg-gray-300'
                  }`} />
                )}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  step === s || (step === 'importing' && s === 'preview')
                    ? 'bg-weave-primary text-white' 
                    : ['mapping', 'preview', 'importing', 'complete'].indexOf(step) > ['upload', 'mapping', 'preview', 'complete'].indexOf(s)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {index + 1}
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: 파일 업로드 */}
          {step === 'upload' && (
            <div className="space-y-6">
              <button
                onClick={downloadTemplate}
                className="w-full p-4 border border-dashed border-weave-primary rounded-lg hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-center justify-center gap-3">
                  <Download className="w-5 h-5 text-weave-primary" />
                  <Typography variant="body2" className="text-weave-primary font-medium">
                    템플릿 다운로드
                  </Typography>
                </div>
                <Typography variant="body2" className="text-xs text-txt-secondary mt-1 text-center">
                  표준 템플릿을 다운로드하여 데이터를 입력하세요
                </Typography>
              </button>

              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                  isDragActive 
                    ? 'border-weave-primary bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <Typography variant="body1" className="font-medium mb-2">
                  {isDragActive ? '파일을 놓으세요' : '엑셀 파일을 드래그하거나 클릭하여 선택'}
                </Typography>
                <Typography variant="body2" className="text-txt-secondary">
                  .xlsx, .xls 파일 지원
                </Typography>
              </div>

              {file && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <Typography variant="body2" className="font-medium">
                      {file.name}
                    </Typography>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: 컬럼 매핑 */}
          {step === 'mapping' && preview && (
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <Typography variant="body2" className="font-medium text-blue-700 mb-1">
                      컬럼 매핑
                    </Typography>
                    <Typography variant="body2" className="text-xs text-blue-600">
                      엑셀 컬럼을 데이터베이스 필드와 연결하세요. 자동으로 제안된 매핑을 확인하고 수정할 수 있습니다.
                    </Typography>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {preview.columns.map((column) => {
                  const currentMapping = mappings.find(m => m.excelColumn === column.header);
                  
                  return (
                    <div key={column.index} className="flex items-center gap-4 p-3 bg-bg-secondary rounded-lg">
                      <div className="flex-1">
                        <Typography variant="body2" className="font-medium">
                          {column.header}
                        </Typography>
                        <Typography variant="body2" className="text-xs text-txt-secondary">
                          예시: {column.sample || '(데이터 없음)'}
                        </Typography>
                      </div>
                      
                      <ArrowRight className="w-4 h-4 text-txt-tertiary" />
                      
                      <select
                        value={currentMapping?.dbField || ''}
                        onChange={(e) => updateMapping(column.header, e.target.value as keyof Transaction | '')}
                        className="px-3 py-2 border border-border-light rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-weave-primary"
                      >
                        {dbFields.map(field => (
                          <option key={field.value} value={field.value}>
                            {field.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>

              {preview.warnings.length > 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <Typography variant="body2" className="font-medium text-yellow-700 mb-2">
                    경고
                  </Typography>
                  <ul className="list-disc list-inside space-y-1">
                    {preview.warnings.map((warning, index) => (
                      <li key={index} className="text-xs text-yellow-600">
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Step 3: 미리보기 */}
          {step === 'preview' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Typography variant="h3" className="text-lg font-semibold">
                  데이터 미리보기
                </Typography>
                <Typography variant="body2" className="text-txt-secondary">
                  {transformedData.length}개 행
                </Typography>
              </div>

              {errors.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg max-h-40 overflow-y-auto">
                  <Typography variant="body2" className="font-medium text-red-700 mb-2">
                    검증 오류 ({errors.length}개)
                  </Typography>
                  <ul className="list-disc list-inside space-y-1">
                    {errors.slice(0, 5).map((error, index) => (
                      <li key={index} className="text-xs text-red-600">
                        행 {error.row}: {error.message}
                      </li>
                    ))}
                    {errors.length > 5 && (
                      <li className="text-xs text-red-600">
                        ... 외 {errors.length - 5}개 오류
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-bg-secondary">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-txt-secondary">날짜</th>
                      <th className="px-3 py-2 text-left font-medium text-txt-secondary">구분</th>
                      <th className="px-3 py-2 text-left font-medium text-txt-secondary">거래처</th>
                      <th className="px-3 py-2 text-right font-medium text-txt-secondary">공급가액</th>
                      <th className="px-3 py-2 text-right font-medium text-txt-secondary">부가세</th>
                      <th className="px-3 py-2 text-right font-medium text-txt-secondary">합계</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transformedData.slice(0, 10).map((txn, index) => (
                      <tr key={index} className="border-b border-border-light">
                        <td className="px-3 py-2">{txn.transaction_date}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            txn.transaction_type === 'sale' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {txn.transaction_type === 'sale' ? '매출' : '매입'}
                          </span>
                        </td>
                        <td className="px-3 py-2">{txn.supplier_name}</td>
                        <td className="px-3 py-2 text-right">{Number(txn.supply_amount).toLocaleString()}</td>
                        <td className="px-3 py-2 text-right">{Number(txn.vat_amount).toLocaleString()}</td>
                        <td className="px-3 py-2 text-right font-medium">{Number(txn.total_amount).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {transformedData.length > 10 && (
                  <div className="text-center py-2 text-xs text-txt-tertiary">
                    ... 외 {transformedData.length - 10}개 행
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: 임포트 중 */}
          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-weave-primary animate-spin mb-4" />
              <Typography variant="h3" className="text-lg font-semibold mb-2">
                데이터 임포트 중...
              </Typography>
              <Typography variant="body2" className="text-txt-secondary">
                잠시만 기다려주세요
              </Typography>
            </div>
          )}

          {/* Step 5: 완료 */}
          {step === 'complete' && importResult && (
            <div className="flex flex-col items-center justify-center py-12">
              {importResult.success ? (
                <>
                  <CheckCircle className="w-12 h-12 text-green-600 mb-4" />
                  <Typography variant="h3" className="text-lg font-semibold mb-2">
                    임포트 완료
                  </Typography>
                  <Typography variant="body2" className="text-txt-secondary">
                    {importResult.imported}개 거래가 성공적으로 임포트되었습니다
                  </Typography>
                </>
              ) : (
                <>
                  <AlertCircle className="w-12 h-12 text-red-600 mb-4" />
                  <Typography variant="h3" className="text-lg font-semibold mb-2">
                    임포트 실패
                  </Typography>
                  <Typography variant="body2" className="text-txt-secondary">
                    {importResult.failed}개 거래 임포트 실패
                  </Typography>
                </>
              )}
              
              {importResult.errors.length > 0 && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg max-h-40 overflow-y-auto">
                  <ul className="list-disc list-inside space-y-1">
                    {importResult.errors.map((error: ImportError, index: number) => (
                      <li key={index} className="text-xs text-red-600">
                        {error.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="p-6 border-t border-border-light flex items-center justify-between">
          <div>
            {step === 'mapping' && preview && (
              <Typography variant="body2" className="text-txt-secondary">
                총 {preview.totalRows}개 행
              </Typography>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {(step === 'mapping' || step === 'preview') && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={importing}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                이전
              </Button>
            )}
            
            {step === 'upload' && (
              <Button
                variant="primary"
                onClick={() => setStep('mapping')}
                disabled={!file || !preview}
              >
                다음
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
            
            {(step === 'mapping' || step === 'preview') && (
              <Button
                variant="primary"
                onClick={handleNext}
                disabled={importing || (step === 'mapping' && mappings.length === 0)}
              >
                {step === 'preview' ? '임포트 시작' : '다음'}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
            
            {step === 'complete' && (
              <Button
                variant="primary"
                onClick={onClose}
              >
                완료
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}