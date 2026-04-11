/**
 * Tests child context and provider inheritance:
 * - getChildContext constrains key to registered child command names
 * - Invalid child command name produces a type error
 */
import { cli } from 'cli-forge';
import { getCommandContext } from 'cli-forge/context';

const app = cli('test')
  .provide('rootSvc', { root: true })
  .command('deploy', {
    builder: (cmd) => cmd.option('target', { type: 'string', required: true }),
    handler: () => {},
  });

app.handler(() => {
  const rootCtx = getCommandContext(app);

  // Child context for a registered command is allowed
  const _deployCtx = rootCtx.getChildContext('deploy');

  // @ts-expect-error — 'nonexistent' is not a registered child command
  rootCtx.getChildContext('nonexistent');
});
