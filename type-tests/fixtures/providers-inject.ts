/**
 * Tests inject key constraints:
 * - Valid keys resolve to the correct type
 * - Invalid keys produce a type error
 */
import { cli } from 'cli-forge';
import { getCommandContext } from 'cli-forge/context';

const app = cli('test')
  .provide('logger', { info: (msg: string) => console.log(msg) })
  .provide('api', { get: (url: string) => url });

// getCommandContext(app) infers providers from the CLI instance
app.handler(() => {
  const ctx = getCommandContext(app);

  // Valid inject — logger is typed as { info: (msg: string) => void }
  const logger = ctx.inject('logger');
  logger.info('test');

  // Valid inject — api is typed as { get: (url: string) => Promise<Response> }
  const api = ctx.inject('api');
  api.get('/test');

  // @ts-expect-error — 'missing' is not a registered provider key
  ctx.inject('missing');
});
