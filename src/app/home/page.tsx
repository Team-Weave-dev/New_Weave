'use client';

import { useState } from 'react';
import { HomeContentSection } from '@/components/home/HomeContentSection';
import FloatingQuickMenu from '@/components/FloatingQuickMenu';
import SimpleHeaderNavigation from '@/components/navigation/SimpleHeaderNavigation';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Typography from '@/components/ui/Typography';
import { mockHomeContent } from '@/lib/data/mockHomeContent';
import { 
  Brain,
  FileText,
  Calculator,
  CreditCard,
  ArrowRight,
  Mail,
  Phone,
  MapPin,
  Github
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const currentYear = 2025;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header Navigation */}
      <SimpleHeaderNavigation />
      
      {/* Spacer for fixed header */}
      <div className="h-14 sm:h-16" />


      {/* Main Content */}
      <main className="flex-grow">
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-7xl mx-auto">
            {/* 히어로 섹션 */}
            <div className="relative bg-gradient-to-r from-blue-50 to-indigo-100 rounded-2xl p-8 mb-12 overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="grid grid-cols-8 gap-4 h-full">
                  {[...Array(32)].map((_, i) => (
                    <div key={i} className="bg-blue-600 rounded-full w-2 h-2 animate-pulse" style={{ animationDelay: `${i * 100}ms` }}></div>
                  ))}
                </div>
              </div>
              
              <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <Typography variant="h1" className="text-4xl font-bold text-gray-900 mb-4">
                    <span className="sm:inline">흩어진 당신의 업무를</span>
                    <br className="hidden sm:block" />
                    <span className="text-blue-600">하나로 엮다</span>
                  </Typography>
                  <Typography variant="body1" className="text-lg text-gray-600 mb-6">
독립 비즈니스를 위한 개인화 AI 기반 ERP. 프리랜서, 소상공인, 전문직, 크리에이터까지 계약부터 세무까지 모든 업무를 한 곳에서 관리하세요.
                  </Typography>
                  
                  <div className="flex gap-4">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => router.push('/dashboard')}
                      className="px-6 py-3"
                    >
                      무료로 시작하기 <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => router.push('/')}
                      className="px-6 py-3"
                    >
                      더 알아보기
                    </Button>
                  </div>
                </div>

                <div className="relative">
                  {/* Hero Illustration */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl shadow-lg">
                      <Brain className="w-8 h-8 text-blue-600 mb-2" />
                      <Typography variant="h4" className="font-semibold text-sm">AI 분석</Typography>
                      <Typography variant="caption" className="text-xs text-gray-600">스마트 업무 최적화</Typography>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-lg">
                      <FileText className="w-8 h-8 text-green-600 mb-2" />
                      <Typography variant="h4" className="font-semibold text-sm">문서 자동화</Typography>
                      <Typography variant="caption" className="text-xs text-gray-600">계약서, 인보이스</Typography>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-lg">
                      <Calculator className="w-8 h-8 text-purple-600 mb-2" />
                      <Typography variant="h4" className="font-semibold text-sm">세무 관리</Typography>
                      <Typography variant="caption" className="text-xs text-gray-600">자동 세금 계산</Typography>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-lg">
                      <CreditCard className="w-8 h-8 text-orange-600 mb-2" />
                      <Typography variant="h4" className="font-semibold text-sm">결제 추적</Typography>
                      <Typography variant="caption" className="text-xs text-gray-600">수익 실시간 분석</Typography>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 홈 콘텐츠 섹션 */}
            <HomeContentSection content={mockHomeContent} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Image
                  src="/logo.png"
                  alt="Weave Logo"
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
                <Typography variant="h3" className="text-xl font-bold">Weave</Typography>
              </div>
              <Typography variant="body2" className="text-gray-400 text-sm">
독립 비즈니스를 위한 개인화 AI 기반 ERP
              </Typography>
              <Typography variant="body2" className="text-gray-400 text-sm mt-2">
                계약부터 세무까지, 모든 업무를 한 곳에서
              </Typography>
            </div>

            {/* Quick Links - 실제 구현된 기능만 */}
            <div>
              <Typography variant="h4" className="text-white font-semibold mb-4">바로가기</Typography>
              <ul className="space-y-2">
                <li>
                  <Link href="/dashboard" className="text-gray-400 hover:text-white text-sm transition-colors">
                    대시보드
                  </Link>
                </li>
                <li>
                  <Link href="/ai-assistant" className="text-gray-400 hover:text-white text-sm transition-colors">
                    AI 비서
                  </Link>
                </li>
                <li>
                  <Link href="/invoices" className="text-gray-400 hover:text-white text-sm transition-colors">
                    인보이스
                  </Link>
                </li>
                <li>
                  <Link href="/clients" className="text-gray-400 hover:text-white text-sm transition-colors">
                    클라이언트 관리
                  </Link>
                </li>
                <li>
                  <Link href="/settings" className="text-gray-400 hover:text-white text-sm transition-colors">
                    설정
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <Typography variant="h4" className="text-white font-semibold mb-4">연락처</Typography>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-gray-400 text-sm">
                  <Mail className="w-4 h-4" />
                  support@weave.ai
                </li>
                <li className="flex items-center gap-2 text-gray-400 text-sm">
                  <Phone className="w-4 h-4" />
                  1600-0000
                </li>
                <li className="flex items-center gap-2 text-gray-400 text-sm">
                  <MapPin className="w-4 h-4" />
                  서울시 강남구
                </li>
              </ul>

              {/* Social Links */}
              <div className="flex items-center gap-3 mt-4">
                <a href="https://github.com/yonghyeon-dev/New_Weave" className="text-gray-400 hover:text-white transition-colors">
                  <Github className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <Typography variant="caption" className="text-gray-400 text-sm">
              © {currentYear} Weave. All rights reserved.
            </Typography>
          </div>
        </div>
      </footer>

      {/* 플로팅 퀵메뉴 */}
      <FloatingQuickMenu />
    </div>
  );
}