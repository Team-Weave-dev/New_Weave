'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { 
  Calculator, 
  DollarSign, 
  Percent,
  FileText,
  TrendingUp,
  Info,
  ChevronDown,
  ChevronUp,
  HelpCircle
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import Typography from '@/components/ui/Typography'
import Button from '@/components/ui/Button'
import type { WidgetProps } from '@/types/dashboard'
import { cn } from '@/lib/utils'

type TaxType = 'vat' | 'income' | 'corporate' | 'capital-gains'
type CalculationMode = 'include' | 'exclude' // 부가세 포함/별도

interface TaxCalculation {
  type: TaxType
  baseAmount: number
  taxRate: number
  taxAmount: number
  totalAmount: number
  deductions?: number
  effectiveRate?: number
}

interface TaxBracket {
  min: number
  max: number | null
  rate: number
  deduction: number
}

// 한국 소득세 구간 (2024년 기준)
const INCOME_TAX_BRACKETS: TaxBracket[] = [
  { min: 0, max: 14000000, rate: 0.06, deduction: 0 },
  { min: 14000000, max: 50000000, rate: 0.15, deduction: 1260000 },
  { min: 50000000, max: 88000000, rate: 0.24, deduction: 5760000 },
  { min: 88000000, max: 150000000, rate: 0.35, deduction: 15440000 },
  { min: 150000000, max: 300000000, rate: 0.38, deduction: 19940000 },
  { min: 300000000, max: 500000000, rate: 0.40, deduction: 25940000 },
  { min: 500000000, max: 1000000000, rate: 0.42, deduction: 35940000 },
  { min: 1000000000, max: null, rate: 0.45, deduction: 65940000 }
]

