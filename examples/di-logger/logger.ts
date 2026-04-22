export const LEVELS = ['debug', 'info', 'warn', 'error'] as const;
export type Level = (typeof LEVELS)[number];

export interface Logger {
  debug(msg: string): void;
  info(msg: string): void;
  warn(msg: string): void;
  error(msg: string): void;
  /** How many messages have been suppressed below the configured level. */
  suppressed(): number;
}

export function makeLogger(level: Level): Logger {
  const threshold = LEVELS.indexOf(level);
  let suppressed = 0;
  const emit = (lvl: Level, msg: string) => {
    if (LEVELS.indexOf(lvl) < threshold) {
      suppressed++;
      return;
    }
    console.log(`[${lvl.toUpperCase()}] ${msg}`);
  };
  return {
    debug: (m) => emit('debug', m),
    info: (m) => emit('info', m),
    warn: (m) => emit('warn', m),
    error: (m) => emit('error', m),
    suppressed: () => suppressed,
  };
}
