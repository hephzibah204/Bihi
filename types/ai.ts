// types/ai.ts
// Type definitions for AI services

export interface AIRequest {
  prompt: string;
  context?: string;
  type?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIResponse {
  content: string;
  isOnline: boolean;
  error?: string;
  fallbackReason?: string;
  notification?: AINotification;
}

export interface AINotification {
  type: 'info' | 'warning' | 'error';
  title: string;
  message: string;
}

export interface AIStreamChunk {
  text: string;
  isComplete: boolean;
}

export type AINotificationCallback = (notification: AINotification) => void;

// Legacy support
export type AIGenerateFunction = (prompt: string | AIRequest, context?: string) => Promise<string>;
export type AIStreamFunction = (prompt: string | AIRequest, onChunk: (chunk: string) => void) => Promise<void>;

// Simulation metadata for PhET and similar providers
export interface AiSimulation {
  id: string;               // e.g., "ohms-law"
  title: string;
  subject?: string;         // physics, chemistry, etc.
  description?: string;
  keywords?: string[];
  url: string;              // embeddable HTML5 url
  image_url?: string;       // screenshot/thumbnail
  languages?: string[];
  provider?: string;        // default 'PhET'
  updated_at?: string;      // ISO string
}

export interface AiSimulationSearchResult extends AiSimulation {
  score?: number;           // optional relevance score
}