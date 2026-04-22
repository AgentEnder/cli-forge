/**
 * Tests .provide() type accumulation:
 * - Eager value providers
 * - ExecutionScope factory providers
 * - Global factory providers
 * - Duplicate key rejection
 * - Multiple provider accumulation
 */
import { cli } from 'cli-forge';

// Eager value provider accumulates type
const _app1 = cli('test')
  .provide('logger', { log: (msg: string) => console.log(msg) })
  .provide('api', { get: (url: string) => url });

// Factory provider (executionScope) — factory receives args
const _app2 = cli('test')
  .option('logLevel', { type: 'string', default: 'info' })
  .provide('logger', {
    factory: (args) => ({ level: args.logLevel }),
  });

// Global factory (no args, must specify lifetime: 'global')
const _app3 = cli('test').provide('pool', {
  factory: () => ({ connections: 10 }),
  lifetime: 'global' as const,
});

// Duplicate key at same level should be a type error
const _app4 = cli('test')
  .provide('logger', { log: console.log })
  // @ts-expect-error — duplicate key 'logger' is not allowed at same level
  .provide('logger', { log: console.log });

// Multiple providers accumulate into TProviders
const _app5 = cli('test')
  .provide('a', 1)
  .provide('b', 'hello')
  .provide('c', true);
