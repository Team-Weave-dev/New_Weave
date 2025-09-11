'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProjectFullPageDetail } from '@/components/projects/ProjectFullPageDetail';
import type { ProjectTableRow } from '@/lib/types/project-table.types';

export interface ProjectDetailPageProps {
  params: {
    id: string;
  };
  searchParams?: {
    [key: string]: string | string[] | undefined;
  };
}

/**
 * 개별 프로젝트 상세 페이지 (전체 페이지)
 * 
 * 라우트: /projects/[id]
 * 예시: /projects/WEAVE_001
 * 
 * 특징:
 * - 전체 페이지 레이아웃으로 프로젝트 상세 정보 표시
 * - URL의 id를 기반으로 해당 프로젝트 자동 선택
 * - 목록으로 돌아가기 버튼
 * - 좌우 네비게이션으로 다른 프로젝트 탐색
 * - 필터 및 검색 기능
 */
export default function ProjectDetailPage({ 
  params, 
  searchParams 
}: ProjectDetailPageProps) {
  const router = useRouter();
  const [allProjects, setAllProjects] = useState<ProjectTableRow[]>([]);
  const [selectedProject, setSelectedProject] = useState<ProjectTableRow | null>(null);
  const [loading, setLoading] = useState(true);

  // 더미 데이터 생성 함수 (통일된 데이터 사용)
  const generateMockData = (): ProjectTableRow[] => {
    const clients = ['A개발', 'B디자인', 'C마케팅', 'D컨설팅', 'E업체', 'F자체', 'A학교'];
    const statuses: Array<'planning' | 'in_progress' | 'review' | 'completed' | 'on_hold' | 'cancelled'> = 
      ['planning', 'in_progress', 'review', 'completed', 'on_hold', 'cancelled'];

    const seededRandom = (seed: number): number => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };

    const baseDate = new Date(2024, 0, 1);
    const dayInterval = 7;

    const projects = Array.from({ length: 20 }, (_, i) => {
      const seed1 = i * 1234 + 5678;
      const seed2 = i * 2345 + 6789;
      const seed3 = i * 3456 + 7890;
      const seed4 = i * 4567 + 8901;
      const seed5 = i * 5678 + 9012;

      const registrationDate = new Date(
        baseDate.getTime() + 
        (i * dayInterval * 24 * 60 * 60 * 1000) + 
        (Math.floor(seededRandom(seed1) * 3) * 24 * 60 * 60 * 1000)
      );
      const dueDate = new Date(registrationDate.getTime() + Math.floor(seededRandom(seed2) * 90) * 24 * 60 * 60 * 1000);
      
      const currentDate = new Date();
      const maxModifyTime = Math.min(currentDate.getTime(), registrationDate.getTime() + 180 * 24 * 60 * 60 * 1000);
      const modifyTimeRange = maxModifyTime - registrationDate.getTime();
      const modifiedDate = new Date(registrationDate.getTime() + Math.floor(seededRandom(seed3) * modifyTimeRange));

      const progress = Math.floor(seededRandom(seed4) * 101);
      let paymentProgress = 0;
      
      if (progress >= 80) {
        paymentProgress = Math.floor(80 + seededRandom(seed5) * 21);
      } else if (progress >= 50) {
        paymentProgress = Math.floor(30 + seededRandom(seed5) * 51);
      } else if (progress >= 20) {
        paymentProgress = Math.floor(10 + seededRandom(seed5) * 31);
      } else {
        paymentProgress = Math.floor(seededRandom(seed5) * 21);
      }
      
      const statusIndex = Math.floor(seededRandom(seed1 + seed2) * statuses.length);
      if (statuses[statusIndex] === 'completed' && seededRandom(seed3 + seed4) > 0.3) {
        paymentProgress = 100;
      }

      return {
        id: `project-${i + 1}`,
        no: `WEAVE_${String(i + 1).padStart(3, '0')}`,
        name: `${['A개발', 'B디자인', 'C마케팅', 'D컨설팅', '카페 관리', '피시방 관리', 'A교육 강의'][i % 7]} 프로젝트`,
        registrationDate: registrationDate.toISOString(),
        client: clients[i % clients.length],
        progress,
        paymentProgress,
        status: statuses[statusIndex],
        dueDate: dueDate.toISOString(),
        modifiedDate: modifiedDate.toISOString(),
        hasContract: seededRandom(seed1 + 1000) > 0.5,
        hasBilling: seededRandom(seed2 + 1000) > 0.3,
        hasDocuments: seededRandom(seed3 + 1000) > 0.4
      };
    });

    // 최신 프로젝트가 상단에 오도록 내림차순 정렬 (no 기준)
    return projects.sort((a, b) => {
      const aNum = parseInt(a.no.split('_')[1] || '0');
      const bNum = parseInt(b.no.split('_')[1] || '0');
      return bNum - aNum;
    });
  };

  // 데이터 로딩
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 300));
      const data = generateMockData();
      setAllProjects(data);
      
      // 현재 id에 해당하는 프로젝트 찾기
      const currentProject = data.find(p => p.no === params.id);
      setSelectedProject(currentProject || null);
      setLoading(false);
    };

    loadData();
  }, [params.id]);

  // 프로젝트 변경 핸들러
  const handleProjectChange = (projectNo: string) => {
    router.push(`/projects/${projectNo}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-txt-secondary">로딩 중...</div>
      </div>
    );
  }

  return (
    <ProjectFullPageDetail
      project={selectedProject}
      allProjects={allProjects}
      onProjectChange={handleProjectChange}
    />
  );
}