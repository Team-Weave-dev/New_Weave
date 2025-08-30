'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  CreditCard, 
  Calculator, 
  Users, 
  Settings,
  Menu,
  X,
  Building,
  Upload,
  Bell,
  Cpu,
  MessageCircle,
  Briefcase,
  FolderOpen,
  Search,
  BrainCircuit
} from 'lucide-react';
import { cn } from '@/lib/utils';

// 계층적 메뉴 구조 - 대시보드, 프로젝트, 세무 관리
const navigation = [
  {
    name: '대시보드',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: '실시간 비즈니스 현황 및 인사이트'
  },
  {
    name: '프로젝트',
    href: '/projects',
    icon: Briefcase,
    description: '프로젝트 중심 업무관리 (클라이언트, 인보이스, 결제)',
    badge: 'New'
  },
  {
    name: '세무 관리',
    href: '/tax-management',
    icon: Calculator,
    description: '세금 계산 및 세무 관리'
  },
  {
    name: '설정',
    href: '/settings',
    icon: Settings,
    description: '시스템 및 개인 설정'
  }
];


interface MainNavigationProps {
  className?: string;
  isMobile?: boolean;
  isOpen?: boolean;
  onMobileMenuToggle?: (isOpen: boolean) => void;
}

export default function MainNavigation({ 
  className = '', 
  isMobile = false, 
  isOpen = false, 
  onMobileMenuToggle 
}: MainNavigationProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['업무 관리']);
  const pathname = usePathname();

  const isActivePath = (href: string): boolean => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    if (href === '#') {
      return false; // 섹션 헤더는 활성화되지 않음
    }
    return pathname.startsWith(href);
  };

  const isChildActive = (children: any[]): boolean => {
    return children.some(child => pathname.startsWith(child.href));
  };

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionName) 
        ? prev.filter(name => name !== sectionName)
        : [...prev, sectionName]
    );
  };

  // 하위 메뉴 클릭 시 드롭다운 유지를 위한 핸들러
  const handleChildClick = (e: React.MouseEvent) => {
    // 하위 메뉴 클릭 시 이벤트 버블링 방지하여 드롭다운 유지
    e.stopPropagation();
  };

  // 모바일 메뉴 토글 핸들러
  const handleMobileMenuToggle = () => {
    onMobileMenuToggle?.(!isOpen);
  };

  // 모바일 네비게이션 렌더링
  if (isMobile) {
    return (
      <>
        {/* Mobile Header */}
        <div className="flex items-center justify-between h-16 px-4 bg-white border-b border-border-light sticky top-0 z-40">
          <Link href="/home" className="flex items-center space-x-3">
            <Image
              src="/logo.png"
              alt="Weave Logo"
              width={32}
              height={32}
              className="rounded-lg"
              priority
            />
            <span className="text-xl font-bold text-txt-primary">Weave</span>
          </Link>

          <button
            onClick={handleMobileMenuToggle}
            className="p-2 text-txt-secondary hover:text-txt-primary transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {isOpen && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
            <div className="fixed inset-y-0 left-0 w-80 bg-white shadow-xl">
              <div className="flex items-center justify-between h-16 px-4 border-b border-border-light">
                <Link 
                  href="/home" 
                  className="flex items-center space-x-3"
                  onClick={() => onMobileMenuToggle?.(false)}
                >
                  <Image
                    src="/logo.png"
                    alt="Weave Logo"
                    width={32}
                    height={32}
                    className="rounded-lg"
                    priority
                  />
                  <span className="text-xl font-bold text-txt-primary">Weave</span>
                </Link>

                <button
                  onClick={() => onMobileMenuToggle?.(false)}
                  className="p-2 text-txt-secondary hover:text-txt-primary"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="h-full overflow-y-auto pb-20">
                <div className="px-4 py-6 space-y-1">
                  {navigation.map((item) => {
                    const isActive = isActivePath(item.href);
                    
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => onMobileMenuToggle?.(false)}
                        className={cn(
                          "flex items-center px-4 py-3 text-base font-medium rounded-xl transition-colors",
                          isActive
                            ? "bg-weave-primary-light text-weave-primary border border-weave-primary/20"
                            : "text-txt-secondary hover:text-txt-primary hover:bg-bg-secondary"
                        )}
                      >
                        <item.icon 
                          className={cn(
                            "w-6 h-6 mr-4 flex-shrink-0",
                            isActive ? "text-weave-primary" : "text-txt-tertiary"
                          )} 
                        />
                        <div className="flex-1">
                          <div className="font-semibold flex items-center gap-2">
                            {item.name}
                            {item.badge && (
                              <span className="px-2 py-1 text-xs font-semibold bg-weave-primary text-white rounded-full">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <div className={cn(
                            "text-sm mt-1",
                            isActive ? "text-weave-primary/70" : "text-txt-tertiary"
                          )}>
                            {item.description}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Mobile User Info */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border-light bg-white">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-weave-primary rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">U</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-txt-primary truncate">
                        사용자
                      </p>
                      <p className="text-xs text-txt-tertiary truncate">
                        user@example.com
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // 데스크톱 네비게이션 렌더링
  return (
    <>
      {/* Desktop Navigation */}
      <nav className={cn("bg-white", className)}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-border-light">
            <Link href="/home" className="flex items-center space-x-3">
              <Image
                src="/logo.png"
                alt="Weave Logo"
                width={32}
                height={32}
                className="rounded-lg"
                priority
              />
              <span className="text-xl font-bold text-txt-primary">Weave</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => {
              const isActive = isActivePath(item.href);
              const hasActiveChild = 'children' in item && Array.isArray(item.children) ? isChildActive(item.children) : false;
              
              if ('isSection' in item && item.isSection) {
                return (
                  <div key={item.name} className="space-y-1">
                    {/* 섹션 헤더 */}
                    <button
                      onClick={() => toggleSection(item.name)}
                      className={cn(
                        "w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors hover:bg-bg-secondary",
                        hasActiveChild 
                          ? "bg-weave-primary-light/50 text-weave-primary" 
                          : "text-txt-primary bg-bg-secondary"
                      )}
                    >
                      <item.icon 
                        className={cn(
                          "w-5 h-5 mr-3 flex-shrink-0",
                          hasActiveChild ? "text-weave-primary" : "text-txt-secondary"
                        )} 
                      />
                      <div className="flex-1 text-left">
                        <div className="font-semibold">{item.name}</div>
                        <div className={cn(
                          "text-xs mt-0.5",
                          hasActiveChild ? "text-weave-primary/70" : "text-txt-tertiary"
                        )}>
                          {item.description}
                        </div>
                      </div>
                      <div className={cn(
                        "text-xs transition-transform",
                        expandedSections.includes(item.name) ? "rotate-90" : ""
                      )}>
                        ▶
                      </div>
                    </button>
                    
                    {/* 하위 메뉴 */}
                    {expandedSections.includes(item.name) && (
                      <div className="ml-6 space-y-1">
                        {('children' in item && Array.isArray(item.children) ? item.children : []).map((child) => {
                        const isChildActve = isActivePath(child.href);
                        return (
                          <Link
                            key={child.name}
                            href={child.href}
                            onClick={handleChildClick}
                            className={cn(
                              "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors group",
                              isChildActve
                                ? "bg-weave-primary-light text-weave-primary border border-weave-primary/20"
                                : "text-txt-secondary hover:text-txt-primary hover:bg-bg-secondary"
                            )}
                          >
                            <child.icon 
                              className={cn(
                                "w-4 h-4 mr-3 flex-shrink-0",
                                isChildActve ? "text-weave-primary" : "text-txt-tertiary group-hover:text-txt-secondary"
                              )} 
                            />
                            <div className="flex-1">
                              <div className="font-medium">{child.name}</div>
                              <div className={cn(
                                "text-xs mt-0.5",
                                isChildActve ? "text-weave-primary/70" : "text-txt-tertiary"
                              )}>
                                {child.description}
                              </div>
                            </div>
                          </Link>
                        );
                        })}
                      </div>
                    )}
                  </div>
                );
              }
              
              // 일반 메뉴 아이템
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors group relative",
                    isActive
                      ? "bg-weave-primary-light text-weave-primary border border-weave-primary/20"
                      : "text-txt-secondary hover:text-txt-primary hover:bg-bg-secondary"
                  )}
                >
                  <item.icon 
                    className={cn(
                      "w-5 h-5 mr-3 flex-shrink-0",
                      isActive ? "text-weave-primary" : "text-txt-tertiary group-hover:text-txt-secondary"
                    )} 
                  />
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-2">
                      {item.name}
                      {item.badge && (
                        <span className="px-1.5 py-0.5 text-xs font-semibold bg-weave-primary text-white rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div className={cn(
                      "text-xs mt-0.5",
                      isActive ? "text-weave-primary/70" : "text-txt-tertiary"
                    )}>
                      {item.description}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* User Info */}
          <div className="p-4 border-t border-border-light">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-weave-primary rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">U</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-txt-primary truncate">
                  사용자
                </p>
                <p className="text-xs text-txt-tertiary truncate">
                  user@example.com
                </p>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}