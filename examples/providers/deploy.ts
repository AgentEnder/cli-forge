import { getCommandContext } from 'cli-forge/context';
import { app } from './cli';

export async function runDeploy() {
  // Passing `app` as both the type witness and the runtime identity check.
  // The stored commandIdChain walks root -> deploy, so both the root and
  // any ancestor are valid references.
  const ctx = getCommandContext(app);
  const deployCtx = ctx.getChildContext('deploy');

  const logger = ctx.inject('logger');
  const target = deployCtx.args.target;

  logger.info(`Deploying to ${target}`);
}
