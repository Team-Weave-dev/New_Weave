'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Link2, ExternalLink, Edit2, Trash2, Globe, Mail, FileText, Calendar, DollarSign, Users, Settings, Folder, MoreHorizontal } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Typography from '@/components/ui/Typography';

interface QuickLink {
  id: string;
  title: string;
  url: string;
  icon: string;
  category: string;
  description?: string;
  color?: string;
}

const ICON_OPTIONS = [
  { value: 'link', icon: Link2, label: '링크' },
  { value: 'globe', icon: Globe, label: '웹사이트' },
  { value: 'mail', icon: Mail, label: '이메일' },
  { value: 'file', icon: FileText, label: '문서' },
  { value: 'calendar', icon: Calendar, label: '캘린더' },
  { value: 'dollar', icon: DollarSign, label: '재무' },
  { value: 'users', icon: Users, label: '팀' },
  { value: 'settings', icon: Settings, label: '설정' },
  { value: 'folder', icon: Folder, label: '폴더' }
];

const CATEGORIES = [
  { value: 'work', label: '업무', color: 'var(--color-brand-primary-start)' },
  { value: 'tools', label: '도구', color: 'var(--color-status-info)' },
  { value: 'docs', label: '문서', color: 'var(--color-status-warning)' },
  { value: 'finance', label: '재무', color: 'var(--color-status-success)' },
  { value: 'personal', label: '개인', color: 'var(--color-status-error)' },
  { value: 'other', label: '기타', color: 'var(--color-text-secondary)' }
];

const DEFAULT_LINKS: QuickLink[] = [
  {
    id: '1',
    title: 'Google Drive',
    url: 'https://drive.google.com',
    icon: 'folder',
    category: 'work',
    description: '클라우드 스토리지',
    color: 'var(--color-brand-primary-start)'
  },
  {
    id: '2',
    title: 'GitHub',
    url: 'https://github.com',
    icon: 'globe',
    category: 'tools',
    description: '코드 저장소',
    color: 'var(--color-status-info)'
  },
  {
    id: '3',
    title: 'Notion',
    url: 'https://notion.so',
    icon: 'file',
    category: 'docs',
    description: '프로젝트 문서',
    color: 'var(--color-status-warning)'
  }
];

