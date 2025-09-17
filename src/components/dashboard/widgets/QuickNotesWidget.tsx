'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Search, Plus, Hash, X, Save, Edit2, Trash2, ChevronDown, ChevronRight, FileText } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import Typography from '@/components/ui/Typography'
import Button from '@/components/ui/Button'

interface Note {
  id: string
  title: string
  content: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
  isPinned?: boolean
}

interface QuickNotesWidgetProps {
  id: string
  config?: {
    maxNotes?: number
    enableMarkdown?: boolean
    enableSearch?: boolean
    enableTags?: boolean
    defaultView?: 'list' | 'grid'
  }
  isEditMode: boolean
  onConfigChange?: (config: any) => void
}

export function QuickNotesWidget({ id, config, isEditMode }: QuickNotesWidgetProps) {
  // 설정값
  const maxNotes = config?.maxNotes || 100
  const enableMarkdown = config?.enableMarkdown !== false
  const enableSearch = config?.enableSearch !== false
  const enableTags = config?.enableTags !== false
  const defaultView = config?.defaultView || 'list'

  // 상태
  const [notes, setNotes] = useState<Note[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newNote, setNewNote] = useState({ title: '', content: '', tags: '' })
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(defaultView)

  // 로컬 스토리지 키
  const storageKey = `quick-notes-${id}`

  // 로컬 스토리지에서 노트 불러오기
  useEffect(() => {
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setNotes(parsed.map((note: any) => ({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt)
        })))
      } catch (error) {
        console.error('Failed to load notes:', error)
      }
    }
  }, [storageKey])

  // 노트 저장
  const saveNotes = useCallback((newNotes: Note[]) => {
    localStorage.setItem(storageKey, JSON.stringify(newNotes))
    setNotes(newNotes)
  }, [storageKey])

  // 모든 태그 추출
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    notes.forEach(note => {
      note.tags.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  }, [notes])

  // 필터링된 노트
  const filteredNotes = useMemo(() => {
    let filtered = [...notes]

    // 검색어 필터링
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(note => 
        note.title.toLowerCase().includes(search) ||
        note.content.toLowerCase().includes(search) ||
        note.tags.some(tag => tag.toLowerCase().includes(search))
      )
    }

    // 태그 필터링
    if (selectedTags.length > 0) {
      filtered = filtered.filter(note =>
        selectedTags.every(tag => note.tags.includes(tag))
      )
    }

    // 정렬 (고정된 노트 우선, 최신순)
    return filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return b.updatedAt.getTime() - a.updatedAt.getTime()
    })
  }, [notes, searchTerm, selectedTags])

  // 노트 생성
  const createNote = () => {
    if (!newNote.title.trim() && !newNote.content.trim()) return

    const note: Note = {
      id: Date.now().toString(),
      title: newNote.title.trim() || '제목 없음',
      content: newNote.content.trim(),
      tags: newNote.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean),
      createdAt: new Date(),
      updatedAt: new Date(),
      isPinned: false
    }

    const updatedNotes = [note, ...notes]
    if (updatedNotes.length > maxNotes) {
      updatedNotes.pop()
    }

    saveNotes(updatedNotes)
    setNewNote({ title: '', content: '', tags: '' })
    setIsCreating(false)
  }

  // 노트 수정
  const updateNote = (updatedNote: Note) => {
    const updatedNotes = notes.map(note =>
      note.id === updatedNote.id
        ? { ...updatedNote, updatedAt: new Date() }
        : note
    )
    saveNotes(updatedNotes)
    setEditingNote(null)
  }

  // 노트 삭제
  const deleteNote = (noteId: string) => {
    const updatedNotes = notes.filter(note => note.id !== noteId)
    saveNotes(updatedNotes)
  }

  // 노트 고정 토글
  const togglePin = (noteId: string) => {
    const updatedNotes = notes.map(note =>
      note.id === noteId
        ? { ...note, isPinned: !note.isPinned }
        : note
    )
    saveNotes(updatedNotes)
  }

  // 노트 확장 토글
  const toggleExpanded = (noteId: string) => {
    const newExpanded = new Set(expandedNotes)
    if (newExpanded.has(noteId)) {
      newExpanded.delete(noteId)
    } else {
      newExpanded.add(noteId)
    }
    setExpandedNotes(newExpanded)
  }

  // 태그 선택 토글
  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag))
    } else {
      setSelectedTags([...selectedTags, tag])
    }
  }

  // 마크다운을 간단한 HTML로 변환 (기본적인 변환만)
  const renderContent = (content: string) => {
    if (!enableMarkdown) return content

    let html = content
      .replace(/^### (.+)$/gm, '<h3 class="font-semibold mt-2">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="font-bold mt-3 text-lg">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="font-bold mt-4 text-xl">$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>')
      .replace(/\n/g, '<br />')

    return <div dangerouslySetInnerHTML={{ __html: html }} />
  }

  return (
    <Card className="h-full flex flex-col">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[var(--color-text-secondary)]" />
            <Typography variant="h3">빠른 메모</Typography>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            >
              {viewMode === 'list' ? '그리드' : '리스트'}
            </Button>
            {!isCreating && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCreating(true)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* 검색 바 */}
        {enableSearch && (
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="메모 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[var(--color-brand-primary-start)] focus:border-transparent"
            />
          </div>
        )}

        {/* 태그 필터 */}
        {enableTags && allTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-[var(--color-brand-primary-start)] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Hash className="w-3 h-3" />
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 본문 */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* 새 노트 작성 폼 */}
        {isCreating && (
          <div className="mb-4 p-3 border border-gray-200 rounded-lg bg-gray-50">
            <input
              type="text"
              placeholder="제목"
              value={newNote.title}
              onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
              className="w-full mb-2 px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[var(--color-brand-primary-start)] focus:border-transparent"
            />
            <textarea
              placeholder="내용을 입력하세요..."
              value={newNote.content}
              onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
              className="w-full mb-2 px-3 py-2 border border-gray-200 rounded resize-none h-24 focus:ring-2 focus:ring-[var(--color-brand-primary-start)] focus:border-transparent"
            />
            {enableTags && (
              <input
                type="text"
                placeholder="태그 (쉼표로 구분)"
                value={newNote.tags}
                onChange={(e) => setNewNote({ ...newNote, tags: e.target.value })}
                className="w-full mb-3 px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-[var(--color-brand-primary-start)] focus:border-transparent"
              />
            )}
            <div className="flex gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={createNote}
              >
                <Save className="w-4 h-4 mr-1" />
                저장
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsCreating(false)
                  setNewNote({ title: '', content: '', tags: '' })
                }}
              >
                취소
              </Button>
            </div>
          </div>
        )}

        {/* 노트 목록 */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-3'}>
          {filteredNotes.map(note => (
            <div
              key={note.id}
              className={`p-3 border border-gray-200 rounded-lg bg-white hover:shadow-sm transition-shadow ${
                note.isPinned ? 'border-[var(--color-brand-primary-start)]' : ''
              }`}
            >
              {editingNote?.id === note.id ? (
                // 편집 모드
                <div>
                  <input
                    type="text"
                    value={editingNote.title}
                    onChange={(e) => setEditingNote({ ...editingNote, title: e.target.value })}
                    className="w-full mb-2 px-2 py-1 border border-gray-200 rounded"
                  />
                  <textarea
                    value={editingNote.content}
                    onChange={(e) => setEditingNote({ ...editingNote, content: e.target.value })}
                    className="w-full mb-2 px-2 py-1 border border-gray-200 rounded resize-none h-24"
                  />
                  {enableTags && (
                    <input
                      type="text"
                      value={editingNote.tags.join(', ')}
                      onChange={(e) => setEditingNote({
                        ...editingNote,
                        tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                      })}
                      className="w-full mb-2 px-2 py-1 border border-gray-200 rounded"
                    />
                  )}
                  <div className="flex gap-1">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => updateNote(editingNote)}
                    >
                      저장
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingNote(null)}
                    >
                      취소
                    </Button>
                  </div>
                </div>
              ) : (
                // 뷰 모드
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <button
                        onClick={() => toggleExpanded(note.id)}
                        className="flex items-center gap-1 text-left hover:text-[var(--color-brand-primary-start)]"
                      >
                        {expandedNotes.has(note.id) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                        <Typography variant="h4" className="font-semibold">
                          {note.title}
                        </Typography>
                      </button>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => togglePin(note.id)}
                        className={`p-1 rounded hover:bg-gray-100 ${
                          note.isPinned ? 'text-[var(--color-brand-primary-start)]' : 'text-gray-400'
                        }`}
                        title={note.isPinned ? '고정 해제' : '고정'}
                      >
                        📌
                      </button>
                      <button
                        onClick={() => setEditingNote(note)}
                        className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* 내용 */}
                  {expandedNotes.has(note.id) && (
                    <div className="mb-2">
                      <div className="text-sm text-gray-600">
                        {renderContent(note.content)}
                      </div>
                    </div>
                  )}

                  {/* 태그 */}
                  {enableTags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {note.tags.map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full"
                        >
                          <Hash className="w-3 h-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 메타 정보 */}
                  <div className="text-xs text-gray-400">
                    {note.updatedAt.toLocaleDateString('ko-KR', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 빈 상태 */}
        {filteredNotes.length === 0 && (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <Typography variant="body2" className="text-gray-500">
              {searchTerm || selectedTags.length > 0
                ? '검색 결과가 없습니다'
                : '메모가 없습니다'}
            </Typography>
            {!searchTerm && selectedTags.length === 0 && (
              <Typography variant="caption" className="text-gray-400 mt-1">
                + 버튼을 눌러 새 메모를 작성하세요
              </Typography>
            )}
          </div>
        )}
      </div>

      {/* 하단 정보 */}
      <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>{filteredNotes.length}개의 메모</span>
          {enableTags && <span>{allTags.length}개의 태그</span>}
        </div>
      </div>
    </Card>
  )
}

export default QuickNotesWidget