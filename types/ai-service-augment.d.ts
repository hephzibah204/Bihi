// Type augmentations to tolerate broader AI service usage across the app

// Common relative paths used by components to import the AI service
declare module 'services/geminiAIService' {
  export function generateResponse(prompt: any, ...args: any[]): Promise<string>;
  export function generateReport(prompt: any, ...args: any[]): Promise<string>;
  export function generateAnnouncement(prompt: any, ...args: any[]): Promise<string>;
  export function generateLessonPlan(prompt: any, ...args: any[]): Promise<string>;
}
declare module '../services/geminiAIService' {
  export function generateResponse(prompt: any, ...args: any[]): Promise<string>;
  export function generateReport(prompt: any, ...args: any[]): Promise<string>;
  export function generateAnnouncement(prompt: any, ...args: any[]): Promise<string>;
  export function generateLessonPlan(prompt: any, ...args: any[]): Promise<string>;
}
declare module '../../services/geminiAIService' {
  export function generateResponse(prompt: any, ...args: any[]): Promise<string>;
  export function generateReport(prompt: any, ...args: any[]): Promise<string>;
  export function generateAnnouncement(prompt: any, ...args: any[]): Promise<string>;
  export function generateLessonPlan(prompt: any, ...args: any[]): Promise<string>;
}

// Provide generateText alias on HuggingFace client typings used in various places
declare module 'services/huggingFaceAPI' {
  export interface HuggingFaceClient {
    generate: (prompt: any, ...args: any[]) => Promise<string>;
    generateEducationalContent?: (prompt: any, ...args: any[]) => Promise<string>;
    generateText?: (prompt: any, ...args: any[]) => Promise<string>;
  }
  export function getHuggingFaceClient(): HuggingFaceClient;
}
declare module '../services/huggingFaceAPI' {
  export interface HuggingFaceClient {
    generate: (prompt: any, ...args: any[]) => Promise<string>;
    generateEducationalContent?: (prompt: any, ...args: any[]) => Promise<string>;
    generateText?: (prompt: any, ...args: any[]) => Promise<string>;
  }
  export function getHuggingFaceClient(): HuggingFaceClient;
}
declare module '../../services/huggingFaceAPI' {
  export interface HuggingFaceClient {
    generate: (prompt: any, ...args: any[]) => Promise<string>;
    generateEducationalContent?: (prompt: any, ...args: any[]) => Promise<string>;
    generateText?: (prompt: any, ...args: any[]) => Promise<string>;
  }
  export function getHuggingFaceClient(): HuggingFaceClient;
}

// Type augmentations to tolerate broader AI service usage across the app

// Common relative paths used by components to import the AI service
declare module 'services/geminiAIService' {
  export function generateResponse(prompt: any, ...args: any[]): any;
  export function generateReport(prompt: any, ...args: any[]): any;
  export function generateAnnouncement(prompt: any, ...args: any[]): any;
  export function generateLessonPlan(prompt: any, ...args: any[]): any;
}
declare module '../services/geminiAIService' {
  export function generateResponse(prompt: any, ...args: any[]): any;
  export function generateReport(prompt: any, ...args: any[]): any;
  export function generateAnnouncement(prompt: any, ...args: any[]): any;
  export function generateLessonPlan(prompt: any, ...args: any[]): any;
}
declare module '../../services/geminiAIService' {
  export function generateResponse(prompt: any, ...args: any[]): any;
  export function generateReport(prompt: any, ...args: any[]): any;
  export function generateAnnouncement(prompt: any, ...args: any[]): any;
  export function generateLessonPlan(prompt: any, ...args: any[]): any;
}

// Provide generateText alias on HuggingFace client typings used in various places
declare module 'services/huggingFaceAPI' {
  export interface HuggingFaceClient {
    generate: (prompt: any, ...args: any[]) => Promise<string>;
    generateEducationalContent?: (prompt: any, ...args: any[]) => Promise<string>;
    generateText?: (prompt: any, ...args: any[]) => Promise<string>;
  }
  export function getHuggingFaceClient(): HuggingFaceClient;
}
declare module '../services/huggingFaceAPI' {
  export interface HuggingFaceClient {
    generate: (prompt: any, ...args: any[]) => Promise<string>;
    generateEducationalContent?: (prompt: any, ...args: any[]) => Promise<string>;
    generateText?: (prompt: any, ...args: any[]) => Promise<string>;
  }
  export function getHuggingFaceClient(): HuggingFaceClient;
}
