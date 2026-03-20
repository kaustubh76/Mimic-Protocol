/**
 * @file metrics.ts
 * @description Performance metrics collection for Envio event handlers
 * @author Mirror Protocol Team
 */
export class Timer {
    startTime;
    name;
    constructor(name) {
        this.name = name;
        this.startTime = Date.now();
    }
    stop() {
        return Date.now() - this.startTime;
    }
    stopAndCheckTarget(targetMs, description) {
        const duration = this.stop();
        if (duration > targetMs) {
            console.warn("Warning: " + description + " exceeded target: " + duration + "ms > " + targetMs + "ms");
        }
        return duration;
    }
}
export class MetricsCollector {
    static counters = new Map();
    static gauges = new Map();
    static startTimer(name) {
        return new Timer(name);
    }
    static incrementCounter(name, value = 1, labels) {
        const key = name;
        const current = this.counters.get(key) || 0;
        this.counters.set(key, current + value);
    }
    static setGauge(name, value, labels) {
        const key = name;
        this.gauges.set(key, value);
    }
    static observeHistogram(name, value) {
        // Simplified - just count
        this.incrementCounter(name + "_observations");
    }
    static recordEvent() {
        this.incrementCounter("events_processed_total");
    }
    static reset() {
        this.counters.clear();
        this.gauges.clear();
    }
}