export function TaxCalculatorWidget({
  id,
  type,
  config,
  isEditMode,
  className
}: WidgetProps) {
  const [selectedTaxType, setSelectedTaxType] = useState<TaxType>('vat')
  const [amount, setAmount] = useState<string>('')
  const [vatMode, setVatMode] = useState<CalculationMode>('exclude')
  const [showDetails, setShowDetails] = useState(false)
  const [calculation, setCalculation] = useState<TaxCalculation | null>(null)

  // VAT 율 (한국 기준)
  const VAT_RATE = 0.10

  // 법인세율 (간소화된 버전)
  const CORPORATE_TAX_RATES = [
    { threshold: 200000000, rate: 0.10 },
    { threshold: 20000000000, rate: 0.20 },
    { threshold: 300000000000, rate: 0.22 },
    { threshold: Infinity, rate: 0.25 }
  ]

  // 양도소득세율 (간소화된 버전)
  const CAPITAL_GAINS_RATE = 0.20

  // 계산 함수들
  const calculateVAT = (baseAmount: number, mode: CalculationMode): TaxCalculation => {
    if (mode === 'exclude') {
      // 부가세 별도
      const taxAmount = baseAmount * VAT_RATE
      return {
        type: 'vat',
        baseAmount,
        taxRate: VAT_RATE,
        taxAmount,
        totalAmount: baseAmount + taxAmount
      }
    } else {
      // 부가세 포함
      const baseAmountExcludingVAT = baseAmount / (1 + VAT_RATE)
      const taxAmount = baseAmount - baseAmountExcludingVAT
      return {
        type: 'vat',
        baseAmount: baseAmountExcludingVAT,
        taxRate: VAT_RATE,
        taxAmount,
        totalAmount: baseAmount
      }
    }
  }

  const calculateIncomeTax = (income: number): TaxCalculation => {
    let bracket = INCOME_TAX_BRACKETS.find(b => 
      income >= b.min && (b.max === null || income <= b.max)
    )
    
    if (!bracket) {
      bracket = INCOME_TAX_BRACKETS[0]
    }

    const taxAmount = income * bracket.rate - bracket.deduction
    const effectiveRate = income > 0 ? taxAmount / income : 0

    return {
      type: 'income',
      baseAmount: income,
      taxRate: bracket.rate,
      taxAmount,
      totalAmount: income - taxAmount,
      deductions: bracket.deduction,
      effectiveRate
    }
  }

  const calculateCorporateTax = (profit: number): TaxCalculation => {
    let taxAmount = 0
    let previousThreshold = 0

    for (const { threshold, rate } of CORPORATE_TAX_RATES) {
      if (profit <= previousThreshold) break
      
      const taxableAmount = Math.min(profit - previousThreshold, threshold - previousThreshold)
      taxAmount += taxableAmount * rate
      previousThreshold = threshold
    }

    const effectiveRate = profit > 0 ? taxAmount / profit : 0

    return {
      type: 'corporate',
      baseAmount: profit,
      taxRate: effectiveRate,
      taxAmount,
      totalAmount: profit - taxAmount,
      effectiveRate
    }
  }

  const calculateCapitalGainsTax = (gains: number): TaxCalculation => {
    const taxAmount = gains * CAPITAL_GAINS_RATE

    return {
      type: 'capital-gains',
      baseAmount: gains,
      taxRate: CAPITAL_GAINS_RATE,
      taxAmount,
      totalAmount: gains - taxAmount
    }
  }

  // 계산 실행
  useEffect(() => {
    const numAmount = parseFloat(amount.replace(/,/g, ''))
    
    if (isNaN(numAmount) || numAmount <= 0) {
      setCalculation(null)
      return
    }

    let result: TaxCalculation | null = null

    switch (selectedTaxType) {
      case 'vat':
        result = calculateVAT(numAmount, vatMode)
        break
      case 'income':
        result = calculateIncomeTax(numAmount)
        break
      case 'corporate':
        result = calculateCorporateTax(numAmount)
        break
      case 'capital-gains':
        result = calculateCapitalGainsTax(numAmount)
        break
    }

    setCalculation(result)
  }, [amount, selectedTaxType, vatMode])

  // 금액 포맷팅
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  // 입력 핸들러
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '')
    if (value === '' || /^\d+$/.test(value)) {
      setAmount(value)
    }
  }

  // 편집 모드 뷰
  if (isEditMode) {
    return (
      <Card className={cn("h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900", className)}>
        <div className="text-center">
          <Calculator className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
            세무 계산기
          </Typography>
          <Typography variant="caption" className="text-gray-500 dark:text-gray-500 mt-1">
            간편 세금 계산
          </Typography>
        </div>
      </Card>
    )
  }

  return (
    <Card className={cn("h-full p-4 flex flex-col", className)}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-blue-600" />
          <Typography variant="h3" className="text-gray-900">
            세무 계산기
          </Typography>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-gray-500 hover:text-gray-700"
        >
          {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* 세금 종류 선택 */}
      <div className="mb-3">
        <Typography variant="caption" className="text-gray-600 dark:text-gray-400 mb-2 block">
          세금 종류
        </Typography>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setSelectedTaxType('vat')}
            className={cn(
              "px-3 py-2 text-sm rounded-lg border transition-colors",
              selectedTaxType === 'vat'
                ? "bg-blue-500 text-white border-blue-500"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700"
            )}
          >
            부가가치세
          </button>
          <button
            onClick={() => setSelectedTaxType('income')}
            className={cn(
              "px-3 py-2 text-sm rounded-lg border transition-colors",
              selectedTaxType === 'income'
                ? "bg-blue-500 text-white border-blue-500"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700"
            )}
          >
            소득세
          </button>
          <button
            onClick={() => setSelectedTaxType('corporate')}
            className={cn(
              "px-3 py-2 text-sm rounded-lg border transition-colors",
              selectedTaxType === 'corporate'
                ? "bg-blue-500 text-white border-blue-500"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700"
            )}
          >
            법인세
          </button>
          <button
            onClick={() => setSelectedTaxType('capital-gains')}
            className={cn(
              "px-3 py-2 text-sm rounded-lg border transition-colors",
              selectedTaxType === 'capital-gains'
                ? "bg-blue-500 text-white border-blue-500"
                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700"
            )}
          >
            양도소득세
          </button>
        </div>
      </div>

      {/* VAT 모드 선택 (부가세일 때만) */}
      {selectedTaxType === 'vat' && (
        <div className="mb-3">
          <Typography variant="caption" className="text-gray-600 dark:text-gray-400 mb-2 block">
            계산 방식
          </Typography>
          <div className="flex gap-2">
            <button
              onClick={() => setVatMode('exclude')}
              className={cn(
                "flex-1 px-3 py-1.5 text-sm rounded border transition-colors",
                vatMode === 'exclude'
                  ? "bg-blue-100 text-blue-700 border-blue-300"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700"
              )}
            >
              부가세 별도
            </button>
            <button
              onClick={() => setVatMode('include')}
              className={cn(
                "flex-1 px-3 py-1.5 text-sm rounded border transition-colors",
                vatMode === 'include'
                  ? "bg-blue-100 text-blue-700 border-blue-300"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-700"
              )}
            >
              부가세 포함
            </button>
          </div>
        </div>
      )}

      {/* 금액 입력 */}
      <div className="mb-4">
        <Typography variant="caption" className="text-gray-600 dark:text-gray-400 mb-2 block">
          {selectedTaxType === 'vat' && vatMode === 'include' ? '총액' : 
           selectedTaxType === 'income' ? '연간 소득' :
           selectedTaxType === 'corporate' ? '과세표준' :
           selectedTaxType === 'capital-gains' ? '양도차익' : '공급가액'}
        </Typography>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={amount ? parseInt(amount).toLocaleString('ko-KR') : ''}
            onChange={handleAmountChange}
            placeholder="금액을 입력하세요"
            className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-right"
          />
        </div>
      </div>

      {/* 계산 결과 */}
      {calculation && (
        <div className="flex-1 space-y-3">
          {/* 주요 결과 */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <Typography variant="caption" className="text-blue-600 dark:text-blue-400">
                세금
              </Typography>
              <Typography variant="h3" className="text-blue-900 dark:text-blue-100">
                {formatCurrency(calculation.taxAmount)}
              </Typography>
            </div>
            <div className="flex items-center justify-between">
              <Typography variant="caption" className="text-blue-600 dark:text-blue-400">
                {selectedTaxType === 'vat' ? '합계' : '세후 금액'}
              </Typography>
              <Typography variant="h4" className="text-blue-900 dark:text-blue-100">
                {formatCurrency(calculation.totalAmount)}
              </Typography>
            </div>
          </div>

          {/* 상세 정보 */}
          {showDetails && (
            <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <Typography variant="caption" className="text-gray-500">
                  세율
                </Typography>
                <Typography variant="body2" className="text-gray-700 dark:text-gray-300">
                  {(calculation.taxRate * 100).toFixed(1)}%
                </Typography>
              </div>
              
              {calculation.effectiveRate !== undefined && (
                <div className="flex justify-between items-center">
                  <Typography variant="caption" className="text-gray-500">
                    실효세율
                  </Typography>
                  <Typography variant="body2" className="text-gray-700 dark:text-gray-300">
                    {(calculation.effectiveRate * 100).toFixed(1)}%
                  </Typography>
                </div>
              )}
              
              {calculation.deductions !== undefined && calculation.deductions > 0 && (
                <div className="flex justify-between items-center">
                  <Typography variant="caption" className="text-gray-500">
                    누진공제
                  </Typography>
                  <Typography variant="body2" className="text-gray-700 dark:text-gray-300">
                    {formatCurrency(calculation.deductions)}
                  </Typography>
                </div>
              )}

              {selectedTaxType === 'vat' && (
                <div className="flex justify-between items-center">
                  <Typography variant="caption" className="text-gray-500">
                    공급가액
                  </Typography>
                  <Typography variant="body2" className="text-gray-700 dark:text-gray-300">
                    {formatCurrency(calculation.baseAmount)}
                  </Typography>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 정보 도움말 */}
      {!calculation && !amount && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <HelpCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <Typography variant="caption" className="text-gray-500">
              세금 종류를 선택하고<br />금액을 입력하세요
            </Typography>
          </div>
        </div>
      )}

      {/* 하단 정보 */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-1">
          <Info className="w-3 h-3 text-gray-400" />
          <Typography variant="caption" className="text-gray-500">
            2024년 세율 기준 (간소화된 계산)
          </Typography>
        </div>
      </div>
    </Card>
  )
}

// 위젯 메타데이터
export const taxCalculatorWidgetMetadata = {
  name: '세무 계산기',
  description: '부가세, 소득세 등 간편 계산',
  icon: 'calculator',
  defaultSize: { width: 2, height: 2 },
  minSize: { width: 2, height: 2 },
  maxSize: { width: 3, height: 3 },
  tags: ['세금', '계산기', '부가세', '소득세'],
  configurable: false,
  version: '1.0.0'
}

export default TaxCalculatorWidget