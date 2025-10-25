type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any; // allow arbitrary meta to avoid type friction across app
  scope?: string;
  userId?: string;
  tenantId?: string;
  tags?: Record<string, string | number | boolean>;
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    name?: string;
    message?: string;
    stack?: string;
  };
}

export class Logger {
  private static instance: Logger;
  private queue: LogEntry[] = [];
  private flushInterval: number = 15_000; // 15s batch send
  private initialized = false;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) Logger.instance = new Logger();
    return Logger.instance;
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;
    setInterval(() => this.flush(), this.flushInterval);
  }

  private push(entry: LogEntry) {
    this.queue.push(entry);
    // In dev, echo to console immediately
    if (process.env.NODE_ENV === 'development') {
      const prefix = `[${entry.level.toUpperCase()}]`;
      console[entry.level === 'debug' ? 'log' : entry.level](prefix, entry.message, entry.context || {}, entry.error || '');
    }
  }

  private flush() {
    if (this.queue.length === 0) return;
    const payload = this.queue.splice(0, this.queue.length);
    try {
      // Replace with your log ingestion endpoint
      // fetch('/api/logs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } catch (e) {
      console.warn('Failed to flush logs:', e);
    }
  }

  log(level: LogLevel, message: string, context?: LogContext) {
    this.push({ level, message, timestamp: new Date().toISOString(), context });
  }

  debug(message: string, context?: LogContext) { this.log('debug', message, context); }
  info(message: string, context?: LogContext) { this.log('info', message, context); }
  warn(message: string, context?: LogContext) { this.log('warn', message, context); }
  error(message: string, context?: LogContext) { this.log('error', message, context); }

  captureError(error: unknown, message = 'Unhandled error', context?: LogContext) {
    const err = error as Error;
    this.push({
      level: 'error',
      message,
      timestamp: new Date().toISOString(),
      context,
      error: {
        name: err?.name,
        message: err?.message,
        stack: err?.stack,
      }
    });
  }
}

export const logger = Logger.getInstance();
logger.init();