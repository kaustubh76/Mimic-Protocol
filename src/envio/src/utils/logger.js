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
};
export class Logger {
    module;
    level;
    constructor(module, level = LogLevel.INFO) {
        this.module = module;
        this.level = level;
    }
    static create(module, level = LogLevel.INFO) {
        return new Logger(module, level);
    }
    debug(message, metadata) {
        if (this.level <= LogLevel.DEBUG) {
            console.debug(`[${this.module}] ${message}`, metadata || '');
        }
    }
    info(message, metadata) {
        if (this.level <= LogLevel.INFO) {
            console.info(`[${this.module}] ${message}`, metadata || '');
        }
    }
    warn(message, metadata) {
        if (this.level <= LogLevel.WARN) {
            console.warn(`[${this.module}] ${message}`, metadata || '');
        }
    }
    error(message, metadata) {
        if (this.level <= LogLevel.ERROR) {
            console.error(`[${this.module}] ${message}`, metadata || '');
        }
    }
}
