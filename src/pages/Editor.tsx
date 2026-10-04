import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { VideoPreview } from '../components/VideoPreview';
import { CaptionTimeline } from '../components/CaptionTimeline';
import { StyleSelector } from '../components/StyleSelector';
import { Button } from '../components/ui/button';
import { Slider } from '../components/ui/slider';
import { ToggleGroup, ToggleGroupItem } from '../components/ui/toggle-group';
import { STYLE_PRESETS } from '../lib/presets';
import type { StylePreset } from '../lib/presets';
import type { WordTimestamp, CaptionStyle } from '../lib/types';
import { ChevronDown, ChevronUp } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://captionrender-production.up.railway.app/api';

export default function Editor() {
  const location = useLocation();
  const navigate = useNavigate();
  const { jobId, fileName } = location.state || {};
  const videoRef = useRef<HTMLVideoElement>(null);

  const videoUrl = jobId ? `${API_BASE}/video/${jobId}` : undefined;

  const [words, setWords] = useState<WordTimestamp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<StylePreset>(STYLE_PRESETS[0]);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const [isStylesOpen, setIsStylesOpen] = useState(true);

  const [style, setStyle] = useState<CaptionStyle>(STYLE_PRESETS[0].style);

  // Load transcription with progress tracking
  useEffect(() => {
    if (!jobId) {
      navigate('/');
      return;
    }

    let attempt = 0;
    const maxAttempts = 600;

    const poll = async () => {
      try {
        const res = await fetch(`${API_BASE}/transcribe/${jobId}`);
        if (!res.ok) throw new Error('Transcribe check failed');

        const data = await res.json();

        if (data.status === 'ready') {
          setWords(data.words);
          if (data.duration > 0) setVideoDuration(data.duration);
          setIsLoading(false);
          return;
        }
        if (data.status === 'error') {
          throw new Error(data.error || 'Transcription failed');
        }

        attempt++;
        setProgress(Math.min(95, Math.round((attempt / maxAttempts) * 100)));

        if (attempt >= maxAttempts) {
          throw new Error('Transcription timed out');
        }

        setTimeout(poll, 1000);
      } catch (err) {
        console.error('Transcription failed:', err);
        setLoadError(err instanceof Error ? err.message : 'Failed to load captions');
        setIsLoading(false);
      }
    };

    poll();
  }, [jobId, navigate]);

  const handleStyleChange = (updates: Partial<CaptionStyle>) => {
    setStyle(prev => ({ ...prev, ...updates }));
  };

  const handlePresetSelect = (preset: StylePreset) => {
    setSelectedPreset(preset);
    setStyle(preset.style);
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleTogglePlay = async () => {
    if (!videoRef.current) return;
    try {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        await videoRef.current.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.log('Playback blocked:', err);
    }
  };

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  const handleVideoReady = (duration: number) => {
    if (duration > 0 && duration !== videoDuration) {
      setVideoDuration(duration);
    }
  };

  const handleRender = () => {
    navigate('/download', { state: { jobId, fileName, words, style } });
  };

  if (!jobId) return null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold">Edit Captions</h1>
            <p className="text-sm text-zinc-500 mt-1">{fileName}</p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
          >
            ← New Video
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-16 space-y-4">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-lg font-medium">Generating captions...</p>
            <p className="text-sm text-zinc-500">Whisper AI is processing your video</p>
            <div className="max-w-md mx-auto">
              <div className="w-full bg-zinc-800 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-zinc-500 mt-1">{progress}% — this may take a few minutes</p>
            </div>
          </div>
        ) : loadError ? (
          <div className="text-center py-16 space-y-3">
            <p className="text-lg text-red-500 font-medium">⚠️ {loadError}</p>
            <Button onClick={() => navigate('/')}>Try Another Video</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-4">
              <VideoPreview
                ref={videoRef}
                videoUrl={videoUrl}
                words={words}
                style={style}
                onStyleChange={handleStyleChange}
                onTimeUpdate={handleTimeUpdate}
                onReady={handleVideoReady}
              />

              <CaptionTimeline
                words={words}
                currentTime={currentTime}
                videoDuration={videoDuration}
                onSeek={handleSeek}
                onChange={setWords}
                isPlaying={isPlaying}
                onTogglePlay={handleTogglePlay}
              />

              <Button
                onClick={handleRender}
                size="lg"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Render & Download Video
              </Button>
            </div>

            {/* Sidebar - Style Selector + Customize */}
            <div className="space-y-4">
              {/* Collapsible Styles Section */}
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                <button
                  onClick={() => setIsStylesOpen(!isStylesOpen)}
                  className="w-full flex items-center justify-between p-4 text-sm font-medium text-white/80 hover:bg-zinc-800/50 transition-colors"
                >
                  <span>Styles</span>
                  {isStylesOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {isStylesOpen && (
                  <div className="p-4 pt-0 border-t border-zinc-800">
                    <StyleSelector
                      selectedStyleId={selectedPreset.id}
                      onSelectStyle={handlePresetSelect}
                    />
                  </div>
                )}
              </div>

              {/* Collapsible Customize Section */}
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                <button
                  onClick={() => setIsCustomizeOpen(!isCustomizeOpen)}
                  className="w-full flex items-center justify-between p-4 text-sm font-medium text-white/80 hover:bg-zinc-800/50 transition-colors"
                >
                  <span>Customize</span>
                  {isCustomizeOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {isCustomizeOpen && (
                  <div className="p-4 pt-0 space-y-4 border-t border-zinc-800">
                    {/* Text Color */}
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-400">Text Color</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={style.fontColor}
                          onChange={(e) => handleStyleChange({ fontColor: e.target.value })}
                          className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <span className="text-xs text-zinc-500 font-mono">{style.fontColor}</span>
                      </div>
                    </div>

                    {/* Background Color */}
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-400">Background</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={style.backgroundColor.startsWith('#') ? style.backgroundColor : '#000000'}
                          onChange={(e) => handleStyleChange({ backgroundColor: e.target.value })}
                          className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <span className="text-xs text-zinc-500 font-mono">{style.backgroundColor}</span>
                      </div>
                    </div>

                    {/* Font Size */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-zinc-400">Font Size</label>
                        <span className="text-xs text-zinc-500">{style.baseFontSize}px</span>
                      </div>
                      <Slider
                        value={[style.baseFontSize]}
                        min={14}
                        max={48}
                        step={2}
                        onValueChange={([v]) => handleStyleChange({ baseFontSize: v })}
                        className="w-full"
                      />
                    </div>

                    {/* Words Per Caption */}
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-400">Words Per Caption</label>
                      <ToggleGroup
                        type="single"
                        value={String(style.wordsPerCaption)}
                        onValueChange={(v) => handleStyleChange({ wordsPerCaption: parseInt(v) })}
                        className="w-full"
                      >
                        <ToggleGroupItem value="1" className="flex-1 text-xs">1</ToggleGroupItem>
                        <ToggleGroupItem value="2" className="flex-1 text-xs">2</ToggleGroupItem>
                        <ToggleGroupItem value="3" className="flex-1 text-xs">3</ToggleGroupItem>
                        <ToggleGroupItem value="4" className="flex-1 text-xs">4</ToggleGroupItem>
                      </ToggleGroup>
                      <p className="text-xs text-zinc-500">
                        {style.wordsPerCaption === 1 ? 'Single word at a time' : `${style.wordsPerCaption} words grouped by phrase`}
                      </p>
                    </div>

                    {/* Position */}
                    <div className="space-y-2">
                      <label className="text-xs text-zinc-400">Position</label>
                      <ToggleGroup
                        type="single"
                        value={style.positionMode === 'free' ? 'free' : style.presetPosition}
                        onValueChange={(v) => {
                          if (v === 'free') {
                            handleStyleChange({ positionMode: 'free' });
                          } else {
                            handleStyleChange({ positionMode: 'preset', presetPosition: v as 'top' | 'middle' | 'bottom' });
                          }
                        }}
                        className="w-full"
                      >
                        <ToggleGroupItem value="top" className="flex-1 text-xs">Top</ToggleGroupItem>
                        <ToggleGroupItem value="middle" className="flex-1 text-xs">Middle</ToggleGroupItem>
                        <ToggleGroupItem value="bottom" className="flex-1 text-xs">Bottom</ToggleGroupItem>
                        <ToggleGroupItem value="free" className="flex-1 text-xs">Drag</ToggleGroupItem>
                      </ToggleGroup>
                      {style.positionMode === 'free' && (
                        <p className="text-xs text-zinc-500">Drag the caption on the video to position it</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
