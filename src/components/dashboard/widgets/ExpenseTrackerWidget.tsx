'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';
import Button from '@/components/ui/Button';
import { 
  PlusCircle, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart,
  Calendar,
  AlertCircle,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Wallet,
  ShoppingCart,
  Home,
  Car,
  Utensils,
  Heart,
  Briefcase,
  Book,
  Plane,
  Gift,
  MoreHorizontal
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, addMonths, isSameMonth } from 'date-fns';
import { ko } from 'date-fns/locale';
import { WidgetProps } from '@/types/dashboard';

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: Date;
  createdAt: Date;
}

interface Budget {
  category: string;
  limit: number;
  spent: number;
  color: string;
}

interface Category {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  color: string;
}

const CATEGORIES: Category[] = [
  { id: 'food', name: '식비', icon: Utensils, color: '#FF6B6B' },
  { id: 'transport', name: '교통', icon: Car, color: '#4ECDC4' },
  { id: 'shopping', name: '쇼핑', icon: ShoppingCart, color: '#45B7D1' },
  { id: 'housing', name: '주거', icon: Home, color: '#96CEB4' },
  { id: 'health', name: '건강', icon: Heart, color: '#FFEAA7' },
  { id: 'work', name: '업무', icon: Briefcase, color: '#DDA0DD' },
  { id: 'education', name: '교육', icon: Book, color: '#98D8C8' },
  { id: 'travel', name: '여행', icon: Plane, color: '#F7DC6F' },
  { id: 'gift', name: '선물', icon: Gift, color: '#F8B500' },
  { id: 'other', name: '기타', icon: MoreHorizontal, color: '#B2B2B2' }
];

