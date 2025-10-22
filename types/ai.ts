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