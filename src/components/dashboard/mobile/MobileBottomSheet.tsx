'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import Button from '@/components/ui/Button';
import Typography from '@/components/ui/Typography';
import { cn } from '@/lib/utils';

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  height?: 'auto' | 'half' | 'full';
  showHandle?: boolean;
  closeOnOverlayClick?: boolean;
  className?: string;
}

export function MobileBottomSheet({
  isOpen,
  onClose,
  title,
  children,
  height = 'auto',
  showHandle = true,
  closeOnOverlayClick = true,
  className
}: MobileBottomSheetProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setTimeout(() => setIsAnimating(true), 10);
    } else {
      setIsAnimating(false);
      setTimeout(() => setIsVisible(false), 300);
    }
  }, [isOpen]);

  // 터치/드래그 핸들링
  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    isDragging.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || !sheetRef.current) return;
    
    currentY.current = e.touches[0].clientY;
    const deltaY = currentY.current - startY.current;
    
    // 아래로 드래그할 때만 이동
    if (deltaY > 0) {
      sheetRef.current.style.transform = `translateY(${deltaY}px)`;
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging.current || !sheetRef.current) return;
    
    const deltaY = currentY.current - startY.current;
    
    // 100px 이상 드래그하면 닫기
    if (deltaY > 100) {
      onClose();
    } else {
      // 원래 위치로 복귀
      sheetRef.current.style.transform = '';
    }
    
    isDragging.current = false;
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isVisible) return null;

  const getHeightClass = () => {
    switch (height) {
      case 'full':
        return 'h-full';
      case 'half':
        return 'h-1/2';
      case 'auto':
      default:
        return 'max-h-[90vh]';
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* 오버레이 */}
      <div
        className={cn(
          "absolute inset-0 bg-black transition-opacity duration-300",
          isAnimating ? "opacity-50" : "opacity-0"
        )}
        onClick={handleOverlayClick}
        aria-hidden="true"
      />

      {/* 바텀시트 */}
      <div
        ref={sheetRef}
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl transition-transform duration-300",
          getHeightClass(),
          isAnimating ? "translate-y-0" : "translate-y-full",
          className
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "bottom-sheet-title" : undefined}
      >
        {/* 드래그 핸들 */}
        {showHandle && (
          <div
            className="flex justify-center py-2 touch-manipulation"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ minHeight: '48px' }}
          >
            <div className="w-12 h-1 bg-gray-300 rounded-full" />
          </div>
        )}

        {/* 헤더 */}
        {title && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
            <h2 
              id="bottom-sheet-title"
              className="text-lg font-medium text-txt-primary"
            >
              {title}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="p-2 touch-manipulation"
              aria-label="닫기"
              style={{ minHeight: '48px', minWidth: '48px' }}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        )}

        {/* 콘텐츠 */}
        <div className={cn(
          "overflow-y-auto overflow-x-hidden",
          height === 'auto' ? 'max-h-[calc(90vh-8rem)]' : ''
        )}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}