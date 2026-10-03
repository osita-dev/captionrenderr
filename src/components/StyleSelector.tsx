import { STYLE_PRESETS } from '../lib/presets';
import type { StylePreset } from '../lib/presets';
import { cn } from '../lib/utils';

interface StyleSelectorProps {
  selectedStyleId: string;
  onSelectStyle: (preset: StylePreset) => void;
  sampleText?: string;
}

export function StyleSelector({ selectedStyleId, onSelectStyle, sampleText = 'One small step for a man' }: StyleSelectorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-white/80">Choose a style</h3>
      <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
        {STYLE_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onSelectStyle(preset)}
            className={cn(
              'group relative rounded-xl p-4 text-left transition-all duration-200',
              'bg-zinc-900 border-2',
              selectedStyleId === preset.id
                ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                : 'border-zinc-800 hover:border-zinc-700'
            )}
          >
            {/* Style preview */}
            <div className="mb-3 rounded-lg bg-zinc-950 p-3 min-h-[60px] flex items-center justify-center">
              <span
                style={{
                  fontFamily: preset.style.fontFamily,
                  fontSize: '14px',
                  color: preset.style.fontColor,
                  backgroundColor: preset.style.backgroundColor,
                  fontWeight: preset.style.fontFamily.includes('Black') || preset.style.fontFamily.includes('Impact') ? 'bold' : 'normal',
                  fontStyle: preset.style.fontFamily.includes('Georgia') ? 'italic' : 'normal',
                  padding: '4px 8px',
                  borderRadius: '4px',
                }}
              >
                {preset.highlightColor ? (
                  <>
                    One small{' '}
                    <span style={{ color: preset.highlightColor }}>step</span>
                  </>
                ) : (
                  sampleText
                )}
              </span>
            </div>
            {/* Style name */}
            <p className="text-xs font-medium text-white/70">{preset.name}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
