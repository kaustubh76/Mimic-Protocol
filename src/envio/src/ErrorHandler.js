/**
 * @file ErrorHandler.ts
 * @description Comprehensive error handling and recovery system
 * @author Mirror Protocol Team
 *
 * FEATURES:
 * - Automatic error recovery
 * - Error categorization and severity levels
 * - Retry mechanisms with exponential backoff
 * - Error logging and monitoring
 * - Graceful degradation
 * - Circuit breaker integration
 */
import { Logger } from './utils/logger.js';
const logger = Logger.create('ErrorHandler');
export var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "LOW";
    ErrorSeverity["MEDIUM"] = "MEDIUM";
    ErrorSeverity["HIGH"] = "HIGH";
    ErrorSeverity["CRITICAL"] = "CRITICAL";
})(ErrorSeverity || (ErrorSeverity = {}));
export var ErrorCategory;
(function (ErrorCategory) {
    ErrorCategory["NETWORK"] = "NETWORK";
    ErrorCategory["CONTRACT"] = "CONTRACT";
    ErrorCategory["DATABASE"] = "DATABASE";
    ErrorCategory["VALIDATION"] = "VALIDATION";
    ErrorCategory["CIRCUIT_BREAKER"] = "CIRCUIT_BREAKER";
    ErrorCategory["RATE_LIMIT"] = "RATE_LIMIT";
    ErrorCategory["UNKNOWN"] = "UNKNOWN";
})(ErrorCategory || (ErrorCategory = {}));
export class ErrorHandler {
    static errorLog = [];
    static maxLogSize = 1000;
    /**
     * Handle error with automatic recovery
     */
    static async handleError(error, context, strategy) {
        // Categorize and classify error
        const fullContext = this._buildErrorContext(error, context);
        // Log error
        this._logError(fullContext);
        // Store in error log
        this._storeError(fullContext);
        // Determine if error is recoverable
        if (!fullContext.recoverable) {
            this._handleUnrecoverableError(fullContext);
            return null;
        }
        // Attempt recovery if strategy provided
        if (strategy) {
            return await this._attemptRecovery(fullContext, strategy);
        }
        return null;
    }
    /**
     * Execute operation with automatic retry on failure
     */
    static async executeWithRetry(operation, strategy, operationName) {
        let lastError = null;
        let attempt = 0;
        while (attempt < strategy.maxRetries) {
            try {
                const result = await operation();
                if (attempt > 0) {
                    logger.info(`Operation "${operationName}" succeeded after ${attempt} retries`);
                }
                return result;
            }
            catch (error) {
                lastError = error;
                attempt++;
                if (attempt < strategy.maxRetries) {
                    const delay = this._calculateRetryDelay(strategy.retryDelay, attempt, strategy.exponentialBackoff);
                    logger.warn(`Operation "${operationName}" failed (attempt ${attempt}/${strategy.maxRetries}), retrying in ${delay}ms`, { error: lastError.message });
                    await this._sleep(delay);
                }
            }
        }
        // All retries exhausted
        logger.error(`Operation "${operationName}" failed after ${strategy.maxRetries} attempts`, { error: lastError?.message });
        // Try fallback if provided
        if (strategy.fallback) {
            logger.info(`Attempting fallback for operation "${operationName}"`);
            try {
                return await strategy.fallback();
            }
            catch (fallbackError) {
                logger.error(`Fallback also failed for operation "${operationName}"`, {
                    error: fallbackError.message,
                });
            }
        }
        // Call onFailure callback
        if (strategy.onFailure) {
            const errorContext = this._buildErrorContext(lastError, {
                category: ErrorCategory.UNKNOWN,
                severity: ErrorSeverity.HIGH,
                message: `Operation "${operationName}" failed`,
                retryCount: attempt,
            });
            strategy.onFailure(errorContext);
        }
        throw lastError;
    }
    /**
     * Wrap async function with error handling
     */
    static async safeExecute(fn, errorMessage, fallbackValue) {
        try {
            return await fn();
        }
        catch (error) {
            logger.error(errorMessage, { error: error.message });
            return fallbackValue;
        }
    }
    /**
     * Categorize error automatically
     */
    static categorizeError(error) {
        const message = error.message.toLowerCase();
        if (message.includes('network') || message.includes('rpc') || message.includes('timeout')) {
            return ErrorCategory.NETWORK;
        }
        if (message.includes('revert') || message.includes('contract')) {
            return ErrorCategory.CONTRACT;
        }
        if (message.includes('database') || message.includes('postgres') || message.includes('sql')) {
            return ErrorCategory.DATABASE;
        }
        if (message.includes('validation') || message.includes('invalid')) {
            return ErrorCategory.VALIDATION;
        }
        if (message.includes('circuit') || message.includes('breaker')) {
            return ErrorCategory.CIRCUIT_BREAKER;
        }
        if (message.includes('rate limit') || message.includes('too many')) {
            return ErrorCategory.RATE_LIMIT;
        }
        return ErrorCategory.UNKNOWN;
    }
    /**
     * Determine error severity
     */
    static determineSevertiy(category, error) {
        // Critical errors
        if (category === ErrorCategory.CIRCUIT_BREAKER) {
            return ErrorSeverity.CRITICAL;
        }
        if (error.message.toLowerCase().includes('critical')) {
            return ErrorSeverity.CRITICAL;
        }
        // High severity errors
        if (category === ErrorCategory.CONTRACT ||
            category === ErrorCategory.DATABASE) {
            return ErrorSeverity.HIGH;
        }
        // Medium severity errors
        if (category === ErrorCategory.NETWORK ||
            category === ErrorCategory.RATE_LIMIT) {
            return ErrorSeverity.MEDIUM;
        }
        // Low severity errors
        if (category === ErrorCategory.VALIDATION) {
            return ErrorSeverity.LOW;
        }
        return ErrorSeverity.MEDIUM;
    }
    /**
     * Check if error is recoverable
     */
    static isRecoverable(category, error) {
        // Network errors are usually recoverable
        if (category === ErrorCategory.NETWORK) {
            return true;
        }
        // Rate limit errors are recoverable with backoff
        if (category === ErrorCategory.RATE_LIMIT) {
            return true;
        }
        // Database connection errors are recoverable
        if (category === ErrorCategory.DATABASE && error.message.includes('connection')) {
            return true;
        }
        // Contract reverts are usually not recoverable
        if (category === ErrorCategory.CONTRACT) {
            return false;
        }
        // Circuit breaker errors are not recoverable until reset
        if (category === ErrorCategory.CIRCUIT_BREAKER) {
            return false;
        }
        // Validation errors are not recoverable
        if (category === ErrorCategory.VALIDATION) {
            return false;
        }
        return false;
    }
    /**
     * Get error statistics
     */
    static getErrorStats() {
        const byCategory = {
            [ErrorCategory.NETWORK]: 0,
            [ErrorCategory.CONTRACT]: 0,
            [ErrorCategory.DATABASE]: 0,
            [ErrorCategory.VALIDATION]: 0,
            [ErrorCategory.CIRCUIT_BREAKER]: 0,
            [ErrorCategory.RATE_LIMIT]: 0,
            [ErrorCategory.UNKNOWN]: 0,
        };
        const bySeverity = {
            [ErrorSeverity.LOW]: 0,
            [ErrorSeverity.MEDIUM]: 0,
            [ErrorSeverity.HIGH]: 0,
            [ErrorSeverity.CRITICAL]: 0,
        };
        let recoverableCount = 0;
        for (const error of this.errorLog) {
            byCategory[error.category]++;
            bySeverity[error.severity]++;
            if (error.recoverable) {
                recoverableCount++;
            }
        }
        return {
            total: this.errorLog.length,
            byCategory,
            bySeverity,
            recoverableCount,
            recentErrors: this.errorLog.slice(-10), // Last 10 errors
        };
    }
    /**
     * Clear error log
     */
    static clearErrorLog() {
        this.errorLog = [];
        logger.info('Error log cleared');
    }
    // ============================================
    // PRIVATE METHODS
    // ============================================
    static _buildErrorContext(error, partial) {
        const category = partial.category || this.categorizeError(error);
        const severity = partial.severity || this.determineSevertiy(category, error);
        const recoverable = partial.recoverable ?? this.isRecoverable(category, error);
        return {
            category,
            severity,
            message: partial.message || error.message,
            originalError: error,
            metadata: partial.metadata,
            timestamp: Date.now(),
            stackTrace: error.stack,
            recoverable,
            retryCount: partial.retryCount || 0,
        };
    }
    static _logError(context) {
        const logMessage = `[${context.category}] ${context.severity}: ${context.message}`;
        const metadata = {
            category: context.category,
            severity: context.severity,
            recoverable: context.recoverable,
            retryCount: context.retryCount,
            ...context.metadata,
        };
        switch (context.severity) {
            case ErrorSeverity.LOW:
                logger.info(logMessage, metadata);
                break;
            case ErrorSeverity.MEDIUM:
                logger.warn(logMessage, metadata);
                break;
            case ErrorSeverity.HIGH:
            case ErrorSeverity.CRITICAL:
                logger.error(logMessage, metadata);
                break;
        }
    }
    static _storeError(context) {
        this.errorLog.push(context);
        // Trim log if it exceeds max size
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog = this.errorLog.slice(-this.maxLogSize);
        }
    }
    static _handleUnrecoverableError(context) {
        logger.error('UNRECOVERABLE ERROR DETECTED', {
            category: context.category,
            severity: context.severity,
            message: context.message,
        });
        if (context.severity === ErrorSeverity.CRITICAL) {
            logger.error('CRITICAL ERROR - SYSTEM MAY BE COMPROMISED', {
                message: context.message,
                stackTrace: context.stackTrace,
            });
            // TODO: Send alerts, trigger monitoring systems
        }
    }
    static async _attemptRecovery(context, strategy) {
        if (context.retryCount >= strategy.maxRetries) {
            logger.error('Max retries exceeded, recovery failed', {
                category: context.category,
                retries: context.retryCount,
            });
            if (strategy.onFailure) {
                strategy.onFailure(context);
            }
            return null;
        }
        // Calculate retry delay
        const delay = this._calculateRetryDelay(strategy.retryDelay, context.retryCount + 1, strategy.exponentialBackoff);
        logger.info(`Attempting recovery (retry ${context.retryCount + 1}/${strategy.maxRetries}) in ${delay}ms`, {
            category: context.category,
        });
        await this._sleep(delay);
        // Try fallback if available
        if (strategy.fallback) {
            try {
                return await strategy.fallback();
            }
            catch (fallbackError) {
                logger.error('Fallback failed', {
                    error: fallbackError.message,
                });
                return null;
            }
        }
        return null;
    }
    static _calculateRetryDelay(baseDelay, attempt, exponential) {
        if (!exponential) {
            return baseDelay;
        }
        // Exponential backoff: delay * 2^(attempt - 1)
        // Max delay capped at 30 seconds
        return Math.min(baseDelay * Math.pow(2, attempt - 1), 30000);
    }
    static _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
/**
 * Default recovery strategies for common operations
 */
export const RecoveryStrategies = {
    /**
     * Network operations (RPC calls, API requests)
     */
    NETWORK: {
        maxRetries: 3,
        retryDelay: 1000,
        exponentialBackoff: true,
    },
    /**
     * Database operations
     */
    DATABASE: {
        maxRetries: 5,
        retryDelay: 2000,
        exponentialBackoff: true,
    },
    /**
     * Critical operations (should not fail)
     */
    CRITICAL: {
        maxRetries: 10,
        retryDelay: 500,
        exponentialBackoff: true,
    },
    /**
     * Best-effort operations (can fail gracefully)
     */
    BEST_EFFORT: {
        maxRetries: 1,
        retryDelay: 500,
        exponentialBackoff: false,
    },
};
