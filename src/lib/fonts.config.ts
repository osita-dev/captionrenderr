// ─── Single Source of Truth for All Fonts ───
// To add a new font: drop the file in backend/assets/fonts/ and frontend/public/fonts/,
// then add one entry below. Everything else is auto-generated.

export interface FontConfig {
  name: string;        // Font family name (used in CSS and presets)
  file: string;        // Font file name (in assets/fonts/ and public/fonts/)
  color: string;       // Default text color
  size: number;        // Default font size
  highlightColor?: string;  // Optional highlight color for key words
  highlightWords?: boolean; // Whether to highlight key words
}

export const FONTS: FontConfig[] = [
  // ─── Custom Fonts ───
  { name: 'Catchye', file: 'Catchye.otf', color: '#ffffff', size: 30 },
  { name: 'Caviar Dreams', file: 'CaviarDreams.ttf', color: '#ffffff', size: 26 },
  { name: 'Stretch Pro', file: 'StretchPro.otf', color: '#ffffff', size: 32 },
  { name: 'TS Block', file: 'TS Block Bold.ttf', color: '#ffffff', size: 30 },
  { name: 'Designer', file: 'Designer.otf', color: '#ffffff', size: 30 },
];

// ─── System Font Presets (no custom font file needed) ───
export interface SystemPreset {
  id: string;
  name: string;
  fontFamily: string;
  color: string;
  size: number;
  highlightColor?: string;
  highlightWords?: boolean;
}

export const SYSTEM_PRESETS: SystemPreset[] = [
  { id: 'popline', name: 'Popline', fontFamily: 'Arial', color: '#ffffff', size: 28, highlightColor: '#8b5cf6', highlightWords: true },
  { id: 'deep-diver', name: 'Deep Diver', fontFamily: 'Arial', color: '#ffffff', size: 26 },
  { id: 'mozi', name: 'Mozi', fontFamily: 'Impact', color: '#ffffff', size: 32 },
  { id: 'playfair', name: 'Playfair', fontFamily: 'Georgia', color: '#ffffff', size: 26 },
  { id: 'beasty', name: 'Beasty', fontFamily: 'Arial Black', color: '#ffffff', size: 30, highlightColor: '#22c55e', highlightWords: true },
  { id: 'spell', name: 'Spell', fontFamily: 'Arial', color: '#ffffff', size: 28, highlightColor: '#a855f7', highlightWords: true },
  { id: 'youshaei', name: 'Youshaei', fontFamily: 'Arial', color: '#14b8a6', size: 28 },
  { id: 'noah', name: 'Noah', fontFamily: 'Helvetica', color: '#ffffff', size: 26 },
];