export function QuickLinksWidget() {
  const [links, setLinks] = useState<QuickLink[]>([]);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [formData, setFormData] = useState({
    title: '',
    url: '',
    icon: 'link',
    category: 'work',
    description: ''
  });

  // 로컬스토리지에서 링크 로드
  useEffect(() => {
    const savedLinks = localStorage.getItem('quickLinks');
    if (savedLinks) {
      setLinks(JSON.parse(savedLinks));
    } else {
      setLinks(DEFAULT_LINKS);
    }
  }, []);

  // 링크 변경 시 로컬스토리지에 저장
  useEffect(() => {
    if (links.length > 0) {
      localStorage.setItem('quickLinks', JSON.stringify(links));
    }
  }, [links]);

  const handleAddLink = () => {
    if (!formData.title || !formData.url) return;

    const newLink: QuickLink = {
      id: Date.now().toString(),
      title: formData.title,
      url: formData.url.startsWith('http') ? formData.url : `https://${formData.url}`,
      icon: formData.icon,
      category: formData.category,
      description: formData.description,
      color: CATEGORIES.find(c => c.value === formData.category)?.color
    };

    setLinks([...links, newLink]);
    setFormData({
      title: '',
      url: '',
      icon: 'link',
      category: 'work',
      description: ''
    });
    setIsAddingLink(false);
  };

  const handleUpdateLink = () => {
    if (!editingId || !formData.title || !formData.url) return;

    setLinks(links.map(link => 
      link.id === editingId
        ? {
            ...link,
            title: formData.title,
            url: formData.url.startsWith('http') ? formData.url : `https://${formData.url}`,
            icon: formData.icon,
            category: formData.category,
            description: formData.description,
            color: CATEGORIES.find(c => c.value === formData.category)?.color
          }
        : link
    ));

    setFormData({
      title: '',
      url: '',
      icon: 'link',
      category: 'work',
      description: ''
    });
    setEditingId(null);
  };

  const handleDeleteLink = (id: string) => {
    setLinks(links.filter(link => link.id !== id));
  };

  const startEdit = (link: QuickLink) => {
    setFormData({
      title: link.title,
      url: link.url,
      icon: link.icon,
      category: link.category,
      description: link.description || ''
    });
    setEditingId(link.id);
    setIsAddingLink(false);
  };

  const getIcon = (iconName: string) => {
    const IconComponent = ICON_OPTIONS.find(opt => opt.value === iconName)?.icon || Link2;
    return IconComponent;
  };

  const filteredLinks = links.filter(link => {
    const matchesCategory = selectedCategory === 'all' || link.category === selectedCategory;
    const matchesSearch = link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (link.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <Card className="p-6 h-full">
      <div className="flex items-center justify-between mb-4">
        <Typography variant="h3">바로가기</Typography>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className="px-2 py-1 text-sm rounded hover:bg-gray-100"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {viewMode === 'grid' ? '목록' : '격자'}
          </button>
          <button
            onClick={() => {
              setIsAddingLink(true);
              setEditingId(null);
              setFormData({
                title: '',
                url: '',
                icon: 'link',
                category: 'work',
                description: ''
              });
            }}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <Plus className="w-5 h-5" style={{ color: 'var(--color-brand-primary-start)' }} />
          </button>
        </div>
      </div>

      {/* 카테고리 필터 */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
            selectedCategory === 'all' ? 'text-white' : ''
          }`}
          style={{
            backgroundColor: selectedCategory === 'all' ? 'var(--color-brand-primary-start)' : 'transparent',
            color: selectedCategory === 'all' ? 'white' : 'var(--color-text-secondary)'
          }}
        >
          전체
        </button>
        {CATEGORIES.map(category => (
          <button
            key={category.value}
            onClick={() => setSelectedCategory(category.value)}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
              selectedCategory === category.value ? 'text-white' : ''
            }`}
            style={{
              backgroundColor: selectedCategory === category.value ? category.color : 'transparent',
              color: selectedCategory === category.value ? 'white' : 'var(--color-text-secondary)'
            }}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* 검색 */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="링크 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg text-sm"
          style={{
            borderColor: 'var(--color-border-primary)',
            color: 'var(--color-text-primary)'
          }}
        />
      </div>

      {/* 링크 추가/수정 폼 */}
      {(isAddingLink || editingId) && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="제목"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              style={{
                borderColor: 'var(--color-border-primary)',
                color: 'var(--color-text-primary)'
              }}
            />
            <input
              type="text"
              placeholder="URL (예: google.com)"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              style={{
                borderColor: 'var(--color-border-primary)',
                color: 'var(--color-text-primary)'
              }}
            />
            <input
              type="text"
              placeholder="설명 (선택사항)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg text-sm"
              style={{
                borderColor: 'var(--color-border-primary)',
                color: 'var(--color-text-primary)'
              }}
            />
            <div className="flex gap-2">
              <select
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                className="flex-1 px-3 py-2 border rounded-lg text-sm"
                style={{
                  borderColor: 'var(--color-border-primary)',
                  color: 'var(--color-text-primary)'
                }}
              >
                {ICON_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="flex-1 px-3 py-2 border rounded-lg text-sm"
                style={{
                  borderColor: 'var(--color-border-primary)',
                  color: 'var(--color-text-primary)'
                }}
              >
                {CATEGORIES.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsAddingLink(false);
                  setEditingId(null);
                  setFormData({
                    title: '',
                    url: '',
                    icon: 'link',
                    category: 'work',
                    description: ''
                  });
                }}
                className="flex-1 px-3 py-2 border rounded-lg text-sm hover:bg-gray-100"
                style={{
                  borderColor: 'var(--color-border-primary)',
                  color: 'var(--color-text-secondary)'
                }}
              >
                취소
              </button>
              <button
                onClick={editingId ? handleUpdateLink : handleAddLink}
                className="flex-1 px-3 py-2 text-white rounded-lg text-sm hover:opacity-90"
                style={{
                  backgroundColor: 'var(--color-brand-primary-start)'
                }}
              >
                {editingId ? '수정' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 링크 목록 */}
      <div className={viewMode === 'grid' 
        ? 'grid grid-cols-2 gap-3' 
        : 'space-y-2'
      }>
        {filteredLinks.map(link => {
          const IconComponent = getIcon(link.icon);
          
          return (
            <div
              key={link.id}
              className={`group relative rounded-lg p-3 hover:shadow-md transition-shadow ${
                viewMode === 'list' ? 'flex items-center justify-between' : ''
              }`}
              style={{
                backgroundColor: 'var(--color-surface-elevated)',
                borderLeft: `3px solid ${link.color || 'var(--color-brand-primary-start)'}`
              }}
            >
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`block ${viewMode === 'list' ? 'flex items-center flex-1' : ''}`}
              >
                <div className={viewMode === 'list' ? 'flex items-center gap-3' : ''}>
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                    style={{
                      backgroundColor: `${link.color || 'var(--color-brand-primary-start)'}20`
                    }}
                  >
                    <IconComponent 
                      className="w-4 h-4" 
                      style={{ color: link.color || 'var(--color-brand-primary-start)' }} 
                    />
                  </div>
                  <div className={viewMode === 'list' ? '' : ''}>
                    <Typography variant="body2" className="font-medium truncate">
                      {link.title}
                    </Typography>
                    {link.description && (
                      <Typography 
                        variant="caption" 
                        className="truncate text-[var(--color-text-secondary)]"
                      >
                        {link.description}
                      </Typography>
                    )}
                  </div>
                </div>
              </a>
              
              {/* 액션 버튼 */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startEdit(link);
                  }}
                  className="p-1 rounded hover:bg-gray-100"
                >
                  <Edit2 className="w-3 h-3" style={{ color: 'var(--color-text-secondary)' }} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteLink(link.id);
                  }}
                  className="p-1 rounded hover:bg-gray-100"
                >
                  <Trash2 className="w-3 h-3" style={{ color: 'var(--color-status-error)' }} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredLinks.length === 0 && (
        <div className="text-center py-8">
          <Typography variant="body2" className="text-[var(--color-text-secondary)]">
            {searchQuery || selectedCategory !== 'all' 
              ? '검색 결과가 없습니다' 
              : '바로가기를 추가해보세요'}
          </Typography>
        </div>
      )}
    </Card>
  );
}