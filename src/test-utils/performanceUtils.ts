/**
 * Performance Testing Utilities
 *
 * Helper functions for measuring and asserting performance metrics
 */

export interface PerformanceMetrics {
  duration: number;
  memory?: number;
  fps?: number;
}

export interface PerformanceBenchmark {
  name: string;
  target: number;
  actual: number;
  passed: boolean;
  unit: "ms" | "MB" | "fps";
}

/**
 * Measure execution time of async function
 */
export async function measureDuration<T>(
  fn: () => Promise<T>,
): Promise<{ result: T; duration: number }> {
  const startTime = performance.now();
  const result = await fn();
  const endTime = performance.now();

  return {
    result,
    duration: endTime - startTime,
  };
}

/**
 * Measure execution time of sync function
 */
export function measureDurationSync<T>(fn: () => T): {
  result: T;
  duration: number;
} {
  const startTime = performance.now();
  const result = fn();
  const endTime = performance.now();

  return {
    result,
    duration: endTime - startTime,
  };
}

/**
 * Measure memory usage before and after function execution
 */
export async function measureMemory<T>(
  fn: () => Promise<T>,
): Promise<{ result: T; memoryDelta: number }> {
  // Force garbage collection if available (Node.js with --expose-gc flag)
  if (global.gc) {
    global.gc();
  }

  const startMemory =
    (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory
      ?.usedJSHeapSize ?? 0;
  const result = await fn();
  const endMemory =
    (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory
      ?.usedJSHeapSize ?? 0;

  return {
    result,
    memoryDelta: endMemory - startMemory,
  };
}

/**
 * Calculate average value from array of numbers
 */
export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

/**
 * Calculate average interval between timestamps
 */
export function calculateAverageInterval(timestamps: number[]): number {
  if (timestamps.length < 2) return 0;

  const intervals: number[] = [];
  for (let i = 1; i < timestamps.length; i++) {
    intervals.push(timestamps[i] - timestamps[i - 1]);
  }

  return calculateAverage(intervals);
}

/**
 * Calculate 95th percentile
 */
export function calculateP95(values: number[]): number {
  if (values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil(sorted.length * 0.95) - 1;

  return sorted[index];
}

/**
 * Run benchmark multiple times and return statistics
 */
export async function runBenchmark(
  name: string,
  fn: () => Promise<void>,
  iterations: number = 10,
): Promise<{
  name: string;
  iterations: number;
  avg: number;
  min: number;
  max: number;
  p95: number;
}> {
  const durations: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const { duration } = await measureDuration(fn);
    durations.push(duration);
  }

  return {
    name,
    iterations,
    avg: calculateAverage(durations),
    min: Math.min(...durations),
    max: Math.max(...durations),
    p95: calculateP95(durations),
  };
}

/**
 * Assert that duration is below target
 */
export function assertPerformance(
  name: string,
  actual: number,
  target: number,
  unit: "ms" | "MB" | "fps" = "ms",
): PerformanceBenchmark {
  const passed = actual <= target;

  const benchmark: PerformanceBenchmark = {
    name,
    target,
    actual,
    passed,
    unit,
  };

  if (!passed) {
    console.warn(
      `⚠️  Performance regression: ${name} took ${actual}${unit} (target: ${target}${unit})`,
    );
  } else {
    console.log(
      `✓ Performance check passed: ${name} took ${actual}${unit} (target: ${target}${unit})`,
    );
  }

  return benchmark;
}

/**
 * Create performance mark
 */
export function mark(name: string): void {
  performance.mark(name);
}

/**
 * Measure between two marks
 */
export function measure(
  name: string,
  startMark: string,
  endMark: string,
): number {
  performance.measure(name, startMark, endMark);
  const measures = performance.getEntriesByName(name, "measure");

  if (measures.length > 0) {
    return measures[measures.length - 1].duration;
  }

  return 0;
}

/**
 * Clear all performance marks and measures
 */
export function clearPerformanceData(): void {
  performance.clearMarks();
  performance.clearMeasures();
}

/**
 * Simulate frame rendering and calculate FPS
 */
export function measureFPS(durationMs: number = 1000): Promise<number> {
  return new Promise((resolve) => {
    let frameCount = 0;
    const startTime = performance.now();

    function countFrame() {
      frameCount++;
      const elapsed = performance.now() - startTime;

      if (elapsed < durationMs) {
        requestAnimationFrame(countFrame);
      } else {
        const fps = (frameCount / elapsed) * 1000;
        resolve(fps);
      }
    }

    requestAnimationFrame(countFrame);
  });
}

/**
 * Wait for specified duration
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * Format duration to human readable string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(2)}ms`;
  }

  const seconds = ms / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(2)}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds.toFixed(2)}s`;
}

/**
 * Get current memory usage
 */
export function getCurrentMemory(): number {
  return (
    (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory
      ?.usedJSHeapSize ?? 0
  );
}

/**
 * Profile function execution
 */
export async function profile<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<{ result: T; metrics: PerformanceMetrics }> {
  const startMark = `${name}-start`;
  const endMark = `${name}-end`;
  const measureName = `${name}-duration`;

  mark(startMark);
  const startMemory = getCurrentMemory();

  const result = await fn();

  mark(endMark);
  const endMemory = getCurrentMemory();

  const duration = measure(measureName, startMark, endMark);
  const memoryDelta = endMemory - startMemory;

  return {
    result,
    metrics: {
      duration,
      memory: memoryDelta,
    },
  };
}
