// ─── Shared Types (Frontend ↔ Backend) ───

export interface VideoJob {
  id: string;
  fileName: string;
  fileSize: number;
  duration: number;
  status: 'uploading' | 'transcribing' | 'ready' | 'rendering' | 'completed' | 'error';
  progress: number;
  createdAt: string;
  error?: string;
}

export interface WordTimestamp {
  id: string;
  startTime: number; // seconds
  endTime: number;   // seconds
  text: string;
}

export interface CaptionStyle {
  fontFamily: string;
  baseFontSize: number;
  fontColor: string;
  backgroundColor: string;
  positionMode: 'preset' | 'free';
  presetPosition: 'bottom' | 'top' | 'middle';
  positionX: number;
  positionY: number;
  autoFontSize: boolean;
  wordsPerCaption: number; // 1-4, how many words to show at once
}

export interface VideoDimensions {
  width: number;
  height: number;
  aspectRatio: number;
  orientation: 'landscape' | 'portrait' | 'square';
}
