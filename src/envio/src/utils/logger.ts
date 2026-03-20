/**
 * @file logger.ts
 * @description Logging utility for Envio event handlers
 * @author Mirror Protocol Team
 */

export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
} as const;

export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

export class Logger {
  private module: string;
  private level: LogLevel;

  constructor(module: string, level: LogLevel = LogLevel.INFO) {
    this.module = module;
    this.level = level;
  }

  static create(module: string, level: LogLevel = LogLevel.INFO): Logger {
    return new Logger(module, level);
  }

  debug(message: string, metadata?: Record<string, any>): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(`[${this.module}] ${message}`, metadata || '');
    }
  }

  info(message: string, metadata?: Record<string, any>): void {
    if (this.level <= LogLevel.INFO) {
      console.info(`[${this.module}] ${message}`, metadata || '');
    }
  }

  warn(message: string, metadata?: Record<string, any>): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[${this.module}] ${message}`, metadata || '');
    }
  }

  error(message: string, metadata?: Record<string, any>): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[${this.module}] ${message}`, metadata || '');
    }
  }
}
