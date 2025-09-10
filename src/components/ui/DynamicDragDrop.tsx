'use client';

import dynamic from 'next/dynamic';
import React from 'react';

// 로딩 컴포넌트
const DragDropLoadingComponent = () => (
  <div className="flex items-center justify-center p-2">
    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-weave-primary"></div>
  </div>
);

// @hello-pangea/dnd 컴포넌트들을 동적 로딩
export const DragDropContext = dynamic(
  () => import('@hello-pangea/dnd').then(mod => ({ default: mod.DragDropContext })),
  {
    loading: DragDropLoadingComponent,
    ssr: false, // SSR에서 실행되지 않도록 설정
  }
);

export const Droppable = dynamic(
  () => import('@hello-pangea/dnd').then(mod => ({ default: mod.Droppable })),
  {
    loading: DragDropLoadingComponent,
    ssr: false,
  }
);

export const Draggable = dynamic(
  () => import('@hello-pangea/dnd').then(mod => ({ default: mod.Draggable })),
  {
    loading: DragDropLoadingComponent,
    ssr: false,
  }
);

// 타입들도 동적으로 가져오기
export type { DropResult } from '@hello-pangea/dnd';

// 드래그앤드롭이 로드되지 않은 경우의 대체 컴포넌트
export const DragDropFallback: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div>{children}</div>;
};

// 클라이언트 사이드에서만 드래그앤드롭 기능을 활성화하는 HOC
export function withDragDrop<T extends {}>(Component: React.ComponentType<T>) {
  return function DragDropWrapper(props: T) {
    const [isClient, setIsClient] = React.useState(false);
    
    React.useEffect(() => {
      setIsClient(true);
    }, []);
    
    if (!isClient) {
      // 서버 사이드에서는 드래그앤드롭 없이 렌더링
      return <Component {...props} />;
    }
    
    // 클라이언트 사이드에서만 드래그앤드롭 기능 활성화
    return <Component {...props} />;
  };
}