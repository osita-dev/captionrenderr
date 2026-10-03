import { useRef, useState, useEffect, useCallback, forwardRef, useMemo } from 'react';
import type { WordTimestamp, CaptionStyle, VideoDimensions } from '../lib/types';
import { groupWords } from '../lib/grouping';

interface VideoPreviewProps {
  videoUrl?: string;
  words: WordTimestamp[];
  style: CaptionStyle;
  onStyleChange: (style: Partial<CaptionStyle>) => void;
  onTimeUpdate?: (time: number) => void;
  onReady?: (duration: number) => void;
}

export const VideoPreview = forwardRef<HTMLVideoElement, VideoPreviewProps>(({
  videoUrl,
  words,
  style,
  onStyleChange,
  onTimeUpdate,
  onReady,
}, ref) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [dimensions, setDimensions] = useState<VideoDimensions | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // ✅ One-time ref setup — never changes
  const setVideoRef = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (!ref) return;
    if (typeof ref === 'function') ref(el);
    else (ref as React.MutableRefObject<HTMLVideoElement | null>).current = el;
  }, [ref]);

  // ✅ Load metadata — stable deps
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    const handleLoaded = () => {
      const w = video.videoWidth || 1920;
      const h = video.videoHeight || 1080;
      const ratio = w / h;
      let orientation: VideoDimensions['orientation'] = 'square';
      if (ratio > 1.3) orientation = 'landscape';
      else if (ratio < 0.8) orientation = 'portrait';

      setDimensions({ width: w, height: h, aspectRatio: ratio, orientation });
      onReady?.(video.duration || 30);
    };

    video.addEventListener('loadedmetadata', handleLoaded);
    return () => video.removeEventListener('loadedmetadata', handleLoaded);
  }, [videoUrl, onReady]);

  // ✅ Time updates — stable
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handler = () => {
      const t = video.currentTime;
      setCurrentTime(t);
      onTimeUpdate?.(t);
    };
    video.addEventListener('timeupdate', handler);
    return () => video.removeEventListener('timeupdate', handler);
  }, [onTimeUpdate]);

  // Auto font size
  const effectiveFontSize = useCallback(() => {
    if (!style.autoFontSize || !dimensions) return style.baseFontSize;
    const scaleFactor = Math.min(1, dimensions.aspectRatio / 1.5);
    return Math.max(12, Math.round(style.baseFontSize * scaleFactor));
  }, [style, dimensions]);

  // Group words by phrase for display
  const captionGroups = useMemo(() => groupWords(words, style.wordsPerCaption), [words, style.wordsPerCaption]);

  // Find the active group at current time
  const activeGroup = captionGroups.find(
    g => currentTime >= g.startTime && currentTime <= g.endTime
  );
  const displayText = activeGroup?.text || '';

  // Position styles
  const getPositionStyles = (): React.CSSProperties => {
    if (style.positionMode === 'free') {
      return { left: `${style.positionX}%`, top: `${style.positionY}%`, transform: 'translate(-50%, -50%)' };
    }
    switch (style.presetPosition) {
      case 'top': return { top: '8%', left: '50%', transform: 'translateX(-50%)' };
      case 'middle': return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
      case 'bottom':
      default: return { bottom: '8%', left: '50%', transform: 'translateX(-50%)' };
    }
  };

  // Drag handlers
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (style.positionMode !== 'free') return;
    setIsDragging(true);
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const capX = (style.positionX / 100) * rect.width;
    const capY = (style.positionY / 100) * rect.height;
    dragOffset.current = { x: clientX - rect.left - capX, y: clientY - rect.top - capY };
  };

  const handleDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    let x = ((clientX - rect.left - dragOffset.current.x) / rect.width) * 100;
    let y = ((clientY - rect.top - dragOffset.current.y) / rect.height) * 100;
    x = Math.max(5, Math.min(95, x));
    y = Math.max(5, Math.min(95, y));
    onStyleChange({ positionX: x, positionY: y });
  }, [isDragging, onStyleChange]);

  const handleDragEnd = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDragMove);
      window.addEventListener('touchend', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleDragMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleDragMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  const fontSize = effectiveFontSize();
  const posStyles = getPositionStyles();

  return (
    <div ref={containerRef} className="relative w-full aspect-video bg-black rounded-lg overflow-hidden select-none">
      {videoUrl ? (
        <video
          ref={setVideoRef}
          src={videoUrl}
          controls
          className="w-full h-full object-contain"
          playsInline
          preload="metadata"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-slate-400">
          Video preview will appear here
        </div>
      )}

      {displayText && (
        <div
          className={`absolute px-4 py-2 rounded text-center max-w-[90%] ${
            style.positionMode === 'free' ? 'cursor-move border border-dashed border-white/40' : ''
          } ${isDragging ? 'opacity-80' : ''}`}
          style={{
            ...posStyles,
            fontFamily: style.fontFamily,
            fontSize: `${fontSize}px`,
            color: style.fontColor,
            backgroundColor: style.backgroundColor || 'rgba(0,0,0,0.7)',
            transition: isDragging ? 'none' : 'all 0.15s ease',
          }}
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
        >
          {displayText}
        </div>
      )}

      {dimensions && (
        <div className="absolute bottom-2 right-2 text-xs text-white/60 bg-black/40 px-2 py-1 rounded">
          {dimensions.orientation === 'portrait' ? '📱 Portrait' :
           dimensions.orientation === 'landscape' ? '🖥️ Landscape' : '⬜ Square'}
          {style.autoFontSize && ` · ${fontSize}px`}
        </div>
      )}
    </div>
  );
});

VideoPreview.displayName = 'VideoPreview';