import { cli } from 'cli-forge';
import { LEVELS, Level, makeLogger } from './logger';
import { runBuild } from './build';

// A CLI that registers a logger as a DI provider. The factory reads
// `args.logLevel` when the provider is first injected, so the logger
// automatically obeys whatever level the user passed on the command line —
// no middleware, no prop drilling, no module-level singletons.
export const app = cli('builder')
  .option('logLevel', {
    type: 'string',
    choices: LEVELS,
    default: 'info' as Level,
    description: 'Minimum log level to emit',
  })
  .provide('logger', {
    // Factory receives the finalized args, so logLevel is the one the user
    // actually passed (after defaults, env vars, and config files resolve).
    factory: (args) => makeLogger(args.logLevel as Level),
  })
  .command('build', {
    description: 'Build a target',
    builder: (cmd) =>
      cmd.option('target', {
        type: 'string',
        required: true,
        description: 'Build target (e.g. web, node)',
      }),
    handler: runBuild,
  });

if (require.main === module) {
  app.forge();
}
