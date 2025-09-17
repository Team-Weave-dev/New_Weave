'use client';

import React, { useEffect } from 'react';

interface SkipLink {
  id: string;
  text: string;
}

interface SkipLinksProps {
  links?: SkipLink[];
}

const defaultLinks: SkipLink[] = [
  { id: 'main-content', text: '주요 콘텐츠로 건너뛰기' },
  { id: 'main-navigation', text: '주 메뉴로 건너뛰기' },
  { id: 'search', text: '검색으로 건너뛰기' },
  { id: 'dashboard-widgets', text: '대시보드 위젯으로 건너뛰기' },
];

export const SkipLinks: React.FC<SkipLinksProps> = ({ links = defaultLinks }) => {
  useEffect(() => {
    // 접근성 CSS 로드
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/styles/accessibility.css';
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const handleSkipLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    
    const target = document.getElementById(targetId);
    if (target) {
      // 대상 요소로 스크롤
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // 대상 요소에 포커스 (임시 tabindex 설정)
      const originalTabIndex = target.getAttribute('tabindex');
      target.setAttribute('tabindex', '-1');
      target.focus();
      
      // 포커스 이후 원래 tabindex 복원
      if (originalTabIndex === null) {
        setTimeout(() => {
          target.removeAttribute('tabindex');
        }, 100);
      }
    }
  };

  return (
    <nav 
      className="skip-links-container" 
      aria-label="스킵 네비게이션"
    >
      {links.map((link) => (
        <a
          key={link.id}
          href={`#${link.id}`}
          className="skip-link"
          onClick={(e) => handleSkipLinkClick(e, link.id)}
        >
          {link.text}
        </a>
      ))}
    </nav>
  );
};