'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Settings, 
  HelpCircle, 
  LogOut,
  ChevronDown
} from 'lucide-react';
import { Typography, Avatar } from '@/components/ui';

interface ProfileMenuItem {
  label: string;
  icon: React.ReactNode;
  action: () => void;
  divider?: boolean;
}

interface ProfileDropdownProps {
  userName?: string;
  userEmail?: string;
  avatarUrl?: string;
}

export default function ProfileDropdown({ 
  userName = "사용자",
  userEmail = "user@example.com",
  avatarUrl
}: ProfileDropdownProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const menuItems: ProfileMenuItem[] = [
    {
      label: '내 정보',
      icon: <User className="w-4 h-4" />,
      action: () => {
        router.push('/profile');
        setIsOpen(false);
      }
    },
    {
      label: '계정 설정',
      icon: <Settings className="w-4 h-4" />,
      action: () => {
        router.push('/settings/account');
        setIsOpen(false);
      }
    },
    {
      label: '도움말',
      icon: <HelpCircle className="w-4 h-4" />,
      action: () => {
        router.push('/help');
        setIsOpen(false);
      },
      divider: true
    },
    {
      label: '로그아웃',
      icon: <LogOut className="w-4 h-4" />,
      action: () => {
        // Mock 로그아웃 - Supabase 연결 제거
        
        // 모든 쿠키 삭제 (브라우저 쿠키도 강제 삭제)
        document.cookie.split(";").forEach((c) => {
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
        
        // 로컬 스토리지도 클리어
        if (typeof window !== 'undefined') {
          localStorage.clear();
          sessionStorage.clear();
        }
        
        // 홈으로 리다이렉트
        router.push('/home');
      }
    }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-bg-secondary transition-colors"
      >
        {avatarUrl ? (
          <Avatar src={avatarUrl} alt={userName} size="sm" />
        ) : (
          <div className="w-10 h-10 bg-weave-primary-light rounded-full flex items-center justify-center">
            <Typography variant="body2" className="text-weave-primary font-semibold">
              {getInitials(userName)}
            </Typography>
          </div>
        )}
        
        <div className="hidden md:block text-left">
          <Typography variant="body2" className="text-txt-primary font-medium">
            {userName}
          </Typography>
          <Typography variant="caption" className="text-txt-tertiary">
            {userEmail}
          </Typography>
        </div>
        
        <ChevronDown className={`w-4 h-4 text-txt-tertiary transition-transform ${
          isOpen ? 'rotate-180' : ''
        }`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-bg-secondary rounded-lg shadow-xl border border-border-light overflow-hidden">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-border-light bg-bg-tertiary">
            <div className="flex items-center gap-3">
              {avatarUrl ? (
                <Avatar src={avatarUrl} alt={userName} size="md" />
              ) : (
                <div className="w-12 h-12 bg-weave-primary-light rounded-full flex items-center justify-center">
                  <Typography variant="body1" className="text-weave-primary font-semibold">
                    {getInitials(userName)}
                  </Typography>
                </div>
              )}
              <div>
                <Typography variant="body2" className="text-txt-primary font-medium">
                  {userName}
                </Typography>
                <Typography variant="caption" className="text-txt-secondary">
                  {userEmail}
                </Typography>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {menuItems.map((item, index) => (
              <React.Fragment key={index}>
                {item.divider && index > 0 && (
                  <div className="my-2 border-t border-border-light" />
                )}
                <button
                  onClick={item.action}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-txt-secondary hover:bg-bg-tertiary hover:text-txt-primary transition-colors"
                >
                  {item.icon}
                  <Typography variant="body2">
                    {item.label}
                  </Typography>
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}