export interface Scene {
  sceneNumber: number;
  title: string;
  narrativeScript: string;
  visualPrompt: string;
  cameraShot: string;
}

export interface StoryboardData {
  title: string;
  artStyle: string;
  scenes: Scene[];
}

export type ImageResolution = '1K' | '2K' | '4K';

export interface GeneratedImage {
  sceneNumber: number;
  imageUrl: string;
  isLoading: boolean;
  error?: string;
}

export interface SelectionBox {
  startX: number;
  startY: number;
  width: number;
  height: number;
}
