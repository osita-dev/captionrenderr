import type { CaptionStyle } from './types';
import { FONTS, SYSTEM_PRESETS } from './fonts.config';

export interface StylePreset {
  id: string;
  name: string;
  style: CaptionStyle;
  animation: 'none' | 'pop' | 'slide' | 'fade' | 'bounce' | 'glow';
  highlightColor?: string;
  highlightWords?: boolean;
}

// Generate presets from config
export const STYLE_PRESETS: StylePreset[] = [
  // Custom font presets
  ...FONTS.map((font) => ({
    id: font.name.toLowerCase().replace(/\s+/g, '-'),
    name: font.name,
    style: {
      fontFamily: font.name,
      baseFontSize: font.size,
      fontColor: font.color,
      backgroundColor: 'rgba(0,0,0,0)',
      positionMode: 'preset' as const,
      presetPosition: 'bottom' as const,
      positionX: 50,
      positionY: 88,
      autoFontSize: true,
      wordsPerCaption: 2,
    },
    animation: 'pop' as const,
    highlightColor: font.highlightColor,
    highlightWords: font.highlightWords,
  })),
  // System font presets
  ...SYSTEM_PRESETS.map((preset) => ({
    id: preset.id,
    name: preset.name,
    style: {
      fontFamily: preset.fontFamily,
      baseFontSize: preset.size,
      fontColor: preset.color,
      backgroundColor: 'rgba(0,0,0,0)',
      positionMode: 'preset' as const,
      presetPosition: 'bottom' as const,
      positionX: 50,
      positionY: 88,
      autoFontSize: true,
      wordsPerCaption: 2,
    },
    animation: 'pop' as const,
    highlightColor: preset.highlightColor,
    highlightWords: preset.highlightWords,
  })),
];
