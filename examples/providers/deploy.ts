import { getCommandContext } from 'cli-forge/context';
import { app } from './cli';

export async function runDeploy() {
  // getCommandContext() reads from AsyncLocalStorage — no need to pass app around.
  // The `app` reference is only used as a type witness for inference.
  const ctx = getCommandContext(app);

  const logger = ctx.inject('logger');
  const target = ctx.args.target;

  logger.info(`Deploying to ${target}`);
}
