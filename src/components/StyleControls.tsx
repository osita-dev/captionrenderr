import type { CaptionStyle } from '../lib/types';
import { Card } from './ui/card';
import { Slider } from './ui/slider';
import { Button } from './ui/button';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { Move, Lock } from 'lucide-react';

interface StyleControlsProps {
  style: CaptionStyle;
  onChange: (style: Partial<CaptionStyle>) => void;
}

export function StyleControls({ style, onChange }: StyleControlsProps) {
  const update = <K extends keyof CaptionStyle>(key: K, value: CaptionStyle[K]) => {
    onChange({ [key]: value });
  };

  const setPreset = (pos: CaptionStyle['presetPosition']) => {
    onChange({
      positionMode: 'preset',
      presetPosition: pos,
    });
  };

  const enableFreeDrag = () => {
    onChange({
      positionMode: 'free',
      ...(style.positionMode === 'preset' && {
        positionX: 50,
        positionY: style.presetPosition === 'top' ? 12 : style.presetPosition === 'middle' ? 50 : 88,
      }),
    });
  };

  return (
    <Card className="p-4 space-y-5">
      <h3 className="font-semibold">Caption Style</h3>

      {/* Position Mode */}
      <div className="space-y-2">
        <label className="text-sm text-slate-500">Position</label>
        {style.positionMode === 'preset' ? (
          <ToggleGroup type="single" value={style.presetPosition} onValueChange={(v) => v && setPreset(v as any)}>
            <ToggleGroupItem value="top">Top</ToggleGroupItem>
            <ToggleGroupItem value="middle">Middle</ToggleGroupItem>
            <ToggleGroupItem value="bottom">Bottom</ToggleGroupItem>
          </ToggleGroup>
        ) : (
          <div className="text-sm text-slate-600 bg-primary/5 p-2 rounded flex items-center gap-2">
            <Move className="w-4 h-4 text-primary" />
            Drag directly on video
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs mt-1"
          onClick={style.positionMode === 'preset' ? enableFreeDrag : () => update('positionMode', 'preset')}
        >
          {style.positionMode === 'preset' ? <Move className="w-3.5 h-3.5 mr-1.5" /> : <Lock className="w-3.5 h-3.5 mr-1.5" />}
          {style.positionMode === 'preset' ? 'Enable free drag' : 'Use presets'}
        </Button>
      </div>

      {/* Font Size */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm text-slate-500">Base Font Size</label>
          <span className="text-sm font-medium">{style.baseFontSize}px</span>
        </div>
        <Slider
          value={[style.baseFontSize]}
          min={14}
          max={42}
          step={2}
          onValueChange={([v]) => update('baseFontSize', v)}
        />
        <label className="flex items-center gap-2 text-sm cursor-pointer mt-1">
          <input
            type="checkbox"
            checked={style.autoFontSize}
            onChange={(e) => update('autoFontSize', e.target.checked)}
            className="accent-primary"
          />
          Auto-adjust for video orientation
        </label>
      </div>

      {/* Colors */}
      <div className="space-y-3">
        <div>
          <label className="text-sm text-slate-500 block mb-1">Text Color</label>
          <input
            type="color"
            value={style.fontColor}
            onChange={(e) => update('fontColor', e.target.value)}
            className="w-full h-10 rounded cursor-pointer border-0"
          />
        </div>
        <div>
          <label className="text-sm text-slate-500 block mb-1">Background</label>
          <input
            type="color"
            value={style.backgroundColor}
            onChange={(e) => update('backgroundColor', e.target.value)}
            className="w-full h-10 rounded cursor-pointer border-0"
          />
        </div>
      </div>
    </Card>
  );
}