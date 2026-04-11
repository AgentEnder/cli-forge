import { getCommandContext } from 'cli-forge/context';
import { app } from './cli';

export async function runDeploy() {
  // getCommandContext() reads from AsyncLocalStorage — no need to pass app around.
  // The `app` reference is only used as a type witness for inference.
  const ctx = getCommandContext(app);
  const deployCtx = ctx.getChildContext('deploy');

  const logger = ctx.inject('logger');
  const target = deployCtx.args.target;

  logger.info(`Deploying to ${target}`);
}
