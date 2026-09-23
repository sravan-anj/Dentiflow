export type BackgroundFitMode = 'cover' | 'contain' | 'repeat';
export type BackgroundBlur = 'none' | 'sm' | 'md' | 'lg';
export type BackgroundTint = 'navy' | 'cyan' | 'dark' | 'light' | 'none';

export interface BackgroundPreset {
  id: string;
  name: string;
  description: string;
  source: string; // URL or data URL
  fallbackSvg?: string;
  tag: string;
  isVideo?: boolean;
}

export interface BackgroundConfig {
  activeId: string;
  activeUrl: string;
  fitMode: BackgroundFitMode;
  dimming: number; // 0 to 100 percentage
  blur: BackgroundBlur;
  tint: BackgroundTint;
  customUploads: {
    id: string;
    name: string;
    dataUrl: string;
    dateAdded: string;
  }[];
}
