import type { TimingContext } from '../types';

/**
 * Generates a simple request ID for tracking.
 */
function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// #region timing-middleware
/**
 * Timing middleware that adds request timing context.
 *
 * The startTime can be used by handlers to calculate execution duration.
 * The requestId provides a correlation ID for logging.
 */
export function timingMiddleware<T>(args: T): T & TimingContext {
  return {
    ...args,
    startTime: Date.now(),
    requestId: generateRequestId(),
  };
}
// #endregion timing-middleware

/**
 * Helper to calculate elapsed time from a start timestamp.
 */
export function getElapsedMs(startTime: number): number {
  return Date.now() - startTime;
}
