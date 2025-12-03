export enum Tab {
  CREATION = 'CREATION',
  PRODUCT = 'PRODUCT',
  VIDEO_EXTRACT = 'VIDEO_EXTRACT'
}

export interface ProductAnalysis {
  productName: string;
  description: string;
  recommendedReasons: string[];
}

export interface GeneratedImageResult {
  mimeType: string;
  data: string; // base64
}

export interface ViralPost {
  id: number;
  title: string;
  author: string;
  likes: string; // e.g. "1.2w", "8k"
  visualDescription: string; // For generating preview/final image
  originalContent: string; // For remix context
}

export interface OptimizedContent {
  title: string;
  content: string;
}

export interface RemixVariation {
  title: string;
  content: string;
}

export interface ScriptScene {
  scene: string;
  visual: string;
  audio: string;
  duration: string;
}

export interface VideoRemixResult {
  transcript: string; // The verbatim extracted text
  remixVariations: RemixVariation[]; // Array of 10 generated viral variations
  visualPrompt: string; // Prompt for generating a matching background video
}
