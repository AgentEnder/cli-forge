import { getCommandContext } from 'cli-forge/context';
import { app } from './cli';

// The handler lives in its own file so that `typeof app` is fully resolved
// by the time this module is type-checked. `getCommandContext(app)` uses
// the imported CLI as both a type witness (for inject/args typing) and a
// runtime identity check — at runtime the stored commandIdChain is walked
// to confirm `app` is part of the active execution.
export function runBuild() {
  const ctx = getCommandContext(app);
  const build = ctx.getChildContext('build');

  const log = ctx.inject('logger');

  log.debug('Resolving toolchain');
  log.debug('Loading config');
  log.info(`Building target: ${build.args.target}`);
  log.warn('No cache configured');

  // Surface how many messages the logger filtered out so tests can verify
  // that log level filtering was applied.
  console.log(`DONE (suppressed=${log.suppressed()})`);
}
