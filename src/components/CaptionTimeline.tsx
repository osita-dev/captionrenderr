import { useState, useRef, useEffect } from 'react';
import type { WordTimestamp } from '../lib/types';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Check, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';

interface CaptionTimelineProps {
  words: WordTimestamp[];
  currentTime: number;
  videoDuration: number;
  onSeek: (time: number) => void;
  onChange: (words: WordTimestamp[]) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

export function CaptionTimeline({
  words,
  currentTime,
  videoDuration,
  onSeek,
  onChange,
  isPlaying,
  onTogglePlay,
}: CaptionTimelineProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll timeline to keep current word visible
  useEffect(() => {
    if (!containerRef.current || !editingId) {
      const activeWord = containerRef.current?.querySelector('[data-active="true"]');
      activeWord?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [currentTime, editingId]);

  const isWordActive = (word: WordTimestamp) =>
    currentTime >= word.startTime && currentTime <= word.endTime;

  const startEdit = (word: WordTimestamp) => {
    setEditingId(word.id);
    setEditText(word.text);
  };

  const confirmEdit = (id: string) => {
    if (!editText.trim()) return;
    onChange(words.map(w => w.id === id ? { ...w, text: editText.trim() } : w));
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') confirmEdit(id);
    if (e.key === 'Escape') cancelEdit();
  };

  // Jump to word's start time
  const handleWordClick = (word: WordTimestamp) => {
    if (editingId) return;
    onSeek(word.startTime);
  };

  // Pagination for readability
  const wordsPerPage = 25;
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(words.length / wordsPerPage);
  const displayedWords = words.slice(page * wordsPerPage, (page + 1) * wordsPerPage);

  return (
    <div className="space-y-3">
      {/* Timeline ruler + playhead */}
      <div className="relative bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
        {/* Time scale */}
        <div className="flex justify-between text-xs text-slate-500 mb-2 px-1">
          <span>0:00</span>
          <span>{Math.floor(videoDuration / 60)}:{String(Math.floor(videoDuration % 60)).padStart(2, '0')}</span>
        </div>

        {/* Playhead position bar */}
        <div className="relative h-10 bg-slate-200 dark:bg-slate-700 rounded overflow-hidden">
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-primary z-10 pointer-events-none"
            style={{ left: `${Math.min(100, (currentTime / videoDuration) * 100)}%` }}
          />
          
          {/* Word blocks on timeline */}
          {words.map((word) => {
            const left = (word.startTime / videoDuration) * 100;
            const width = Math.max(1.5, ((word.endTime - word.startTime) / videoDuration) * 100);
            const active = isWordActive(word);
            return (
              <button
                key={word.id}
                data-active={active}
                onClick={() => handleWordClick(word)}
                className={`absolute top-1 bottom-1 rounded text-xs px-1 truncate transition-all ${
                  active
                    ? 'bg-primary text-white font-medium shadow-md'
                    : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500 text-slate-800 dark:text-slate-100'
                } ${editingId === word.id ? 'ring-2 ring-primary' : ''}`}
                style={{ left: `${left}%`, width: `${width}%` }}
                title={word.text}
              >
                {width > 5 ? word.text : ''}
              </button>
            );
          })}
        </div>
      </div>

      {/* Word-by-word editable list */}
      <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={onTogglePlay} className="h-8 w-8 p-0">
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <span className="text-sm font-medium">Transcript</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="h-7 w-7 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs text-slate-500">{page + 1} / {totalPages || 1}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="h-7 w-7 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Editable words flow */}
        <div
          ref={containerRef}
          className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2"
        >
          {displayedWords.map((word) => {
            const active = isWordActive(word);
            const isEditing = editingId === word.id;

            return (
              <div key={word.id} className="relative group">
                {isEditing ? (
                  <div className="flex items-center gap-1">
                    <Input
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onBlur={() => confirmEdit(word.id)}
                      onKeyDown={(e) => handleKeyDown(e, word.id)}
                      autoFocus
                      className="w-24 h-8 text-sm px-2 py-1"
                    />
                    <Button size="sm" variant="ghost" onClick={() => confirmEdit(word.id)} className="h-8 w-8 p-0">
                      <Check className="w-4 h-4 text-green-500" />
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleWordClick(word)}
                    onDoubleClick={() => startEdit(word)}
                    className={`px-2 py-1 rounded text-sm transition-all ${
                      active
                        ? 'bg-primary text-white font-medium shadow-md scale-105'
                        : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100'
                    }`}
                  >
                    {word.text}
                    <span className="block text-[10px] opacity-60 mt-0.5">
                      {word.startTime.toFixed(1)}s
                    </span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-slate-400 mt-3">
          💡 Click a word to jump there • Double-click to edit • Timeline above shows full alignment
        </p>
      </div>
    </div>
  );
}