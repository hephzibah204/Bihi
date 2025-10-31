// services/bananaImageService.ts
// Image generation via Banana.dev with safe fallbacks

import { logger } from '../utils/logger';

export interface ImageGenOptions {
  size?: { width: number; height: number } | string; // e.g., "512x512"
  steps?: number;
  cfgScale?: number;
  seed?: number;
}

export interface ImageGenResult {
  imageUrl: string;
  model: string;
  provider: 'banana' | 'huggingface' | 'placeholder';
}

function getEnv(key: string): string | undefined {
  // Prefer Vite public env if present
  const viteVal = (typeof import.meta !== 'undefined' && (import.meta as any)?.env?.[key]) || undefined;
  if (viteVal) return viteVal as string;
  // Next-style/public env
  const nextVal = (process.env as any)[key];
  if (nextVal) return nextVal as string;
  return undefined;
}

/**
 * Basic Banana.dev image generation client.
 * If Banana credentials are missing, it falls back to Hugging Face image inference,
 * and finally to a placeholder image.
 */
export class BananaImageService {
  private apiKey?: string;
  private modelKey?: string;
  private hfKey?: string;

  constructor() {
    this.apiKey = getEnv('BANANA_API_KEY') || getEnv('VITE_BANANA_API_KEY');
    this.modelKey = getEnv('BANANA_MODEL_KEY') || getEnv('VITE_BANANA_MODEL_KEY');
    this.hfKey = getEnv('HUGGINGFACE_API_KEY') || getEnv('VITE_HUGGINGFACE_API_KEY');
  }

  hasBanana(): boolean {
    return !!(this.apiKey && this.modelKey);
  }

  hasHF(): boolean {
    return !!this.hfKey;
  }

  /**
   * Generate an image from a prompt.
   */
  async generateImage(prompt: string, options: ImageGenOptions = {}): Promise<ImageGenResult> {
    try {
      if (this.hasBanana()) {
        return await this.generateViaBanana(prompt, options);
      }
      if (this.hasHF()) {
        return await this.generateViaHuggingFace(prompt, options);
      }
      // Final fallback: placeholder image
      const size = typeof options.size === 'string' ? options.size : `${(options.size as any)?.width || 512}x${(options.size as any)?.height || 512}`;
      return {
        imageUrl: `https://dummyimage.com/${size}/e5e7eb/111&text=${encodeURIComponent('Image service not configured')}`,
        model: 'placeholder',
        provider: 'placeholder'
      };
    } catch (error) {
      logger.captureError(error as unknown, 'Image generation failed');
      // Graceful fallback even on errors
      return {
        imageUrl: `https://dummyimage.com/512x512/fde68a/111&text=${encodeURIComponent('Error generating image')}`,
        model: 'error',
        provider: 'placeholder'
      };
    }
  }

  /**
   * Banana.dev Serverless API call.
   * Note: Banana has changed product directions; this implementation targets their
   * classic v4-style endpoint signature. Adjust if your deployment differs.
   */
  private async generateViaBanana(prompt: string, options: ImageGenOptions): Promise<ImageGenResult> {
    const payload = {
      modelKey: this.modelKey,
      apiKey: this.apiKey,
      // Typical control args for SD-like models
      // The exact shape depends on your deployed model server.
      prompt,
      // Pass options through for compatible models
      cfgScale: options.cfgScale ?? 7,
      steps: options.steps ?? 30,
      seed: options.seed ?? undefined,
      size: typeof options.size === 'string' ? options.size : undefined
    } as any;

    // Historically Banana used https://api.banana.dev/v2/ or /v4/ endpoints.
    // We try v4 and fall back to v2 if needed.
    const endpoints = [
      'https://api.banana.dev/v4/generate',
      'https://api.banana.dev/v2/',
    ];

    for (const url of endpoints) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`Banana API ${res.status}: ${txt}`);
        }
        const data = await res.json();
        // Expected shapes vary; we try several common fields
        const imageUrl = data?.imageUrl || data?.output?.imageUrl || data?.output?.result?.image_url || data?.result?.image_url;
        if (imageUrl) {
          return { imageUrl, model: 'banana-model', provider: 'banana' };
        }
        // Sometimes models return base64; handle that too
        const b64 = data?.output?.base64 || data?.result?.base64;
        if (typeof b64 === 'string' && b64.length > 0) {
          return { imageUrl: `data:image/png;base64,${b64}`, model: 'banana-model', provider: 'banana' };
        }
        // If unknown shape, log and continue to next endpoint
        logger.warn('Unexpected Banana response shape', { data });
      } catch (err) {
        logger.warn('Banana endpoint failed, trying next', { url, error: (err as any)?.message });
        continue;
      }
    }

    // If all Banana endpoints fail, try Hugging Face
    if (this.hasHF()) {
      return await this.generateViaHuggingFace(prompt, options);
    }
    throw new Error('Banana image generation failed and no HF key configured');
  }

  /**
   * Hugging Face Inference API image generation.
   * Uses Stability AI SDXL as a default.
   */
  private async generateViaHuggingFace(prompt: string, options: ImageGenOptions): Promise<ImageGenResult> {
    const model = 'stabilityai/stable-diffusion-xl-base-1.0';
    const url = `https://api-inference.huggingface.co/models/${model}`;
    const body = JSON.stringify({ inputs: prompt });

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.hfKey}`,
        'Content-Type': 'application/json'
      },
      body
    });

    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`HF image API ${res.status}: ${txt}`);
    }

    // HF returns image bytes
    const blob = await res.blob();
    const dataUrl = await this.blobToDataUrl(blob);
    return { imageUrl: dataUrl, model, provider: 'huggingface' };
  }

  private async blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

let bananaImageInstance: BananaImageService | null = null;
export function getBananaImageService(): BananaImageService {
  if (!bananaImageInstance) bananaImageInstance = new BananaImageService();
  return bananaImageInstance;
}