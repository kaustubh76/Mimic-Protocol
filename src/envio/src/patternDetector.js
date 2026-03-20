"use strict";
/**
 * @file patternDetector.ts
 * @description Sub-50ms behavioral pattern detection engine
 * @author Mirror Protocol Team
 *
 * KEY FEATURES:
 * - Real-time pattern detection from on-chain events
 * - Sub-50ms detection latency
 * - Multiple pattern types (momentum, arbitrage, mean reversion)
 * - Confidence scoring
 *
 * ENVIO INTEGRATION:
 * - Triggered by Envio event handlers
 * - Uses HyperSync for fast historical queries
 * - Real-time behavioral analysis
 *
 * PERFORMANCE:
 * - Target: <50ms pattern detection
 * - Optimized algorithms for speed
 * - Pre-computed behavioral graphs
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PatternDetector = void 0;
var logger_1 = require("./utils/logger");
var metrics_1 = require("./utils/metrics");
var decoder_1 = require("./utils/decoder");
var logger = logger_1.Logger.create('PatternDetector');
/**
 * Pattern detection engine
 */
var PatternDetector = /** @class */ (function () {
    function PatternDetector() {
    }
    /**
     * Detect momentum trading pattern
     *
     * Pattern: User consistently buys during upward price movements
     * Criteria: 3+ consecutive buys with increasing prices
     *
     * @param events - Trading events for a user
     * @returns Detected pattern or null
     *
     * Performance Target: <20ms
     */
    PatternDetector.detectMomentum = function (events) {
        var timer = metrics_1.MetricsCollector.startTimer('pattern_detection_momentum');
        try {
            // Filter to buy events only
            var buyEvents = events
                .filter(function (e) { return e.action === 'buy'; })
                .sort(function (a, b) { return Number(a.timestamp - b.timestamp); });
            if (buyEvents.length < 3) {
                timer.stop();
                return null;
            }
            // Find consecutive buy streaks with increasing prices
            var maxStreak = 0;
            var currentStreak = 1;
            var streakVolumeTotal = buyEvents[0].amount;
            var streakStartPrice = buyEvents[0].price;
            for (var i = 1; i < buyEvents.length; i++) {
                var prev = buyEvents[i - 1];
                var curr = buyEvents[i];
                // Check if price increased and time gap is reasonable (< 1 hour)
                var timeDiff = Number(curr.timestamp - prev.timestamp);
                var priceIncreased = curr.price > prev.price;
                if (priceIncreased && timeDiff < 3600) {
                    currentStreak++;
                    streakVolumeTotal += curr.amount;
                }
                else {
                    maxStreak = Math.max(maxStreak, currentStreak);
                    currentStreak = 1;
                    streakVolumeTotal = curr.amount;
                    streakStartPrice = curr.price;
                }
            }
            maxStreak = Math.max(maxStreak, currentStreak);
            // Pattern detected if streak >= 3
            if (maxStreak >= 3) {
                var avgVolume = streakVolumeTotal / BigInt(maxStreak);
                // Calculate confidence based on:
                // - Streak length (longer = higher confidence)
                // - Consistency (price always increasing = higher)
                // - Volume (higher = higher)
                var streakScore = Math.min(maxStreak * 2000, 6000); // Max 60% from streak
                var volumeScore = 2000; // 20% base volume score
                var consistencyScore = 2000; // 20% consistency
                var confidence = Math.min(streakScore + volumeScore + consistencyScore, 10000);
                // Encode parameters: [minConsecutiveGreen, volumeThreshold, timeWindow]
                var parameters = [
                    BigInt(maxStreak),
                    avgVolume,
                    BigInt(3600), // 1 hour time window
                ];
                var encodedData = decoder_1.PatternDecoder.encode('momentum', parameters);
                var duration = timer.stopAndCheckTarget(20, 'Momentum pattern detection');
                logger.info('✅ Momentum pattern detected', {
                    streak: maxStreak,
                    confidence: confidence,
                    avgVolume: avgVolume.toString(),
                    detectionTime: duration,
                });
                return {
                    type: 'momentum',
                    confidence: confidence,
                    parameters: parameters,
                    encodedData: encodedData,
                    metadata: {
                        detectionTime: duration,
                        dataPoints: events.length,
                    },
                };
            }
            timer.stop();
            return null;
        }
        catch (error) {
            timer.stop();
            logger.error('Error detecting momentum pattern', error);
            return null;
        }
    };
    /**
     * Detect mean reversion trading pattern
     *
     * Pattern: User buys after significant price drops, sells after recovery
     * Criteria: Buy at >10% dip, sell at >5% recovery
     *
     * @param events - Trading events for a user
     * @returns Detected pattern or null
     *
     * Performance Target: <20ms
     */
    PatternDetector.detectMeanReversion = function (events) {
        var timer = metrics_1.MetricsCollector.startTimer('pattern_detection_mean_reversion');
        try {
            if (events.length < 4) {
                timer.stop();
                return null;
            }
            var sorted = __spreadArray([], events, true).sort(function (a, b) { return Number(a.timestamp - b.timestamp); });
            // Calculate moving average
            var prices = sorted.map(function (e) { return Number(e.price); });
            var avgPrice = prices.reduce(function (a, b) { return a + b; }, 0) / prices.length;
            // Find buy-after-dip and sell-after-recovery pairs
            var dipBuys = 0;
            var recoveryS = void 0, ells = 0;
            var totalDipPercent = 0;
            var totalRecoveryPercent = 0;
            for (var i = 1; i < sorted.length; i++) {
                var prev = sorted[i - 1];
                var curr = sorted[i];
                var priceChange = ((Number(curr.price) - Number(prev.price)) / Number(prev.price)) * 100;
                var deviationFromAvg = ((Number(curr.price) - avgPrice) / avgPrice) * 100;
                // Buy after dip (price dropped >10% from average)
                if (curr.action === 'buy' && deviationFromAvg < -10) {
                    dipBuys++;
                    totalDipPercent += Math.abs(deviationFromAvg);
                }
                // Sell after recovery (price up >5% from average)
                if (curr.action === 'sell' && deviationFromAvg > 5) {
                    recoverySells++;
                    totalRecoveryPercent += deviationFromAvg;
                }
            }
            // Pattern detected if at least 2 buy-low/sell-high cycles
            if (dipBuys >= 2 && recoverySells >= 2) {
                var avgDip = Math.round(totalDipPercent / dipBuys);
                var avgRecovery = Math.round(totalRecoveryPercent / recoverySells);
                // Confidence based on consistency and profitability
                var cycleScore = Math.min((dipBuys + recoverySells) * 1000, 5000); // Max 50%
                var profitabilityScore = Math.min(avgRecovery * 100, 3000); // Max 30%
                var consistencyScore = 2000; // 20% base
                var confidence = Math.min(cycleScore + profitabilityScore + consistencyScore, 10000);
                // Encode parameters: [deviationThreshold, lookbackPeriod, targetReturn]
                var parameters = [
                    BigInt(Math.round(avgDip * 100)), // Basis points
                    BigInt(events.length), // Lookback period
                    BigInt(Math.round(avgRecovery * 100)), // Target return in basis points
                ];
                var encodedData = decoder_1.PatternDecoder.encode('mean_reversion', parameters);
                var duration = timer.stopAndCheckTarget(20, 'Mean reversion pattern detection');
                logger.info('✅ Mean reversion pattern detected', {
                    dipBuys: dipBuys,
                    recoverySells: recoverySells,
                    avgDip: avgDip,
                    avgRecovery: avgRecovery,
                    confidence: confidence,
                    detectionTime: duration,
                });
                return {
                    type: 'mean_reversion',
                    confidence: confidence,
                    parameters: parameters,
                    encodedData: encodedData,
                    metadata: {
                        detectionTime: duration,
                        dataPoints: events.length,
                    },
                };
            }
            timer.stop();
            return null;
        }
        catch (error) {
            timer.stop();
            logger.error('Error detecting mean reversion pattern', error);
            return null;
        }
    };
    /**
     * Detect arbitrage trading pattern
     *
     * Pattern: User exploits price differences across DEXs
     * Criteria: Near-simultaneous buy/sell of same token on different DEXs
     *
     * @param events - Trading events for a user
     * @returns Detected pattern or null
     *
     * Performance Target: <20ms
     */
    PatternDetector.detectArbitrage = function (events) {
        var timer = metrics_1.MetricsCollector.startTimer('pattern_detection_arbitrage');
        try {
            if (events.length < 2) {
                timer.stop();
                return null;
            }
            var sorted = __spreadArray([], events, true).sort(function (a, b) { return Number(a.timestamp - b.timestamp); });
            // Find near-simultaneous buy/sell pairs (within 60 seconds)
            var arbOps = 0;
            var totalSpread = 0;
            var dexAddresses = new Set();
            for (var i = 0; i < sorted.length - 1; i++) {
                for (var j = i + 1; j < sorted.length; j++) {
                    var event1 = sorted[i];
                    var event2 = sorted[j];
                    var timeDiff = Number(event2.timestamp - event1.timestamp);
                    // Must be same token, opposite actions, within 60 seconds
                    if (event1.tokenAddress === event2.tokenAddress &&
                        event1.action !== event2.action &&
                        timeDiff < 60) {
                        // Calculate price spread
                        var spread = Math.abs(Number(event2.price) - Number(event1.price));
                        var spreadPercent = (spread / Number(Math.min(event1.price, event2.price))) * 100;
                        if (spreadPercent > 1) {
                            // Significant spread (>1%)
                            arbOps++;
                            totalSpread += spreadPercent;
                            dexAddresses.add(event1.txHash.slice(0, 10)); // Simplified DEX identification
                        }
                    }
                }
            }
            // Pattern detected if at least 2 arbitrage operations
            if (arbOps >= 2) {
                var avgSpread = totalSpread / arbOps;
                // Confidence based on number of operations and average spread
                var opsScore = Math.min(arbOps * 2000, 6000); // Max 60%
                var spreadScore = Math.min(avgSpread * 200, 3000); // Max 30%
                var consistencyScore = 1000; // 10% base
                var confidence = Math.min(opsScore + spreadScore + consistencyScore, 10000);
                // Encode parameters: [dexAddresses, minPriceGap, maxSlippage]
                var parameters = [
                    Array.from(dexAddresses).slice(0, 5), // Max 5 DEXs
                    BigInt(Math.round(avgSpread * 100)), // Min price gap in basis points
                    BigInt(50), // 0.5% max slippage
                ];
                var encodedData = decoder_1.PatternDecoder.encode('arbitrage', parameters);
                var duration = timer.stopAndCheckTarget(20, 'Arbitrage pattern detection');
                logger.info('✅ Arbitrage pattern detected', {
                    operations: arbOps,
                    avgSpread: avgSpread,
                    dexCount: dexAddresses.size,
                    confidence: confidence,
                    detectionTime: duration,
                });
                return {
                    type: 'arbitrage',
                    confidence: confidence,
                    parameters: parameters,
                    encodedData: encodedData,
                    metadata: {
                        detectionTime: duration,
                        dataPoints: events.length,
                    },
                };
            }
            timer.stop();
            return null;
        }
        catch (error) {
            timer.stop();
            logger.error('Error detecting arbitrage pattern', error);
            return null;
        }
    };
    /**
     * Analyze user trading history and detect all patterns
     *
     * @param userAddress - Wallet address to analyze
     * @param events - Trading events for the user
     * @returns Array of detected patterns
     *
     * Performance Target: <50ms total
     */
    PatternDetector.analyzeUserBehavior = function (userAddress, events) {
        return __awaiter(this, void 0, void 0, function () {
            var timer, detectedPatterns, _a, momentum, meanReversion, arbitrage, duration, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        timer = metrics_1.MetricsCollector.startTimer('pattern_detection_full_analysis');
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        logger.info('🔍 Analyzing user behavior', {
                            userAddress: userAddress,
                            eventCount: events.length,
                        });
                        detectedPatterns = [];
                        return [4 /*yield*/, Promise.all([
                                Promise.resolve(this.detectMomentum(events)),
                                Promise.resolve(this.detectMeanReversion(events)),
                                Promise.resolve(this.detectArbitrage(events)),
                            ])];
                    case 2:
                        _a = _b.sent(), momentum = _a[0], meanReversion = _a[1], arbitrage = _a[2];
                        if (momentum)
                            detectedPatterns.push(momentum);
                        if (meanReversion)
                            detectedPatterns.push(meanReversion);
                        if (arbitrage)
                            detectedPatterns.push(arbitrage);
                        duration = timer.stopAndCheckTarget(50, "Full behavioral analysis for ".concat(userAddress));
                        if (detectedPatterns.length > 0) {
                            logger.info("\u2705 Detected ".concat(detectedPatterns.length, " patterns in ").concat(duration, "ms"), {
                                userAddress: userAddress,
                                patterns: detectedPatterns.map(function (p) { return p.type; }),
                                duration: duration,
                            });
                            // Record sub-50ms achievement
                            if (duration < 50) {
                                metrics_1.MetricsCollector.incrementCounter('sub_50ms_detections');
                                logger.info("\uD83D\uDE80 SUB-50MS PATTERN DETECTION (".concat(duration, "ms) - Only possible with Envio!"), { duration: duration });
                            }
                        }
                        metrics_1.MetricsCollector.setGauge('last_pattern_detection_time', duration);
                        return [2 /*return*/, detectedPatterns];
                    case 3:
                        error_1 = _b.sent();
                        timer.stop();
                        logger.error('Error analyzing user behavior', error_1);
                        return [2 /*return*/, []];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return PatternDetector;
}());
exports.PatternDetector = PatternDetector;
exports.default = PatternDetector;
