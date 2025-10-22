interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (req: any) => string; // Function to generate unique keys
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
  message?: string; // Custom error message
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      windowMs: 15 * 60 * 1000, // 15 minutes default
      maxRequests: 100, // 100 requests per window default
      keyGenerator: (req) => req.ip || 'anonymous',
      message: 'Too many requests, please try again later.',
      ...config,
    };

    // Clean up expired entries every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  private cleanup() {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    });
  }

  private getKey(identifier: string): string {
    return `rate_limit:${identifier}`;
  }

  public isAllowed(identifier: string): { allowed: boolean; resetTime?: number; remaining?: number } {
    const key = this.getKey(identifier);
    const now = Date.now();
    
    // Get or create rate limit entry
    if (!this.store[key] || this.store[key].resetTime < now) {
      this.store[key] = {
        count: 0,
        resetTime: now + this.config.windowMs,
      };
    }

    const entry = this.store[key];
    
    if (entry.count >= this.config.maxRequests) {
      return {
        allowed: false,
        resetTime: entry.resetTime,
        remaining: 0,
      };
    }

    entry.count++;
    
    return {
      allowed: true,
      resetTime: entry.resetTime,
      remaining: this.config.maxRequests - entry.count,
    };
  }

  public reset(identifier: string): void {
    const key = this.getKey(identifier);
    delete this.store[key];
  }

  public getStatus(identifier: string): { count: number; resetTime: number; remaining: number } | null {
    const key = this.getKey(identifier);
    const entry = this.store[key];
    
    if (!entry || entry.resetTime < Date.now()) {
      return null;
    }

    return {
      count: entry.count,
      resetTime: entry.resetTime,
      remaining: Math.max(0, this.config.maxRequests - entry.count),
    };
  }
}

// Pre-configured rate limiters for different use cases
export const rateLimiters = {
  // General API rate limiter - 100 requests per 15 minutes
  general: new RateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 100,
  }),

  // Authentication rate limiter - 5 attempts per 15 minutes
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
    message: 'Too many authentication attempts, please try again later.',
  }),

  // Messaging rate limiter - 50 messages per hour
  messaging: new RateLimiter({
    windowMs: 60 * 60 * 1000,
    maxRequests: 50,
    message: 'Too many messages sent, please wait before sending more.',
  }),

  // File upload rate limiter - 10 uploads per hour
  upload: new RateLimiter({
    windowMs: 60 * 60 * 1000,
    maxRequests: 10,
    message: 'Too many file uploads, please wait before uploading more.',
  }),

  // Search rate limiter - 200 searches per hour
  search: new RateLimiter({
    windowMs: 60 * 60 * 1000,
    maxRequests: 200,
    message: 'Too many search requests, please wait before searching again.',
  }),
};

// Middleware function for API routes
export function createRateLimitMiddleware(limiterType: keyof typeof rateLimiters = 'general') {
  const limiter = rateLimiters[limiterType];

  return function rateLimitMiddleware(identifier: string) {
    const result = limiter.isAllowed(identifier);
    
    if (!result.allowed) {
      const resetDate = new Date(result.resetTime || Date.now());
      throw new Error(`Rate limit exceeded. Try again at ${resetDate.toISOString()}`);
    }

    return {
      remaining: result.remaining,
      resetTime: result.resetTime,
    };
  };
}

// Client-side rate limiting for fetch requests
export class ClientRateLimiter {
  private static instance: ClientRateLimiter;
  private store: Map<string, { count: number; resetTime: number }> = new Map();

  static getInstance(): ClientRateLimiter {
    if (!ClientRateLimiter.instance) {
      ClientRateLimiter.instance = new ClientRateLimiter();
    }
    return ClientRateLimiter.instance;
  }

  private getKey(url: string, method: string = 'GET'): string {
    return `${method}:${url}`;
  }

  public canMakeRequest(url: string, method: string = 'GET', maxPerMinute: number = 60): boolean {
    const key = this.getKey(url, method);
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window

    const entry = this.store.get(key);
    
    if (!entry || entry.resetTime < now) {
      this.store.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return true;
    }

    if (entry.count >= maxPerMinute) {
      return false;
    }

    entry.count++;
    return true;
  }

  public waitTime(url: string, method: string = 'GET'): number {
    const key = this.getKey(url, method);
    const entry = this.store.get(key);
    
    if (!entry) return 0;
    
    return Math.max(0, entry.resetTime - Date.now());
  }
}

// Enhanced fetch wrapper with rate limiting
export async function fetchWithRateLimit(
  url: string,
  options: RequestInit = {},
  maxPerMinute: number = 60
): Promise<Response> {
  const rateLimiter = ClientRateLimiter.getInstance();
  const method = options.method || 'GET';

  if (!rateLimiter.canMakeRequest(url, method, maxPerMinute)) {
    const waitTime = rateLimiter.waitTime(url, method);
    throw new Error(`Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds before making another request.`);
  }

  return fetch(url, options);
}

export default RateLimiter;