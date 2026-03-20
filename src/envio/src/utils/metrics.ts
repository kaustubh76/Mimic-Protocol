/**
 * @file metrics.ts
 * @description Performance metrics collection for Envio event handlers
 * @author Mirror Protocol Team
 */

export class Timer {
  private startTime: number;
  private name: string;

  constructor(name: string) {
    this.name = name;
    this.startTime = Date.now();
  }

  stop(): number {
    return Date.now() - this.startTime;
  }

  stopAndCheckTarget(targetMs: number, description: string): number {
    const duration = this.stop();
    if (duration > targetMs) {
      console.warn("Warning: " + description + " exceeded target: " + duration + "ms > " + targetMs + "ms");
    }
    return duration;
  }
}

export class MetricsCollector {
  private static counters: Map<string, number> = new Map();
  private static gauges: Map<string, number> = new Map();

  static startTimer(name: string): Timer {
    return new Timer(name);
  }

  static incrementCounter(name: string, value: number = 1, labels?: Record<string, string>): void {
    const key = name;
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);
  }

  static setGauge(name: string, value: number, labels?: Record<string, string>): void {
    const key = name;
    this.gauges.set(key, value);
  }

  static observeHistogram(name: string, value: number): void {
    // Simplified - just count
    this.incrementCounter(name + "_observations");
  }

  static recordEvent(): void {
    this.incrementCounter("events_processed_total");
  }

  static reset(): void {
    this.counters.clear();
    this.gauges.clear();
  }
}