export function ExpenseTrackerWidget({ id, config }: WidgetProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [view, setView] = useState<'overview' | 'add' | 'budget' | 'trend'>('overview');
  const [newExpense, setNewExpense] = useState({
    amount: '',
    category: 'food',
    description: ''
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAlert, setShowAlert] = useState(false);

  // 로컬 스토리지에서 데이터 로드
  useEffect(() => {
    const savedExpenses = localStorage.getItem(`expense_tracker_expenses_${id}`);
    const savedBudgets = localStorage.getItem(`expense_tracker_budgets_${id}`);

    if (savedExpenses) {
      const parsed = JSON.parse(savedExpenses);
      setExpenses(parsed.map((exp: any) => ({
        ...exp,
        date: new Date(exp.date),
        createdAt: new Date(exp.createdAt)
      })));
    }

    if (savedBudgets) {
      setBudgets(JSON.parse(savedBudgets));
    } else {
      // 기본 예산 설정
      const defaultBudgets: Budget[] = CATEGORIES.map(cat => ({
        category: cat.id,
        limit: 500000, // 50만원 기본 예산
        spent: 0,
        color: cat.color
      }));
      setBudgets(defaultBudgets);
    }
  }, [id]);

  // 데이터 저장
  useEffect(() => {
    if (expenses.length > 0) {
      localStorage.setItem(`expense_tracker_expenses_${id}`, JSON.stringify(expenses));
    }
    if (budgets.length > 0) {
      localStorage.setItem(`expense_tracker_budgets_${id}`, JSON.stringify(budgets));
    }
  }, [expenses, budgets, id]);

  // 현재 월의 지출 계산
  const monthlyExpenses = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    
    return expenses.filter(exp => {
      const expDate = new Date(exp.date);
      return expDate >= start && expDate <= end;
    });
  }, [expenses, currentMonth]);

  // 카테고리별 지출 계산
  const categoryExpenses = useMemo(() => {
    const result: Record<string, number> = {};
    
    monthlyExpenses.forEach(exp => {
      if (selectedCategory === 'all' || exp.category === selectedCategory) {
        result[exp.category] = (result[exp.category] || 0) + exp.amount;
      }
    });

    return result;
  }, [monthlyExpenses, selectedCategory]);

  // 총 지출 계산
  const totalExpense = useMemo(() => {
    return Object.values(categoryExpenses).reduce((sum, amount) => sum + amount, 0);
  }, [categoryExpenses]);

  // 예산 대비 지출 계산
  const budgetStatus = useMemo(() => {
    return budgets.map(budget => {
      const spent = categoryExpenses[budget.category] || 0;
      const percentage = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
      return {
        ...budget,
        spent,
        percentage,
        isOver: percentage > 100
      };
    });
  }, [budgets, categoryExpenses]);

  // 예산 초과 체크
  useEffect(() => {
    const hasOverBudget = budgetStatus.some(b => b.isOver);
    setShowAlert(hasOverBudget);
  }, [budgetStatus]);

  // 지출 추가
  const addExpense = () => {
    if (!newExpense.amount || parseFloat(newExpense.amount) <= 0) return;

    const expense: Expense = {
      id: Date.now().toString(),
      amount: parseFloat(newExpense.amount),
      category: newExpense.category,
      description: newExpense.description,
      date: new Date(),
      createdAt: new Date()
    };

    setExpenses([...expenses, expense]);
    setNewExpense({ amount: '', category: 'food', description: '' });
    setView('overview');
  };

  // 예산 업데이트
  const updateBudget = (category: string, limit: number) => {
    setBudgets(budgets.map(b => 
      b.category === category ? { ...b, limit } : b
    ));
  };

  // 월별 트렌드 데이터
  const trendData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const month = subMonths(new Date(), i);
      const start = startOfMonth(month);
      const end = endOfMonth(month);
      
      const monthExpenses = expenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate >= start && expDate <= end;
      });

      const total = monthExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      
      months.push({
        month: format(month, 'MM월', { locale: ko }),
        total,
        fullDate: month
      });
    }
    return months;
  }, [expenses]);

  const renderOverview = () => (
    <div className="space-y-4">
      {/* 월 선택 */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <Typography variant="h6" className="font-semibold">
          {format(currentMonth, 'yyyy년 MM월', { locale: ko })}
        </Typography>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          disabled={isSameMonth(currentMonth, new Date())}
        >
          <ChevronRight className={`w-5 h-5 ${
            isSameMonth(currentMonth, new Date()) ? 'text-gray-300' : 'text-gray-600'
          }`} />
        </button>
      </div>

      {/* 총 지출 */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-4 text-white">
        <div className="flex items-center justify-between">
          <div>
            <Typography variant="body2" className="text-white/80">
              이번 달 총 지출
            </Typography>
            <Typography variant="h4" className="font-bold text-white">
              ₩{totalExpense.toLocaleString()}
            </Typography>
          </div>
          <Wallet className="w-8 h-8 text-white/60" />
        </div>
      </div>

      {/* 카테고리 필터 */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
            selectedCategory === 'all'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          전체
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
              selectedCategory === cat.id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* 예산 경고 */}
      {showAlert && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
          <div className="flex-1">
            <Typography variant="body2" className="text-red-700 font-semibold">
              예산 초과 경고
            </Typography>
            <Typography variant="caption" className="text-red-600">
              일부 카테고리에서 예산을 초과했습니다.
            </Typography>
          </div>
        </div>
      )}

      {/* 카테고리별 지출 */}
      <div className="space-y-3">
        {budgetStatus
          .filter(b => selectedCategory === 'all' || b.category === selectedCategory)
          .filter(b => b.spent > 0)
          .map(budget => {
            const category = CATEGORIES.find(c => c.id === budget.category);
            if (!category) return null;
            const Icon = category.icon;

            return (
              <div key={budget.category} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <Icon className="w-4 h-4" style={{ color: category.color }} />
                    </div>
                    <Typography variant="body2" className="font-medium">
                      {category.name}
                    </Typography>
                  </div>
                  <div className="text-right">
                    <Typography variant="body2" className="font-semibold">
                      ₩{budget.spent.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" className="text-gray-500">
                      / ₩{budget.limit.toLocaleString()}
                    </Typography>
                  </div>
                </div>
                <div className="relative">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        budget.isOver ? 'bg-red-500' : 'bg-green-500'
                      }`}
                      style={{ 
                        width: `${Math.min(budget.percentage, 100)}%`,
                        backgroundColor: budget.isOver ? '#EF4444' : category.color
                      }}
                    />
                  </div>
                  {budget.percentage > 100 && (
                    <Typography variant="caption" className="text-red-500 mt-1">
                      {(budget.percentage - 100).toFixed(0)}% 초과
                    </Typography>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {/* 액션 버튼 */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setView('add')}
          className="flex items-center justify-center gap-1"
        >
          <PlusCircle className="w-4 h-4" />
          <span>추가</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setView('budget')}
          className="flex items-center justify-center gap-1"
        >
          <DollarSign className="w-4 h-4" />
          <span>예산</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setView('trend')}
          className="flex items-center justify-center gap-1"
        >
          <PieChart className="w-4 h-4" />
          <span>트렌드</span>
        </Button>
      </div>
    </div>
  );

  const renderAddExpense = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <Typography variant="h6" className="font-semibold">
          지출 추가
        </Typography>
        <button
          onClick={() => setView('overview')}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            금액
          </label>
          <input
            type="number"
            value={newExpense.amount}
            onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            카테고리
          </label>
          <div className="grid grid-cols-5 gap-2">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setNewExpense({ ...newExpense, category: cat.id })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    newExpense.category === cat.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon 
                    className="w-5 h-5 mx-auto mb-1" 
                    style={{ color: newExpense.category === cat.id ? '#3B82F6' : cat.color }}
                  />
                  <Typography variant="caption" className="text-xs">
                    {cat.name}
                  </Typography>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            설명 (선택)
          </label>
          <input
            type="text"
            value={newExpense.description}
            onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="예: 점심 식사"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setView('overview')}
          >
            취소
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={addExpense}
            disabled={!newExpense.amount || parseFloat(newExpense.amount) <= 0}
          >
            추가
          </Button>
        </div>
      </div>
    </div>
  );

  const renderBudgetSettings = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <Typography variant="h6" className="font-semibold">
          예산 설정
        </Typography>
        <button
          onClick={() => setView('overview')}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <div className="space-y-3">
        {CATEGORIES.map(cat => {
          const budget = budgets.find(b => b.category === cat.id);
          const Icon = cat.icon;
          
          return (
            <div key={cat.id} className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${cat.color}20` }}
              >
                <Icon className="w-5 h-5" style={{ color: cat.color }} />
              </div>
              <div className="flex-1">
                <Typography variant="body2" className="font-medium">
                  {cat.name}
                </Typography>
              </div>
              <input
                type="number"
                value={budget?.limit || 0}
                onChange={(e) => updateBudget(cat.id, parseFloat(e.target.value) || 0)}
                className="w-32 px-2 py-1 text-right border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          );
        })}
      </div>

      <Button
        variant="primary"
        className="w-full"
        onClick={() => setView('overview')}
      >
        저장
      </Button>
    </div>
  );

  const renderTrendView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <Typography variant="h6" className="font-semibold">
          지출 트렌드
        </Typography>
        <button
          onClick={() => setView('overview')}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      {/* 월별 막대 차트 */}
      <div className="space-y-3">
        {trendData.map((month, index) => {
          const maxValue = Math.max(...trendData.map(m => m.total));
          const percentage = maxValue > 0 ? (month.total / maxValue) * 100 : 0;
          const isCurrentMonth = isSameMonth(month.fullDate, currentMonth);
          
          return (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between">
                <Typography 
                  variant="body2" 
                  className={isCurrentMonth ? 'font-semibold text-blue-600' : ''}
                >
                  {month.month}
                </Typography>
                <Typography 
                  variant="body2" 
                  className={isCurrentMonth ? 'font-semibold text-blue-600' : ''}
                >
                  ₩{month.total.toLocaleString()}
                </Typography>
              </div>
              <div className="h-8 bg-gray-200 rounded-lg overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    isCurrentMonth ? 'bg-blue-500' : 'bg-gray-400'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* 평균 지출 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <Typography variant="body2" className="text-gray-600 mb-1">
          6개월 평균 지출
        </Typography>
        <Typography variant="h5" className="font-bold text-gray-900">
          ₩{Math.round(
            trendData.reduce((sum, m) => sum + m.total, 0) / trendData.length
          ).toLocaleString()}
        </Typography>
      </div>

      {/* 트렌드 분석 */}
      <div className="space-y-2">
        {trendData.length >= 2 && (
          <>
            {trendData[trendData.length - 1].total > trendData[trendData.length - 2].total ? (
              <div className="flex items-center gap-2 text-red-600">
                <TrendingUp className="w-4 h-4" />
                <Typography variant="body2">
                  지난달 대비 ₩{Math.abs(
                    trendData[trendData.length - 1].total - trendData[trendData.length - 2].total
                  ).toLocaleString()} 증가
                </Typography>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-600">
                <TrendingDown className="w-4 h-4" />
                <Typography variant="body2">
                  지난달 대비 ₩{Math.abs(
                    trendData[trendData.length - 1].total - trendData[trendData.length - 2].total
                  ).toLocaleString()} 감소
                </Typography>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <Card className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          <div>
            <Typography variant="h6" className="font-semibold">
              지출 추적기
            </Typography>
            <Typography variant="caption" className="text-gray-500">
              카테고리별 지출 관리
            </Typography>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {view === 'overview' && renderOverview()}
        {view === 'add' && renderAddExpense()}
        {view === 'budget' && renderBudgetSettings()}
        {view === 'trend' && renderTrendView()}
      </div>
    </Card>
  );
}